import { useCallback, useEffect, useRef, useState } from 'react';
import { computeBeatDelay, microPauseExtra, microPauseEveryCount } from '../lib/rhythm.js';
import { performTap } from '../lib/tapSimulator.js';

const FIRST_TAP_DELAY_MS = 220;

/**
 * Engine auto-tap.
 * ------------------------------------------------------------------
 * - Penjadwalan memakai setTimeout berantai (bukan setInterval) sehingga
 *   setiap interval bisa diacak: delay dasar acak, perkalian "humanize",
 *   plus micro-pause periodik.
 * - Statistik: jumlah tap, durasi berjalan (akumulatif antar sesi), dan
 *   laporan ketukan terakhir (delivered / terblokir iframe cross-origin).
 */
export function useAutoTap({ settings, target, stageRef, onTap }) {
  const [running, setRunning] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [delivery, setDelivery] = useState(null);
  const [lastStopReason, setLastStopReason] = useState(null);

  const runningRef = useRef(false);
  const timeoutRef = useRef(null);
  const tickerRef = useRef(null);
  const tapCountRef = useRef(0);
  const tapsSincePauseRef = useRef(0);
  const accumulatedRef = useRef(0); // ms sesi-sesi sebelumnya
  const segmentStartRef = useRef(0); // timestamp mulai segmen aktif

  const settingsRef = useRef(settings);
  const targetRef = useRef(target);
  const onTapRef = useRef(onTap);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);
  useEffect(() => {
    onTapRef.current = onTap;
  }, [onTap]);

  const elapsedNow = useCallback(
    () => accumulatedRef.current + (runningRef.current ? Date.now() - segmentStartRef.current : 0),
    [],
  );

  /** Delay berikutnya: acak dalam rentang + humanize (logika di lib/rhythm.js). */
  const computeDelay = useCallback(() => computeBeatDelay(settingsRef.current), []);

  const doOneTap = useCallback(() => {
    const stage = stageRef?.current;
    if (!stage) return;
    const t = targetRef.current || { xPct: 50, yPct: 50 };
    const s = settingsRef.current;
    const rect = stage.getBoundingClientRect();

    const result = performTap({
      container: stage,
      x: (t.xPct / 100) * rect.width,
      y: (t.yPct / 100) * rect.height,
      jitterPx: s.jitterPx,
      mode: s.tapMode,
    });
    if (!result) return;

    tapCountRef.current += 1;
    setTapCount(tapCountRef.current);
    setDelivery(result);
    onTapRef.current?.(result);
  }, [stageRef]);

  /** Loop utama: setTimeout berantai dengan micro-pause periodik. */
  const scheduleNext = useCallback(
    (delay) => {
      timeoutRef.current = window.setTimeout(() => {
        if (!runningRef.current) return;
        doOneTap();

        const s = settingsRef.current;
        let next = computeDelay();
        if (s.microPauseEnabled) {
          tapsSincePauseRef.current += 1;
          if (tapsSincePauseRef.current >= microPauseEveryCount(s)) {
            next += microPauseExtra(s);
            tapsSincePauseRef.current = 0;
          }
        }

        if (runningRef.current) scheduleNext(next);
      }, delay);
    },
    [computeDelay, doOneTap],
  );

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setLastStopReason(null);
    segmentStartRef.current = Date.now();
    setRunning(true);
    scheduleNext(FIRST_TAP_DELAY_MS);
  }, [scheduleNext]);

  const stop = useCallback((reason = 'manual') => {
    if (!runningRef.current) return;
    runningRef.current = false;
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    accumulatedRef.current += Date.now() - segmentStartRef.current;
    setRunning(false);
    setElapsedMs(accumulatedRef.current);
    setLastStopReason(reason);
  }, []);

  const reset = useCallback(() => {
    stop('reset');
    tapCountRef.current = 0;
    tapsSincePauseRef.current = 0;
    accumulatedRef.current = 0;
    segmentStartRef.current = Date.now();
    setTapCount(0);
    setElapsedMs(0);
    setDelivery(null);
  }, [stop]);

  const toggle = useCallback(() => {
    if (runningRef.current) stop('manual');
    else start();
  }, [start, stop]);

  /** Ticker durasi berjalan (250ms) selama engine aktif. */
  useEffect(() => {
    if (!running) return undefined;
    setElapsedMs(elapsedNow());
    tickerRef.current = window.setInterval(() => setElapsedMs(elapsedNow()), 250);
    return () => {
      if (tickerRef.current) {
        window.clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
    };
  }, [running, elapsedNow]);

  /** Auto-pause saat tab disembunyikan (timer di-throttle browser). */
  const pauseWhenHidden = Boolean(settings.pauseWhenHidden);
  useEffect(() => {
    if (!pauseWhenHidden) return undefined;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && runningRef.current) stop('hidden');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pauseWhenHidden, stop]);

  /** Bersihkan semua timer saat unmount. */
  useEffect(
    () => () => {
      runningRef.current = false;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (tickerRef.current) window.clearInterval(tickerRef.current);
    },
    [],
  );

  const tapsPerMinute = elapsedMs > 500 ? Math.round((tapCount / elapsedMs) * 60000) : 0;

  return {
    running,
    start,
    stop,
    toggle,
    reset,
    tapCount,
    elapsedMs,
    tapsPerMinute,
    delivery,
    lastStopReason,
  };
}
