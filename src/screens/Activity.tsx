import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Plus, Timer, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BarChart } from '../components/Charts';
import { MiniRing } from '../components/Rings';
import { Sheet } from '../components/Sheet';
import { AnimatedNumber, Button, Card, SectionTitle, Segmented, Slider, rise, stagger, toneSoft } from '../components/ui';
import { ACTIVITY_TYPES, INTENSITY, activeCalories, activityById, type IntensityId } from '../data/activities';
import { useDayStats, useToday } from '../hooks/useDerived';
import { WEEKDAYS_SHORT, formatClock, formatDayLabel, lastNDays, parseDayKey } from '../lib/dates';
import { currentWeight, useStore } from '../store/useStore';
import { useUI } from '../store/useUI';

const QUICK = ['walk-break', 'walk', 'brisk-walk', 'stairs', 'strength', 'run', 'cycle', 'yoga'];
const WEEKLY_GOAL_MIN = 150;

export function ActivityScreen() {
  const activities = useStore((s) => s.activities);
  const removeActivity = useStore((s) => s.removeActivity);
  const weight = useStore(currentWeight);
  const openSheet = useUI((s) => s.openSheet);
  const today = useToday();
  const day = useDayStats();

  const week = lastNDays(7);
  const minutesByDay = week.map((d) => activities.filter((a) => a.date === d).reduce((t, a) => t + a.minutes, 0));
  const weekMinutes = minutesByDay.reduce((a, b) => a + b, 0);
  const weekKcal = activities.filter((a) => week.includes(a.date)).reduce((t, a) => t + a.kcal, 0);

  const history = useMemo(() => {
    const byDay = new Map<string, typeof activities>();
    [...activities].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).forEach((a) => byDay.set(a.date, [...(byDay.get(a.date) ?? []), a]));
    return [...byDay.entries()].slice(0, 10);
  }, [activities]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={rise}>
        <h1 className="text-3xl font-bold">Move</h1>
        <p className="text-muted">Every walk break counts. Logged activity raises today's calorie budget.</p>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center">
              <MiniRing progress={day.exerciseKcal / 300} size={64} stroke={7} color="rgb(var(--violet))">
                <Flame size={18} className="text-violet" />
              </MiniRing>
              <p className="mt-2 font-display text-xl font-bold">
                <AnimatedNumber value={day.exerciseKcal} />
              </p>
              <p className="text-xs text-muted">kcal today</p>
            </div>
            <div className="flex flex-col items-center">
              <MiniRing progress={day.activeMinutes / 30} size={64} stroke={7} color="rgb(var(--aqua))">
                <Timer size={18} className="text-aqua" />
              </MiniRing>
              <p className="mt-2 font-display text-xl font-bold">
                <AnimatedNumber value={day.activeMinutes} />
              </p>
              <p className="text-xs text-muted">min today</p>
            </div>
            <div className="flex flex-col items-center">
              <MiniRing progress={weekMinutes / WEEKLY_GOAL_MIN} size={64} stroke={7} color="rgb(var(--lime))">
                <span className="text-[11px]">{Math.min(100, Math.round((weekMinutes / WEEKLY_GOAL_MIN) * 100))}%</span>
              </MiniRing>
              <p className="mt-2 font-display text-xl font-bold">
                <AnimatedNumber value={weekMinutes} />
              </p>
              <p className="text-xs text-muted">of 150 min/wk</p>
            </div>
          </div>
        </Card>
        <Card>
          <SectionTitle action={<span className="text-xs text-muted">{weekKcal.toLocaleString()} kcal this week</span>}>Last 7 days</SectionTitle>
          <BarChart
            data={week.map((d, i) => ({ label: WEEKDAYS_SHORT[parseDayKey(d).getDay()].slice(0, 2), value: minutesByDay[i], highlight: d === today }))}
            target={Math.round(WEEKLY_GOAL_MIN / 7)}
            tone="violet"
            height={120}
            format={(v) => `${Math.round(v)}m`}
          />
        </Card>
      </div>

      <Card>
        <SectionTitle>Quick log</SectionTitle>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {QUICK.map((id, i) => {
            const a = activityById(id);
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.04, type: 'spring', stiffness: 300, damping: 18 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => openSheet({ type: 'activity', activityId: id })}
                className={clsx('flex flex-col items-center gap-1 rounded-2xl p-3', toneSoft[a.color].split(' ')[0])}
              >
                <span className="text-3xl">{a.emoji}</span>
                <span className="text-center text-[11px] font-semibold leading-tight text-fg">{a.name.replace('Desk walk break', 'Walk break')}</span>
              </motion.button>
            );
          })}
        </div>
        <Button variant="soft" className="mt-3 w-full" onClick={() => openSheet({ type: 'activity' })}>
          <Plus size={18} /> More activities
        </Button>
      </Card>

      <Card>
        <SectionTitle>History</SectionTitle>
        {history.length === 0 && <p className="text-sm text-muted">Nothing logged yet. Your first walk break is a great start — about {activeCalories(3, weight, 3)} kcal in 3 minutes.</p>}
        <div className="space-y-4">
          {history.map(([date, items]) => (
            <div key={date}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                {formatDayLabel(date)} · {items.reduce((t, a) => t + a.kcal, 0)} kcal
              </p>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((a) => (
                    <motion.div key={a.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40, height: 0 }} className="flex items-center gap-3 rounded-2xl bg-fg/[0.035] p-2.5 pr-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-xl">{a.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{a.name}</p>
                        <p className="text-xs text-muted">
                          {a.minutes} min · {formatClock(a.time)}
                          {a.source === 'reminder' && ' · from reminder'}
                        </p>
                      </div>
                      <span className="font-display font-semibold text-violet">−{a.kcal}</span>
                      <button aria-label={`Delete ${a.name}`} onClick={() => removeActivity(a.id)} className="text-muted hover:text-coral">
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

export function ActivitySheet() {
  const sheet = useUI((s) => s.sheet);
  const { closeSheet, toast } = useUI();
  const addActivity = useStore((s) => s.addActivity);
  const weight = useStore(currentWeight);
  const open = sheet?.type === 'activity';
  const [typeId, setTypeId] = useState('walk');
  const [minutes, setMinutes] = useState(30);
  const [intensity, setIntensity] = useState<IntensityId>('moderate');

  useEffect(() => {
    if (sheet?.type !== 'activity') return;
    const t = activityById(sheet.activityId ?? 'walk');
    setTypeId(t.id);
    setMinutes(t.defaultMinutes);
    setIntensity('moderate');
  }, [sheet]);

  const type = activityById(typeId);
  const factor = INTENSITY.find((i) => i.id === intensity)!.factor;
  const kcal = activeCalories(type.met, weight, minutes, factor);

  const save = () => {
    addActivity({ type: type.id, name: type.name, emoji: type.emoji, minutes, kcal, source: 'manual' });
    closeSheet();
    toast({ emoji: type.emoji, title: `${type.name} logged`, body: `−${kcal} kcal · budget raised`, tone: 'violet' });
    if (minutes >= 30) useUI.getState().celebrate();
  };

  return (
    <Sheet open={open} onClose={closeSheet} title="Log activity">
      <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
        {ACTIVITY_TYPES.map((a) => (
          <motion.button
            key={a.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setTypeId(a.id);
              setMinutes(a.defaultMinutes);
            }}
            className={clsx('flex w-20 shrink-0 flex-col items-center gap-1 rounded-2xl p-2.5 transition-colors', typeId === a.id ? 'bg-violet text-white shadow-[0_0_24px_rgb(var(--violet)/0.5)]' : 'bg-fg/[0.05]')}
          >
            <motion.span className="text-2xl" animate={typeId === a.id ? { scale: [1, 1.3, 1], rotate: [0, -10, 0] } : {}}>
              {a.emoji}
            </motion.span>
            <span className="text-center text-[10px] font-semibold leading-tight">{a.name}</span>
          </motion.button>
        ))}
      </div>

      <div className="mt-4 rounded-3xl bg-fg/[0.04] p-5 text-center">
        <motion.p key={type.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold text-muted">
          {type.emoji} {type.name}
        </motion.p>
        <div className="mt-1 flex items-baseline justify-center gap-2">
          <AnimatedNumber value={minutes} className="font-display text-6xl font-bold" duration={0.3} />
          <span className="text-lg text-muted">min</span>
        </div>
        <Slider label="Duration" value={minutes} min={1} max={180} onChange={setMinutes} />
        <div className="mt-2 flex justify-center gap-2">
          {[5, 15, 30, 45, 60].map((m) => (
            <button key={m} onClick={() => setMinutes(m)} className={clsx('rounded-full px-3 py-1 text-xs font-semibold', minutes === m ? 'bg-fg text-bg' : 'bg-fg/[0.06] text-muted')}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <span className="label">Intensity</span>
        <Segmented value={intensity} onChange={setIntensity} options={INTENSITY.map((i) => ({ value: i.id, label: i.label }))} />
      </div>

      <motion.div layout className="mt-4 flex items-center justify-between rounded-3xl bg-violet/10 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet">Active calories</p>
          <p className="text-xs text-muted">MET {(type.met * factor).toFixed(1)} · {weight.toFixed(1)} kg</p>
        </div>
        <p className="font-display text-4xl font-bold text-violet">
          −<AnimatedNumber value={kcal} duration={0.4} />
        </p>
      </motion.div>

      <Button variant="cool" className="mt-4 w-full py-4 text-lg" onClick={save}>
        Log {minutes} min
      </Button>
    </Sheet>
  );
}
