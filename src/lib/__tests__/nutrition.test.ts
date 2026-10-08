import { describe, expect, it } from 'vitest';
import { activeCalories } from '../../data/activities';
import { bmr, calorieFloor, computePlan, maxSafePace, recommendedPace } from '../nutrition';

const base = {
  sex: 'male' as const,
  birthDate: '1996-01-01',
  heightCm: 175,
  goalWeightKg: 75,
  activityLevel: 'sedentary' as const,
  paceKgPerWeek: 0.5,
};
const now = new Date(2026, 9, 8);

describe('nutrition', () => {
  it('computes Mifflin–St Jeor BMR', () => {
    // 10*85 + 6.25*175 - 5*30 + 5
    expect(bmr('male', 85, 175, 30)).toBeCloseTo(1798.75);
    expect(bmr('female', 85, 175, 30)).toBeCloseTo(1632.75);
  });

  it('turns a 0.5 kg/week pace into a ~550 kcal daily deficit', () => {
    const plan = computePlan(base, 85, now);
    expect(plan.tdee).toBe(Math.round(1798.75 * 1.2));
    expect(plan.dailyDeficit).toBeGreaterThan(540);
    expect(plan.dailyDeficit).toBeLessThan(560);
    expect(plan.adjustment).toBeNull();
    expect(plan.goalDate).not.toBeNull();
    expect(plan.weeksToGoal).toBeCloseTo(20);
  });

  it('never drops below the calorie floor and slows the pace instead', () => {
    const small = { ...base, sex: 'female' as const, heightCm: 155, goalWeightKg: 50, paceKgPerWeek: 1 };
    const plan = computePlan(small, 56, now);
    expect(plan.targetKcal).toBeGreaterThanOrEqual(calorieFloor('female'));
    expect(plan.pace).toBeLessThan(1);
    expect(['calorie-floor', 'pace-capped']).toContain(plan.adjustment);
  });

  it('caps pace at ~1% of body weight per week', () => {
    expect(maxSafePace(60)).toBeCloseTo(0.6);
    expect(maxSafePace(150)).toBe(1);
    const plan = computePlan({ ...base, paceKgPerWeek: 1 }, 70, now);
    expect(plan.pace).toBeLessThanOrEqual(0.7);
  });

  it('switches to maintenance at or below the goal', () => {
    const plan = computePlan(base, 74, now);
    expect(plan.adjustment).toBe('maintenance');
    expect(plan.dailyDeficit).toBe(0);
    expect(plan.goalDate).toBeNull();
  });

  it('recommends a gentle pace when close to goal', () => {
    expect(recommendedPace(78, 75, 175)).toBe(0.25);
    expect(recommendedPace(90, 75, 175)).toBe(0.5);
  });

  it('macros add up to roughly the target', () => {
    const p = computePlan(base, 85, now);
    const kcal = p.proteinG * 4 + p.carbsG * 4 + p.fatG * 9;
    expect(Math.abs(kcal - p.targetKcal)).toBeLessThan(20);
  });

  it('counts only active (above-resting) calories for exercise', () => {
    // walking 3.5 MET, 80 kg, 60 min → (3.5-1)*80 = 200
    expect(activeCalories(3.5, 80, 60)).toBe(200);
  });
});
