import { useCallback, useEffect, useRef, useState } from 'react';
import { computeBeatDelay, microPauseExtra, microPauseEveryCount } from '../lib/rhythm.js';

const FIRST_BEAT_DELAY_MS = 400;

/**
 * Putar satu bunyi pendek memakai WebAudio (tanpa file audio).
 * AudioContext dibuat malas (lazy) dan di-resume saat dibutuhkan karena
 * browser mewajibkan interaksi pengguna terlebih dahulu.
 */
function playBeep(audioRef, freq, durationMs, volume) {
  const ctx = audioRef.current;
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const dur = durationMs / 1000;
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  } catch {
    /* audio tidak tersedia — abaikan, pacer tetap jalan lewat getar/visual */
  }
}

/**
 * usePacer — engine "pacer irama": metronom natural yang memberi tanda
 * bunyi + getar + visual pada ritme yang sama dengan engine auto-tap.
 *
 * Dipakai untuk pemandu tap manual di HP (split-screen dengan aplikasi
 * TikTok), karena browser TIDAK bisa mengirim event tap ke aplikasi lain.
 */
export function usePacer({ settings, soundOn = true, vibrationOn = true }) {
  const [running, setRunning] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [manualCount, setManualCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const runningRef = useRef(false);
  const timerRef = useRef(null);
  const tickerRef = useRef(null);
  const audioRef = useRef(null);
  const beatRef = useRef(0);
  const manualRef = useRef(0);
  const tapsSincePauseRef = useRef(0);
  const accumulatedRef = useRef(0);
  const segmentStartRef = useRef(0);

  const settingsRef = useRef(settings);
  const soundRef = useRef(soundOn);
  const vibrationRef = useRef(vibrationOn);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);
  useEffect(() => {
    vibrationRef.current = vibrationOn;
  }, [vibrationOn]);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        try {
          audioRef.current = new Ctx();
        } catch {
          audioRef.current = null;
        }
      }
    }
    if (audioRef.current?.state === 'suspended') {
      audioRef.current.resume().catch(() => {});
    }
    return audioRef.current;
  }, []);

  const vibrate = useCallback((pattern) => {
    if (!vibrationRef.current) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        /* sebagian browser melempar error bila tab tidak aktif — abaikan */
      }
    }
  }, []);

  const doBeat = useCallback(() => {
    beatRef.current += 1;
    setBeatCount(beatRef.current);
    if (soundRef.current) playBeep(ensureAudio(), 880, 70, 0.18);
    vibrate(35);
  }, [ensureAudio, vibrate]);

  const schedule = useCallback(
    (delay) => {
      timerRef.current = window.setTimeout(() => {
        if (!runningRef.current) return;
        doBeat();

        const s = settingsRef.current;
        const next = computeBeatDelay(s);
        let pauseExtra = 0;

        if (s.microPauseEnabled) {
          tapsSincePauseRef.current += 1;
          if (tapsSincePauseRef.current >= microPauseEveryCount(s)) {
            pauseExtra = microPauseExtra(s);
            tapsSincePauseRef.current = 0;
          }
        }

        if (pauseExtra > 0) {
          // Tanda masuk micro-pause: bunyi rendah + getar ganda.
          if (soundRef.current) playBeep(ensureAudio(), 440, 220, 0.15);
          vibrate([60, 50, 60]);
        }

        if (runningRef.current) schedule(next + pauseExtra);
      }, delay);
    },
    [doBeat, ensureAudio, vibrate],
  );

  const start = useCallback(() => {
    if (runningRef.current) return;
    ensureAudio();
    runningRef.current = true;
    segmentStartRef.current = Date.now();
    setRunning(true);
    schedule(FIRST_BEAT_DELAY_MS);
  }, [ensureAudio, schedule]);

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    accumulatedRef.current += Date.now() - segmentStartRef.current;
    setRunning(false);
    setElapsedMs(accumulatedRef.current);
  }, []);

  const toggle = useCallback(() => {
    if (runningRef.current) stop();
    else start();
  }, [start, stop]);

  const reset = useCallback(() => {
    stop();
    beatRef.current = 0;
    manualRef.current = 0;
    tapsSincePauseRef.current = 0;
    accumulatedRef.current = 0;
    setBeatCount(0);
    setManualCount(0);
    setElapsedMs(0);
  }, [stop]);

  /** Ketukan manual pengguna (area tap besar di panel pacer). */
  const tapManual = useCallback(() => {
    manualRef.current += 1;
    setManualCount(manualRef.current);
    vibrate(20);
    if (soundRef.current) playBeep(ensureAudio(), 660, 50, 0.12);
  }, [ensureAudio, vibrate]);

  /** Ticker durasi berjalan (250ms) selama pacer aktif. */
  useEffect(() => {
    if (!running) return undefined;
    tickerRef.current = window.setInterval(
      () => setElapsedMs(accumulatedRef.current + (Date.now() - segmentStartRef.current)),
      250,
    );
    return () => {
      if (tickerRef.current) {
        window.clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
    };
  }, [running]);

  /** Auto-pause saat tab disembunyikan (timer di-throttle browser). */
  const pauseWhenHidden = Boolean(settings.pauseWhenHidden);
  useEffect(() => {
    if (!pauseWhenHidden) return undefined;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && runningRef.current) stop();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pauseWhenHidden, stop]);

  /** Bersihkan semua timer saat unmount. */
  useEffect(
    () => () => {
      runningRef.current = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (tickerRef.current) window.clearInterval(tickerRef.current);
    },
    [],
  );

  return {
    running,
    beatCount,
    manualCount,
    elapsedMs,
    start,
    stop,
    toggle,
    reset,
    tapManual,
  };
}
