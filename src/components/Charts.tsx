import { motion } from 'framer-motion';
import { useId, useMemo, useState } from 'react';
import type { Tone } from './ui';

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

/** Vertical bars that grow in with a stagger; optional dashed target line. */
export function BarChart({ data, target, tone = 'coral', height = 160, format = (v) => String(Math.round(v)), overTone }: { data: BarDatum[]; target?: number; tone?: Tone; height?: number; format?: (v: number) => string; overTone?: Tone }) {
  const max = Math.max(1, target ?? 0, ...data.map((d) => d.value)) * 1.12;
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="relative w-full" style={{ height: height + 24 }}>
      {target != null && (
        <motion.div
          className="absolute inset-x-0 border-t-2 border-dashed border-fg/25"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ bottom: 24 + (target / max) * height, originX: 0 }}
        >
          <span className="absolute -top-5 right-0 rounded-md bg-bg/60 px-1 text-[10px] font-semibold text-muted">target {format(target)}</span>
        </motion.div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-2" style={{ height: height + 24 }}>
        {data.map((d, i) => {
          const t = target != null && overTone && d.value > target ? overTone : tone;
          const color = `rgb(var(--${t}))`;
          const soft = (a: number) => `rgb(var(--${t}) / ${a})`;
          return (
            <div key={d.label + i} className="flex h-full flex-1 flex-col items-center justify-end" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <div className="relative flex w-full flex-1 items-end justify-center">
                {hover === i && (
                  <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-1 z-10 rounded-lg bg-fg px-1.5 py-0.5 text-[10px] font-bold text-bg">
                    {format(d.value)}
                  </motion.span>
                )}
                <motion.div
                  className="w-full max-w-[34px] rounded-t-xl rounded-b-md"
                  style={{
                    background: `linear-gradient(180deg, ${color}, ${soft(0.35)})`,
                    boxShadow: d.highlight ? `0 0 20px ${soft(0.6)}` : undefined,
                    opacity: d.value === 0 ? 0.25 : 1,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(4, (d.value / max) * height) }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 120, damping: 16 }}
                />
              </div>
              <span className={`mt-1.5 h-[18px] text-[11px] font-semibold ${d.highlight ? 'text-fg' : 'text-muted'}`}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface LinePoint {
  x: number; // epoch ms
  y: number;
}

/** Smooth weight line with gradient fill, goal line and dashed projection. */
export function LineChart({ points, goal, projection, height = 200, format = (v) => v.toFixed(1) }: { points: LinePoint[]; goal?: number; projection?: LinePoint[]; height?: number; format?: (v: number) => string }) {
  const id = useId().replace(/:/g, '');
  const W = 600;
  const H = height;
  const pad = { l: 8, r: 8, t: 16, b: 22 };
  const all = [...points, ...(projection ?? [])];
  const { sx, sy, minY, maxY } = useMemo(() => {
    const xs = all.map((p) => p.x);
    const ys = [...all.map((p) => p.y), ...(goal != null ? [goal] : [])];
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs, minX + 86400000);
    const lo = Math.min(...ys) - 0.8;
    const hi = Math.max(...ys) + 0.8;
    return {
      sx: (x: number) => pad.l + ((x - minX) / (maxX - minX)) * (W - pad.l - pad.r),
      sy: (y: number) => pad.t + (1 - (y - lo) / (hi - lo)) * (H - pad.t - pad.b),
      minY: lo,
      maxY: hi,
    };
  }, [points, projection, goal, H]);

  const path = (pts: LinePoint[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M${sx(pts[0].x)},${sy(pts[0].y)}`;
    let d = `M${sx(pts[0].x)},${sy(pts[0].y)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const cx = (sx(p0.x) + sx(p1.x)) / 2;
      d += ` C${cx},${sy(p0.y)} ${cx},${sy(p1.y)} ${sx(p1.x)},${sy(p1.y)}`;
    }
    return d;
  };
  const line = path(points);
  const area = points.length > 1 ? `${line} L${sx(points[points.length - 1].x)},${H - pad.b} L${sx(points[0].x)},${H - pad.b} Z` : '';
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--coral))" stopOpacity="0.45" />
          <stop offset="100%" stopColor="rgb(var(--coral))" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`stroke-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(var(--peach))" />
          <stop offset="100%" stopColor="rgb(var(--coral))" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)} stroke="rgb(var(--line) / 0.06)" />
      ))}
      {goal != null && goal >= minY && goal <= maxY && (
        <g>
          <motion.line x1={pad.l} x2={W - pad.r} y1={sy(goal)} y2={sy(goal)} stroke="rgb(var(--lime))" strokeWidth="2" strokeDasharray="6 6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
          <text x={W - pad.r} y={sy(goal) - 6} textAnchor="end" fontSize="13" fontWeight="700" fill="rgb(var(--lime))">
            goal {format(goal)}
          </text>
        </g>
      )}
      {area && <motion.path d={area} fill={`url(#fill-${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} />}
      {projection && projection.length > 1 && (
        <motion.path d={`M${sx(projection[0].x)},${sy(projection[0].y)} L${sx(projection[projection.length - 1].x)},${sy(projection[projection.length - 1].y)}`} fill="none" stroke="rgb(var(--violet))" strokeWidth="2.5" strokeDasharray="4 8" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.8 }} transition={{ delay: 1, duration: 1.2 }} />
      )}
      <motion.path d={line} fill="none" stroke={`url(#stroke-${id})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
      {points.map((p, i) => (
        <motion.circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={i === points.length - 1 ? 7 : 4} fill={i === points.length - 1 ? 'white' : 'rgb(var(--coral))'} stroke="rgb(var(--coral))" strokeWidth={i === points.length - 1 ? 4 : 0} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + (i / Math.max(points.length, 1)) * 1.1, type: 'spring' }} />
      ))}
      {last && (
        <motion.circle cx={sx(last.x)} cy={sy(last.y)} r={7} fill="none" stroke="rgb(var(--coral))" strokeWidth="2" animate={{ r: [7, 18], opacity: [0.8, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
      )}
    </svg>
  );
}
