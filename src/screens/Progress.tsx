import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Info, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BarChart, LineChart } from '../components/Charts';
import { Sheet } from '../components/Sheet';
import { AnimatedNumber, Button, Card, SectionTitle, rise, stagger } from '../components/ui';
import { computeDayStats, usePlan, useToday } from '../hooks/useDerived';
import { ACHIEVEMENTS, loggingStreak } from '../lib/achievements';
import { WEEKDAYS_SHORT, addDays, dayKey, lastNDays, parseDayKey } from '../lib/dates';
import { ACTIVITY_LEVELS, KCAL_PER_KG, formatWeight, kgToLb } from '../lib/nutrition';
import { currentWeight, useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import { WeightPicker } from './Onboarding';

export function ProgressScreen() {
  const profile = useStore((s) => s.profile)!;
  const weights = useStore((s) => s.weights);
  const foods = useStore((s) => s.foods);
  const activities = useStore((s) => s.activities);
  const water = useStore((s) => s.water);
  const unlocked = useStore((s) => s.achievements);
  const openSheet = useUI((s) => s.openSheet);
  const plan = usePlan()!;
  const today = useToday();
  const [explain, setExplain] = useState(false);
  const units = profile.units;
  const fmt = (kg: number, d = 1) => formatWeight(kg, units, d);
  const conv = (kg: number) => (units === 'imperial' ? kgToLb(kg) : kg);

  const now = currentWeight({ profile, weights });
  const lost = profile.startWeightKg - now;
  const total = Math.max(0.1, profile.startWeightKg - profile.goalWeightKg);
  const pct = Math.max(0, Math.min(1, lost / total));

  const points = weights.map((w) => ({ x: parseDayKey(w.date).getTime(), y: conv(w.kg) }));
  const projection = useMemo(() => {
    if (!plan.goalDate || plan.pace <= 0 || !weights.length) return undefined;
    // Project a few weeks ahead (not all the way to the goal) so real data keeps most of the chart.
    const last = weights[weights.length - 1];
    const start = parseDayKey(last.date).getTime();
    const span = start - parseDayKey(weights[0].date).getTime();
    const horizon = Math.min(plan.goalDate.getTime(), start + Math.max(28 * 864e5, span * 0.6));
    const weeks = (horizon - start) / (7 * 864e5);
    return [
      { x: start, y: conv(last.kg) },
      { x: horizon, y: conv(Math.max(profile.goalWeightKg, last.kg - plan.pace * weeks)) },
    ];
  }, [weights, plan, profile.goalWeightKg, units]);

  const week = lastNDays(7);
  const dayStats = week.map((d) => computeDayStats(d, { foods, activities, water }, plan, profile.eatBackExercise));
  const loggedDays = dayStats.filter((s) => s.foods.length > 0);
  const avgIntake = loggedDays.length ? Math.round(loggedDays.reduce((t, s) => t + s.eaten, 0) / loggedDays.length) : 0;
  const onTarget = dayStats.filter((s, i) => week[i] !== today && s.foods.length && s.eaten <= s.budget).length;
  const weekDeficit = dayStats.filter((s) => s.foods.length).reduce((t, s) => t + (plan.tdee + s.exerciseKcal - s.eaten), 0);
  const streak = loggingStreak(foods);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={rise} className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progress</h1>
          <p className="text-muted">Trends beat single days. Weigh in weekly, same time.</p>
        </div>
        <Button className="shrink-0 whitespace-nowrap px-4 py-2.5 text-sm" onClick={() => openSheet({ type: 'weight' })}>
          <Scale size={16} /> Log weight
        </Button>
      </motion.div>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="label">Current</span>
            <p className="font-display text-5xl font-bold">
              <AnimatedNumber value={conv(now)} format={(n) => n.toFixed(1)} />
              <span className="ml-1 text-lg font-medium text-muted">{units === 'imperial' ? 'lb' : 'kg'}</span>
            </p>
          </div>
          <div className={clsx('flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold', lost >= 0 ? 'bg-lime/15 text-lime' : 'bg-coral/15 text-coral')}>
            {lost >= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
            {fmt(Math.abs(lost))} {lost >= 0 ? 'lost' : 'gained'}
          </div>
        </div>
        <div className="relative mt-6">
          <div className="h-4 overflow-hidden rounded-full bg-fg/10">
            <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ type: 'spring', stiffness: 40, damping: 14, delay: 0.3 }} />
          </div>
          <motion.span className="absolute -top-7 -translate-x-1/2 text-2xl" initial={{ left: '0%' }} animate={{ left: `${pct * 100}%` }} transition={{ type: 'spring', stiffness: 40, damping: 14, delay: 0.3 }}>
            <motion.span className="inline-block" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
              {pct >= 1 ? '🏆' : '🏃'}
            </motion.span>
          </motion.span>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>Start {fmt(profile.startWeightKg)}</span>
            <span className="font-semibold text-fg">{Math.round(pct * 100)}%</span>
            <span>Goal {fmt(profile.goalWeightKg)}</span>
          </div>
        </div>
        {plan.goalDate && (
          <p className="mt-4 rounded-2xl bg-fg/[0.04] p-3 text-sm">
            At {fmt(plan.pace, 2)}/week you'll reach {fmt(profile.goalWeightKg)} around{' '}
            <span className="font-semibold text-gradient">{plan.goalDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>.
          </p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle action={<span className="text-xs text-muted">{weights.length} weigh-in{weights.length === 1 ? '' : 's'}</span>}>Weight trend</SectionTitle>
          {points.length > 0 ? (
            <LineChart points={points} goal={conv(profile.goalWeightKg)} projection={projection} height={220} />
          ) : (
            <p className="text-sm text-muted">Log your weight to see your trend.</p>
          )}
          <div className="mt-3 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-1 w-4 rounded bg-coral" /> Weight</span>
            <span className="flex items-center gap-1.5"><span className="h-1 w-4 rounded bg-lime" /> Goal</span>
            <span className="flex items-center gap-1.5"><span className="h-1 w-4 rounded bg-violet" /> Projection</span>
          </div>
        </Card>
        <Card>
          <SectionTitle action={<span className="text-xs text-muted">avg {avgIntake.toLocaleString()} kcal</span>}>Calories, last 7 days</SectionTitle>
          <BarChart
            data={week.map((d, i) => ({ label: WEEKDAYS_SHORT[parseDayKey(d).getDay()].slice(0, 2), value: dayStats[i].eaten, highlight: d === today }))}
            target={plan.targetKcal}
            tone="lime"
            overTone="coral"
            height={150}
          />
        </Card>
      </div>

      <motion.div variants={rise} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Logging streak', value: streak, unit: streak === 1 ? 'day' : 'days', emoji: '🔥' },
          { label: 'On-target days', value: onTarget, unit: '/ 7', emoji: '🎯' },
          { label: 'Week deficit', value: Math.max(0, weekDeficit), unit: 'kcal', emoji: '📉' },
          { label: '≈ fat burned', value: Math.max(0, weekDeficit) / KCAL_PER_KG * (units === 'imperial' ? 2.2046 : 1), unit: units === 'imperial' ? 'lb' : 'kg', emoji: '⚖️', digits: 2 },
        ].map((s, i) => (
          <motion.div key={s.label} className="card p-4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.07, type: 'spring' }}>
            <span className="text-2xl">{s.emoji}</span>
            <p className="mt-1 font-display text-2xl font-bold">
              <AnimatedNumber value={s.value} format={(n) => n.toFixed(s.digits ?? 0)} /> <span className="text-sm font-medium text-muted">{s.unit}</span>
            </p>
            <p className="text-xs text-muted">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <Card>
        <SectionTitle action={<span className="text-xs text-muted">{Object.keys(unlocked).length} / {ACHIEVEMENTS.length}</span>}>Achievements</SectionTitle>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {ACHIEVEMENTS.map((a, i) => {
            const got = !!unlocked[a.id];
            return (
              <motion.div
                key={a.id}
                title={a.description}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className={clsx('flex flex-col items-center rounded-2xl p-3 text-center', got ? 'bg-brand/10 bg-gradient-to-b from-peach/20 to-coral/5' : 'bg-fg/[0.03]')}
              >
                <motion.span className={clsx('text-3xl', !got && 'opacity-30 grayscale')} whileHover={got ? { scale: 1.3, rotate: 12 } : {}}>
                  {got ? a.emoji : '🔒'}
                </motion.span>
                <p className={clsx('mt-1 text-[11px] font-semibold leading-tight', !got && 'text-muted')}>{a.title}</p>
              </motion.div>
            );
          })}
        </div>
      </Card>

      <Card>
        <button className="flex w-full items-center justify-between" onClick={() => setExplain((v) => !v)}>
          <span className="flex items-center gap-2 text-lg font-semibold">
            <Info size={18} className="text-aqua" /> How your deficit is calculated
          </span>
          <motion.span animate={{ rotate: explain ? 180 : 0 }}>
            <ChevronDown />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {explain && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <ol className="mt-4 space-y-3 text-sm">
                {[
                  ['Basal metabolic rate', `${plan.bmr} kcal`, `Mifflin–St Jeor for a ${plan.age}-year-old ${profile.sex}, ${Math.round(profile.heightCm)} cm, ${fmt(now)}.`],
                  ['× activity', `${plan.tdee} kcal`, `${ACTIVITY_LEVELS[profile.activityLevel].label} (×${ACTIVITY_LEVELS[profile.activityLevel].multiplier}) — your maintenance calories.`],
                  ['− deficit', `${plan.dailyDeficit} kcal`, `${fmt(plan.pace, 2)}/week × ${KCAL_PER_KG} kcal per kg of fat ÷ 7 days.${plan.adjustment === 'calorie-floor' ? ' Limited so you never go below a safe minimum.' : ''}`],
                  ['= daily target', `${plan.targetKcal} kcal`, `Plus ${Math.round(profile.eatBackExercise * 100)}% of the calories you burn in logged activity.`],
                ].map(([title, value, desc], i) => (
                  <motion.li key={title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aqua/15 text-xs font-bold text-aqua">{i + 1}</span>
                    <div className="flex-1">
                      <p className="flex justify-between font-semibold">
                        {title} <span className="font-display">{value}</span>
                      </p>
                      <p className="text-xs text-muted">{desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export function WeightSheet() {
  const sheet = useUI((s) => s.sheet);
  const { closeSheet, toast, celebrate } = useUI();
  const profile = useStore((s) => s.profile);
  const weights = useStore((s) => s.weights);
  const logWeight = useStore((s) => s.logWeight);
  const open = sheet?.type === 'weight';
  const last = profile ? currentWeight({ profile, weights }) : 70;
  const [kg, setKg] = useState(last);
  const [date, setDate] = useState(dayKey());
  useEffect(() => {
    if (open) {
      setKg(last);
      setDate(dayKey());
    }
  }, [open]);
  if (!profile) return null;
  const diff = kg - last;
  const save = () => {
    logWeight(kg, date);
    closeSheet();
    toast({ emoji: diff <= 0 ? '📉' : '📈', title: `Logged ${formatWeight(kg, profile.units)}`, body: diff < 0 ? `${formatWeight(-diff, profile.units)} down. Lovely.` : diff > 0 ? 'Daily swings are normal — watch the trend.' : 'Steady.', tone: diff <= 0 ? 'lime' : 'sun' });
    if (diff < 0) celebrate();
  };
  return (
    <Sheet open={open} onClose={closeSheet} title="Log weight">
      <WeightPicker label="Today's weight" kg={kg} units={profile.units} onChange={setKg} />
      <div className="mt-3 flex items-center gap-3">
        <label className="label mb-0 flex-1" htmlFor="wdate">
          Date
        </label>
        <input id="wdate" type="date" className="input w-auto" value={date} max={dayKey()} min={dayKey(addDays(new Date(), -60))} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={Math.sign(Math.round(diff * 10))} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={clsx('mt-4 text-center text-sm font-semibold', diff < 0 ? 'text-lime' : diff > 0 ? 'text-sun' : 'text-muted')}>
          {Math.abs(diff) < 0.05 ? 'Same as last time' : `${diff < 0 ? '▼' : '▲'} ${formatWeight(Math.abs(diff), profile.units)} vs last weigh-in`}
        </motion.p>
      </AnimatePresence>
      <Button className="mt-4 w-full py-4 text-lg" onClick={save}>
        Save weigh-in
      </Button>
    </Sheet>
  );
}
