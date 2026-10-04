/**
 * rhythm.js
 * ------------------------------------------------------------------
 * Logika ritme ketukan "natural" yang dipakai bersama oleh:
 *  - engine auto-tap overlay (useAutoTap), dan
 *  - pacer irama (usePacer) untuk pemandu tap manual di HP.
 *
 * Dipisah ke modul sendiri supaya kedua fitur memakai perhitungan
 * delay yang identik dan mudah disetel dari satu tempat.
 */
import { randInt, randFloat } from './random.js';

/**
 * Delay antar ketukan: acak dalam rentang min–max, lalu (bila humanize
 * aktif) dikali 0.88x–1.18x plus jeda "ragu" sesekali.
 */
export function computeBeatDelay(settings) {
  const lo = Math.min(settings.minDelayMs, settings.maxDelayMs);
  const hi = Math.max(settings.minDelayMs, settings.maxDelayMs);
  let delay = randInt(lo, hi);
  if (settings.humanize) {
    delay = Math.round(delay * randFloat(0.88, 1.18));
    if (Math.random() < 0.06) delay += randInt(90, 420);
  }
  return delay;
}

/**
 * Tambahan durasi micro-pause (0 bila fitur nonaktif).
 * Dipakai sebagai tambahan delay setelah N ketukan.
 */
export function microPauseExtra(settings) {
  if (!settings.microPauseEnabled) return 0;
  const lo = Math.min(settings.microPauseMinMs, settings.microPauseMaxMs);
  const hi = Math.max(settings.microPauseMinMs, settings.microPauseMaxMs);
  return randInt(lo, hi);
}

/** Ambang jumlah ketukan sebelum micro-pause (minimal 2). */
export function microPauseEveryCount(settings) {
  return Math.max(2, settings.microPauseEvery);
}
