import { create } from 'zustand';
import type { ActiveReminder, MealSlot } from '../types';

export type Tab = 'today' | 'menus' | 'activity' | 'progress' | 'profile';

export type Sheet =
  | { type: 'food'; mode?: 'snap' | 'search' | 'quick'; meal?: MealSlot }
  | { type: 'activity'; activityId?: string }
  | { type: 'weight' }
  | { type: 'meal'; mealId: string; meal?: MealSlot }
  | { type: 'plan' };

export interface Toast {
  id: number;
  emoji: string;
  title: string;
  body?: string;
  tone?: 'coral' | 'aqua' | 'violet' | 'lime' | 'peach' | 'sun';
}

interface UIState {
  tab: Tab;
  setTab: (t: Tab) => void;
  sheet: Sheet | null;
  openSheet: (s: Sheet) => void;
  closeSheet: () => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  reminders: ActiveReminder[];
  pushReminder: (r: ActiveReminder) => void;
  dismissReminder: (id: string) => void;
  /** Incremented to fire a confetti burst. */
  confetti: number;
  celebrate: () => void;
  achievement: string | null;
  showAchievement: (id: string | null) => void;
}

let toastId = 0;

export const useUI = create<UIState>()((set) => ({
  tab: 'today',
  setTab: (tab) => set({ tab }),
  sheet: null,
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
  toasts: [],
  toast: (t) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  reminders: [],
  pushReminder: (r) => set((s) => ({ reminders: [...s.reminders.filter((x) => x.kind !== r.kind), r].slice(-3) })),
  dismissReminder: (id) => set((s) => ({ reminders: s.reminders.filter((x) => x.id !== id) })),
  confetti: 0,
  celebrate: () => set((s) => ({ confetti: s.confetti + 1 })),
  achievement: null,
  showAchievement: (achievement) => set({ achievement }),
}));
