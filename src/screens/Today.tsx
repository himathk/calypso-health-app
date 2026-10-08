import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ChevronRight, Clock, Flame, Footprints, Plus, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { useMemo } from 'react';
import { DayTimeline } from '../components/DayTimeline';
import { DayRings } from '../components/Rings';
import { AnimatedNumber, Button, Card, IconButton, ProgressBar, SectionTitle, rise, stagger, toneSoft } from '../components/ui';
import { WaterGlass } from '../components/WaterGlass';
import { activeCalories, activityById } from '../data/activities';
import { useDayStats, useNow, usePlan } from '../hooks/useDerived';
import { formatClock, formatCountdown, formatDuration, greeting } from '../lib/dates';
import { recommendMeals, nextMealSlot, slotTarget, suggestSlot, SLOT_META, SLOT_ORDER } from '../lib/recommend';
import { REMINDER_META, dayModeAt, remindersForDay } from '../lib/schedule';
import { loggingStreak } from '../lib/achievements';
import { currentWeight, useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import type { FoodEntry, MealSlot } from '../types';

const ACTIVE_GOAL_KCAL = 300;

export function FoodRow({ f, onDelete }: { f: FoodEntry; onDelete?: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }}
      className="group relative"
    >
      <motion.div
        drag={onDelete ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0 }}
        onDragEnd={(_, info) => info.offset.x < -90 && onDelete?.()}
        className="relative flex items-center gap-3 rounded-2xl bg-fg/[0.035] p-2.5 pr-3"
      >
        {f.photo ? (
          <img src={f.photo} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fg/[0.06] text-2xl">{f.emoji}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{f.name}</p>
          <p className="truncate text-xs text-muted">
            {f.portion ? `${f.portion} · ` : ''}P {f.protein}g · C {f.carbs}g · F {f.fat}g
          </p>
        </div>
        {f.source === 'ai' && <Sparkles size={14} className="shrink-0 text-violet" aria-label="Estimated from photo" />}
        <span className="shrink-0 font-display font-semibold tabular-nums">{f.kcal}</span>
        {onDelete && (
          <button onClick={onDelete} aria-label={`Delete ${f.name}`} className="shrink-0 text-muted opacity-60 transition hover:text-coral group-hover:opacity-100">
            <Trash2 size={16} />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

function MacroRow({ label, value, goal, tone }: { label: string; value: number; goal: number; tone: 'coral' | 'sun' | 'violet' }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-muted">
          <AnimatedNumber value={value} />/{goal}g
        </span>
      </div>
      <ProgressBar value={value} max={goal} tone={tone} height={7} />
    </div>
  );
}

export function Today() {
  const now = useNow(1000);
  const profile = useStore((s) => s.profile)!;
  const foods = useStore((s) => s.foods);
  const removeFood = useStore((s) => s.removeFood);
  const addWater = useStore((s) => s.addWater);
  const undoWater = useStore((s) => s.undoWater);
  const addActivity = useStore((s) => s.addActivity);
  const weight = useStore(currentWeight);
  const completed = useStore((s) => s.completed);
  const { openSheet, toast, setTab } = useUI();
  const plan = usePlan()!;
  const day = useDayStats();

  const mode = dayModeAt(profile.schedule, now);
  const dateNum = now.getDate();
  const slots = useMemo(() => remindersForDay(profile, new Date()), [profile, dateNum]);
  const upcoming = slots.filter((s) => s.at > now).slice(0, 3);
  const moveSlots = slots.filter((s) => s.kind === 'move');
  const movesDue = moveSlots.filter((s) => s.at <= now).length;
  const streak = loggingStreak(foods, now);

  const eatenSlots = new Set(SLOT_ORDER.filter((s) => day.bySlot[s].length > 0));
  const slot = suggestSlot(now, profile.schedule, eatenSlots);
  const logSlot = nextMealSlot(now, profile.schedule);
  const target = slotTarget(slot, day.budget, day.remaining, eatenSlots);
  const suggestion = recommendMeals({ slot, targetKcal: target, diet: profile.diet })[0];

  const removeEntry = (f: FoodEntry) => {
    removeFood(f.id);
    toast({ emoji: '🗑️', title: `Removed ${f.name}` });
  };

  const walkBreak = () => {
    const t = activityById('walk-break');
    addActivity({ type: t.id, name: t.name, emoji: t.emoji, minutes: 3, kcal: activeCalories(t.met, weight, 3), source: 'manual' });
    toast({ emoji: '🚶', title: 'Move break logged', tone: 'violet' });
  };

  const water = (ml: number) => {
    addWater(ml);
    toast({ emoji: '💧', title: `+${ml} ml`, body: `${((day.waterMl + ml) / 1000).toFixed(2)} L of ${(plan.waterMl / 1000).toFixed(2)} L`, tone: 'aqua' });
    if (day.waterMl < plan.waterMl && day.waterMl + ml >= plan.waterMl) useUI.getState().celebrate();
  };

  const completedToday = new Set(Object.values(completed).flat());

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.header variants={rise} className="flex items-center gap-3 pt-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setTab('profile')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-2xl shadow-glow"
          aria-label="Profile"
        >
          {profile.avatar}
        </motion.button>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-xl font-bold leading-tight sm:text-2xl">
            {greeting(now)}, {profile.name.split(' ')[0]}
          </h1>
        </div>
        {streak > 0 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-full bg-peach/15 px-3 py-1.5 text-sm font-bold text-peach" title="Logging streak">
            <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
              🔥
            </motion.span>
            {streak}
          </motion.div>
        )}
      </motion.header>

      {/* Mode banner */}
      <motion.div variants={rise} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
        <motion.span key={mode.mode} initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="text-2xl">
          {mode.emoji}
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {mode.label}
            {mode.endsAtMin != null && (
              <span className="font-normal text-muted">
                {' '}
                · {formatDuration(mode.endsAtMin - (now.getHours() * 60 + now.getMinutes()))} {mode.until}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted">{mode.description}</p>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* Rings */}
        <Card className="flex flex-col items-center">
          <DayRings eaten={day.eaten} budget={day.budget} activeKcal={day.exerciseKcal} activeGoal={ACTIVE_GOAL_KCAL} waterMl={day.waterMl} waterGoal={plan.waterMl} size={250} />
          <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
            {[
              { label: 'Eaten', value: day.eaten, unit: 'kcal', tone: 'coral' as const },
              { label: 'Burned', value: day.exerciseKcal, unit: 'kcal', tone: 'violet' as const },
              { label: 'Water', value: day.waterMl / 1000, unit: 'L', tone: 'aqua' as const, digits: 2 },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-fg/[0.04] py-2">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${toneSoft[s.tone].split(' ')[1]}`}>{s.label}</p>
                <p className="font-display text-lg font-bold">
                  <AnimatedNumber value={s.value} format={(n) => n.toFixed(s.digits ?? 0)} />
                  <span className="ml-0.5 text-xs font-medium text-muted">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 w-full space-y-2.5">
            <MacroRow label="Protein" value={day.protein} goal={plan.proteinG} tone="coral" />
            <MacroRow label="Carbs" value={day.carbs} goal={plan.carbsG} tone="sun" />
            <MacroRow label="Fat" value={day.fat} goal={plan.fatG} tone="violet" />
          </div>
          {day.exerciseKcal > 0 && profile.eatBackExercise > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              <Flame size={12} className="mr-1 inline text-peach" />
              Budget includes +{Math.round(day.exerciseKcal * profile.eatBackExercise)} kcal from activity
            </p>
          )}
        </Card>

        <div className="space-y-4">
          {/* Up next */}
          <Card>
            <SectionTitle
              action={
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock size={13} /> {formatClock(now, useStore.getState().settings.use24h)}
                </span>
              }
            >
              Up next
            </SectionTitle>
            <DayTimeline schedule={profile.schedule} date={now} reminders={slots} now={now} compact />
            <div className="mt-4 space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {upcoming.length === 0 && (
                  <motion.p key="none" className="text-sm text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    Nothing else scheduled today. Rest up 🌙
                  </motion.p>
                )}
                {upcoming.map((r, i) => {
                  const meta = REMINDER_META[r.kind];
                  return (
                    <motion.div
                      key={r.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      className={`flex items-center gap-3 rounded-2xl p-2.5 ${i === 0 ? 'bg-fg/[0.06]' : ''}`}
                    >
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${toneSoft[meta.color]}`}>{r.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{r.title}</p>
                        <p className="text-xs text-muted">{formatClock(r.at, useStore.getState().settings.use24h)}</p>
                      </div>
                      <span className={`font-display text-sm font-semibold tabular-nums ${i === 0 ? 'text-gradient' : 'text-muted'}`}>
                        {formatCountdown(r.at.getTime() - now.getTime())}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {moveSlots.length > 0 && (
              <div className="mt-4 rounded-2xl bg-violet/10 p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <Footprints size={16} className="text-violet" /> Move breaks
                  </span>
                  <span className="text-muted">
                    <span className="font-semibold text-fg">{day.moveBreaks}</span> / {movesDue || moveSlots.length} so far
                  </span>
                </div>
                <div className="flex gap-1">
                  {moveSlots.map((m) => {
                    const done = completedToday.has(m.id);
                    const past = m.at <= now;
                    return (
                      <motion.span
                        key={m.id}
                        className={`h-2 flex-1 rounded-full ${done ? 'bg-violet' : past ? 'bg-violet/30' : 'bg-fg/10'}`}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        title={formatClock(m.at)}
                      />
                    );
                  })}
                </div>
                <Button variant="soft" className="mt-3 w-full py-2 text-sm" onClick={walkBreak}>
                  <Footprints size={16} /> I just took a walk break
                </Button>
              </div>
            )}
          </Card>

          {/* Water */}
          <Card className="flex items-center gap-4">
            <WaterGlass ml={day.waterMl} goal={plan.waterMl} size={0.85} />
            <div className="flex-1">
              <p className="label">Hydration</p>
              <p className="font-display text-3xl font-bold">
                <AnimatedNumber value={day.waterMl / 1000} format={(n) => n.toFixed(2)} />
                <span className="text-base font-medium text-muted"> / {(plan.waterMl / 1000).toFixed(2)} L</span>
              </p>
              <p className="mb-3 text-xs text-muted">{Math.max(0, Math.ceil((plan.waterMl - day.waterMl) / 250))} glasses to go</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="cool" className="px-4 py-2 text-sm" onClick={() => water(250)}>
                  <Plus size={16} /> 250 ml
                </Button>
                <Button variant="soft" className="px-4 py-2 text-sm" onClick={() => water(500)}>
                  +500
                </Button>
                {day.waterMl > 0 && (
                  <IconButton label="Undo last glass" onClick={() => undoWater()} className="h-9 w-9">
                    <Undo2 size={16} />
                  </IconButton>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Suggestion */}
      {suggestion && (
        <motion.button
          variants={rise}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openSheet({ type: 'meal', mealId: suggestion.meal.id, meal: slot })}
          className="relative flex w-full items-center gap-4 overflow-hidden rounded-3xl p-4 text-left"
          style={{ background: `linear-gradient(120deg, hsl(${suggestion.meal.hue} 80% 55% / 0.22), rgb(var(--surface) / 0.7))` }}
        >
          <motion.span className="text-5xl" animate={{ y: [0, -6, 0], rotate: [0, 6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            {suggestion.meal.emoji}
          </motion.span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-peach">
              {SLOT_META[slot].label} idea · ~{target} kcal left for it
            </p>
            <p className="truncate font-display text-lg font-semibold">{suggestion.meal.name}</p>
            <p className="text-xs text-muted">
              {suggestion.meal.kcal} kcal · {suggestion.meal.protein}g protein · {suggestion.meal.kind === 'buy' ? 'Buy it' : `${suggestion.meal.minutes} min`}
            </p>
          </div>
          <ChevronRight className="shrink-0 text-muted" />
        </motion.button>
      )}

      {/* Meals */}
      <Card>
        <SectionTitle
          action={
            <Button variant="soft" className="px-3 py-1.5 text-sm" onClick={() => openSheet({ type: 'food', mode: 'snap', meal: logSlot })}>
              <Camera size={15} /> Snap
            </Button>
          }
        >
          Meals
        </SectionTitle>
        <div className="space-y-4">
          {SLOT_ORDER.map((s: MealSlot) => {
            const entries = day.bySlot[s];
            const kcal = entries.reduce((t, f) => t + f.kcal, 0);
            return (
              <div key={s}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {SLOT_META[s].emoji} {SLOT_META[s].label}
                    {kcal > 0 && <span className="ml-2 font-normal text-muted">{kcal} kcal</span>}
                  </p>
                  <IconButton label={`Add to ${SLOT_META[s].label}`} className="h-8 w-8" onClick={() => openSheet({ type: 'food', mode: 'search', meal: s })}>
                    <Plus size={16} />
                  </IconButton>
                </div>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {entries.map((f) => (
                      <FoodRow key={f.id} f={f} onDelete={() => removeEntry(f)} />
                    ))}
                  </AnimatePresence>
                  {entries.length === 0 && <p className="rounded-2xl border border-dashed hairline px-3 py-2.5 text-xs text-muted">Nothing logged yet</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Activity summary */}
      <Card>
        <SectionTitle
          action={
            <Button variant="soft" className="px-3 py-1.5 text-sm" onClick={() => openSheet({ type: 'activity' })}>
              <Plus size={15} /> Log
            </Button>
          }
        >
          Activity
        </SectionTitle>
        {day.activities.length === 0 ? (
          <p className="text-sm text-muted">No activity yet. Even a 10-minute walk burns ~{activeCalories(3.5, weight, 10)} kcal.</p>
        ) : (
          <div className="space-y-2">
            {day.activities.slice(-4).reverse().map((a) => (
              <motion.div key={a.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-2xl bg-fg/[0.035] p-2.5 pr-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-xl">{a.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-muted">
                    {a.minutes} min · {formatClock(a.time)}
                  </p>
                </div>
                <span className="font-display font-semibold text-violet">−{a.kcal}</span>
              </motion.div>
            ))}
            {day.activities.length > 4 && (
              <button className="text-sm font-semibold text-coral" onClick={() => setTab('activity')}>
                See all {day.activities.length} →
              </button>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
