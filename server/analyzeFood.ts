import Anthropic from '@anthropic-ai/sdk';
import {
  FoodAnalysisError,
  buildFoodRequest,
  parseFoodResponse,
  validateFoodRequest,
  type FoodAnalysis,
} from '../src/lib/foodAi/shared';

export interface HandlerResult {
  status: number;
  body: FoodAnalysis | { error: string; code: string };
}

let client: Anthropic | null = null;

/**
 * Framework-agnostic handler for POST /api/analyze-food.
 * Returns 501 when the server has no API key so the browser can fall back to
 * the user's own key (Settings → AI food scanner).
 */
export async function handleAnalyzeFood(body: unknown): Promise<HandlerResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: 501, body: { error: 'Food scanning is not configured on this server.', code: 'not_configured' } };
  }
  try {
    const request = validateFoodRequest(body);
    client ??= new Anthropic();
    const message = await client.beta.messages.create(buildFoodRequest(request));
    return { status: 200, body: parseFoodResponse(message) };
  } catch (error) {
    if (error instanceof FoodAnalysisError) {
      return { status: error.code === 'bad_request' ? 400 : 422, body: { error: error.message, code: error.code } };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { status: 429, body: { error: 'Too many scans right now — try again in a minute.', code: 'rate_limited' } };
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return { status: 502, body: { error: 'The server API key was rejected.', code: 'auth' } };
    }
    if (error instanceof Anthropic.APIError) {
      return { status: 502, body: { error: `AI service error (${error.status ?? 'network'}).`, code: 'upstream' } };
    }
    console.error('[analyze-food]', error);
    return { status: 500, body: { error: 'Unexpected server error.', code: 'internal' } };
  }
}
