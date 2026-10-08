export type Sex = 'male' | 'female';
export type Units = 'metric' | 'imperial';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type Diet = 'any' | 'vegetarian' | 'vegan' | 'pescatarian';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Theme = 'dark' | 'light';

export interface Schedule {
  /** 0 = Sunday … 6 = Saturday */
  workDays: number[];
  workStart: string; // "HH:mm"
  workEnd: string;
  lunchTime: string;
  lunchMinutes: number;
  wakeTime: string;
  sleepTime: string;
}

export interface ReminderSettings {
  water: { enabled: boolean; workIntervalMin: number; offIntervalMin: number };
  move: { enabled: boolean; intervalMin: number };
  meals: boolean;
  eveningWalk: boolean;
  weighIn: { enabled: boolean; day: number };
  sound: boolean;
  systemNotifications: boolean;
}

export interface Profile {
  name: string;
  avatar: string;
  sex: Sex;
  birthDate: string; // YYYY-MM-DD
  heightCm: number;
  startWeightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  paceKgPerWeek: number;
  diet: Diet;
  units: Units;
  /** Fraction (0–1) of logged exercise calories added back to the daily budget. */
  eatBackExercise: number;
  schedule: Schedule;
  reminders: ReminderSettings;
  createdAt: string;
}

export type FoodSource = 'ai' | 'search' | 'quick' | 'menu';

export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  meal: MealSlot;
  name: string;
  emoji: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portion?: string;
  source: FoodSource;
  /** Small JPEG data URL thumbnail for photo-logged food. */
  photo?: string;
}

export interface ActivityEntry {
  id: string;
  date: string;
  time: string;
  type: string;
  name: string;
  emoji: string;
  minutes: number;
  kcal: number;
  source: 'manual' | 'reminder';
}

export interface WaterEntry {
  id: string;
  date: string;
  time: string;
  ml: number;
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export type ReminderKind =
  | 'water'
  | 'move'
  | 'breakfast'
  | 'lunch'
  | 'snack'
  | 'dinner'
  | 'endOfWork'
  | 'eveningWalk'
  | 'kitchenClosed'
  | 'weighIn';

export interface ReminderSlot {
  id: string;
  kind: ReminderKind;
  at: Date;
  title: string;
  body: string;
  emoji: string;
}

export interface ActiveReminder {
  id: string;
  kind: ReminderKind;
  title: string;
  body: string;
  emoji: string;
  firedAt: number;
}
