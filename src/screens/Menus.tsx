import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock, Shuffle, ShoppingBag, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '../components/Sheet';
import { AnimatedNumber, Button, Card, Chip, SectionTitle, rise, stagger } from '../components/ui';
import { mealById, type MealIdea, type MealKind, type MealTag } from '../data/meals';
import { useDayStats, useNow } from '../hooks/useDerived';
import { SLOT_META, SLOT_ORDER, nextMealSlot, planDay, recommendMeals, slotTarget, suggestSlot } from '../lib/recommend';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import type { MealSlot } from '../types';

type Filter = 'all' | 'quick' | MealKind | MealTag;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '✨ All' },
  { id: 'quick', label: '⚡ ≤ 10 min' },
  { id: 'no-cook', label: '🥗 No-cook' },
  { id: 'buy', label: '🛍️ Buy it' },
  { id: 'cook', label: '🍳 Cook' },
  { id: 'high-protein', label: '💪 High protein' },
  { id: 'meal-prep', label: '🍱 Meal prep' },
  { id: 'desk-friendly', label: '💼 Desk-friendly' },
];

const KIND_LABEL: Record<MealKind, string> = { cook: 'Cook', 'no-cook': 'No-cook', buy: 'Buy it' };

function MealCard({ meal, fit, onOpen, index }: { meal: MealIdea; fit?: 'great' | 'good' | 'over'; onOpen: () => void; index: number }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: Math.min(index, 10) * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      onClick={onOpen}
      className="glass group overflow-hidden rounded-3xl text-left shadow-card"
    >
      <div className="relative flex h-28 items-center justify-center overflow-hidden" style={{ background: `radial-gradient(circle at 30% 30%, hsl(${meal.hue} 85% 62% / 0.55), hsl(${(meal.hue + 40) % 360} 80% 45% / 0.25) 70%)` }}>
        <motion.span className="text-6xl drop-shadow-xl" animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }} transition={{ duration: 4 + (index % 3), repeat: Infinity, ease: 'easeInOut' }}>
          {meal.emoji}
        </motion.span>
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
          {meal.kind === 'buy' ? <ShoppingBag size={11} /> : <Clock size={11} />}
          {meal.kind === 'buy' ? 'Buy it' : `${meal.minutes} min`}
        </span>
        {fit && (
          <span className={clsx('absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', fit === 'great' ? 'bg-lime text-black' : fit === 'good' ? 'bg-white/80 text-black' : 'bg-coral text-white')}>
            {fit === 'great' ? 'Perfect fit' : fit === 'good' ? 'Fits' : 'Over'}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <p className="line-clamp-2 min-h-[2.5rem] font-semibold leading-tight">{meal.name}</p>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="font-display text-base font-bold text-gradient">{meal.kcal} kcal</span>
          <span className="text-muted">{meal.protein}g protein</span>
        </div>
      </div>
    </motion.button>
  );
}

