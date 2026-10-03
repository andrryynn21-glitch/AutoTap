import { formatNumber } from '../lib/format.js';
import { Chip, SectionCard } from './ui.jsx';

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

/**
 * ControlPanel — tombol master ON/OFF + reset + ringkasan setelan aktif.
 */
export function ControlPanel({
  running,
  onToggle,
  onReset,
  tapCount,
  lastStopReason,
  wakeLockSupported,
  settings,
}) {
  const intervalLabel =
    settings.minDelayMs === settings.maxDelayMs
      ? `${settings.minDelayMs} ms (fix)`
      : `${settings.minDelayMs}–${settings.maxDelayMs} ms`;

  return (
    <SectionCard title="Kontrol Auto-Tap" subtitle="Mulai / hentikan engine secara instan">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={running}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-4 text-base font-extrabold tracking-wide shadow-lg transition-all active:scale-[0.98] ${
          running
            ? 'bg-tik-pink text-white shadow-tik-pink/30'
            : 'bg-gradient-to-r from-tik-cyan to-tik-pink text-ink-950 shadow-tik-cyan/20'
        }`}
      >
        {running ? <StopIcon /> : <PlayIcon />}
        {running ? 'BERHENTI AUTO-TAP' : 'MULAI AUTO-TAP'}
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
            running ? 'bg-black/25 text-white' : 'bg-black/15 text-ink-900'
          }`}
        >
          {formatNumber(tapCount)} tap
        </span>
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-ink-600 px-3.5 py-1.5 text-xs font-medium text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100"
        >
          Reset Counter & Timer
        </button>
        <Chip tone="neutral">Interval {intervalLabel}</Chip>
        <Chip tone={settings.jitterPx > 0 ? 'cyan' : 'neutral'}>Jitter ±{settings.jitterPx}px</Chip>
        <Chip tone={settings.microPauseEnabled ? 'pink' : 'neutral'}>
          {settings.microPauseEnabled
            ? `Micro-pause tiap ${settings.microPauseEvery} tap`
            : 'Micro-pause off'}
        </Chip>
        {running && wakeLockSupported && <Chip tone="green">Layar dijaga tetap menyala</Chip>}
      </div>

      {lastStopReason === 'hidden' && !running && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-300">
          Engine di-pause otomatis karena tab berpindah ke background (browser men-throttle
          timer sehingga ritme jadi tidak natural). Matikan opsi “Auto-pause saat tab
          disembunyikan” di Pengaturan bila tidak diinginkan.
        </p>
      )}
    </SectionCard>
  );
}
