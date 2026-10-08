import { describe, expect, it } from 'vitest';
import type { Profile } from '../../types';
import { dayModeAt, dueReminders, remindersForDay } from '../schedule';

const profile: Pick<Profile, 'schedule' | 'reminders'> = {
  schedule: { workDays: [1, 2, 3, 4, 5], workStart: '09:00', workEnd: '17:00', lunchTime: '12:30', lunchMinutes: 45, wakeTime: '06:30', sleepTime: '22:30' },
  reminders: {
    water: { enabled: true, workIntervalMin: 60, offIntervalMin: 90 },
    move: { enabled: true, intervalMin: 30 },
    meals: true,
    eveningWalk: true,
    weighIn: { enabled: true, day: 1 },
    sound: false,
    systemNotifications: false,
  },
};

// 2026-10-07 is a Wednesday, 2026-10-10 a Saturday.
const wed = (h: number, m = 0) => new Date(2026, 9, 7, h, m);
const sat = (h: number, m = 0) => new Date(2026, 9, 10, h, m);
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

describe('day modes', () => {
  it('follows a 9-to-5 workday', () => {
    expect(dayModeAt(profile.schedule, wed(5)).mode).toBe('sleep');
    expect(dayModeAt(profile.schedule, wed(7)).mode).toBe('morning');
    expect(dayModeAt(profile.schedule, wed(10)).mode).toBe('work');
    expect(dayModeAt(profile.schedule, wed(12, 45)).mode).toBe('lunch');
    expect(dayModeAt(profile.schedule, wed(15)).mode).toBe('work');
    expect(dayModeAt(profile.schedule, wed(19)).mode).toBe('evening');
    expect(dayModeAt(profile.schedule, wed(23)).mode).toBe('sleep');
  });

  it('treats weekends as days off', () => {
    expect(dayModeAt(profile.schedule, sat(11)).mode).toBe('off');
  });

  it('handles bedtimes after midnight', () => {
    const late = { ...profile.schedule, sleepTime: '00:30' };
    expect(dayModeAt(late, wed(0, 15)).mode).not.toBe('sleep');
    expect(dayModeAt(late, wed(1)).mode).toBe('sleep');
  });
});

describe('workday reminders', () => {
  const slots = remindersForDay(profile, wed(0));
  const at = (kind: string) => slots.filter((s) => s.kind === kind).map((s) => hhmm(s.at));

  it('nudges a walk every 30 minutes at work, skipping lunch', () => {
    const moves = at('move');
    expect(moves[0]).toBe('09:30');
    expect(moves).toContain('12:00');
    expect(moves).not.toContain('12:30');
    expect(moves).not.toContain('13:00');
    expect(moves).toContain('13:30');
    expect(moves.at(-1)).toBe('16:30');
  });

  it('reminds to drink water through the workday and evening', () => {
    const water = at('water');
    expect(water[0]).toBe('09:00');
    expect(water).toContain('10:15');
    expect(water.some((t) => t > '17:00')).toBe(true);
  });

  it('calls lunch on time and marks the end of the day', () => {
    expect(at('lunch')).toEqual(['12:30']);
    expect(at('endOfWork')).toEqual(['17:00']);
    expect(at('breakfast')).toEqual(['07:00']);
  });

  it('never schedules anything while asleep', () => {
    expect(slots.every((s) => hhmm(s.at) >= '06:30' && hhmm(s.at) < '22:30')).toBe(true);
  });
});

describe('days off', () => {
  const slots = remindersForDay(profile, sat(0));
  it('drops desk move breaks but keeps water, meals and a walk', () => {
    expect(slots.some((s) => s.kind === 'move')).toBe(false);
    expect(slots.some((s) => s.kind === 'water')).toBe(true);
    expect(slots.some((s) => s.kind === 'eveningWalk')).toBe(true);
    expect(slots.some((s) => s.kind === 'lunch')).toBe(true);
  });
});

describe('dueReminders', () => {
  const slots = remindersForDay(profile, wed(0));
  it('fires the newest due reminder per kind within the grace window', () => {
    const due = dueReminders(slots, new Set(), wed(10, 5));
    expect(due.map((d) => `${d.kind}@${hhmm(d.at)}`)).toEqual(['move@10:00']);
  });
  it('does not re-fire', () => {
    const first = dueReminders(slots, new Set(), wed(10, 5));
    expect(dueReminders(slots, new Set(first.map((f) => f.id)), wed(10, 6))).toEqual([]);
  });
  it('ignores stale reminders', () => {
    expect(dueReminders(slots, new Set(), wed(10, 29)).length).toBe(1); // 10:15 water only
  });
});
