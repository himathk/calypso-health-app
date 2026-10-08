import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Bell, Briefcase, Droplets, Footprints, Moon, Sparkles, Sun, Utensils } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { DayTimeline } from '../components/DayTimeline';
import { LogoMark, Wordmark } from '../components/Logo';
import { AnimatedNumber, Button, Chip, Segmented, Slider, Toggle, toneSoft } from '../components/ui';
import { WEEKDAYS_SHORT } from '../lib/dates';
import { requestNotificationPermission } from '../lib/notify';
import {
  ACTIVITY_LEVELS,
  PACE_OPTIONS,
  bmi,
  bmiCategory,
  cmToFtIn,
  computePlan,
  ftInToCm,
  kgToLb,
  lbToKg,
  maxSafePace,
  recommendedPace,
} from '../lib/nutrition';
import { remindersForDay } from '../lib/schedule';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import type { ActivityLevel, Diet, Profile } from '../types';

const AVATARS = ['🦊', '🐼', '🐯', '🦁', '🐨', '🐸', '🦄', '🐙', '🦋', '🌻'];

export const DEFAULT_PROFILE: Profile = {
  name: '',
  avatar: '🦊',
  sex: 'female',
  birthDate: '1995-06-15',
  heightCm: 170,
  startWeightKg: 80,
  goalWeightKg: 72,
  activityLevel: 'sedentary',
  paceKgPerWeek: 0.5,
  diet: 'any',
  units: 'metric',
  eatBackExercise: 0.5,
  schedule: {
    workDays: [1, 2, 3, 4, 5],
    workStart: '09:00',
    workEnd: '17:00',
    lunchTime: '12:30',
    lunchMinutes: 45,
    wakeTime: '06:30',
    sleepTime: '22:30',
  },
  reminders: {
    water: { enabled: true, workIntervalMin: 60, offIntervalMin: 90 },
    move: { enabled: true, intervalMin: 30 },
    meals: true,
    eveningWalk: true,
    weighIn: { enabled: true, day: 1 },
    sound: true,
    systemNotifications: false,
  },
  createdAt: new Date().toISOString(),
};

const STEPS = ['welcome', 'you', 'body', 'goal', 'lifestyle', 'schedule', 'habits', 'plan'] as const;
type Step = (typeof STEPS)[number];

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, filter: 'blur(8px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, filter: 'blur(8px)' }),
};

function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold uppercase tracking-[0.2em] text-peach">
        {eyebrow}
      </motion.p>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-2 text-muted">
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

function BigValue({ value, unit, digits = 0 }: { value: number; unit: string; digits?: number }) {
  return (
    <div className="flex items-baseline justify-center gap-2 py-2">
      <AnimatedNumber value={value} format={(n) => n.toFixed(digits)} className="font-display text-6xl font-bold" duration={0.4} />
      <span className="text-xl font-semibold text-muted">{unit}</span>
    </div>
  );
}

function Stepper({ onMinus, onPlus }: { onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex gap-2">
      <Button variant="soft" className="h-11 w-11 p-0 text-xl" onClick={onMinus} aria-label="Decrease">
        −
      </Button>
      <Button variant="soft" className="h-11 w-11 p-0 text-xl" onClick={onPlus} aria-label="Increase">
        +
      </Button>
    </div>
  );
}

export function WeightPicker({ kg, units, onChange, min = 35, max = 200, label }: { kg: number; units: Profile['units']; onChange: (kg: number) => void; min?: number; max?: number; label: string }) {
  const imperial = units === 'imperial';
  const shown = imperial ? kgToLb(kg) : kg;
  const step = imperial ? 1 : 0.5;
  const set = (v: number) => onChange(Math.min(max, Math.max(min, imperial ? lbToKg(v) : v)));
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <Stepper onMinus={() => set(shown - step)} onPlus={() => set(shown + step)} />
      </div>
      <BigValue value={shown} unit={imperial ? 'lb' : 'kg'} digits={imperial ? 0 : 1} />
      <Slider label={label} value={shown} min={imperial ? kgToLb(min) : min} max={imperial ? kgToLb(max) : max} step={step} onChange={set} />
    </div>
  );
}

