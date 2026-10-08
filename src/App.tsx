import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { AuroraBackground } from './components/AuroraBackground';
import { LogoMark, Wordmark } from './components/Logo';
import { BottomNav, SideNav } from './components/Nav';
import { AchievementPopup, ConfettiBurst, ReminderStack, ToastStack } from './components/Overlays';
import { useNow, usePlan } from './hooks/useDerived';
import { useExternalActions, useReminderEngine } from './hooks/useReminderEngine';
import { ACHIEVEMENTS } from './lib/achievements';
import { dayModeAt } from './lib/schedule';
import { ActivityScreen, ActivitySheet } from './screens/Activity';
import { FoodSheet } from './screens/FoodSheet';
import { MealSheet, MenusScreen } from './screens/Menus';
import { Onboarding } from './screens/Onboarding';
import { ProfileScreen } from './screens/Profile';
import { ProgressScreen, WeightSheet } from './screens/Progress';
import { Today } from './screens/Today';
import { useStore } from './store/useStore';
import { useUI } from './store/useUI';

function Splash() {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="absolute h-64 w-64 rounded-full bg-coral/30 blur-3xl" animate={{ scale: [0.8, 1.3, 1] }} transition={{ duration: 1.6 }} />
      <LogoMark size={110} animated className="relative" />
      <motion.div initial={{ opacity: 0, y: 12, letterSpacing: '0.4em' }} animate={{ opacity: 1, y: 0, letterSpacing: '0em' }} transition={{ delay: 0.6, duration: 0.8 }}>
        <Wordmark className="relative mt-4 block text-4xl" />
      </motion.div>
    </motion.div>
  );
}

/** Unlocks achievements as data changes and celebrates new ones. */
function useAchievementWatcher() {
  const profile = useStore((s) => s.profile);
  const foods = useStore((s) => s.foods);
  const activities = useStore((s) => s.activities);
  const water = useStore((s) => s.water);
  const weights = useStore((s) => s.weights);
  const plan = usePlan();
  const primed = useRef(false);

  useEffect(() => {
    if (!profile || !plan) return;
    const t = setTimeout(() => {
      const ctx = { profile, plan, foods, activities, water, weights, now: new Date() };
      const have = useStore.getState().achievements;
      const fresh = ACHIEVEMENTS.filter((a) => !have[a.id] && a.check(ctx)).map((a) => a.id);
      if (!fresh.length) {
        primed.current = true;
        return;
      }
      useStore.getState().unlock(fresh);
      if (primed.current) {
        useUI.getState().showAchievement(fresh[0]);
        useUI.getState().celebrate();
      }
      primed.current = true;
    }, 600);
    return () => clearTimeout(t);
  }, [profile, plan, foods, activities, water, weights]);
}

function useThemeSync() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('calypso-theme', theme);
    } catch {
      /* private mode */
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0f24' : '#f5f3ff');
  }, [theme]);
}

const SCREENS = {
  today: Today,
  menus: MenusScreen,
  activity: ActivityScreen,
  progress: ProgressScreen,
  profile: ProfileScreen,
};

function Shell() {
  const tab = useUI((s) => s.tab);
  const Screen = SCREENS[tab];
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);
  return (
    <motion.div className="flex min-h-dvh" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <SideNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-32 pt-[max(env(safe-area-inset-top),1rem)] sm:px-6 lg:pb-12 lg:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <FoodSheet />
      <ActivitySheet />
      <WeightSheet />
      <MealSheet />
    </motion.div>
  );
}

export function App() {
  const hydrated = useStore((s) => s.hydrated);
  const profile = useStore((s) => s.profile);
  const [splashDone, setSplashDone] = useState(false);
  const now = useNow(60_000);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useThemeSync();
  useReminderEngine();
  useExternalActions();
  useAchievementWatcher();

  const mode = profile ? dayModeAt(profile.schedule, now).mode : 'morning';
  const ready = hydrated && splashDone;

  return (
    <MotionConfig reducedMotion="user">
      <AuroraBackground mode={mode} />
      <AnimatePresence mode="wait">
        {!ready ? <Splash key="splash" /> : !profile ? <Onboarding key="onboarding" /> : <Shell key="shell" />}
      </AnimatePresence>
      <ReminderStack />
      <ToastStack />
      <ConfettiBurst />
      <AchievementPopup />
    </MotionConfig>
  );
}
