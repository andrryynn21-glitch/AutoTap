import { useEffect, useState } from 'react';
import { clamp } from '../lib/random.js';

/* ------------------------------ layout ------------------------------ */

export function SectionCard({ title, subtitle, children, actions, id }) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-ink-700 bg-ink-900/80 p-4 shadow-lg shadow-black/40 backdrop-blur"
    >
      {(title || actions) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-300">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-xs text-ink-400">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

/* ------------------------------ inputs ------------------------------ */

export function NumberInput({ value, onChange, min = 0, max = 100000, step = 1, suffix }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    const next = Number.isFinite(parsed) ? clamp(parsed, min, max) : value;
    onChange(next);
    setDraft(String(next));
  };

  return (
    <span className="flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-950/70 px-2 py-1.5">
      <input
        type="number"
        inputMode="numeric"
        value={draft}
        min={min}
        max={max}
        step={step}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        className="w-14 bg-transparent text-right text-sm font-semibold text-ink-100 outline-none"
      />
      {suffix && <span className="text-[11px] text-ink-400">{suffix}</span>}
    </span>
  );
}

export function RangeField({ label, value, onChange, min, max, step = 1, suffix, hint }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-ink-200">{label}</span>
        <NumberInput value={value} onChange={onChange} min={min} max={max} suffix={suffix} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer"
        aria-label={label}
      />
      {hint && <p className="mt-1 text-[11px] leading-snug text-ink-500">{hint}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-1.5 text-left disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block text-sm text-ink-200">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-snug text-ink-500">{description}</span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-tik-cyan/60 bg-tik-cyan/25' : 'border-ink-600 bg-ink-800'
        }`}
      >
        <span
          className={`absolute top-[3px] h-[16px] w-[16px] rounded-full transition-all ${
            checked ? 'left-[23px] bg-tik-cyan' : 'left-[3px] bg-ink-400'
          }`}
        />
      </span>
    </button>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex rounded-lg border border-ink-600 bg-ink-950/60 p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              active ? 'bg-ink-700 text-ink-100 shadow-md' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- bits ------------------------------- */

const ACCENT_CLASSES = {
  cyan: 'text-tik-cyan',
  pink: 'text-tik-pink',
  white: 'text-ink-100',
  amber: 'text-amber-400',
  green: 'text-emerald-400',
};

export function StatCard({ label, value, sub, accent = 'white', pulse = false }) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-950/60 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-ink-500">{label}</p>
      <p
        className={`mt-1 truncate text-xl font-bold tabular-nums ${
          ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.white
        } ${pulse ? 'animate-pulse' : ''}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-ink-400">{sub}</p>}
    </div>
  );
}

const CHIP_TONES = {
  neutral: 'border-ink-600 bg-ink-800 text-ink-300',
  cyan: 'border-tik-cyan/40 bg-tik-cyan/10 text-tik-cyan',
  pink: 'border-tik-pink/40 bg-tik-pink/10 text-tik-pink',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  green: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
};

export function Chip({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        CHIP_TONES[tone] ?? CHIP_TONES.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}