export function HeightPicker({ cm, units, onChange }: { cm: number; units: Profile['units']; onChange: (cm: number) => void }) {
  const { ft, inch } = cmToFtIn(cm);
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="label">Height</span>
        <Stepper onMinus={() => onChange(Math.max(130, cm - (units === 'imperial' ? 2.54 : 1)))} onPlus={() => onChange(Math.min(220, cm + (units === 'imperial' ? 2.54 : 1)))} />
      </div>
      {units === 'metric' ? (
        <BigValue value={cm} unit="cm" />
      ) : (
        <div className="flex items-baseline justify-center gap-1 py-2 font-display text-6xl font-bold">
          {ft}
          <span className="text-xl text-muted">ft</span> {inch}
          <span className="text-xl text-muted">in</span>
        </div>
      )}
      <Slider label="Height" value={cm} min={130} max={220} step={units === 'imperial' ? 2.54 : 1} onChange={(v) => onChange(units === 'imperial' ? ftInToCm(0, Math.round(v / 2.54)) : v)} />
    </div>
  );
}

function TimeField({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon: ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-fg/[0.04] px-4 py-3">
      <span className="text-muted">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <input type="time" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} className="bg-transparent text-right font-semibold tabular-nums outline-none" />
    </label>
  );
}

function SelectChips<T extends number>({ value, options, onChange, suffix }: { value: T; options: T[]; onChange: (v: T) => void; suffix: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o} active={o === value} onClick={() => onChange(o)} className="px-3 py-1.5 text-xs">
          {o}
          {suffix}
        </Chip>
      ))}
    </div>
  );
}

