import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ImagePlus, KeyRound, Lightbulb, Minus, Plus, RefreshCw, Search, Sparkles, Wand2, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet } from '../components/Sheet';
import { AnimatedNumber, Button, Chip, Segmented } from '../components/ui';
import { FOOD_CATEGORIES, searchFoods, type FoodCategory, type FoodItem } from '../data/foods';
import { useDayStats, useNow } from '../hooks/useDerived';
import { AiNotConfiguredError, analyzeFood } from '../lib/foodAi/client';
import type { FoodAnalysis } from '../lib/foodAi/shared';
import { prepareFoodImage, type PreparedImage } from '../lib/image';
import { nextMealSlot, SLOT_META, SLOT_ORDER } from '../lib/recommend';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import type { MealSlot } from '../types';

type Mode = 'snap' | 'search' | 'quick';

const SCAN_STEPS = ['Identifying foods…', 'Estimating portions…', 'Looking for hidden oils & sauces…', 'Crunching the numbers…'];
const MULTIPLIERS = [0.5, 0.75, 1, 1.5, 2];

function useLogger(meal: MealSlot) {
  const addFood = useStore((s) => s.addFood);
  const { toast, closeSheet, celebrate } = useUI();
  const day = useDayStats();
  return (entry: Omit<Parameters<typeof addFood>[0], 'meal'>) => {
    addFood({ ...entry, meal });
    const remaining = day.remaining - entry.kcal;
    closeSheet();
    toast({
      emoji: entry.emoji,
      title: `Logged ${entry.kcal} kcal to ${SLOT_META[meal].label}`,
      body: remaining >= 0 ? `${remaining} kcal left today` : `${-remaining} kcal over — a walk helps!`,
      tone: remaining >= 0 ? 'lime' : 'coral',
    });
    if (useStore.getState().foods.length === 1) celebrate();
  };
}

// ---------------------------------------------------------------------------
// Snap

