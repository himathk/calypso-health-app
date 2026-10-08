import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useId, useMemo } from 'react';

const W = 120;
const H = 150;
// Tapered glass outline
const GLASS = `M14 8 L106 8 L96 138 Q95 146 87 146 L33 146 Q25 146 24 138 Z`;

function wavePath(amplitude: number, phase: number): string {
  const pts: string[] = [];
  for (let x = -W; x <= W * 2; x += 10) {
    const y = Math.sin((x / W) * Math.PI * 2 + phase) * amplitude;
    pts.push(`${x},${y.toFixed(2)}`);
  }
  return `M${pts.join(' L')} L${W * 2},${H + 20} L${-W},${H + 20} Z`;
}

/** Glass that fills with animated waves and bubbles as you log water. */
export function WaterGlass({ ml, goal, size = 1 }: { ml: number; goal: number; size?: number }) {
  const id = useId().replace(/:/g, '');
  const pct = Math.max(0, Math.min(1, goal ? ml / goal : 0));
  const level = useSpring(0, { stiffness: 40, damping: 12 });
  useEffect(() => level.set(pct), [pct, level]);
  const y = useTransform(level, (p) => 8 + (1 - p) * 138);
  const back = useMemo(() => wavePath(5, Math.PI), []);
  const front = useMemo(() => wavePath(6, 0), []);
  const bubbles = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ x: 30 + ((i * 37) % 60), r: 1.5 + (i % 3), delay: i * 0.7, dur: 2.6 + (i % 4) * 0.5 })), []);

  return (
    <svg width={W * size} height={H * size} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <clipPath id={`clip-${id}`}>
          <path d={GLASS} />
        </clipPath>
        <linearGradient id={`water-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--aqua))" />
          <stop offset="100%" stopColor="rgb(var(--violet))" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#clip-${id})`}>
        <rect x="0" y="0" width={W} height={H} fill="rgb(var(--aqua) / 0.06)" />
        <motion.g style={{ y }}>
          <motion.path
            d={back}
            fill="rgb(var(--aqua) / 0.35)"
            animate={{ x: [0, -W] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.path
            d={front}
            fill={`url(#water-${id})`}
            animate={{ x: [-W, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          {pct > 0.05 &&
            bubbles.map((b, i) => (
              <motion.circle
                key={i}
                cx={b.x}
                r={b.r}
                fill="white"
                fillOpacity={0.5}
                initial={{ cy: 150, opacity: 0 }}
                animate={{ cy: [150, 20], opacity: [0, 0.8, 0] }}
                transition={{ duration: b.dur, repeat: Infinity, delay: b.delay, ease: 'easeOut' }}
              />
            ))}
        </motion.g>
      </g>
      <path d={GLASS} fill="none" stroke="rgb(var(--fg) / 0.35)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M22 18 L30 128" stroke="white" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
