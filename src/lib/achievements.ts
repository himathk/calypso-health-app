import { computeDayStats } from '../hooks/useDerived';
import type { ActivityEntry, FoodEntry, Profile, WaterEntry, WeightEntry } from '../types';
import { addDays, dayKey, lastNDays } from './dates';
import type { Plan } from './nutrition';

export interface AchievementContext {
  profile: Profile;
  plan: Plan;
  foods: FoodEntry[];
  activities: ActivityEntry[];
  water: WaterEntry[];
  weights: WeightEntry[];
  now: Date;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  check: (ctx: AchievementContext) => boolean;
}

/** Consecutive days (ending today, or yesterday if today is still empty) with at least one food log. */
export function loggingStreak(foods: FoodEntry[], now = new Date()): number {
  const days = new Set(foods.map((f) => f.date));
  let cursor = days.has(dayKey(now)) ? now : addDays(now, -1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function waterGoalDays(ctx: AchievementContext): number {
  const totals = new Map<string, number>();
  ctx.water.forEach((w) => totals.set(w.date, (totals.get(w.date) ?? 0) + w.ml));
  return [...totals.values()].filter((ml) => ml >= ctx.plan.waterMl).length;
}

function maxMoveBreaksInADay(activities: ActivityEntry[]): number {
  const counts = new Map<string, number>();
  activities.filter((a) => a.type === 'walk-break' || a.type === 'stretch').forEach((a) => counts.set(a.date, (counts.get(a.date) ?? 0) + 1));
  return Math.max(0, ...counts.values());
}

function onTargetDays(ctx: AchievementContext): number {
  const today = dayKey(ctx.now);
  const days = [...new Set(ctx.foods.map((f) => f.date))].filter((d) => d < today);
  return days.filter((d) => {
    const s = computeDayStats(d, ctx, ctx.plan, ctx.profile.eatBackExercise);
    return s.eaten <= s.budget && s.eaten >= s.budget * 0.6;
  }).length;
}

function kgLost(ctx: AchievementContext): number {
  const latest = ctx.weights.at(-1)?.kg ?? ctx.profile.startWeightKg;
  return ctx.profile.startWeightKg - latest;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-bite', emoji: '🍽️', title: 'First bite', description: 'Log your first meal.', check: (c) => c.foods.length > 0 },
  { id: 'snapper', emoji: '📸', title: 'Snap happy', description: 'Log 5 meals from photos.', check: (c) => c.foods.filter((f) => f.source === 'ai').length >= 5 },
  { id: 'hydrated', emoji: '💧', title: 'Hydrated', description: 'Hit your daily water goal.', check: (c) => waterGoalDays(c) >= 1 },
  { id: 'hydration-hero', emoji: '🌊', title: 'Hydration hero', description: 'Hit your water goal on 5 days.', check: (c) => waterGoalDays(c) >= 5 },
  { id: 'desk-escape', emoji: '🚪', title: 'Desk escape artist', description: 'Take 8 move breaks in one workday.', check: (c) => maxMoveBreaksInADay(c.activities) >= 8 },
  { id: 'first-sweat', emoji: '💦', title: 'First sweat', description: 'Log a workout.', check: (c) => c.activities.some((a) => a.type !== 'walk-break' && a.type !== 'stretch') },
  {
    id: 'active-week', emoji: '🏅', title: 'Active week', description: '150 active minutes in 7 days.',
    check: (c) => {
      const week = new Set(lastNDays(7, c.now));
      return c.activities.filter((a) => week.has(a.date)).reduce((t, a) => t + a.minutes, 0) >= 150;
    },
  },
  { id: 'on-target', emoji: '🎯', title: 'Bullseye', description: 'Finish a day within your calorie budget.', check: (c) => onTargetDays(c) >= 1 },
  { id: 'on-target-5', emoji: '🏹', title: 'Sharpshooter', description: 'Finish 5 days within budget.', check: (c) => onTargetDays(c) >= 5 },
  { id: 'streak-3', emoji: '🔥', title: 'On a roll', description: 'Log food 3 days in a row.', check: (c) => loggingStreak(c.foods, c.now) >= 3 },
  { id: 'streak-7', emoji: '⚡', title: 'Week warrior', description: 'Log food 7 days in a row.', check: (c) => loggingStreak(c.foods, c.now) >= 7 },
  { id: 'first-kg', emoji: '📉', title: 'First kilo down', description: 'Lose your first kilogram.', check: (c) => kgLost(c) >= 1 },
  {
    id: 'halfway', emoji: '⛰️', title: 'Halfway there', description: 'Lose half of what you set out to.',
    check: (c) => c.profile.startWeightKg > c.profile.goalWeightKg && kgLost(c) >= (c.profile.startWeightKg - c.profile.goalWeightKg) / 2,
  },
  {
    id: 'goal', emoji: '🏆', title: 'Goal reached', description: 'Hit your goal weight.',
    check: (c) => c.profile.startWeightKg > c.profile.goalWeightKg && (c.weights.at(-1)?.kg ?? Infinity) <= c.profile.goalWeightKg,
  },
];

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