function ScanOverlay() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SCAN_STEPS.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-violet/20 via-transparent to-coral/20" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'linear-gradient(rgb(var(--aqua) / 0.5) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--aqua) / 0.5) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <motion.div
        className="absolute inset-x-0 h-24"
        style={{ background: 'linear-gradient(180deg, transparent, rgb(var(--aqua) / 0.55), transparent)' }}
        animate={{ top: ['-25%', '100%'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
      />
      {['left-3 top-3 border-l-4 border-t-4', 'right-3 top-3 border-r-4 border-t-4', 'bottom-3 left-3 border-b-4 border-l-4', 'bottom-3 right-3 border-b-4 border-r-4'].map((c) => (
        <motion.span key={c} className={`absolute h-8 w-8 rounded-md border-white ${c}`} animate={{ scale: [1, 0.85, 1], opacity: [1, 0.6, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
      ))}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-white">
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
          <Sparkles size={18} />
        </motion.span>
        <AnimatePresence mode="wait">
          <motion.span key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-sm font-semibold">
            {SCAN_STEPS[i]}
          </motion.span>
        </AnimatePresence>
      </div>
    </>
  );
}

function SnapPanel({ meal }: { meal: MealSlot }) {
  const apiKey = useStore((s) => s.settings.apiKey);
  const { setTab, closeSheet } = useUI();
  const log = useLogger(meal);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'scanning' | 'done' | 'error' | 'setup'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<FoodAnalysis | null>(null);
  const [mult, setMult] = useState<number[]>([]);
  const [included, setIncluded] = useState<boolean[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = async (img: PreparedImage) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState('scanning');
    setError('');
    try {
      const { result: r } = await analyzeFood({ image: img.base64, mediaType: img.mediaType, note: note || undefined }, apiKey, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setResult(r);
      setMult(r.items.map(() => 1));
      setIncluded(r.items.map(() => true));
      setState('done');
    } catch (e) {
      if (ctrl.signal.aborted) return;
      if (e instanceof AiNotConfiguredError) {
        setState('setup');
        return;
      }
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setState('error');
    }
  };

  const onFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const img = await prepareFoodImage(file);
      setImage(img);
      void run(img);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
      setState('error');
    }
  };

  const totals = useMemo(() => {
    if (!result) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    return result.items.reduce(
      (t, it, i) => {
        if (!included[i]) return t;
        const m = mult[i] ?? 1;
        return { kcal: t.kcal + it.calories * m, protein: t.protein + it.protein_g * m, carbs: t.carbs + it.carbs_g * m, fat: t.fat + it.fat_g * m };
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [result, mult, included]);

  const logIt = () => {
    if (!result) return;
    const items = result.items.filter((_, i) => included[i]);
    const parts = result.items.flatMap((it, i) => (included[i] ? [`${it.name}${mult[i] !== 1 ? ` ×${mult[i]}` : ''}`] : []));
    log({
      name: result.meal_name || items.map((i) => i.name).join(', '),
      emoji: items[0]?.emoji ?? '🍽️',
      kcal: Math.round(totals.kcal),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      portion: parts.slice(0, 4).join(', ') + (parts.length > 4 ? ` +${parts.length - 4} more` : ''),
      source: 'ai',
      photo: image?.thumbUrl,
    });
  };

  const reset = () => {
    abortRef.current?.abort();
    setImage(null);
    setResult(null);
    setState('idle');
  };

  return (
    <div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      <AnimatePresence mode="wait">
        {!image ? (
          <motion.div key="pick" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void onFile(e.dataTransfer.files?.[0]);
              }}
              className={clsx('relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors', dragOver ? 'border-coral bg-coral/10' : 'hairline bg-fg/[0.03]')}
            >
              <motion.div className="absolute h-40 w-40 rounded-full bg-coral/20 blur-3xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 3, repeat: Infinity }} />
              <motion.div
                className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-brand text-white shadow-glow"
                animate={{ rotate: [0, -6, 6, 0], y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Camera size={36} />
              </motion.div>
              <p className="relative mt-4 font-display text-xl font-semibold">Snap your {SLOT_META[meal].label.toLowerCase()}</p>
              <p className="relative mt-1 max-w-xs text-sm text-muted">Calypso identifies each food, estimates the portion and counts the calories — including the oil you can't see.</p>
              <div className="relative mt-5 flex w-full max-w-xs flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={() => cameraRef.current?.click()}>
                  <Camera size={18} /> Take photo
                </Button>
                <Button variant="soft" className="flex-1" onClick={() => uploadRef.current?.click()}>
                  <ImagePlus size={18} /> Upload
                </Button>
              </div>
            </div>
            <label className="label mt-4" htmlFor="note">
              Anything the camera can't see? (optional)
            </label>
            <input id="note" className="input" placeholder="e.g. cooked in ghee · large portion · no sugar" value={note} onChange={(e) => setNote(e.target.value)} />
          </motion.div>
        ) : (
          <motion.div key="photo" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <motion.div layout className={clsx('relative overflow-hidden rounded-3xl bg-black', state === 'done' ? 'h-44' : 'aspect-[4/3]')}>
              <motion.img layout src={image.previewUrl} alt="Your meal" className="h-full w-full object-cover" animate={{ scale: state === 'scanning' ? 1.06 : 1 }} transition={{ duration: 4 }} />
              {state === 'scanning' && <ScanOverlay />}
              {state === 'done' && result && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
                  <div className="text-white">
                    <p className="text-xs font-bold uppercase tracking-wider text-sun">
                      <Sparkles size={12} className="mr-1 inline" />
                      Recognised
                    </p>
                    <p className="font-display text-2xl font-bold">{result.meal_name}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {state === 'scanning' && (
              <Button variant="ghost" className="mt-3 w-full" onClick={reset}>
                Cancel
              </Button>
            )}

            {state === 'setup' && <AiSetupCard onSearch={() => useUI.getState().openSheet({ type: 'food', mode: 'search', meal })} onSettings={() => { closeSheet(); setTab('profile'); }} />}

            {state === 'error' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-3xl bg-coral/10 p-4 text-sm">
                <p className="font-semibold text-coral">Couldn't analyse that photo</p>
                <p className="mt-1 text-muted">{error}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="soft" className="py-2 text-sm" onClick={() => run(image)}>
                    <RefreshCw size={15} /> Retry
                  </Button>
                  <Button variant="ghost" className="py-2 text-sm" onClick={reset}>
                    New photo
                  </Button>
                </div>
              </motion.div>
            )}

            {state === 'done' && result && (
              <div className="mt-4">
                {!result.is_food ? (
                  <div className="rounded-3xl bg-sun/10 p-4 text-sm">
                    <p className="font-semibold text-sun">That doesn't look like food 🤔</p>
                    <p className="mt-1 text-muted">{result.notes}</p>
                    <Button variant="soft" className="mt-3 py-2 text-sm" onClick={reset}>
                      Try another photo
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {result.items.map((it, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: included[i] ? 1 : 0.45, x: 0 }}
                          transition={{ delay: i * 0.08, type: 'spring' }}
                          className="rounded-2xl bg-fg/[0.04] p-3"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setIncluded((arr) => arr.map((v, j) => (j === i ? !v : v)))}
                              className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-bold transition', included[i] ? 'border-coral bg-coral text-white' : 'border-fg/30')}
                              aria-label={included[i] ? `Exclude ${it.name}` : `Include ${it.name}`}
                            >
                              {included[i] && '✓'}
                            </button>
                            <span className="text-2xl">{it.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold">{it.name}</p>
                              <p className="truncate text-xs text-muted">
                                {it.portion} · <span className={it.confidence === 'high' ? 'text-lime' : it.confidence === 'medium' ? 'text-sun' : 'text-coral'}>{it.confidence} confidence</span>
                              </p>
                            </div>
                            <span className="font-display font-bold tabular-nums">
                              <AnimatedNumber value={it.calories * (mult[i] ?? 1)} />
                            </span>
                          </div>
                          {included[i] && (
                            <div className="mt-2 flex gap-1 pl-9">
                              {MULTIPLIERS.map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setMult((arr) => arr.map((v, j) => (j === i ? m : v)))}
                                  className={clsx('relative flex-1 rounded-lg py-1 text-xs font-semibold transition-colors', mult[i] === m ? 'text-white' : 'text-muted')}
                                >
                                  {mult[i] === m && <motion.span layoutId={`mult-${i}`} className="absolute inset-0 rounded-lg bg-violet" />}
                                  <span className="relative">{m}×</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {result.notes && (
                      <p className="mt-3 flex gap-2 rounded-2xl bg-aqua/10 p-3 text-xs text-muted">
                        <Wand2 size={14} className="mt-0.5 shrink-0 text-aqua" /> {result.notes}
                      </p>
                    )}
                    {result.healthier_swap && (
                      <p className="mt-2 flex gap-2 rounded-2xl bg-lime/10 p-3 text-xs text-muted">
                        <Lightbulb size={14} className="mt-0.5 shrink-0 text-lime" /> <span><span className="font-semibold text-fg">Lighter swap: </span>{result.healthier_swap}</span>
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      {[
                        ['kcal', totals.kcal, 'text-gradient'],
                        ['protein', totals.protein, 'text-coral'],
                        ['carbs', totals.carbs, 'text-sun'],
                        ['fat', totals.fat, 'text-violet'],
                      ].map(([label, v, cls]) => (
                        <div key={label as string} className="rounded-2xl bg-fg/[0.04] py-2">
                          <AnimatedNumber value={v as number} className={`font-display text-lg font-bold ${cls}`} />
                          <p className="text-[10px] uppercase tracking-wider text-muted">{label as string}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="soft" onClick={reset} aria-label="New photo">
                        <RefreshCw size={18} />
                      </Button>
                      <Button className="flex-1" disabled={!included.some(Boolean)} onClick={logIt}>
                        Log {Math.round(totals.kcal)} kcal
                      </Button>
                    </div>
                    <p className="mt-2 text-center text-[11px] text-muted">AI estimates can be off by 10–20 %. Adjust portions if something looks wrong.</p>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AiSetupCard({ onSearch, onSettings }: { onSearch: () => void; onSettings: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-3xl bg-violet/10 p-5">
      <div className="flex items-center gap-2 font-semibold text-violet">
        <KeyRound size={18} /> Connect the AI scanner
      </div>
      <p className="mt-2 text-sm text-muted">
        Photo recognition uses Claude's vision model. Either deploy Calypso with an <code className="rounded bg-fg/10 px-1">ANTHROPIC_API_KEY</code>, or paste your own key under <span className="font-semibold text-fg">Profile → AI food scanner</span>. It's stored only on this device.
      </p>
      <div className="mt-4 flex gap-2">
        <Button variant="cool" className="flex-1 whitespace-nowrap px-3 py-2.5 text-sm" onClick={onSettings}>
          Open settings
        </Button>
        <Button variant="soft" className="flex-1 whitespace-nowrap px-3 py-2.5 text-sm" onClick={onSearch}>
          <Search size={15} /> Search instead
        </Button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Search

function SearchPanel({ meal }: { meal: MealSlot }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<FoodCategory | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [servings, setServings] = useState(1);
  const log = useLogger(meal);
  const results = useMemo(() => searchFoods(q, cat).slice(0, 60), [q, cat]);

  const add = (f: FoodItem) =>
    log({
      name: f.name,
      emoji: f.emoji,
      kcal: Math.round(f.kcal * servings),
      protein: Math.round(f.protein * servings),
      carbs: Math.round(f.carbs * servings),
      fat: Math.round(f.fat * servings),
      portion: servings === 1 ? f.serving : `${servings} × ${f.serving}`,
      source: 'search',
    });

  return (
    <div>
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input className="input pl-11" placeholder="Search 115+ foods… try “kottu” or “latte”" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </div>
      <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={!cat} onClick={() => setCat(null)} className="py-1.5 text-xs">
          All
        </Chip>
        {FOOD_CATEGORIES.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? null : c)} className="py-1.5 text-xs">
            {c}
          </Chip>
        ))}
      </div>
      <motion.div className="mt-3 space-y-2" initial="hidden" animate="show" key={`${q}-${cat}`} variants={{ show: { transition: { staggerChildren: 0.025 } } }}>
        {results.length === 0 && <p className="py-8 text-center text-sm text-muted">No matches. Use Quick add to enter it manually.</p>}
        {results.map((f) => {
          const isOpen = open === f.id;
          return (
            <motion.div key={f.id} layout variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className={clsx('overflow-hidden rounded-2xl transition-colors', isOpen ? 'bg-fg/[0.07]' : 'bg-fg/[0.035]')}>
              <button
                className="flex w-full items-center gap-3 p-3 text-left"
                onClick={() => {
                  setOpen(isOpen ? null : f.id);
                  setServings(1);
                }}
              >
                <span className="text-2xl">{f.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{f.name}</p>
                  <p className="truncate text-xs text-muted">{f.serving}</p>
                </div>
                <span className="font-display font-semibold tabular-nums">{f.kcal}</span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="flex items-center gap-3 px-3 pb-3">
                      <div className="flex items-center gap-1 rounded-xl bg-fg/[0.06] p-1">
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-fg/10" onClick={() => setServings((s) => Math.max(0.5, s - 0.5))} aria-label="Fewer servings">
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold tabular-nums">{servings}×</span>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-fg/10" onClick={() => setServings((s) => Math.min(10, s + 0.5))} aria-label="More servings">
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="flex-1 text-xs text-muted">
                        P {Math.round(f.protein * servings)} · C {Math.round(f.carbs * servings)} · F {Math.round(f.fat * servings)}
                      </p>
                      <Button className="px-4 py-2 text-sm" onClick={() => add(f)}>
                        Add {Math.round(f.kcal * servings)}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick add

function QuickPanel({ meal }: { meal: MealSlot }) {
  const log = useLogger(meal);
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');
  const n = (v: string) => Math.max(0, Math.round(Number(v) || 0));
  return (
    <div className="space-y-3">
      <div>
        <label className="label" htmlFor="qa-name">
          What did you eat?
        </label>
        <input id="qa-name" className="input" placeholder="e.g. Office birthday cake" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="qa-kcal">
          Calories
        </label>
        <input id="qa-kcal" className="input font-display text-2xl font-bold" inputMode="numeric" placeholder="0" value={kcal} onChange={(e) => setKcal(e.target.value.replace(/[^\d]/g, ''))} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ['Protein g', p, setP],
            ['Carbs g', c, setC],
            ['Fat g', f, setF],
          ] as const
        ).map(([label, v, set]) => (
          <div key={label}>
            <label className="label">{label}</label>
            <input className="input" inputMode="numeric" placeholder="—" value={v} onChange={(e) => set(e.target.value.replace(/[^\d]/g, ''))} />
          </div>
        ))}
      </div>
      <Button
        className="w-full"
        disabled={!n(kcal)}
        onClick={() => log({ name: name.trim() || 'Quick add', emoji: '⚡', kcal: n(kcal), protein: n(p), carbs: n(c), fat: n(f), source: 'quick' })}
      >
        <Zap size={18} /> Add {n(kcal) || ''} kcal
      </Button>
    </div>
  );
}

export function FoodSheet() {
  const sheet = useUI((s) => s.sheet);
  const closeSheet = useUI((s) => s.closeSheet);
  const schedule = useStore((s) => s.profile?.schedule);
  const now = useNow(60_000);
  const open = sheet?.type === 'food';
  const [mode, setMode] = useState<Mode>('snap');
  const [meal, setMeal] = useState<MealSlot>('lunch');

  useEffect(() => {
    if (sheet?.type !== 'food') return;
    setMode(sheet.mode ?? 'snap');
    setMeal(sheet.meal ?? (schedule ? nextMealSlot(now, schedule) : 'lunch'));
  }, [sheet]);

  return (
    <Sheet open={open} onClose={closeSheet} title="Log food">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'snap', label: <><Camera size={15} /> Snap</> },
          { value: 'search', label: <><Search size={15} /> Search</> },
          { value: 'quick', label: <><Zap size={15} /> Quick</> },
        ]}
      />
      <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
        {SLOT_ORDER.map((s) => (
          <Chip key={s} active={meal === s} onClick={() => setMeal(s)} className="py-1.5 text-xs">
            {SLOT_META[s].emoji} {SLOT_META[s].label}
          </Chip>
        ))}
      </div>
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {mode === 'snap' && <SnapPanel meal={meal} />}
            {mode === 'search' && <SearchPanel meal={meal} />}
            {mode === 'quick' && <QuickPanel meal={meal} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </Sheet>
  );
}
