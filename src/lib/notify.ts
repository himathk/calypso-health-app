import type { ReminderKind } from '../types';

export type PermissionState = NotificationPermission | 'unsupported';

export function notificationPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

const ACTIONS: Partial<Record<ReminderKind, { action: string; title: string }[]>> = {
  water: [{ action: 'water', title: '💧 Drank 250 ml' }, { action: 'snooze', title: 'Snooze 10m' }],
  move: [{ action: 'move', title: '✅ Did it' }, { action: 'snooze', title: 'Snooze 10m' }],
  lunch: [{ action: 'log-food', title: '📸 Log lunch' }],
  dinner: [{ action: 'log-food', title: '📸 Log dinner' }],
  breakfast: [{ action: 'log-food', title: '📸 Log breakfast' }],
};

/** Shows an OS-level notification via the service worker (so action buttons work). */
export async function showSystemNotification(opts: { id: string; kind: ReminderKind; title: string; body: string }): Promise<void> {
  if (notificationPermission() !== 'granted') return;
  const options: NotificationOptions & { actions?: { action: string; title: string }[]; renotify?: boolean } = {
    body: opts.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: `calypso-${opts.kind}`,
    renotify: true,
    data: { id: opts.id, kind: opts.kind },
    actions: ACTIONS[opts.kind],
  };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(opts.title, options);
      return;
    }
  } catch {
    /* fall back below */
  }
  try {
    new Notification(opts.title, options);
  } catch {
    /* some mobile browsers only allow SW notifications */
  }
}

let audioCtx: AudioContext | null = null;

/** A soft two-note chime, synthesised so there's no audio file to download. */
export function playChime(kind: ReminderKind = 'water'): void {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    const notes = kind === 'water' ? [880, 1174.66] : kind === 'move' ? [659.25, 987.77] : [523.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.14;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  } catch {
    /* audio is a nice-to-have */
  }
}

export function vibrate(pattern: number | number[] = [40, 60, 40]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
