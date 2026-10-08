import { motion } from 'framer-motion';
import { formatClock, minutesOfDay, toMinutes } from '../lib/dates';
import { REMINDER_META, isWorkDay } from '../lib/schedule';
import type { ReminderSlot, Schedule } from '../types';

interface Segment {
  from: number;
  to: number;
  color: string;
  label: string;
}

function segmentsFor(s: Schedule, workDay: boolean): Segment[] {
  const wake = toMinutes(s.wakeTime);
  let sleep = toMinutes(s.sleepTime);
  if (sleep <= wake) sleep = 1440; // bedtime after midnight: draw until the end of the bar
  const start = toMinutes(s.workStart);
  const end = toMinutes(s.workEnd);
  const lunch = toMinutes(s.lunchTime);
  const lunchEnd = lunch + s.lunchMinutes;
  const segs: Segment[] = [{ from: 0, to: wake, color: 'rgb(var(--line) / 0.1)', label: 'Sleep' }];
  if (workDay) {
    segs.push({ from: wake, to: start, color: 'rgb(var(--peach))', label: 'Morning' });
    segs.push({ from: start, to: lunch, color: 'rgb(var(--violet))', label: 'Work' });
    segs.push({ from: lunch, to: lunchEnd, color: 'rgb(var(--lime))', label: 'Lunch' });
    segs.push({ from: lunchEnd, to: end, color: 'rgb(var(--violet))', label: 'Work' });
    segs.push({ from: end, to: sleep, color: 'rgb(var(--coral))', label: 'Evening' });
  } else {
    segs.push({ from: wake, to: sleep, color: 'rgb(var(--aqua))', label: 'Day off' });
  }
  segs.push({ from: sleep, to: 1440, color: 'rgb(var(--line) / 0.1)', label: 'Sleep' });
  return segs.filter((x) => x.to > x.from);
}

/** A 24-hour bar of the user's day with reminder dots and a live "now" marker. */
export function DayTimeline({ schedule, date = new Date(), reminders = [], now, compact = false }: { schedule: Schedule; date?: Date; reminders?: ReminderSlot[]; now?: Date; compact?: boolean }) {
  const workDay = isWorkDay(schedule, date);
  const segs = segmentsFor(schedule, workDay);
  const pct = (m: number) => `${(m / 1440) * 100}%`;
  return (
    <div className="w-full select-none">
      <div className={`relative ${compact ? 'h-10' : 'h-14'}`}>
        {reminders.map((r, i) => {
          const m = r.at.getHours() * 60 + r.at.getMinutes();
          const past = now ? r.at <= now : false;
          return (
            <motion.span
              key={r.id}
              title={`${formatClock(r.at)} · ${r.title}`}
              className="absolute bottom-1 -translate-x-1/2 rounded-full"
              style={{
                left: pct(m),
                width: 6,
                height: r.kind === 'move' ? 10 : r.kind === 'water' ? 14 : 20,
                background: `rgb(var(--${REMINDER_META[r.kind].color}))`,
                opacity: past ? 0.35 : 0.95,
              }}
              initial={{ scaleY: 0, originY: 1 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.3 + i * 0.02, type: 'spring', stiffness: 300, damping: 18 }}
            />
          );
        })}
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-fg/5">
        {segs.map((s, i) => (
          <motion.div
            key={`${s.label}-${i}`}
            className="absolute inset-y-0"
            style={{ background: s.color }}
            initial={{ left: pct(s.from), width: 0 }}
            animate={{ left: pct(s.from), width: pct(s.to - s.from) }}
            transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.05 }}
          />
        ))}
      </div>
      {now && (
        <div className="relative h-0">
          <motion.div className="absolute -top-[18px] -translate-x-1/2" animate={{ left: pct(minutesOfDay(now)) }} transition={{ type: 'spring', stiffness: 60 }}>
            <span className="relative block h-6 w-1 rounded-full bg-fg shadow-[0_0_12px_rgb(var(--fg)/0.8)]" />
            <motion.span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg/40" animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
          </motion.div>
        </div>
      )}
      {!compact && (
        <div className="relative mt-2 h-4 text-[10px] font-medium text-muted">
          {[0, 6, 9, 12, 15, 18, 21, 24].map((h) => (
            <span key={h} className="absolute -translate-x-1/2" style={{ left: pct(h * 60) }}>
              {h === 24 ? '' : formatClock(`${String(h).padStart(2, '0')}:00`)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
