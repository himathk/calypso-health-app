import type { Profile, ReminderKind, ReminderSlot, Schedule } from '../types';
import { atMinutes, dayKey, fromMinutes, minutesOfDay, toMinutes } from './dates';

export type DayMode = 'sleep' | 'morning' | 'work' | 'lunch' | 'evening' | 'off';

export interface DayModeInfo {
  mode: DayMode;
  label: string;
  emoji: string;
  /** Minute-of-day when this mode ends (may exceed 1440 when it crosses midnight). */
  endsAtMin: number | null;
  /** What the countdown to `endsAtMin` leads to, e.g. "until lunch". */
  until: string;
  description: string;
}

export function isWorkDay(schedule: Schedule, date: Date): boolean {
  return schedule.workDays.includes(date.getDay());
}

export function isAwake(schedule: Schedule, minute: number): boolean {
  const wake = toMinutes(schedule.wakeTime);
  const sleep = toMinutes(schedule.sleepTime);
  return wake < sleep ? minute >= wake && minute < sleep : minute >= wake || minute < sleep;
}

/** Minutes from `from` until `to`, going forward around the clock. */
function forward(from: number, to: number): number {
  return (((to - from) % 1440) + 1440) % 1440;
}

export function dayModeAt(schedule: Schedule, date: Date): DayModeInfo {
  const m = minutesOfDay(date);
  const wake = toMinutes(schedule.wakeTime);
  const sleep = toMinutes(schedule.sleepTime);
  const start = toMinutes(schedule.workStart);
  const end = toMinutes(schedule.workEnd);
  const lunch = toMinutes(schedule.lunchTime);
  const lunchEnd = lunch + schedule.lunchMinutes;

  if (!isAwake(schedule, m)) {
    return { mode: 'sleep', label: 'Rest mode', emoji: '🌙', endsAtMin: m + forward(m, wake), until: 'until wake-up', description: 'Reminders are paused while you sleep.' };
  }
  if (!isWorkDay(schedule, date)) {
    return { mode: 'off', label: 'Day off', emoji: '🌴', endsAtMin: m + forward(m, sleep), until: 'until bedtime', description: 'Relaxed reminders — water, meals and a walk.' };
  }
  if (m < start) {
    return { mode: 'morning', label: 'Morning', emoji: '🌅', endsAtMin: start, until: 'until work', description: 'Hydrate and grab a protein-rich breakfast.' };
  }
  if (m >= lunch && m < lunchEnd && lunch >= start && lunchEnd <= end) {
    return { mode: 'lunch', label: 'Lunch break', emoji: '🍱', endsAtMin: lunchEnd, until: 'of lunch left', description: 'Step away from the desk and eat mindfully.' };
  }
  if (m < end) {
    const beforeLunch = m < lunch && lunch >= start;
    return {
      mode: 'work',
      label: 'Work mode',
      emoji: '💼',
      endsAtMin: beforeLunch ? lunch : end,
      until: beforeLunch ? 'until lunch' : 'until you clock off',
      description: 'Water and move-break reminders are on.',
    };
  }
  return { mode: 'evening', label: 'Evening', emoji: '🌆', endsAtMin: m + forward(m, sleep), until: 'until bedtime', description: 'Wind down — dinner, a walk and an early kitchen close.' };
}