export function MenusScreen() {
  const profile = useStore((s) => s.profile)!;
  const openSheet = useUI((s) => s.openSheet);
  const now = useNow(60_000);
  const day = useDayStats();
  const [slot, setSlot] = useState<MealSlot>(() => suggestSlot(now, profile.schedule, new Set(SLOT_ORDER.filter((s) => day.bySlot[s].length > 0))));
  const [filter, setFilter] = useState<Filter>('all');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000));
  const [planKind, setPlanKind] = useState<'any' | 'easy'>('easy');

  const eatenSlots = new Set(SLOT_ORDER.filter((s) => day.bySlot[s].length > 0));
  const target = slotTarget(slot, day.budget, day.remaining, eatenSlots);

  const recs = useMemo(() => {
    const kinds = filter === 'cook' || filter === 'no-cook' || filter === 'buy' ? [filter] : undefined;
    const tags = filter === 'high-protein' || filter === 'meal-prep' || filter === 'desk-friendly' ? [filter as MealTag] : undefined;
    const list = recommendMeals({ slot, targetKcal: target, diet: profile.diet, kinds, tags });
    return filter === 'quick' ? list.filter((r) => r.meal.minutes <= 10) : list;
  }, [slot, target, profile.diet, filter]);

  const plan = useMemo(() => planDay(day.budget, profile.diet, seed, planKind === 'easy' ? ['no-cook', 'buy'] : undefined) ?? planDay(day.budget, profile.diet, seed), [day.budget, profile.diet, seed, planKind]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={rise}>
        <h1 className="text-3xl font-bold">Menus</h1>
        <p className="text-muted">Easy to make or easy to buy — sized to what's left of your day.</p>
      </motion.div>

      <motion.div variants={rise} className="relative overflow-hidden rounded-3xl bg-brand p-5 text-white shadow-glow">
        <motion.div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity }} />
        <p className="text-sm font-semibold text-white/80">Left for today</p>
        <p className="font-display text-4xl font-bold">
          <AnimatedNumber value={Math.max(0, day.remaining)} /> <span className="text-lg font-medium text-white/80">kcal</span>
        </p>
        <p className="mt-1 text-sm text-white/85">
          Aim for about <span className="font-bold">{target} kcal</span> at {SLOT_META[slot].label.toLowerCase()}.
        </p>
      </motion.div>

      <motion.div variants={rise} className="flex gap-2">
        {SLOT_ORDER.map((s) => (
          <Chip key={s} active={slot === s} onClick={() => setSlot(s)} className="flex-1 justify-center px-2">
            <span className="hidden sm:inline">{SLOT_META[s].emoji}</span> {SLOT_META[s].label}
          </Chip>
        ))}
      </motion.div>

      <motion.div variants={rise} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} className="py-1.5 text-xs">
            {f.label}
          </Chip>
        ))}
      </motion.div>

      <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {recs.map((r, i) => (
            <MealCard key={`${slot}-${r.meal.id}`} meal={r.meal} fit={r.fit} index={i} onOpen={() => openSheet({ type: 'meal', mealId: r.meal.id, meal: slot })} />
          ))}
        </AnimatePresence>
      </motion.div>
      {recs.length === 0 && <p className="py-6 text-center text-sm text-muted">No {SLOT_META[slot].label.toLowerCase()} ideas match this filter for your diet yet.</p>}

      <Card>
        <SectionTitle
          action={
            <Button variant="soft" className="px-3 py-2 text-sm" onClick={() => setSeed((s) => s + 1)}>
              <motion.span key={seed} initial={{ rotate: -180 }} animate={{ rotate: 0 }}>
                <Shuffle size={16} />
              </motion.span>
              Shuffle
            </Button>
          }
        >
          <span className="flex items-center gap-2">
            <Sparkles size={18} className="text-peach" /> Plan my whole day
          </span>
        </SectionTitle>
        <div className="mb-3 flex gap-2">
          <Chip active={planKind === 'easy'} onClick={() => setPlanKind('easy')} className="py-1.5 text-xs">
            Zero cooking
          </Chip>
          <Chip active={planKind === 'any'} onClick={() => setPlanKind('any')} className="py-1.5 text-xs">
            Any meals
          </Chip>
        </div>
        {plan ? (
          <>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {SLOT_ORDER.map((s, i) => {
                  const m = plan.meals[s];
                  return (
                    <motion.button
                      key={`${seed}-${s}-${m.id}`}
                      layout
                      initial={{ opacity: 0, rotateX: -60, y: 10 }}
                      animate={{ opacity: 1, rotateX: 0, y: 0 }}
                      exit={{ opacity: 0, rotateX: 60 }}
                      transition={{ delay: i * 0.08, type: 'spring', stiffness: 220, damping: 22 }}
                      onClick={() => openSheet({ type: 'meal', mealId: m.id, meal: s })}
                      className="flex w-full items-center gap-3 rounded-2xl bg-fg/[0.04] p-3 text-left"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: `hsl(${m.hue} 80% 60% / 0.2)` }}>
                        {m.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{SLOT_META[s].label}</p>
                        <p className="truncate text-sm font-semibold">{m.name}</p>
                      </div>
                      <span className="font-display font-semibold">{m.kcal}</span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-lime/10 px-4 py-3 text-sm">
              <span>
                Total <span className="font-display font-bold">{plan.kcal}</span> / {day.budget} kcal
              </span>
              <span className="font-semibold text-lime">{plan.protein}g protein</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Couldn't fit a full day into {day.budget} kcal with these options — try "Any meals".</p>
        )}
      </Card>
    </motion.div>
  );
}

export function MealSheet() {
  const sheet = useUI((s) => s.sheet);
  const { closeSheet, toast } = useUI();
  const addFood = useStore((s) => s.addFood);
  const schedule = useStore((s) => s.profile?.schedule);
  const open = sheet?.type === 'meal';
  const meal = sheet?.type === 'meal' ? mealById(sheet.mealId) : undefined;
  const [slot, setSlot] = useState<MealSlot>('lunch');
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (sheet?.type === 'meal') {
      setSlot(sheet.meal ?? (schedule ? nextMealSlot(new Date(), schedule) : 'lunch'));
      setChecked(new Set());
    }
  }, [sheet]);

  const [cached, setCached] = useState<MealIdea | undefined>(meal);
  useEffect(() => {
    if (meal) setCached(meal);
  }, [meal]);
  const m = meal ?? cached;

  const log = () => {
    if (!m) return;
    addFood({ name: m.name, emoji: m.emoji, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat, meal: slot, source: 'menu' });
    closeSheet();
    toast({ emoji: m.emoji, title: `${m.name} logged`, body: `${m.kcal} kcal to ${SLOT_META[slot].label}`, tone: 'lime' });
  };

  return (
    <Sheet open={open} onClose={closeSheet} title={m?.name} wide>
      {m && (
        <div>
          <div className="relative -mx-5 -mt-2 flex h-40 items-center justify-center overflow-hidden" style={{ background: `radial-gradient(circle at 50% 40%, hsl(${m.hue} 85% 62% / 0.5), transparent 70%)` }}>
            <motion.span className="text-8xl" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
              {m.emoji}
            </motion.span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            {[
              ['kcal', m.kcal, 'text-gradient'],
              ['protein', `${m.protein}g`, 'text-coral'],
              ['carbs', `${m.carbs}g`, 'text-sun'],
              ['fat', `${m.fat}g`, 'text-violet'],
            ].map(([label, v, cls], i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="rounded-2xl bg-fg/[0.04] py-2">
                <p className={`font-display text-lg font-bold ${cls}`}>{v}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-fg/[0.06] px-2.5 py-1 font-semibold">{KIND_LABEL[m.kind]}</span>
            {m.kind !== 'buy' && <span className="rounded-full bg-fg/[0.06] px-2.5 py-1 font-semibold">{m.minutes} min</span>}
            {m.tags.map((t) => (
              <span key={t} className="rounded-full bg-fg/[0.06] px-2.5 py-1 font-semibold capitalize text-muted">
                {t.replace('-', ' ')}
              </span>
            ))}
          </div>
          {m.buyTip && (
            <p className="mt-4 flex gap-2 rounded-2xl bg-sun/10 p-3 text-sm">
              <ShoppingBag size={16} className="mt-0.5 shrink-0 text-sun" /> {m.buyTip}
            </p>
          )}
          <h4 className="mt-5 font-semibold">{m.kind === 'buy' ? 'What to get' : 'Ingredients'}</h4>
          <ul className="mt-2 space-y-1.5">
            {m.ingredients.map((ing, i) => {
              const on = checked.has(i);
              return (
                <li key={ing}>
                  <button
                    onClick={() => setChecked((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; })}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-fg/[0.04]"
                  >
                    <motion.span animate={{ scale: on ? [1, 1.3, 1] : 1 }} className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2', on ? 'border-lime bg-lime text-black' : 'border-fg/25')}>
                      {on && <Check size={12} strokeWidth={3} />}
                    </motion.span>
                    <span className={clsx(on && 'text-muted line-through')}>{ing}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <h4 className="mt-5 font-semibold">{m.kind === 'buy' ? 'How to order it' : 'Steps'}</h4>
          <ol className="mt-2 space-y-2">
            {m.steps.map((s, i) => (
              <motion.li key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </motion.li>
            ))}
          </ol>
          <div className="mt-6 flex gap-2 overflow-x-auto">
            {SLOT_ORDER.filter((s) => m.slots.includes(s) || s === slot).map((s) => (
              <Chip key={s} active={slot === s} onClick={() => setSlot(s)} className="py-1.5 text-xs">
                {SLOT_META[s].label}
              </Chip>
            ))}
          </div>
          <Button className="mt-3 w-full py-4" onClick={log}>
            I ate this · log {m.kcal} kcal
          </Button>
        </div>
      )}
    </Sheet>
  );
}
