import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import type { DayMode } from '../lib/schedule';

const PALETTES: Record<DayMode, [string, string, string]> = {
  morning: ['var(--peach)', 'var(--sun)', 'var(--coral)'],
  work: ['var(--violet)', 'var(--aqua)', 'var(--coral)'],
  lunch: ['var(--peach)', 'var(--lime)', 'var(--coral)'],
  evening: ['var(--coral)', 'var(--violet)', 'var(--peach)'],
  off: ['var(--aqua)', 'var(--lime)', 'var(--violet)'],
  sleep: ['var(--violet)', 'var(--aqua)', 'var(--violet)'],
};

const BLOBS = [
  { size: 520, x: ['-10%', '15%', '-5%'], y: ['-15%', '5%', '-10%'], left: '-10%', top: '-10%', dur: 22 },
  { size: 460, x: ['10%', '-15%', '5%'], y: ['0%', '20%', '-5%'], left: '55%', top: '20%', dur: 26 },
  { size: 400, x: ['0%', '20%', '-10%'], y: ['10%', '-10%', '15%'], left: '10%', top: '60%', dur: 30 },
];

/** Slow-drifting aurora blobs whose colours follow the time of day. */
export function AuroraBackground({ mode = 'work' }: { mode?: DayMode }) {
  const palette = PALETTES[mode];
  const stars = useMemo(
    () => Array.from({ length: 28 }, () => ({ left: Math.random() * 100, top: Math.random() * 100, delay: Math.random() * 6, size: Math.random() * 2 + 1 })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-bg" />
      <AnimatePresence initial={false}>
        <motion.div
          key={mode}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        >
          {BLOBS.map((b, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: b.size,
                height: b.size,
                left: b.left,
                top: b.top,
                filter: 'blur(90px)',
                background: `radial-gradient(circle, rgb(${palette[i]} / 0.42), transparent 70%)`,
              }}
              animate={{ x: b.x, y: b.y, scale: [1, 1.15, 0.95] }}
              transition={{
                x: { duration: b.dur, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                y: { duration: b.dur * 1.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                scale: { duration: b.dur * 0.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>
      {(mode === 'sleep' || mode === 'evening') &&
        stars.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }}
            animate={{ opacity: [0.1, 0.8, 0.1] }}
            transition={{ duration: 3 + s.delay, repeat: Infinity, delay: s.delay }}
          />
        ))}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
