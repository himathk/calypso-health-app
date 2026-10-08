import { useEffect, useMemo, useState } from 'react';
import { dayKey } from '../lib/dates';
import { computePlan, dailyBudget, type Plan } from '../lib/nutrition';
import { currentWeight, useStore } from '../store/useStore';
import type { ActivityEntry, FoodEntry, MealSlot } from '../types';

/** Re-renders every `ms` so clocks and countdowns stay live. */
export function useNow(ms = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** The current day key, refreshed at midnight. */
export function useToday(): string {
  const now = useNow(30_000);
  return dayKey(now);
}

export function usePlan(): Plan | null {
  const profile = useStore((s) => s.profile);
  const weights = useStore((s) => s.weights);
  const today = useToday();
  return useMemo(
    () => (profile ? computePlan(profile, currentWeight({ profile, weights })) : null),
    [profile, weights, today],
  );
}

export interface DayStats {
  foods: FoodEntry[];
  activities: ActivityEntry[];
  eaten: number;
  protein: number;
  carbs: number;
  fat: number;
  exerciseKcal: number;
  activeMinutes: number;
  waterMl: number;
  budget: number;
  remaining: number;
  bySlot: Record<MealSlot, FoodEntry[]>;
  moveBreaks: number;
}

export function computeDayStats(
  date: string,
  data: { foods: FoodEntry[]; activities: ActivityEntry[]; water: { date: string; ml: number }[] },
  plan: Plan | null,
  eatBack: number,
): DayStats {
  const foods = data.foods.filter((f) => f.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const activities = data.activities.filter((a) => a.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const sum = (key: 'kcal' | 'protein' | 'carbs' | 'fat') => foods.reduce((t, f) => t + f[key], 0);
  const exerciseKcal = activities.reduce((t, a) => t + a.kcal, 0);
  const budget = plan ? dailyBudget(plan, exerciseKcal, eatBack) : 2000;
  const eaten = sum('kcal');
  const bySlot: Record<MealSlot, FoodEntry[]> = { breakfast: [], lunch: [], snack: [], dinner: [] };
  foods.forEach((f) => bySlot[f.meal].push(f));
  return {
    foods,
    activities,
    eaten,
    protein: sum('protein'),
    carbs: sum('carbs'),
    fat: sum('fat'),
    exerciseKcal,
    activeMinutes: activities.reduce((t, a) => t + a.minutes, 0),
    waterMl: data.water.filter((w) => w.date === date).reduce((t, w) => t + w.ml, 0),
    budget,
    remaining: budget - eaten,
    bySlot,
    moveBreaks: activities.filter((a) => a.type === 'walk-break' || a.type === 'stretch').length,
  };
}

export function useDayStats(date?: string): DayStats {
  const today = useToday();
  const key = date ?? today;
  const foods = useStore((s) => s.foods);
  const activities = useStore((s) => s.activities);
  const water = useStore((s) => s.water);
  const eatBack = useStore((s) => s.profile?.eatBackExercise ?? 0.5);
  const plan = usePlan();
  return useMemo(() => computeDayStats(key, { foods, activities, water }, plan, eatBack), [key, foods, activities, water, plan, eatBack]);
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
