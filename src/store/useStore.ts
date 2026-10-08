import { del, get, set } from 'idb-keyval';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { dayKey, timeKey } from '../lib/dates';
import type { ActivityEntry, FoodEntry, Profile, Theme, WaterEntry, WeightEntry } from '../types';

// IndexedDB instead of localStorage: food photo thumbnails would blow the 5 MB limit.
const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name)) ?? null,
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

export const uid = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export interface Settings {
  theme: Theme;
  apiKey: string;
  use24h: boolean;
}

export interface SnoozedReminder {
  id: string;
  kind: import('../types').ReminderKind;
  title: string;
  body: string;
  emoji: string;
  at: number;
}

interface PersistedState {
  profile: Profile | null;
  foods: FoodEntry[];
  activities: ActivityEntry[];
  water: WaterEntry[];
  weights: WeightEntry[];
  /** Reminder slot IDs already shown, keyed by day. */
  fired: Record<string, string[]>;
  snoozed: SnoozedReminder[];
  /** Reminder slot IDs the user completed ("Did it"). */
  completed: Record<string, string[]>;
  achievements: Record<string, string>;
  settings: Settings;
}

interface Actions {
  setProfile: (p: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addFood: (entry: Omit<FoodEntry, 'id' | 'date' | 'time'> & Partial<Pick<FoodEntry, 'date' | 'time'>>) => FoodEntry;
  updateFood: (id: string, patch: Partial<FoodEntry>) => void;
  removeFood: (id: string) => void;
  addActivity: (entry: Omit<ActivityEntry, 'id' | 'date' | 'time'> & Partial<Pick<ActivityEntry, 'date' | 'time'>>) => ActivityEntry;
  removeActivity: (id: string) => void;
  addWater: (ml: number) => void;
  undoWater: (date?: string) => void;
  logWeight: (kg: number, date?: string) => void;
  removeWeight: (date: string) => void;
  markFired: (ids: string[]) => void;
  markCompleted: (id: string) => void;
  snooze: (r: Omit<SnoozedReminder, 'at'>, minutes: number) => void;
  clearSnoozed: (id: string) => void;
  unlock: (ids: string[]) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  importData: (data: Partial<PersistedState>) => void;
  resetAll: () => void;
}

export type AppState = PersistedState & Actions & { hydrated: boolean };

const initial: PersistedState = {
  profile: null,
  foods: [],
  activities: [],
  water: [],
  weights: [],
  fired: {},
  snoozed: [],
  completed: {},
  achievements: {},
  settings: { theme: 'dark', apiKey: '', use24h: false },
};

/** Keep only the last few days of reminder bookkeeping. */
function prune(map: Record<string, string[]>): Record<string, string[]> {
  const keys = Object.keys(map).sort().slice(-3);
  return Object.fromEntries(keys.map((k) => [k, map[k]]));
}

export const useStore = create<AppState>()(
  persist(
    (setState, getState) => ({
      ...initial,
      hydrated: false,

      setProfile: (profile) =>
        setState((s) => ({
          profile,
          weights: s.weights.length ? s.weights : [{ date: dayKey(), kg: profile.startWeightKg }],
        })),
      updateProfile: (patch) => setState((s) => (s.profile ? { profile: { ...s.profile, ...patch } } : {})),

      addFood: (entry) => {
        const now = new Date();
        const full: FoodEntry = { id: uid(), date: dayKey(now), time: timeKey(now), ...entry };
        setState((s) => ({ foods: [...s.foods, full] }));
        return full;
      },
      updateFood: (id, patch) => setState((s) => ({ foods: s.foods.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      removeFood: (id) => setState((s) => ({ foods: s.foods.filter((f) => f.id !== id) })),

      addActivity: (entry) => {
        const now = new Date();
        const full: ActivityEntry = { id: uid(), date: dayKey(now), time: timeKey(now), ...entry };
        setState((s) => ({ activities: [...s.activities, full] }));
        return full;
      },
      removeActivity: (id) => setState((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),

      addWater: (ml) => {
        const now = new Date();
        setState((s) => ({ water: [...s.water, { id: uid(), date: dayKey(now), time: timeKey(now), ml }] }));
      },
      undoWater: (date = dayKey()) =>
        setState((s) => {
          const idx = s.water.map((w) => w.date).lastIndexOf(date);
          if (idx < 0) return {};
          return { water: s.water.filter((_, i) => i !== idx) };
        }),

      logWeight: (kg, date = dayKey()) =>
        setState((s) => ({
          weights: [...s.weights.filter((w) => w.date !== date), { date, kg: Math.round(kg * 10) / 10 }].sort((a, b) => a.date.localeCompare(b.date)),
        })),
      removeWeight: (date) => setState((s) => ({ weights: s.weights.filter((w) => w.date !== date) })),

      markFired: (ids) =>
        setState((s) => {
          const key = dayKey();
          const today = new Set(s.fired[key] ?? []);
          ids.forEach((id) => today.add(id));
          return { fired: prune({ ...s.fired, [key]: [...today] }) };
        }),
      markCompleted: (id) =>
        setState((s) => {
          const key = dayKey();
          const today = new Set(s.completed[key] ?? []);
          today.add(id);
          return { completed: prune({ ...s.completed, [key]: [...today] }) };
        }),
      snooze: (r, minutes) =>
        setState((s) => ({
          snoozed: [...s.snoozed.filter((x) => x.id !== r.id), { ...r, id: `${r.id}~${Date.now()}`, at: Date.now() + minutes * 60_000 }],
        })),
      clearSnoozed: (id) => setState((s) => ({ snoozed: s.snoozed.filter((x) => x.id !== id) })),

      unlock: (ids) =>
        setState((s) => {
          const next = { ...s.achievements };
          ids.forEach((id) => (next[id] ??= new Date().toISOString()));
          return { achievements: next };
        }),

      updateSettings: (patch) => setState((s) => ({ settings: { ...s.settings, ...patch } })),

      importData: (data) => setState(() => ({ ...initial, ...data, settings: { ...initial.settings, ...data.settings } })),
      resetAll: () => {
        setState({ ...initial, settings: getState().settings });
      },
    }),
    {
      name: 'calypso-v1',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s): PersistedState => ({
        profile: s.profile,
        foods: s.foods,
        activities: s.activities,
        water: s.water,
        weights: s.weights,
        fired: s.fired,
        snoozed: s.snoozed,
        completed: s.completed,
        achievements: s.achievements,
        settings: s.settings,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Current weight = most recent weigh-in, falling back to the starting weight. */
export function currentWeight(s: Pick<AppState, 'weights' | 'profile'>): number {
  return s.weights.length ? s.weights[s.weights.length - 1].kg : (s.profile?.startWeightKg ?? 70);
}