export function ReminderSettingsEditor({ draft, update }: { draft: Profile; update: (p: Partial<Profile>) => void }) {
  const r = draft.reminders;
  const setR = (patch: Partial<Profile['reminders']>) => update({ reminders: { ...r, ...patch } });
  const rows: { icon: ReactNode; title: string; desc: string; on: boolean; toggle: (v: boolean) => void; extra?: ReactNode; tone: 'aqua' | 'violet' | 'peach' | 'coral' | 'lime' }[] = [
    {
      icon: <Droplets size={20} />, title: 'Drink water', desc: `Every ${r.water.workIntervalMin} min at work, every ${r.water.offIntervalMin} min otherwise`,
      on: r.water.enabled, toggle: (v) => setR({ water: { ...r.water, enabled: v } }), tone: 'aqua',
      extra: <SelectChips value={r.water.workIntervalMin} options={[30, 45, 60, 90]} suffix=" min" onChange={(v) => setR({ water: { ...r.water, workIntervalMin: v } })} />,
    },
    {
      icon: <Footprints size={20} />, title: 'Walk & stretch breaks', desc: `Every ${r.move.intervalMin} min during work hours`,
      on: r.move.enabled, toggle: (v) => setR({ move: { ...r.move, enabled: v } }), tone: 'violet',
      extra: <SelectChips value={r.move.intervalMin} options={[20, 30, 45, 60]} suffix=" min" onChange={(v) => setR({ move: { ...r.move, intervalMin: v } })} />,
    },
    { icon: <Utensils size={20} />, title: 'Meal timing', desc: 'Breakfast, lunch on time, an afternoon snack window, dinner and kitchen close', on: r.meals, toggle: (v) => setR({ meals: v }), tone: 'peach' },
    { icon: <Sun size={20} />, title: 'After-work walk', desc: 'A nudge to walk when the workday ends, and on days off', on: r.eveningWalk, toggle: (v) => setR({ eveningWalk: v }), tone: 'coral' },
    { icon: <Sparkles size={20} />, title: 'Weekly weigh-in', desc: 'Monday mornings, before breakfast', on: r.weighIn.enabled, toggle: (v) => setR({ weighIn: { ...r.weighIn, enabled: v } }), tone: 'lime' },
  ];
  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <motion.div key={row.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="card p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneSoft[row.tone]}`}>{row.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{row.title}</p>
              <p className="text-xs text-muted">{row.desc}</p>
            </div>
            <Toggle checked={row.on} onChange={row.toggle} label={row.title} tone={row.tone} />
          </div>
          <AnimatePresence initial={false}>
            {row.on && row.extra && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-3">{row.extra}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

export function ScheduleEditor({ draft, update }: { draft: Profile; update: (p: Partial<Profile>) => void }) {
  const s = draft.schedule;
  const set = (patch: Partial<Profile['schedule']>) => update({ schedule: { ...s, ...patch } });
  const toggleDay = (d: number) => set({ workDays: s.workDays.includes(d) ? s.workDays.filter((x) => x !== d) : [...s.workDays, d].sort() });
  const preview = useMemo(() => {
    const d = new Date();
    const offset = (((s.workDays[0] ?? 1) - d.getDay()) + 7) % 7;
    d.setDate(d.getDate() + offset);
    return d;
  }, [s.workDays]);
  return (
    <div className="space-y-4">
      <div className="card">
        <span className="label">Work days</span>
        <div className="flex justify-between gap-1">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <motion.button
              key={d}
              whileTap={{ scale: 0.85 }}
              onClick={() => toggleDay(d)}
              className={clsx('flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold transition-colors', s.workDays.includes(d) ? 'bg-violet text-white shadow-[0_0_20px_rgb(var(--violet)/0.5)]' : 'bg-fg/[0.05] text-muted')}
            >
              {WEEKDAYS_SHORT[d].slice(0, 2)}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <TimeField label="Start work" value={s.workStart} onChange={(v) => set({ workStart: v })} icon={<Briefcase size={18} />} />
        <TimeField label="Finish work" value={s.workEnd} onChange={(v) => set({ workEnd: v })} icon={<Briefcase size={18} />} />
        <TimeField label="Lunch" value={s.lunchTime} onChange={(v) => set({ lunchTime: v })} icon={<Utensils size={18} />} />
        <label className="flex items-center gap-3 rounded-2xl bg-fg/[0.04] px-4 py-3">
          <span className="flex-1 text-sm font-medium">Lunch length</span>
          <select value={s.lunchMinutes} onChange={(e) => set({ lunchMinutes: Number(e.target.value) })} className="bg-transparent font-semibold outline-none">
            {[30, 45, 60, 90].map((m) => (
              <option key={m} value={m} className="bg-surface">
                {m} min
              </option>
            ))}
          </select>
        </label>
        <TimeField label="Wake up" value={s.wakeTime} onChange={(v) => set({ wakeTime: v })} icon={<Sun size={18} />} />
        <TimeField label="Bedtime" value={s.sleepTime} onChange={(v) => set({ sleepTime: v })} icon={<Moon size={18} />} />
      </div>
      <div className="card">
        <span className="label">Your workday rhythm</span>
        <DayTimeline schedule={s} date={preview} reminders={remindersForDay(draft, preview)} />
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
          <Legend color="var(--aqua)" label="Water" />
          <Legend color="var(--violet)" label="Move break" />
          <Legend color="var(--peach)" label="Meals" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: `rgb(${color})` }} />
      {label}
    </span>
  );
}

export function Onboarding() {
  const setProfile = useStore((s) => s.setProfile);
  const celebrate = useUI((s) => s.celebrate);
  const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);
  const [sexChosen, setSexChosen] = useState(false);
  const [[stepIndex, dir], setStep] = useState<[number, number]>([0, 0]);
  const step: Step = STEPS[stepIndex];
  const update = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));
  const plan = useMemo(() => computePlan(draft, draft.startWeightKg), [draft]);

  const go = (delta: number) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, stepIndex + delta));
    if (STEPS[next] === 'goal' && delta > 0) {
      update({ paceKgPerWeek: recommendedPace(draft.startWeightKg, draft.goalWeightKg, draft.heightCm) || 0.5 });
    }
    if (STEPS[next] === 'plan') setTimeout(celebrate, 900);
    setStep([next, delta]);
  };

  const canNext = step !== 'you' || (draft.name.trim().length > 0 && sexChosen);

  const finish = () => setProfile({ ...draft, name: draft.name.trim(), createdAt: new Date().toISOString() });

  const enableNotifications = async () => {
    const p = await requestNotificationPermission();
    update({ reminders: { ...draft.reminders, systemNotifications: p === 'granted' } });
  };

  const b = bmi(draft.startWeightKg, draft.heightCm);
  const cat = bmiCategory(b);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pb-6 pt-[max(env(safe-area-inset-top),1.25rem)]">
      {stepIndex > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => go(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-fg/[0.06]" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-1 gap-1.5">
            {STEPS.slice(1).map((s, i) => (
              <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-fg/10">
                <motion.div className="h-full bg-brand" initial={false} animate={{ width: i < stepIndex ? '100%' : '0%' }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
            {step === 'welcome' && (
              <div className="flex min-h-[80dvh] flex-col items-center justify-center text-center">
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} className="relative">
                  <motion.div className="absolute inset-0 rounded-full bg-coral/30 blur-3xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 4, repeat: Infinity }} />
                  <LogoMark size={140} animated className="relative" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                  <Wordmark className="mt-6 block text-6xl" />
                  <p className="mx-auto mt-4 max-w-sm text-lg text-muted">
                    The calorie coach that knows your <span className="whitespace-nowrap font-semibold text-fg">9-to-5</span>. Snap your food, hit your deficit, and keep moving through the workday.
                  </p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="mt-10 flex flex-wrap justify-center gap-2 text-sm">
                  {['📸 Photo → calories', '🎯 Smart deficit', '💧 Water & walk nudges', '🥗 Easy menus'].map((t, i) => (
                    <motion.span key={t} className="glass rounded-full px-3 py-1.5" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4 + i * 0.1, type: 'spring' }}>
                      {t}
                    </motion.span>
                  ))}
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }} className="mt-10 w-full max-w-xs">
                  <Button className="w-full py-4 text-lg" onClick={() => go(1)}>
                    Build my plan <ArrowRight size={20} />
                  </Button>
                  <p className="mt-3 text-xs text-muted">Takes about a minute. Everything stays on this device.</p>
                </motion.div>
              </div>
            )}

            {step === 'you' && (
              <div>
                <StepHeader eyebrow="Step 1 · You" title="First, who are we coaching?" />
                <div className="space-y-4">
                  <div className="card">
                    <label className="label" htmlFor="name">
                      Your name
                    </label>
                    <input id="name" className="input text-lg" placeholder="e.g. Sam" value={draft.name} autoFocus onChange={(e) => update({ name: e.target.value })} />
                    <span className="label mt-4">Pick an avatar</span>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map((a) => (
                        <motion.button
                          key={a}
                          whileTap={{ scale: 0.8 }}
                          animate={{ scale: draft.avatar === a ? 1.12 : 1 }}
                          onClick={() => update({ avatar: a })}
                          className={clsx('flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-colors', draft.avatar === a ? 'bg-brand shadow-glow' : 'bg-fg/[0.05]')}
                        >
                          {a}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <span className="label">Sex (for metabolism maths)</span>
                    <Segmented
                      value={sexChosen ? draft.sex : ('' as Profile['sex'])}
                      options={[
                        { value: 'female', label: 'Female' },
                        { value: 'male', label: 'Male' },
                      ]}
                      onChange={(v) => {
                        setSexChosen(true);
                        update({ sex: v });
                      }}
                    />
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <label className="label" htmlFor="dob">
                          Birthday
                        </label>
                        <input id="dob" type="date" className="input" value={draft.birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => e.target.value && update({ birthDate: e.target.value })} />
                      </div>
                      <div>
                        <span className="label">Units</span>
                        <Segmented
                          size="sm"
                          className="h-[50px]"
                          value={draft.units}
                          options={[
                            { value: 'metric', label: 'kg · cm' },
                            { value: 'imperial', label: 'lb · ft' },
                          ]}
                          onChange={(v) => update({ units: v })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'body' && (
              <div>
                <StepHeader eyebrow="Step 2 · Body" title="Where are you starting from?" subtitle="No judgement — this just sets your baseline." />
                <div className="space-y-4">
                  <HeightPicker cm={draft.heightCm} units={draft.units} onChange={(cm) => update({ heightCm: Math.round(cm) })} />
                  <WeightPicker
                    label="Current weight"
                    kg={draft.startWeightKg}
                    units={draft.units}
                    onChange={(kg) => update({ startWeightKg: kg, goalWeightKg: Math.min(draft.goalWeightKg, kg - 0.5) })}
                  />
                  <motion.div layout className="card flex items-center justify-between">
                    <div>
                      <span className="label">BMI</span>
                      <AnimatedNumber value={b} format={(n) => n.toFixed(1)} className="font-display text-3xl font-bold" />
                    </div>
                    <motion.span key={cat.label} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${toneSoft[cat.tone]}`}>
                      {cat.label}
                    </motion.span>
                  </motion.div>
                </div>
              </div>
            )}

            {step === 'goal' && (
              <div>
                <StepHeader eyebrow="Step 3 · Goal" title="Where do you want to be?" />
                <div className="space-y-4">
                  <WeightPicker label="Goal weight" kg={draft.goalWeightKg} units={draft.units} min={40} max={draft.startWeightKg} onChange={(kg) => update({ goalWeightKg: kg })} />
                  <div className="grid grid-cols-2 gap-3">
                    {PACE_OPTIONS.map((p, i) => {
                      const unsafe = p.kg > maxSafePace(draft.startWeightKg) + 0.001;
                      const rec = recommendedPace(draft.startWeightKg, draft.goalWeightKg, draft.heightCm) === p.kg;
                      const active = draft.paceKgPerWeek === p.kg;
                      return (
                        <motion.button
                          key={p.kg}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: unsafe ? 0.45 : 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => update({ paceKgPerWeek: p.kg })}
                          className={clsx('relative rounded-3xl border p-4 text-left transition-all', active ? 'border-coral bg-coral/10 shadow-glow' : 'hairline glass')}
                        >
                          {rec && <span className="absolute -top-2 right-3 rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold uppercase text-black">Recommended</span>}
                          <p className="font-semibold">{p.label}</p>
                          <p className="font-display text-2xl font-bold">{draft.units === 'imperial' ? `${(kgToLb(p.kg)).toFixed(1)} lb` : `${p.kg} kg`}<span className="text-sm font-medium text-muted">/wk</span></p>
                          <p className="mt-1 text-xs text-muted">{unsafe ? 'Too fast for your weight' : p.description}</p>
                          <p className="mt-2 text-xs font-semibold text-peach">−{Math.round((p.kg * 7700) / 7)} kcal/day</p>
                        </motion.button>
                      );
                    })}
                  </div>
                  <PlanPreview plan={plan} units={draft.units} />
                </div>
              </div>
            )}

            {step === 'lifestyle' && (
              <div>
                <StepHeader eyebrow="Step 4 · Lifestyle" title="How active is a normal day?" subtitle="Don't count workouts — you'll log those and Calypso adds them back to your budget." />
                <div className="space-y-3">
                  {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((lvl, i) => {
                    const a = ACTIVITY_LEVELS[lvl];
                    const active = draft.activityLevel === lvl;
                    return (
                      <motion.button
                        key={lvl}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, type: 'spring' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => update({ activityLevel: lvl })}
                        className={clsx('flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition-all', active ? 'border-coral bg-coral/10 shadow-glow' : 'hairline glass')}
                      >
                        <motion.span className="text-3xl" animate={active ? { rotate: [0, -15, 15, 0], scale: 1.15 } : { scale: 1 }}>
                          {a.emoji}
                        </motion.span>
                        <div className="flex-1">
                          <p className="font-semibold">{a.label}</p>
                          <p className="text-sm text-muted">{a.description}</p>
                        </div>
                        <span className="text-xs font-semibold text-muted">×{a.multiplier}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 'schedule' && (
              <div>
                <StepHeader eyebrow="Step 5 · Schedule" title="Tell me about your workday" subtitle="Reminders follow this rhythm — dense at the desk, relaxed on days off, silent while you sleep." />
                <ScheduleEditor draft={draft} update={update} />
              </div>
            )}

            {step === 'habits' && (
              <div>
                <StepHeader eyebrow="Step 6 · Habits" title="Food style & nudges" />
                <div className="card mb-4">
                  <span className="label">I eat</span>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['any', '🍗 Everything'],
                        ['pescatarian', '🐟 Pescatarian'],
                        ['vegetarian', '🥚 Vegetarian'],
                        ['vegan', '🌱 Vegan'],
                      ] as [Diet, string][]
                    ).map(([d, label]) => (
                      <Chip key={d} active={draft.diet === d} onClick={() => update({ diet: d })}>
                        {label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <ReminderSettingsEditor draft={draft} update={update} />
                <div className="card mt-4 flex items-center gap-3">
                  <Bell className="text-sun" size={22} />
                  <div className="flex-1">
                    <p className="font-semibold">System notifications</p>
                    <p className="text-xs text-muted">So reminders reach you while Calypso is in the background.</p>
                  </div>
                  {draft.reminders.systemNotifications ? (
                    <span className="text-sm font-semibold text-lime">On ✓</span>
                  ) : (
                    <Button variant="soft" className="py-2 text-sm" onClick={enableNotifications}>
                      Enable
                    </Button>
                  )}
                </div>
              </div>
            )}

            {step === 'plan' && <PlanReveal draft={draft} plan={plan} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {step !== 'welcome' && (
        <motion.div layout className="sticky bottom-0 mt-6 bg-gradient-to-t from-bg via-bg/90 to-transparent pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-4">
          {step === 'plan' ? (
            <Button className="w-full py-4 text-lg" onClick={finish}>
              Start my journey <Sparkles size={20} />
            </Button>
          ) : (
            <Button className="w-full py-4 text-lg" disabled={!canNext} onClick={() => go(1)}>
              Continue <ArrowRight size={20} />
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}

function PlanPreview({ plan, units }: { plan: ReturnType<typeof computePlan>; units: Profile['units'] }) {
  return (
    <motion.div layout className="card overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <span className="label">Daily target</span>
          <div className="flex items-baseline gap-1">
            <AnimatedNumber value={plan.targetKcal} className="font-display text-4xl font-bold text-gradient" />
            <span className="text-sm text-muted">kcal</span>
          </div>
        </div>
        <div className="text-right">
          <span className="label">Goal date</span>
          <p className="font-display text-lg font-semibold">
            {plan.goalDate ? plan.goalDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </p>
          {plan.weeksToGoal != null && <p className="text-xs text-muted">{Math.ceil(plan.weeksToGoal)} weeks</p>}
        </div>
      </div>
      <AnimatePresence>
        {plan.adjustment === 'calorie-floor' && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 rounded-2xl bg-sun/10 p-3 text-xs text-sun">
            Heads up: that pace would put you below a safe minimum intake, so Calypso slowed it to {units === 'imperial' ? `${kgToLb(plan.pace).toFixed(1)} lb` : `${plan.pace} kg`}/week. Logging activity raises your budget.
          </motion.p>
        )}
        {plan.adjustment === 'pace-capped' && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 rounded-2xl bg-sun/10 p-3 text-xs text-sun">
            Losing more than ~1% of body weight a week tends to cost muscle, so Calypso capped your pace at {plan.pace} kg/week.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PlanReveal({ draft, plan }: { draft: Profile; plan: ReturnType<typeof computePlan> }) {
  const stats = [
    { label: 'Burn at rest (BMR)', value: plan.bmr, unit: 'kcal' },
    { label: 'Daily burn (TDEE)', value: plan.tdee, unit: 'kcal' },
    { label: 'Daily deficit', value: plan.dailyDeficit, unit: 'kcal' },
    { label: 'Water goal', value: plan.waterMl / 1000, unit: 'L', digits: 2 },
  ];
  const macros = [
    { label: 'Protein', g: plan.proteinG, color: 'bg-coral' },
    { label: 'Carbs', g: plan.carbsG, color: 'bg-sun' },
    { label: 'Fat', g: plan.fatG, color: 'bg-violet' },
  ];
  const totalG = plan.proteinG * 4 + plan.carbsG * 4 + plan.fatG * 9;
  return (
    <div>
      <StepHeader eyebrow={`Your plan, ${draft.name || 'friend'}`} title={<>Eat <span className="text-gradient">{plan.targetKcal.toLocaleString()}</span> kcal a day</>} subtitle={plan.goalDate ? `…and you'll reach your goal around ${plan.goalDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}.` : "You're at your goal — this is your maintenance plan."} />
      <motion.div className="grid grid-cols-2 gap-3" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } }}>
        {stats.map((s) => (
          <motion.div key={s.label} variants={{ hidden: { opacity: 0, y: 30, rotateX: -40 }, show: { opacity: 1, y: 0, rotateX: 0 } }} className="card p-4">
            <span className="label">{s.label}</span>
            <div className="flex items-baseline gap-1">
              <AnimatedNumber value={s.value} format={(n) => n.toFixed(s.digits ?? 0)} className="font-display text-3xl font-bold" duration={1.6} />
              <span className="text-sm text-muted">{s.unit}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="card mt-3">
        <span className="label">Daily macros</span>
        <div className="flex h-4 overflow-hidden rounded-full">
          {macros.map((m, i) => (
            <motion.div
              key={m.label}
              className={m.color}
              initial={{ width: 0 }}
              animate={{ width: `${((m.g * (m.label === 'Fat' ? 9 : 4)) / totalG) * 100}%` }}
              transition={{ delay: 1.1 + i * 0.15, type: 'spring', stiffness: 80 }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 text-center">
          {macros.map((m) => (
            <div key={m.label}>
              <p className="font-display text-xl font-bold">{m.g}g</p>
              <p className="text-xs text-muted">{m.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-4 text-center text-xs text-muted">
        Based on the Mifflin–St Jeor equation. Estimates, not medical advice — check with a doctor if you have a health condition.
      </motion.p>
    </div>
  );
}
