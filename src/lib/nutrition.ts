import type { ActivityLevel, Profile, Sex } from '../types';
import { addDays } from './dates';

/** Energy in one kilogram of body fat (the standard approximation). */
export const KCAL_PER_KG = 7700;

export const ACTIVITY_LEVELS: Record<ActivityLevel, { multiplier: number; label: string; description: string; emoji: string }> = {
  sedentary: { multiplier: 1.2, label: 'Desk-bound', description: 'Office job, under ~5k steps a day', emoji: '💻' },
  light: { multiplier: 1.375, label: 'Lightly active', description: 'Desk job plus regular walking (5–8k steps)', emoji: '🚶' },
  moderate: { multiplier: 1.55, label: 'Active', description: 'On your feet a lot, or 8–12k steps', emoji: '🏃' },
  active: { multiplier: 1.725, label: 'Very active', description: 'Physical job or 12k+ steps daily', emoji: '🏗️' },
  athlete: { multiplier: 1.9, label: 'Athlete', description: 'Hard physical work and daily training', emoji: '🏋️' },
};

export const PACE_OPTIONS = [
  { kg: 0.25, label: 'Gentle', description: 'Barely notice the deficit' },
  { kg: 0.5, label: 'Steady', description: 'The sweet spot for most people' },
  { kg: 0.75, label: 'Focused', description: 'Noticeable hunger, faster results' },
  { kg: 1, label: 'Aggressive', description: 'Only with plenty to lose' },
] as const;

export function ageFrom(birthDate: string, now = new Date()): number {
  const b = new Date(birthDate);
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return Math.max(14, Math.min(100, age));
}

/** Mifflin–St Jeor basal metabolic rate (kcal/day). */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
}

/** Lowest daily intake Calypso will ever suggest without medical supervision. */
export function calorieFloor(sex: Sex): number {
  return sex === 'female' ? 1200 : 1500;
}

/** Losing more than ~1% of body weight per week tends to cost muscle. */
export function maxSafePace(weightKg: number): number {
  // Round down to the nearest 0.05 kg (epsilon guards against 11.999… from float maths).
  return Math.min(1, Math.round(Math.floor((weightKg * 0.01) / 0.05 + 1e-9) * 0.05 * 100) / 100);
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number): { label: string; tone: 'aqua' | 'lime' | 'sun' | 'coral' } {
  if (value < 18.5) return { label: 'Underweight', tone: 'aqua' };
  if (value < 25) return { label: 'Healthy', tone: 'lime' };
  if (value < 30) return { label: 'Overweight', tone: 'sun' };
  return { label: 'Obese range', tone: 'coral' };
}

export function recommendedPace(currentKg: number, goalKg: number, heightCm: number): number {
  const toLose = currentKg - goalKg;
  if (toLose <= 0) return 0;
  if (toLose < 4) return 0.25;
  const b = bmi(currentKg, heightCm);
  const pace = b >= 32 ? 0.75 : 0.5;
  return Math.min(pace, maxSafePace(currentKg));
}

export interface Plan {
  age: number;
  bmr: number;
  tdee: number;
  /** Daily calorie target before exercise is added back. */
  targetKcal: number;
  dailyDeficit: number;
  requestedPace: number;
  /** Pace actually achievable after safety limits. */
  pace: number;
  /** Why the plan differs from what was asked, if it does. */
  adjustment: null | 'pace-capped' | 'calorie-floor' | 'maintenance';
  kgToLose: number;
  weeksToGoal: number | null;
  goalDate: Date | null;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
  bmi: number;
}

export function computePlan(profile: Pick<Profile, 'sex' | 'birthDate' | 'heightCm' | 'goalWeightKg' | 'activityLevel' | 'paceKgPerWeek'>, currentKg: number, now = new Date()): Plan {
  const age = ageFrom(profile.birthDate, now);
  const base = bmr(profile.sex, currentKg, profile.heightCm, age);
  const tdee = base * ACTIVITY_LEVELS[profile.activityLevel].multiplier;
  const kgToLose = Math.max(0, currentKg - profile.goalWeightKg);
  const floor = calorieFloor(profile.sex);

  let adjustment: Plan['adjustment'] = null;
  let pace = profile.paceKgPerWeek;

  if (kgToLose <= 0) {
    pace = 0;
    adjustment = 'maintenance';
  } else {
    const safe = maxSafePace(currentKg);
    if (pace > safe) {
      pace = safe;
      adjustment = 'pace-capped';
    }
  }

  let deficit = (pace * KCAL_PER_KG) / 7;
  if (tdee - deficit < floor) {
    deficit = Math.max(0, tdee - floor);
    pace = (deficit * 7) / KCAL_PER_KG;
    if (adjustment !== 'maintenance') adjustment = 'calorie-floor';
  }

  const targetKcal = adjustment === 'maintenance' ? Math.round(tdee) : Math.round((tdee - deficit) / 10) * 10;
  const weeksToGoal = pace > 0 ? kgToLose / pace : null;
  const goalDate = weeksToGoal != null ? addDays(now, Math.ceil(weeksToGoal * 7)) : null;

  // Protein ~2 g per kg of goal weight protects muscle in a deficit, capped at 40 % of calories.
  const proteinG = Math.round(Math.min(profile.goalWeightKg * 2, (targetKcal * 0.4) / 4));
  const fatG = Math.round((targetKcal * 0.28) / 9);
  const carbsG = Math.max(0, Math.round((targetKcal - proteinG * 4 - fatG * 9) / 4));
  const waterMl = Math.min(4000, Math.max(2000, Math.round((currentKg * 35) / 250) * 250));

  return {
    age,
    bmr: Math.round(base),
    tdee: Math.round(tdee),
    targetKcal,
    dailyDeficit: Math.max(0, Math.round(tdee) - targetKcal),
    requestedPace: profile.paceKgPerWeek,
    pace: Math.round(pace * 100) / 100,
    adjustment,
    kgToLose: Math.round(kgToLose * 10) / 10,
    weeksToGoal,
    goalDate,
    proteinG,
    carbsG,
    fatG,
    waterMl,
    bmi: Math.round(bmi(currentKg, profile.heightCm) * 10) / 10,
  };
}

/** Today's calorie budget: base target plus the share of exercise calories the user eats back. */
export function dailyBudget(plan: Plan, exerciseKcal: number, eatBack: number): number {
  return Math.round(plan.targetKcal + exerciseKcal * eatBack);
}

// ---- Units ---------------------------------------------------------------

export const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalIn = Math.round(cm / 2.54);
  return { ft: Math.floor(totalIn / 12), inch: totalIn % 12 };
}

export function ftInToCm(ft: number, inch: number): number {
  return (ft * 12 + inch) * 2.54;
}

export function formatWeight(kg: number, units: 'metric' | 'imperial', digits = 1): string {
  return units === 'imperial' ? `${kgToLb(kg).toFixed(digits)} lb` : `${kg.toFixed(digits)} kg`;
}

export function formatHeight(cm: number, units: 'metric' | 'imperial'): string {
  if (units === 'metric') return `${Math.round(cm)} cm`;
  const { ft, inch } = cmToFtIn(cm);
  return `${ft}′${inch}″`;
}
