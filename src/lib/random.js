/**
 * Helper angka & keacakan untuk engine auto-tap.
 */

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Integer acak inklusif antara min..max. */
export function randInt(min, max) {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

/** Float acak antara min..max. */
export function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Offset jitter acak di dalam lingkaran radius `radiusPx`
 * (distribusi uniform di seluruh area lingkaran, bukan menumpuk di pusat).
 */
export function randomJitter(radiusPx) {
  if (!radiusPx || radiusPx <= 0) return { dx: 0, dy: 0 };
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * radiusPx;
  return {
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
  };
}

/** Pembulatan 0.1 untuk koordinat persen target. */
export function round1(value) {
  return Math.round(value * 10) / 10;
}
