import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { AlarmClockOff, Check, X } from 'lucide-react';
import { useEffect } from 'react';
import { useReminderActions } from '../hooks/useReminderEngine';
import { achievementById } from '../lib/achievements';
import { REMINDER_META } from '../lib/schedule';
import { useUI } from '../store/useUI';
import type { ActiveReminder } from '../types';
import { Button, toneSoft } from './ui';

const PRIMARY_LABEL: Partial<Record<ActiveReminder['kind'], string>> = {
  water: 'Drank 250 ml',
  move: 'Did it',
  breakfast: 'Log breakfast',
  lunch: 'Log lunch',
  dinner: 'Log dinner',
  snack: 'See snack ideas',
  endOfWork: 'Log my walk',
  eveningWalk: 'Log my walk',
  weighIn: 'Log weight',
  kitchenClosed: 'Got it',
};

function ReminderCard({ r }: { r: ActiveReminder }) {
  const { complete, snooze, dismiss } = useReminderActions();
  const meta = REMINDER_META[r.kind];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 120, scale: 0.9, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => Math.abs(info.offset.x) > 110 && dismiss(r)}
      className="glass pointer-events-auto w-full overflow-hidden rounded-3xl p-4 shadow-2xl"
      style={{ background: 'rgb(var(--surface) / 0.94)' }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${toneSoft[meta.color]}`}
          animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
          transition={{ duration: 0.9, delay: 0.3 }}
        >
          {r.emoji}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${toneSoft[meta.color]}`}>{meta.label}</span>
          </div>
          <p className="mt-1 font-semibold leading-tight">{r.title}</p>
          <p className="mt-0.5 text-sm text-muted">{r.body}</p>
        </div>
        <button aria-label="Dismiss" onClick={() => dismiss(r)} className="text-muted hover:text-fg">
          <X size={18} />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1 py-2.5 text-sm" variant={r.kind === 'water' ? 'cool' : 'primary'} onClick={() => complete(r)}>
          <Check size={16} /> {PRIMARY_LABEL[r.kind] ?? 'Done'}
        </Button>
        {(r.kind === 'water' || r.kind === 'move' || r.kind === 'lunch') && (
          <Button variant="soft" className="py-2.5 text-sm" onClick={() => snooze(r)}>
            <AlarmClockOff size={16} /> 10m
          </Button>
        )}
      </div>
      <motion.div
        className={`mt-3 h-1 rounded-full ${r.kind === 'water' ? 'bg-aqua' : 'bg-brand'}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 90, ease: 'linear' }}
        onAnimationComplete={() => dismiss(r, true)}
      />
    </motion.div>
  );
}

export function ReminderStack() {
  const reminders = useUI((s) => s.reminders);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto flex max-w-md flex-col gap-3 p-3 pt-[max(env(safe-area-inset-top),0.75rem)] lg:right-6 lg:left-auto lg:mx-0">
      <AnimatePresence>
        {reminders.map((r) => (
          <ReminderCard key={r.id} r={r} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ToastStack() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[55] flex flex-col items-center gap-2 px-4 lg:bottom-8">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="glass flex items-center gap-3 rounded-full py-2.5 pl-3 pr-5 shadow-card"
            style={{ background: 'rgb(var(--surface) / 0.94)' }}
          >
            <motion.span className="text-xl" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.1 }}>
              {t.emoji}
            </motion.span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.body && <p className="text-xs text-muted">{t.body}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ConfettiBurst() {
  const count = useUI((s) => s.confetti);
  useEffect(() => {
    if (!count || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#FF6B78', '#FFAA64', '#FFD05A', '#38DAE6', '#9274FF', '#AAE848'];
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.65 }, colors, scalar: 1.1 });
    const t = setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors });
      confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors });
    }, 250);
    return () => clearTimeout(t);
  }, [count]);
  return null;
}

export function AchievementPopup() {
  const id = useUI((s) => s.achievement);
  const show = useUI((s) => s.showAchievement);
  const a = id ? achievementById(id) : undefined;
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => show(null), 4200);
    return () => clearTimeout(t);
  }, [id, show]);
  return (
    <AnimatePresence>
      {a && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => show(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            className="glass relative flex w-full max-w-xs flex-col items-center rounded-[2rem] p-8 text-center"
            style={{ background: 'rgb(var(--surface) / 0.95)' }}
            initial={{ scale: 0.5, rotate: -8, y: 40 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <motion.div
              className="absolute -top-10 flex h-24 w-24 items-center justify-center rounded-full bg-brand text-5xl shadow-glow"
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
            >
              {a.emoji}
            </motion.div>
            <p className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-peach">Achievement unlocked</p>
            <h3 className="mt-2 text-2xl font-bold">{a.title}</h3>
            <p className="mt-1 text-sm text-muted">{a.description}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
