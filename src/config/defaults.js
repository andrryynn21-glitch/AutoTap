/**
 * Konstanta & nilai default global aplikasi.
 */

export const APP_NAME = 'TikTok Auto-Tap Web';
export const APP_TAGLINE = 'Auto-tap companion dengan ritme natural';

/** Key localStorage — di-version agar mudah dimigrasi. */
export const STORAGE_KEYS = {
  settings: 'tatw:settings:v1',
  target: 'tatw:target:v1',
  stage: 'tatw:stage:v1',
  installDismissed: 'tatw:install-dismissed:v1',
  pacer: 'tatw:pacer:v1',
};

/** Pengaturan engine default. */
export const DEFAULT_SETTINGS = {
  /** Interval dasar antar ketukan (ms). Bila min == max -> fix, else random di rentang ini. */
  minDelayMs: 120,
  maxDelayMs: 260,
  /** Radius jitter titik tap (px). 0 = tepat di titik target. */
  jitterPx: 14,
  /** mode event yang dikirim: 'both' | 'pointer' | 'touch' | 'mouse' */
  tapMode: 'both',
  /** variasi mikro pada delay tiap ketukan (0.88x–1.18x + "ragu" sesekali) */
  humanize: true,
  /** micro-pause: berhenti sesaat tiap N ketukan */
  microPauseEnabled: true,
  microPauseEvery: 25,
  microPauseMinMs: 900,
  microPauseMaxMs: 2600,
  /** otomatis berhenti ketika tab disembunyikan (timer di-throttle browser) */
  pauseWhenHidden: true,
};

/**
 * Preferensi Pacer Irama (pemandu tap manual untuk HP / split-screen).
 * Ritme ketukan mengikuti DEFAULT_SETTINGS di atas.
 */
export const DEFAULT_PACER = {
  soundOn: true,
  vibrationOn: true,
};

export const SETTING_LIMITS = {
  delayMin: 30,
  delayMax: 5000,
  jitterMax: 40,
  pauseEveryMin: 5,
  pauseEveryMax: 500,
  pauseMsMin: 100,
  pauseMsMax: 15000,
};

/** Posisi awal target pointer (% terhadap area stage). */
export const DEFAULT_TARGET = { xPct: 50, yPct: 58 };

/** Konfigurasi stage player. */
export const DEFAULT_STAGE = {
  mode: 'demo', // 'embed' | 'demo'
  input: '',
};
