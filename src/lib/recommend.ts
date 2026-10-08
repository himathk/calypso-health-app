import { MEALS, fitsDiet, type MealIdea, type MealKind, type MealTag } from '../data/meals';
import type { Diet, MealSlot, Schedule } from '../types';
import { minutesOfDay, toMinutes } from './dates';
import { isWorkDay } from './schedule';

/** Share of the daily budget each meal slot usually takes. */
export const SLOT_SHARE: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };
export const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export const SLOT_META: Record<MealSlot, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅' },
  lunch: { label: 'Lunch', emoji: '🌞' },
  snack: { label: 'Snack', emoji: '🍎' },
  dinner: { label: 'Dinner', emoji: '🌙' },
};

/** The meal the user is most likely about to eat, given the clock and their schedule. */
export function nextMealSlot(now: Date, schedule: Schedule): MealSlot {
  const m = minutesOfDay(now);
  const lunch = toMinutes(schedule.lunchTime);
  const lunchEnd = lunch + schedule.lunchMinutes;
  const workEnd = isWorkDay(schedule, now) ? toMinutes(schedule.workEnd) : 17 * 60;
  if (m < Math.min(lunch - 90, 10.5 * 60)) return 'breakfast';
  if (m < lunchEnd + 30) return 'lunch';
  if (m < workEnd + 30) return 'snack';
  if (m < toMinutes(schedule.sleepTime) - 150 || toMinutes(schedule.sleepTime) < 6 * 60) return 'dinner';
  return 'snack';
}

/**
 * The meal worth suggesting next: the current time slot, or — if it's already
 * been eaten — the next one that hasn't.
 */
export function suggestSlot(now: Date, schedule: Schedule, eaten: Set<MealSlot>): MealSlot {
  const current = nextMealSlot(now, schedule);
  const order = SLOT_ORDER.slice(SLOT_ORDER.indexOf(current));
  return order.find((s) => !eaten.has(s)) ?? current;
}

/** A sensible calorie target for one slot given what's left today. */
export function slotTarget(slot: MealSlot, dailyBudget: number, remaining: number, eatenSlots: Set<MealSlot>): number {
  const later = SLOT_ORDER.slice(SLOT_ORDER.indexOf(slot) + 1).filter((s) => !eatenSlots.has(s));
  const reserved = later.reduce((sum, s) => sum + SLOT_SHARE[s] * dailyBudget, 0);
  const fair = SLOT_SHARE[slot] * dailyBudget;
  const available = remaining - reserved;
  return Math.round(Math.max(Math.min(fair * 1.2, Math.max(available, fair * 0.6)), 0));
}

export interface RecommendOptions {
  slot: MealSlot;
  targetKcal: number;
  diet: Diet;
  kinds?: MealKind[];
  tags?: MealTag[];
}

export interface ScoredMeal {
  meal: MealIdea;
  score: number;
  fit: 'great' | 'good' | 'over';
}

export function recommendMeals(opts: RecommendOptions, meals: MealIdea[] = MEALS): ScoredMeal[] {
  return meals
    .filter((m) => m.slots.includes(opts.slot) && fitsDiet(m, opts.diet))
    .filter((m) => !opts.kinds?.length || opts.kinds.includes(m.kind))
    .filter((m) => !opts.tags?.length || opts.tags.every((t) => m.tags.includes(t)))
    .map((meal) => {
      const diff = meal.kcal - opts.targetKcal;
      // Going over hurts twice as much as coming in under.
      const calorieFit = 1 - (Math.abs(diff) / Math.max(opts.targetKcal, 1)) * (diff > 0 ? 2 : 1);
      const proteinDensity = (meal.protein * 4) / Math.max(meal.kcal, 1); // 0 – 0.5
      const speed = meal.minutes <= 10 ? 0.15 : meal.minutes <= 20 ? 0.05 : 0;
      const score = calorieFit + proteinDensity * 1.2 + speed;
      const fit: ScoredMeal['fit'] = diff > opts.targetKcal * 0.15 ? 'over' : Math.abs(diff) <= opts.targetKcal * 0.2 ? 'great' : 'good';
      return { meal, score, fit };
    })
    .sort((a, b) => b.score - a.score);
}

export interface DayPlan {
  meals: Record<MealSlot, MealIdea>;
  kcal: number;
  protein: number;
}

/** Deterministic PRNG so "shuffle" gives a new — but reproducible — plan per seed. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds a full day of meals whose calories land close to the budget. */
export function planDay(budget: number, diet: Diet, seed: number, kinds?: MealKind[], meals: MealIdea[] = MEALS): DayPlan | null {
  const pool = (slot: MealSlot) =>
    meals.filter((m) => m.slots.includes(slot) && fitsDiet(m, diet) && (!kinds?.length || kinds.includes(m.kind)));
  const b = pool('breakfast');
  const l = pool('lunch');
  const d = pool('dinner');
  const s = pool('snack');
  if (!b.length || !l.length || !d.length || !s.length) return null;

  const candidates: { plan: DayPlan; score: number }[] = [];
  for (const breakfast of b)
    for (const lunch of l)
      for (const dinner of d) {
        if (dinner.id === lunch.id) continue;
        for (const snack of s) {
          if (snack.id === breakfast.id) continue;
          const kcal = breakfast.kcal + lunch.kcal + dinner.kcal + snack.kcal;
          const protein = breakfast.protein + lunch.protein + dinner.protein + snack.protein;
          const miss = Math.abs(budget - kcal) / budget;
          if (kcal > budget * 1.05 || miss > 0.15) continue;
          candidates.push({ plan: { meals: { breakfast, lunch, dinner, snack }, kcal, protein }, score: miss - (protein * 4) / kcal / 2 });
        }
      }
  if (!candidates.length) return null;
  candidates.sort((x, y) => x.score - y.score);
  const top = candidates.slice(0, Math.min(40, candidates.length));
  const rand = mulberry32(seed);
  return top[Math.floor(rand() * top.length)].plan;
}
