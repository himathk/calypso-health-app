import { useCallback, useEffect } from 'react';
import { activeCalories, activityById } from '../data/activities';
import { dayKey } from '../lib/dates';
import { playChime, showSystemNotification, vibrate } from '../lib/notify';
import { dueReminders, remindersForDay } from '../lib/schedule';
import { currentWeight, useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import type { ActiveReminder, MealSlot, ReminderKind } from '../types';

const TICK_MS = 20_000;

function fire(r: Omit<ActiveReminder, 'firedAt'>) {
  const { profile } = useStore.getState();
  useUI.getState().pushReminder({ ...r, firedAt: Date.now() });
  if (profile?.reminders.sound) playChime(r.kind);
  vibrate();
  if (profile?.reminders.systemNotifications && (document.hidden || !document.hasFocus())) {
    void showSystemNotification({ id: r.id, kind: r.kind, title: `${r.emoji} ${r.title}`, body: r.body });
  }
}

/**
 * Checks the schedule every 20 s (and whenever the app regains focus) and pops
 * any reminder that just became due. Browsers throttle background timers to
 * ~1/min, which is still well inside the 15-minute grace window.
 */
export function useReminderEngine() {
  const schedule = useStore((s) => s.profile?.schedule);
  const reminders = useStore((s) => s.profile?.reminders);

  useEffect(() => {
    if (!schedule || !reminders) return;
    const tick = () => {
      const st = useStore.getState();
      if (!st.profile) return;
      const now = new Date();
      const slots = remindersForDay(st.profile, now);
      const due = dueReminders(slots, new Set(st.fired[dayKey(now)] ?? []), now);
      if (due.length) {
        // Mark everything up to now as fired so older missed slots don't pop later.
        st.markFired(slots.filter((s) => s.at <= now).map((s) => s.id));
        due.forEach((d) => fire({ id: d.id, kind: d.kind, title: d.title, body: d.body, emoji: d.emoji }));
      }
      st.snoozed
        .filter((s) => s.at <= now.getTime())
        .forEach((s) => {
          st.clearSnoozed(s.id);
          fire({ id: s.id, kind: s.kind, title: s.title, body: s.body, emoji: s.emoji });
        });
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [schedule, reminders]);
}

const MEAL_FOR: Partial<Record<ReminderKind, MealSlot>> = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' };

/** What each reminder's buttons do — shared by in-app cards and OS notification actions. */
export function useReminderActions() {
  const complete = useCallback((r: Pick<ActiveReminder, 'id' | 'kind'>) => {
    const st = useStore.getState();
    const ui = useUI.getState();
    ui.dismissReminder(r.id);
    switch (r.kind) {
      case 'water':
        st.addWater(250);
        st.markCompleted(r.id);
        ui.toast({ emoji: '💧', title: '+250 ml', body: 'Nice — keep sipping.', tone: 'aqua' });
        break;
      case 'move': {
        const type = activityById('walk-break');
        const kg = currentWeight(st);
        st.addActivity({ type: type.id, name: type.name, emoji: type.emoji, minutes: 3, kcal: activeCalories(type.met, kg, 3), source: 'reminder' });
        st.markCompleted(r.id);
        ui.toast({ emoji: '🚶', title: 'Move break logged', body: 'Your back says thanks.', tone: 'violet' });
        break;
      }
      case 'breakfast':
      case 'lunch':
      case 'dinner':
        ui.openSheet({ type: 'food', mode: 'snap', meal: MEAL_FOR[r.kind] });
        break;
      case 'snack':
        ui.setTab('menus');
        break;
      case 'endOfWork':
      case 'eveningWalk':
        ui.openSheet({ type: 'activity', activityId: 'walk' });
        break;
      case 'weighIn':
        ui.openSheet({ type: 'weight' });
        break;
      default:
        break;
    }
  }, []);

  const snooze = useCallback((r: Pick<ActiveReminder, 'id' | 'kind' | 'title' | 'body' | 'emoji'>) => {
    useUI.getState().dismissReminder(r.id);
    useStore.getState().snooze({ id: r.id, kind: r.kind, title: r.title, body: r.body, emoji: r.emoji }, 10);
    useUI.getState().toast({ emoji: '⏰', title: 'Snoozed for 10 minutes' });
  }, []);

  const dismiss = useCallback((r: Pick<ActiveReminder, 'id'>, _auto = false) => {
    useUI.getState().dismissReminder(r.id);
  }, []);

  return { complete, snooze, dismiss };
}

const FALLBACK_TEXT: Partial<Record<ReminderKind, { title: string; body: string; emoji: string }>> = {
  water: { title: 'Hydration check', body: 'Time for a glass of water.', emoji: '💧' },
  move: { title: 'Move break', body: 'Stand up and walk for 2–3 minutes.', emoji: '🚶' },
  lunch: { title: 'Lunch time', body: 'Step away from the screen.', emoji: '🍱' },
};

/** Handles taps on OS notification buttons and home-screen shortcuts (?go=…). */
export function useExternalActions() {
  const { complete, snooze } = useReminderActions();
  const hydrated = useStore((s) => s.hydrated);
  const hasProfile = useStore((s) => !!s.profile);

  useEffect(() => {
    if (!hydrated || !hasProfile) return;
    const handle = (action: string, kind?: string, id?: string) => {
      const k = (kind || 'water') as ReminderKind;
      const r = { id: id || `ext-${Date.now()}`, kind: k, ...(FALLBACK_TEXT[k] ?? FALLBACK_TEXT.water!) };
      if (action === 'water') complete({ ...r, kind: 'water' });
      else if (action === 'move') complete({ ...r, kind: 'move' });
      else if (action === 'snooze') snooze(r);
      else if (action === 'log-food') useUI.getState().openSheet({ type: 'food', mode: 'snap', meal: MEAL_FOR[k] });
    };

    const params = new URLSearchParams(location.search);
    const go = params.get('go');
    const action = params.get('action');
    if (go === 'snap') useUI.getState().openSheet({ type: 'food', mode: 'snap' });
    if (go === 'water') complete({ id: `shortcut-${Date.now()}`, kind: 'water' });
    if (go === 'activity') useUI.getState().openSheet({ type: 'activity' });
    if (action) handle(action, params.get('kind') ?? undefined, params.get('id') ?? undefined);
    if (go || action) history.replaceState(null, '', location.pathname);

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'calypso-reminder-action') handle(e.data.action, e.data.kind, e.data.id);
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, [hydrated, hasProfile, complete, snooze]);
}
