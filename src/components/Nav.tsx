import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Activity, Camera, ChefHat, Home, LineChart, UserRound, type LucideIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useUI, type Tab } from '../store/useUI';
import { Logo } from './Logo';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'menus', label: 'Menus', icon: ChefHat },
  { id: 'activity', label: 'Move', icon: Activity },
  { id: 'progress', label: 'Progress', icon: LineChart },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

function SnapButton({ big = false }: { big?: boolean }) {
  const openSheet = useUI((s) => s.openSheet);
  return (
    <motion.button
      aria-label="Snap your food"
      onClick={() => openSheet({ type: 'food', mode: 'snap' })}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9, rotate: -8 }}
      className={clsx('relative flex items-center justify-center rounded-full bg-brand text-white shadow-glow', big ? 'h-16 w-16' : 'h-14 w-14')}
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-brand"
        animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
      />
      <Camera size={big ? 28 : 24} strokeWidth={2.2} className="relative" />
    </motion.button>
  );
}

export function BottomNav() {
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const items = TABS.filter((t) => t.id !== 'profile');
  const left = items.slice(0, 2);
  const right = items.slice(2);

  const renderItem = (t: (typeof TABS)[number]) => {
    const active = tab === t.id;
    const Icon = t.icon;
    return (
      <button key={t.id} onClick={() => setTab(t.id)} className="relative flex flex-1 flex-col items-center gap-1 py-2" aria-current={active ? 'page' : undefined}>
        {active && <motion.span layoutId="nav-pill" className="absolute inset-x-2 inset-y-0 rounded-2xl bg-fg/[0.08]" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
        <motion.span animate={{ y: active ? -2 : 0, scale: active ? 1.12 : 1 }} className={clsx('relative', active ? 'text-coral' : 'text-muted')}>
          <Icon size={22} strokeWidth={active ? 2.4 : 2} />
        </motion.span>
        <span className={clsx('relative text-[11px] font-semibold', active ? 'text-fg' : 'text-muted')}>{t.label}</span>
      </button>
    );
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 26, delay: 0.2 }}
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.6rem)] lg:hidden"
    >
      <div className="glass mx-auto flex max-w-md items-center rounded-[1.75rem] px-2 py-1.5 shadow-card">
        {left.map(renderItem)}
        <div className="-mt-9 px-1">
          <SnapButton />
        </div>
        {right.map(renderItem)}
      </div>
    </motion.nav>
  );
}

export function SideNav() {
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const profile = useStore((s) => s.profile);
  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-2 p-5 lg:flex"
    >
      <Logo className="mb-6 px-2" />
      {TABS.map((t) => {
        const active = tab === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx('relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition-colors', active ? 'text-fg' : 'text-muted hover:text-fg')}
          >
            {active && <motion.span layoutId="side-pill" className="glass absolute inset-0 rounded-2xl" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className={clsx('relative', active && 'text-coral')}>
              <Icon size={20} />
            </span>
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
      <div className="mt-auto flex flex-col items-center gap-3 rounded-3xl p-5 text-center glass">
        <SnapButton big />
        <p className="text-sm font-semibold">Snap a meal</p>
        <p className="text-xs text-muted">Calypso estimates calories from a photo.</p>
      </div>
      {profile && <p className="mt-2 px-2 text-xs text-muted">Signed in locally as {profile.name}</p>}
    </motion.aside>
  );
}
