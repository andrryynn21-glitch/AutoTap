/**
 * Formatter angka & durasi (locale Indonesia).
 */

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value ?? 0);
}

/** 1500 -> "1,5 s", 240 -> "240 ms" */
export function formatMs(ms) {
  if (ms >= 1000) {
    const seconds = ms / 1000;
    return `${seconds.toFixed(1).replace('.', ',')} s`;
  }
  return `${Math.round(ms)} ms`;
}
