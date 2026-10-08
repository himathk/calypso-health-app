import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useId } from 'react';
import { AnimatedNumber } from './ui';

interface RingProps {
  size: number;
  r: number;
  stroke: number;
  progress: number;
  colors: [string, string];
  delay?: number;
}

function Ring({ size, r, stroke, progress, colors, delay = 0 }: RingProps) {
  const id = useId().replace(/:/g, '');
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const spring = useSpring(0, { stiffness: 50, damping: 16, mass: 1 });
  useEffect(() => {
    const t = setTimeout(() => spring.set(Math.max(0, Math.min(progress, 1))), delay * 1000);
    return () => clearTimeout(t);
  }, [progress, spring, delay]);
  const offset = useTransform(spring, (p) => circumference * (1 - p));
  const angle = useTransform(spring, (p) => p * Math.PI * 2 - Math.PI / 2);
  const hx = useTransform(angle, (a) => c + r * Math.cos(a));
  const hy = useTransform(angle, (a) => c + r * Math.sin(a));
  const headOpacity = useTransform(spring, (p) => (p > 0.02 ? 1 : 0));

  return (
    <g>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
        <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgb(var(--line) / 0.08)" strokeWidth={stroke} />
      <motion.circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={`url(#g-${id})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ strokeDashoffset: offset }}
        transform={`rotate(-90 ${c} ${c})`}
        filter={`url(#glow-${id})`}
      />
      <motion.circle cx={hx} cy={hy} r={stroke / 2 - 2} fill="white" style={{ opacity: headOpacity }} />
    </g>
  );
}

export interface DayRingsProps {
  eaten: number;
  budget: number;
  activeKcal: number;
  activeGoal: number;
  waterMl: number;
  waterGoal: number;
  size?: number;
}

/** Triple activity-style ring: calories (outer), active burn (middle), water (inner). */
export function DayRings({ eaten, budget, activeKcal, activeGoal, waterMl, waterGoal, size = 260 }: DayRingsProps) {
  const remaining = budget - eaten;
  const over = remaining < 0;
  const outer = size / 2 - 14;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <Ring
          size={size}
          r={outer}
          stroke={20}
          progress={budget ? eaten / budget : 0}
          colors={over ? ['rgb(var(--coral))', '#ff3355'] : ['rgb(var(--coral))', 'rgb(var(--sun))']}
        />
        <Ring size={size} r={outer - 26} stroke={14} progress={activeGoal ? activeKcal / activeGoal : 0} colors={['rgb(var(--violet))', '#c5a8ff']} delay={0.15} />
        <Ring size={size} r={outer - 48} stroke={12} progress={waterGoal ? waterMl / waterGoal : 0} colors={['rgb(var(--aqua))', '#7cf3ff']} delay={0.3} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          key={over ? 'over' : 'left'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${over ? 'text-coral' : 'text-muted'}`}
        >
          {over ? 'over budget' : 'kcal left'}
        </motion.span>
        <AnimatedNumber value={Math.abs(remaining)} className={`font-display text-5xl font-bold leading-none ${over ? 'text-coral' : ''}`} />
        <span className="mt-1 text-xs text-muted">
          <AnimatedNumber value={eaten} /> / {budget.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export function MiniRing({ progress, size = 44, stroke = 5, color = 'rgb(var(--coral))', children }: { progress: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) {
  const r = size / 2 - stroke / 2;
  const C = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line) / 0.1)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - Math.max(0, Math.min(1, progress))) }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{children}</div>
    </div>
  );
}
