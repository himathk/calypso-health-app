// Shared between the server endpoint (server/analyzeFood.ts) and the in-browser
// "bring your own key" path, so both build the exact same Claude request.
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

export const FOOD_MODEL = 'claude-opus-5-5';

export const SUPPORTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export type FoodImageMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

export interface FoodAnalysisRequest {
  /** Base64 image data without the `data:` prefix. */
  image: string;
  mediaType: FoodImageMediaType;
  /** Optional free-text hint from the user ("large portion", "no sugar"…). */
  note?: string;
}

const SYSTEM_PROMPT = `You are the food-recognition engine inside Calypso, a calorie-tracking app used by people who are trying to lose weight.

You receive one photo of food or drink, sometimes with a note from the user. Identify every distinct item on the plate and estimate its portion and nutrition as accurately as you can.

How to estimate:
- Judge portion size from visual cues: plate or bowl diameter (a dinner plate is about 26 cm), cutlery, hands, packaging, cup sizes.
- Account for what the camera can't see but is almost always there: cooking oil, butter, dressings, sauces, sugar in drinks. Fold it into the item it belongs to and mention it in "notes".
- Recognise dishes from any cuisine (e.g. Sri Lankan rice and curry, kottu, Japanese ramen, Mexican burrito) and use typical recipes for that dish.
- If there is a nutrition label or a branded package, prefer its numbers.
- Give realistic single numbers, not ranges. Calories in kcal, macros in grams, rounded to whole numbers.
- "confidence" reflects how sure you are about the identity and the portion together.
- If the user's note gives the portion or ingredients, trust it over the photo.

If the photo does not show food or drink, set is_food to false, return an empty items list and zero totals, and use "notes" to say what you see instead.

"healthier_swap" is one short, practical suggestion for a lower-calorie or higher-protein version of this meal, written for someone on a calorie deficit. Keep "notes" under 40 words.`;

/** JSON schema used for structured outputs, so the reply is always parseable. */
export const FOOD_JSON_SCHEMA = {
  type: 'object',
  properties: {
    is_food: { type: 'boolean' },
    meal_name: {
      type: 'string',
      description: "Short name for the whole plate, e.g. 'Grilled chicken rice bowl'",
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          emoji: { type: 'string', description: 'A single emoji that represents the item' },
          portion: { type: 'string', description: "Human-friendly portion, e.g. '1 cup (~180 g)'" },
          grams: { type: 'number' },
          calories: { type: 'number' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'emoji', 'portion', 'grams', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'confidence'],
        additionalProperties: false,
      },
    },
    total_calories: { type: 'number' },
    notes: { type: 'string' },
    healthier_swap: { type: 'string' },
  },
  required: ['is_food', 'meal_name', 'items', 'total_calories', 'notes', 'healthier_swap'],
  additionalProperties: false,
} as const;

const nonNegative = z.coerce.number().transform((n) => (Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0));

export const FoodItemSchema = z.object({
  name: z.string().min(1),
  emoji: z.string().catch('🍽️'),
  portion: z.string().catch(''),
  grams: nonNegative,
  calories: nonNegative,
  protein_g: nonNegative,
  carbs_g: nonNegative,
  fat_g: nonNegative,
  confidence: z.enum(['high', 'medium', 'low']).catch('medium'),
});

export const FoodAnalysisSchema = z.object({
  is_food: z.boolean(),
  meal_name: z.string().catch('Meal'),
  items: z.array(FoodItemSchema),
  total_calories: nonNegative,
  notes: z.string().catch(''),
  healthier_swap: z.string().catch(''),
});

export type FoodItemEstimate = z.infer<typeof FoodItemSchema>;
export type FoodAnalysis = z.infer<typeof FoodAnalysisSchema>;

export class FoodAnalysisError extends Error {
  constructor(
    message: string,
    readonly code: 'refused' | 'truncated' | 'invalid_response' | 'bad_request',
  ) {
    super(message);
    this.name = 'FoodAnalysisError';
  }
}

export function validateFoodRequest(body: unknown): FoodAnalysisRequest {
  const parsed = z
    .object({
      image: z.string().min(100).max(8_000_000),
      mediaType: z.enum(SUPPORTED_MEDIA_TYPES),
      note: z.string().max(500).optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    throw new FoodAnalysisError('Expected { image: base64, mediaType, note? } with a JPEG/PNG/WebP/GIF image.', 'bad_request');
  }
  const { image, mediaType, note } = parsed.data;
  return { image: image as string, mediaType: mediaType as FoodImageMediaType, note };
}

export function buildFoodRequest(req: FoodAnalysisRequest): Anthropic.Beta.Messages.MessageCreateParamsNonStreaming {
  const note = req.note?.trim();
  return {
    model: FOOD_MODEL,
    max_tokens: 16000,
    // Route a safety-classifier decline to Anthropic's recommended fallback model
    // instead of failing the scan.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: FOOD_JSON_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: req.mediaType, data: req.image } },
          {
            type: 'text',
            text: note ? `Analyse this meal. Note from the user: ${note}` : 'Analyse this meal.',
          },
        ],
      },
    ],
  };
}

export function parseFoodResponse(message: Anthropic.Beta.Messages.BetaMessage): FoodAnalysis {
  if (message.stop_reason === 'refusal') {
    throw new FoodAnalysisError("Calypso couldn't analyse this photo. Try another angle or log it manually.", 'refused');
  }
  if (message.stop_reason === 'max_tokens') {
    throw new FoodAnalysisError('The analysis was cut off. Please try again.', 'truncated');
  }
  const text = message.content
    .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return coerceFoodAnalysis(safeJson(text));
}

export function coerceFoodAnalysis(raw: unknown): FoodAnalysis {
  const parsed = FoodAnalysisSchema.safeParse(raw);
  if (!parsed.success) {
    throw new FoodAnalysisError('The food analysis came back in an unexpected shape.', 'invalid_response');
  }
  const result = parsed.data;
  // Trust the item breakdown over the model's own total.
  result.total_calories = result.items.reduce((sum, item) => sum + item.calories, 0);
  return result;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new FoodAnalysisError('The food analysis was not valid JSON.', 'invalid_response');
  }
}
