import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CalendarClock, ChevronDown, Download, Eye, EyeOff, KeyRound, Moon, Palette, Smartphone, Sun, Target, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LogoMark } from '../components/Logo';
import { AnimatedNumber, Button, Chip, Segmented, Toggle, rise, stagger } from '../components/ui';
import { usePlan } from '../hooks/useDerived';
import { detectAiMode, type AiMode } from '../lib/foodAi/client';
import { notificationPermission, playChime, requestNotificationPermission, showSystemNotification } from '../lib/notify';
import { ACTIVITY_LEVELS, PACE_OPTIONS, formatWeight, kgToLb } from '../lib/nutrition';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import type { ActivityLevel, Diet, Profile } from '../types';
import { ReminderSettingsEditor, ScheduleEditor, WeightPicker } from './Onboarding';

function Section({ icon, title, subtitle, children, defaultOpen = false }: { icon: ReactNode; title: string; subtitle?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div variants={rise} className="card p-0">
      <button className="flex w-full items-center gap-3 p-5 text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fg/[0.06]">{icon}</span>
        <span className="flex-1">
          <span className="block font-semibold">{title}</span>
          {subtitle && <span className="block text-xs text-muted">{subtitle}</span>}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-muted">
          <ChevronDown />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} className="overflow-hidden">
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

let deferredInstall: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e as BeforeInstallPromptEvent;
  });
}