const PRIORITY: Record<ReminderKind, number> = {
  lunch: 10,
  breakfast: 9,
  dinner: 9,
  weighIn: 8,
  endOfWork: 7,
  snack: 6,
  kitchenClosed: 5,
  eveningWalk: 5,
  move: 3,
  water: 2,
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/**
 * Every reminder for a calendar day, derived from the user's schedule.
 * Work days get a dense desk-worker rhythm; days off get a relaxed one.
 */
export function remindersForDay(profile: Pick<Profile, 'schedule' | 'reminders'>, date: Date): ReminderSlot[] {
  const { schedule: s, reminders: r } = profile;
  const key = dayKey(date);
  const wake = toMinutes(s.wakeTime);
  const sleepRaw = toMinutes(s.sleepTime);
  const sleep = sleepRaw <= wake ? sleepRaw + 1440 : sleepRaw; // allow bedtimes after midnight
  const start = toMinutes(s.workStart);
  const end = toMinutes(s.workEnd);
  const lunch = toMinutes(s.lunchTime);
  const lunchEnd = lunch + s.lunchMinutes;
  const workDay = isWorkDay(s, date);

  const slots: { kind: ReminderKind; min: number; title: string; body: string; emoji: string }[] = [];
  const add = (kind: ReminderKind, min: number, emoji: string, title: string, body: string) => {
    if (min < wake || min >= sleep) return;
    slots.push({ kind, min, emoji, title, body });
  };

  if (r.weighIn.enabled && date.getDay() === r.weighIn.day) {
    add('weighIn', wake + 10, '⚖️', 'Weekly weigh-in', 'Step on the scale before breakfast — same time, same conditions.');
  }

  if (workDay) {
    if (r.meals && start - wake >= 45) {
      add('breakfast', wake + 30, '🍳', 'Breakfast time', 'Lead with protein — it keeps you full until lunch.');
    }
    if (r.water.enabled) {
      add('water', start, '💧', 'First glass at your desk', 'Start the workday with a full glass of water.');
      for (let m = start + 15 + r.water.workIntervalMin; m < end; m += r.water.workIntervalMin) {
        add('water', m, '💧', 'Hydration check', 'Time for a glass of water (250 ml).');
      }
    }
    if (r.move.enabled) {
      for (let m = start + r.move.intervalMin; m < end; m += r.move.intervalMin) {
        if (m >= lunch && m < lunchEnd) continue;
        add('move', m, '🚶', 'Move break', 'Stand up and walk for 2–3 minutes. Your back will thank you.');
      }
    }
    if (r.meals) {
      add('lunch', lunch, '🍱', 'Lunch time', 'Step away from the screen — check Menus for ideas that fit your budget.');
      const snack = roundTo(lunchEnd + (end - lunchEnd) / 2, 15);
      if (end - lunchEnd >= 150) add('snack', snack, '🍎', 'Afternoon snack window', 'If you are hungry, keep it under ~200 kcal and protein-forward.');
    }
    add('endOfWork', end, '🎉', 'Workday done', r.eveningWalk ? 'Shut the laptop and go for a 15-minute walk to reset.' : 'Nice work today. Time to switch off.');
    if (r.meals) {
      const dinner = Math.max(end + 90, Math.min(end + 150, sleep - 210));
      add('dinner', roundTo(dinner, 15), '🍽️', 'Dinner time', 'Fill half the plate with veg, a quarter with protein.');
    }
    if (r.water.enabled) {
      for (let m = end + r.water.offIntervalMin; m < sleep - 90; m += r.water.offIntervalMin) {
        add('water', m, '💧', 'Evening hydration', 'A glass of water now beats a snack later.');
      }
    }
  } else {
    if (r.meals) {
      add('breakfast', wake + 45, '🥞', 'Slow breakfast', 'Enjoy it — just log it.');
      add('lunch', Math.max(lunch, wake + 240), '🥗', 'Lunch time', 'Days off are when calories sneak in — check your budget first.');
      add('dinner', roundTo(Math.min(19 * 60, sleep - 210), 15), '🍽️', 'Dinner time', 'Fill half the plate with veg, a quarter with protein.');
    }
    if (r.water.enabled) {
      for (let m = wake + 60; m < sleep - 90; m += r.water.offIntervalMin) {
        add('water', m, '💧', 'Hydration check', 'Time for a glass of water.');
      }
    }
    if (r.eveningWalk) {
      add('eveningWalk', roundTo(Math.min(17 * 60, sleep - 300), 30), '🌇', 'Day-off walk', 'Get outside for 30 minutes — about 120 kcal and a better mood.');
    }
  }

  if (r.meals) add('kitchenClosed', roundTo(sleep - 150, 15), '🌙', 'Kitchen closing', 'Late-night snacks are the #1 deficit breaker. Herbal tea instead?');

  // Drop low-priority reminders that land within 10 minutes of a more important one.
  slots.sort((a, b) => a.min - b.min);
  const kept = slots.filter(
    (slot) => !slots.some((other) => other !== slot && Math.abs(other.min - slot.min) < 10 && PRIORITY[other.kind] > PRIORITY[slot.kind]),
  );

  return kept.map((slot) => ({
    id: `${key}@${fromMinutes(slot.min)}:${slot.kind}`,
    kind: slot.kind,
    at: atMinutes(date, slot.min),
    title: slot.title,
    body: slot.body,
    emoji: slot.emoji,
  }));
}

/** Reminders that should fire now: due, unfired and not older than `graceMin` (newest per kind only). */
export function dueReminders(slots: ReminderSlot[], fired: Set<string>, now: Date, graceMin = 15): ReminderSlot[] {
  const latestByKind = new Map<ReminderKind, ReminderSlot>();
  for (const slot of slots) {
    const age = (now.getTime() - slot.at.getTime()) / 60000;
    if (age < 0 || age > graceMin || fired.has(slot.id)) continue;
    const prev = latestByKind.get(slot.kind);
    if (!prev || prev.at < slot.at) latestByKind.set(slot.kind, slot);
  }
  return [...latestByKind.values()].sort((a, b) => a.at.getTime() - b.at.getTime());
}

export const REMINDER_META: Record<ReminderKind, { label: string; color: 'aqua' | 'violet' | 'coral' | 'peach' | 'lime' | 'sun' }> = {
  water: { label: 'Water', color: 'aqua' },
  move: { label: 'Move', color: 'violet' },
  breakfast: { label: 'Breakfast', color: 'peach' },
  lunch: { label: 'Lunch', color: 'peach' },
  snack: { label: 'Snack', color: 'lime' },
  dinner: { label: 'Dinner', color: 'peach' },
  endOfWork: { label: 'Wrap up', color: 'sun' },
  eveningWalk: { label: 'Walk', color: 'violet' },
  kitchenClosed: { label: 'Wind down', color: 'coral' },
  weighIn: { label: 'Weigh-in', color: 'lime' },
};
