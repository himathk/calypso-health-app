import { describe, expect, it } from 'vitest';
import { MEALS, fitsDiet } from '../../data/meals';
import { FOOD_MODEL, buildFoodRequest, parseFoodResponse, validateFoodRequest } from '../foodAi/shared';
import { planDay, recommendMeals } from '../recommend';

describe('recommendations', () => {
  it('respects diet', () => {
    const vegan = recommendMeals({ slot: 'dinner', targetKcal: 500, diet: 'vegan' });
    expect(vegan.length).toBeGreaterThan(0);
    expect(vegan.every((r) => r.meal.diet === 'vegan')).toBe(true);
    expect(MEALS.filter((m) => fitsDiet(m, 'pescatarian')).some((m) => m.diet === 'any')).toBe(false);
  });

  it('ranks meals near the calorie target first', () => {
    const recs = recommendMeals({ slot: 'lunch', targetKcal: 450, diet: 'any' });
    expect(Math.abs(recs[0].meal.kcal - 450)).toBeLessThan(150);
  });

  it('plans a whole day within ~15% of the budget', () => {
    const plan = planDay(1800, 'any', 42)!;
    expect(plan).not.toBeNull();
    expect(plan.kcal).toBeLessThanOrEqual(1800 * 1.05);
    expect(plan.kcal).toBeGreaterThanOrEqual(1800 * 0.85);
    expect(planDay(1800, 'any', 42)).toEqual(plan); // deterministic per seed
  });
});

describe('food AI request/response', () => {
  const image = 'A'.repeat(200);

  it('builds a vision request with structured output and refusal fallback', () => {
    const req = buildFoodRequest({ image, mediaType: 'image/jpeg', note: 'large portion' });
    expect(req.model).toBe(FOOD_MODEL);
    expect(req.fallbacks).toBe('default');
    expect(req.betas).toContain('server-side-fallback-2026-07-01');
    expect(req.output_config?.format?.type).toBe('json_schema');
    const content = req.messages[0].content as { type: string; text?: string }[];
    expect(content[0].type).toBe('image');
    expect(content[1].text).toContain('large portion');
  });

  it('rejects bad payloads', () => {
    expect(() => validateFoodRequest({ image: 'x', mediaType: 'image/jpeg' })).toThrow();
    expect(() => validateFoodRequest({ image, mediaType: 'image/tiff' })).toThrow();
    expect(validateFoodRequest({ image, mediaType: 'image/png' }).mediaType).toBe('image/png');
  });

  const message = (text: string, stop_reason = 'end_turn') =>
    ({ id: 'm', type: 'message', role: 'assistant', model: FOOD_MODEL, content: [{ type: 'text', text, citations: null }], stop_reason, stop_sequence: null, usage: {} }) as never;

  it('parses and sanitises a structured reply, recomputing the total', () => {
    const r = parseFoodResponse(
      message(
        JSON.stringify({
          is_food: true,
          meal_name: 'Rice and curry',
          items: [
            { name: 'White rice', emoji: '🍚', portion: '1.5 cups', grams: 240, calories: 310.6, protein_g: 6, carbs_g: 68, fat_g: 1, confidence: 'high' },
            { name: 'Chicken curry', emoji: '🍛', portion: '1 cup', grams: 220, calories: 330, protein_g: 28, carbs_g: 8, fat_g: 20, confidence: 'medium' },
          ],
          total_calories: 9999,
          notes: 'Coconut milk adds fat.',
          healthier_swap: 'Half rice, extra veg.',
        }),
      ),
    );
    expect(r.items[0].calories).toBe(311);
    expect(r.total_calories).toBe(641);
  });

  it('surfaces refusals and truncation as typed errors', () => {
    expect(() => parseFoodResponse(message('', 'refusal'))).toThrow(/couldn't analyse/i);
    expect(() => parseFoodResponse(message('{"is_food": tr', 'max_tokens'))).toThrow(/cut off/i);
    expect(() => parseFoodResponse(message('not json'))).toThrow(/not valid JSON/);
  });
});