export function ProfileScreen() {
  const profile = useStore((s) => s.profile)!;
  const update = useStore((s) => s.updateProfile);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const importData = useStore((s) => s.importData);
  const toast = useUI((s) => s.toast);
  const plan = usePlan()!;
  const [aiMode, setAiMode] = useState<AiMode | null>(null);
  const [keyDraft, setKeyDraft] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [perm, setPerm] = useState(notificationPermission());
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const standalone = typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    void detectAiMode(settings.apiKey).then(setAiMode);
  }, [settings.apiKey]);

  const patch = (p: Partial<Profile>) => update(p);

  const exportData = () => {
    const s = useStore.getState();
    const data = { profile: s.profile, foods: s.foods, activities: s.activities, water: s.water, weights: s.weights, achievements: s.achievements, exportedAt: new Date().toISOString(), app: 'calypso', version: 1 };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `calypso-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ emoji: '💾', title: 'Backup downloaded' });
  };

  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'calypso' || !data.profile) throw new Error('Not a Calypso backup');
      importData({ profile: data.profile, foods: data.foods ?? [], activities: data.activities ?? [], water: data.water ?? [], weights: data.weights ?? [], achievements: data.achievements ?? {}, settings });
      toast({ emoji: '✅', title: 'Backup restored' });
    } catch (e) {
      toast({ emoji: '⚠️', title: 'Import failed', body: e instanceof Error ? e.message : undefined, tone: 'coral' });
    }
  };

  const testReminder = async () => {
    useUI.getState().pushReminder({ id: `test-${Date.now()}`, kind: 'water', title: 'This is a test reminder', body: 'Reminders look like this. Tap a button to log instantly.', emoji: '💧', firedAt: Date.now() });
    if (profile.reminders.sound) playChime('water');
    if (perm === 'granted') await showSystemNotification({ id: `test-${Date.now()}`, kind: 'water', title: '💧 Calypso test', body: 'System notifications are working.' });
  };

  const aiBadge = aiMode === 'server' ? ['Connected via server', 'bg-lime/15 text-lime'] : aiMode === 'own-key' ? ['Using your key', 'bg-aqua/15 text-aqua'] : aiMode === 'none' ? ['Not set up', 'bg-sun/15 text-sun'] : ['Checking…', 'bg-fg/10 text-muted'];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={rise} className="card relative overflow-hidden text-center">
        <motion.div className="absolute inset-x-0 -top-20 mx-auto h-48 w-48 rounded-full bg-coral/25 blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-brand text-5xl shadow-glow" whileHover={{ rotate: [0, -10, 10, 0] }}>
          {profile.avatar}
        </motion.div>
        <input
          className="relative mt-3 w-full bg-transparent text-center font-display text-2xl font-bold outline-none"
          value={profile.name}
          aria-label="Name"
          onChange={(e) => patch({ name: e.target.value })}
        />
        <p className="relative text-sm text-muted">Calypso member since {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {[
            ['Target', plan.targetKcal, 'kcal'],
            ['Deficit', plan.dailyDeficit, 'kcal'],
            ['Protein', plan.proteinG, 'g'],
          ].map(([l, v, u]) => (
            <div key={l as string} className="rounded-2xl bg-fg/[0.05] py-2">
              <p className="font-display text-xl font-bold">
                <AnimatedNumber value={v as number} />
                <span className="text-xs font-medium text-muted">{u}</span>
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted">{l}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <Section icon={<Target size={20} className="text-coral" />} title="Goal & body" subtitle={`${formatWeight(profile.goalWeightKg, profile.units)} at ${profile.units === 'imperial' ? `${kgToLb(plan.pace).toFixed(1)} lb` : `${plan.pace} kg`}/week`}>
        <div className="space-y-4">
          <WeightPicker label="Goal weight" kg={profile.goalWeightKg} units={profile.units} max={profile.startWeightKg + 30} onChange={(kg) => patch({ goalWeightKg: kg })} />
          <div>
            <span className="label">Pace</span>
            <div className="flex flex-wrap gap-2">
              {PACE_OPTIONS.map((p) => (
                <Chip key={p.kg} active={profile.paceKgPerWeek === p.kg} onClick={() => patch({ paceKgPerWeek: p.kg })}>
                  {p.label} · {profile.units === 'imperial' ? `${kgToLb(p.kg).toFixed(1)} lb` : `${p.kg} kg`}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Everyday activity</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((l) => (
                <Chip key={l} active={profile.activityLevel === l} onClick={() => patch({ activityLevel: l })}>
                  {ACTIVITY_LEVELS[l].emoji} {ACTIVITY_LEVELS[l].label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Eat back exercise calories</span>
            <Segmented
              size="sm"
              value={String(profile.eatBackExercise)}
              onChange={(v) => patch({ eatBackExercise: Number(v) })}
              options={['0', '0.25', '0.5', '0.75', '1'].map((v) => ({ value: v, label: `${Number(v) * 100}%` }))}
            />
            <p className="mt-2 text-xs text-muted">Activity calorie estimates run high, so 50% is a safe middle ground.</p>
          </div>
          <div>
            <span className="label">I eat</span>
            <div className="flex flex-wrap gap-2">
              {(['any', 'pescatarian', 'vegetarian', 'vegan'] as Diet[]).map((d) => (
                <Chip key={d} active={profile.diet === d} onClick={() => patch({ diet: d })} className="capitalize">
                  {d === 'any' ? 'Everything' : d}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section icon={<CalendarClock size={20} className="text-violet" />} title="Schedule" subtitle={`${profile.schedule.workStart}–${profile.schedule.workEnd} · lunch ${profile.schedule.lunchTime}`}>
        <ScheduleEditor draft={profile} update={patch} />
      </Section>

      <Section icon={<Bell size={20} className="text-aqua" />} title="Reminders" subtitle="Water, move breaks, meals">
        <ReminderSettingsEditor draft={profile} update={patch} />
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-fg/[0.04] p-4">
            <div>
              <p className="font-semibold">Chime</p>
              <p className="text-xs text-muted">A soft sound when a reminder pops</p>
            </div>
            <Toggle checked={profile.reminders.sound} onChange={(v) => patch({ reminders: { ...profile.reminders, sound: v } })} label="Chime" />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-fg/[0.04] p-4">
            <div>
              <p className="font-semibold">System notifications</p>
              <p className="text-xs text-muted">
                {perm === 'granted' ? 'Allowed by your browser' : perm === 'denied' ? 'Blocked — enable them in browser settings' : perm === 'unsupported' ? 'Not supported here — install the app first' : 'Needed for reminders while in the background'}
              </p>
            </div>
            {perm === 'granted' ? (
              <Toggle checked={profile.reminders.systemNotifications} onChange={(v) => patch({ reminders: { ...profile.reminders, systemNotifications: v } })} label="System notifications" />
            ) : (
              <Button
                variant="soft"
                className="shrink-0 py-2 text-sm"
                disabled={perm === 'denied' || perm === 'unsupported'}
                onClick={async () => {
                  const p = await requestNotificationPermission();
                  setPerm(p);
                  if (p === 'granted') patch({ reminders: { ...profile.reminders, systemNotifications: true } });
                }}
              >
                Allow
              </Button>
            )}
          </div>
          <Button variant="soft" className="w-full" onClick={testReminder}>
            Send a test reminder
          </Button>
          <p className="text-xs text-muted">
            Reminders run while Calypso is open — keep it in a browser tab or installed on your desktop during the workday. Phones may pause apps in the background.
          </p>
        </div>
      </Section>

      <Section icon={<KeyRound size={20} className="text-peach" />} title="AI food scanner" subtitle="Photo → calories, powered by Claude">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Status</span>
            <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold', aiBadge[1])}>{aiBadge[0]}</span>
          </div>
          {aiMode !== 'server' && (
            <>
              <label className="label" htmlFor="apikey">
                Your Anthropic API key
              </label>
              <div className="relative">
                <input
                  id="apikey"
                  className="input pr-12 font-mono text-sm"
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-ant-…"
                  value={keyDraft}
                  autoComplete="off"
                  onChange={(e) => setKeyDraft(e.target.value)}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setShowKey((v) => !v)} aria-label={showKey ? 'Hide key' : 'Show key'}>
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="cool"
                  className="flex-1 py-2.5 text-sm"
                  disabled={keyDraft === settings.apiKey}
                  onClick={() => {
                    updateSettings({ apiKey: keyDraft.trim() });
                    toast({ emoji: '🔑', title: keyDraft.trim() ? 'Key saved on this device' : 'Key removed' });
                  }}
                >
                  Save key
                </Button>
                {settings.apiKey && (
                  <Button
                    variant="danger"
                    className="py-2.5 text-sm"
                    onClick={() => {
                      setKeyDraft('');
                      updateSettings({ apiKey: '' });
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted">
                Create a key at platform.claude.com. It's stored only in this browser and sent only to api.anthropic.com. For a shared deployment, set <code className="rounded bg-fg/10 px-1">ANTHROPIC_API_KEY</code> on the server instead.
              </p>
            </>
          )}
        </div>
      </Section>

      <Section icon={<Palette size={20} className="text-lime" />} title="Appearance & units">
        <div className="space-y-4">
          <div>
            <span className="label">Theme</span>
            <Segmented
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
              options={[
                { value: 'dark', label: <><Moon size={15} /> Dark</> },
                { value: 'light', label: <><Sun size={15} /> Light</> },
              ]}
            />
          </div>
          <div>
            <span className="label">Units</span>
            <Segmented
              value={profile.units}
              onChange={(units) => patch({ units })}
              options={[
                { value: 'metric', label: 'kg · cm' },
                { value: 'imperial', label: 'lb · ft' },
              ]}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">24-hour clock</span>
            <Toggle checked={settings.use24h} onChange={(use24h) => updateSettings({ use24h })} label="24-hour clock" />
          </div>
        </div>
      </Section>

      <Section icon={<Smartphone size={20} className="text-sun" />} title="Install & data">
        <div className="space-y-3">
          {!standalone && (
            <div className="rounded-2xl bg-fg/[0.04] p-4 text-sm">
              <p className="font-semibold">Install Calypso</p>
              <p className="mt-1 text-xs text-muted">Get a home-screen icon, full-screen app and offline support. On iPhone: Share → Add to Home Screen. On Android/desktop Chrome: use the button below or the install icon in the address bar.</p>
              <Button
                variant="soft"
                className="mt-3 py-2 text-sm"
                onClick={async () => {
                  if (deferredInstall) {
                    await deferredInstall.prompt();
                    deferredInstall = null;
                  } else {
                    toast({ emoji: '📲', title: 'Use your browser menu to install' });
                  }
                }}
              >
                Install app
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="soft" className="text-sm" onClick={exportData}>
              <Download size={16} /> Export
            </Button>
            <Button variant="soft" className="text-sm" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Import
            </Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
          </div>
          <AnimatePresence mode="wait">
            {confirmReset ? (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-2xl bg-coral/10 p-4 text-sm">
                <p className="font-semibold text-coral">Delete everything on this device?</p>
                <p className="mt-1 text-xs text-muted">Your profile, logs and progress will be erased. Export a backup first if you might want them.</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="danger" className="py-2 text-sm" onClick={resetAll}>
                    Yes, erase
                  </Button>
                  <Button variant="ghost" className="py-2 text-sm" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button variant="danger" className="w-full text-sm" onClick={() => setConfirmReset(true)}>
                  <Trash2 size={16} /> Reset all data
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Section>

      <motion.div variants={rise} className="flex flex-col items-center gap-2 py-6 text-center text-xs text-muted">
        <LogoMark size={36} />
        <p>Calypso 0.1 · Your data stays on this device.</p>
        <p>Calorie maths are estimates, not medical advice.</p>
      </motion.div>
    </motion.div>
  );
}
