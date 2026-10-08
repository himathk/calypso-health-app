import clsx from 'clsx';
import { animate, motion, useMotionValue, useTransform, type HTMLMotionProps } from 'framer-motion';
import { useEffect, useId, type ReactNode } from 'react';

export type Tone = 'coral' | 'peach' | 'aqua' | 'violet' | 'lime' | 'sun';

export const toneText: Record<Tone, string> = {
  coral: 'text-coral',
  peach: 'text-peach',
  aqua: 'text-aqua',
  violet: 'text-violet',
  lime: 'text-lime',
  sun: 'text-sun',
};
export const toneBg: Record<Tone, string> = {
  coral: 'bg-coral',
  peach: 'bg-peach',
  aqua: 'bg-aqua',
  violet: 'bg-violet',
  lime: 'bg-lime',
  sun: 'bg-sun',
};
export const toneSoft: Record<Tone, string> = {
  coral: 'bg-coral/15 text-coral',
  peach: 'bg-peach/15 text-peach',
  aqua: 'bg-aqua/15 text-aqua',
  violet: 'bg-violet/15 text-violet',
  lime: 'bg-lime/15 text-lime',
  sun: 'bg-sun/15 text-sun',
};

/** Number that counts up/down smoothly whenever its value changes. */
export function AnimatedNumber({ value, className, format = (n) => Math.round(n).toLocaleString(), duration = 0.9 }: { value: number; className?: string; format?: (n: number) => string; duration?: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, mv, duration]);
  return <motion.span className={clsx('tabular-nums', className)}>{text}</motion.span>;
}

type ButtonVariant = 'primary' | 'cool' | 'ghost' | 'soft' | 'danger';

export function Button({ variant = 'primary', className, children, ...props }: HTMLMotionProps<'button'> & { variant?: ButtonVariant; children?: ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary' && 'bg-brand text-white shadow-glow',
        variant === 'cool' && 'bg-cool text-white shadow-glow-aqua',
        variant === 'ghost' && 'text-fg hover:bg-fg/5',
        variant === 'soft' && 'bg-fg/[0.07] text-fg hover:bg-fg/10',
        variant === 'danger' && 'bg-coral/15 text-coral hover:bg-coral/25',
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function IconButton({ className, children, label, ...props }: HTMLMotionProps<'button'> & { label: string; children?: ReactNode }) {
  return (
    <motion.button
      aria-label={label}
      title={label}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.88 }}
      className={clsx('inline-flex h-10 w-10 items-center justify-center rounded-full bg-fg/[0.06] text-fg transition-colors hover:bg-fg/10', className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** Pill selector with a sliding highlight (shared layout animation). */
export function Segmented<T extends string>({ value, options, onChange, className, size = 'md' }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; className?: string; size?: 'sm' | 'md' }) {
  const id = useId();
  return (
    <div className={clsx('relative flex rounded-2xl bg-fg/[0.06] p-1', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors',
            size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm',
            value === o.value ? 'text-white' : 'text-muted hover:text-fg',
          )}
        >
          {value === o.value && (
            <motion.span layoutId={`seg-${id}`} className="absolute inset-0 -z-10 rounded-xl bg-brand shadow-glow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, tone = 'coral' }: { checked: boolean; onChange: (v: boolean) => void; label?: string; tone?: Tone }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx('relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300', checked ? toneBg[tone] : 'bg-fg/15')}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className={clsx('absolute top-1 h-6 w-6 rounded-full bg-white shadow-md', checked ? 'right-1' : 'left-1')}
      />
    </button>
  );
}

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={clsx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
        active ? 'border-transparent bg-brand text-white shadow-glow' : 'hairline bg-fg/[0.04] text-muted hover:text-fg',
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function Slider({ value, min, max, step = 1, onChange, label }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label?: string }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      aria-label={label}
      type="range"
      className="range w-full"
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ ['--fill' as string]: `${fill}%` }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-3 flex items-center justify-between', className)}>
      <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

/** Container that staggers its children's entrance. */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
export const rise = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

export function Card({ className, children, ...props }: HTMLMotionProps<'div'> & { children?: ReactNode }) {
  return (
    <motion.div variants={rise} className={clsx('card', className)} {...props}>
      {children}
    </motion.div>
  );
}

export function ProgressBar({ value, max, tone = 'coral', className, height = 8 }: { value: number; max: number; tone?: Tone; className?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  return (
    <div className={clsx('w-full overflow-hidden rounded-full bg-fg/10', className)} style={{ height }}>
      <motion.div
        className={clsx('h-full rounded-full', toneBg[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${pct * 100}%` }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        style={{ boxShadow: `0 0 12px rgb(var(--${tone}) / 0.6)` }}
      />
    </div>
  );
}
