import { motion } from 'framer-motion';
import { useId } from 'react';

/**
 * The Calypso mark: an open "C" that doubles as a progress ring,
 * wrapped around a flame-leaf — burning energy, growing healthier.
 */
export function LogoMark({ size = 40, animated = false, className }: { size?: number; animated?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '');
  const ring = `ring-${id}`;
  const flame = `flame-${id}`;
  const draw = animated
    ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 1.4, ease: [0.65, 0, 0.35, 1] } }
    : {};
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={ring} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B78" />
          <stop offset="0.55" stopColor="#FFAA64" />
          <stop offset="1" stopColor="#FFD05A" />
        </linearGradient>
        <linearGradient id={flame} x1="32" y1="14" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38DAE6" />
          <stop offset="1" stopColor="#9274FF" />
        </linearGradient>
      </defs>
      {/* Open C ring, gap on the right like an unfinished progress ring */}
      <motion.path
        d="M50.6 18.4A23 23 0 1 0 50.6 45.6"
        stroke={`url(#${ring})`}
        strokeWidth="7"
        strokeLinecap="round"
        {...draw}
      />
      <motion.circle
        cx="50.6"
        cy="45.6"
        r="3.6"
        fill="#FFD05A"
        initial={animated ? { scale: 0 } : false}
        animate={animated ? { scale: [0, 1.4, 1] } : undefined}
        transition={{ delay: 1.2, duration: 0.5 }}
      />
      {/* Flame-leaf */}
      <motion.path
        d="M32 15c5.5 6.2 11 11.6 11 19.2A11 11 0 0 1 32 45.4 11 11 0 0 1 21 34.2c0-4.3 2-7.6 4.6-10.4.4 3 1.8 5.3 4.2 6.4C30 24.8 30.6 19.6 32 15Z"
        fill={`url(#${flame})`}
        style={{ transformOrigin: '32px 45px' }}
        initial={animated ? { scale: 0, opacity: 0 } : false}
        animate={animated ? { scale: [0, 1.12, 0.96, 1], opacity: 1 } : undefined}
        transition={{ delay: 0.5, duration: 0.9, ease: 'easeOut' }}
      />
      <path d="M32 41.5c-3 0-5-2.1-5-4.9 0-2.4 1.6-4.1 3.2-5.6.2 1.7 1 2.8 2.3 3.3.6-1.9 1.2-3.3 2-4.3 1.6 1.9 2.5 3.8 2.5 5.9 0 3.2-2 5.6-5 5.6Z" fill="white" fillOpacity="0.85" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      calyps<span className="text-gradient">o</span>
    </span>
  );
}

export function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <Wordmark className="text-2xl" />
    </div>
  );
}
