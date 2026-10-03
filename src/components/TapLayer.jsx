import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { clamp, round1 } from '../lib/random.js';

const MAX_RIPPLES = 14;

/**
 * TapLayer — lapisan overlay di atas area player:
 *  - RIPPLE tap feedback (dipicu engine via ref.addRipple)
 *  - TARGET POINTER: lingkaran target melayang yang bisa digeser
 *    (pointer events + dukungan tombol panah untuk aksesibilitas)
 *
 * Layer ini sengaja `pointer-events-none` kecuali handle target, supaya
 * `document.elementFromPoint()` tetap menemukan elemen asli di bawahnya.
 */
export const TapLayer = forwardRef(function TapLayer(
  { stageRef, target, onTargetChange, running, className = '' },
  ref,
) {
  const [ripples, setRipples] = useState([]);
  const [dragging, setDragging] = useState(false);
  const rippleIdRef = useRef(0);
  const timersRef = useRef(new Map());

  const addRipple = useCallback((x, y, meta = {}) => {
    const id = (rippleIdRef.current += 1);
    setRipples((current) => [
      ...current.slice(-(MAX_RIPPLES - 1)),
      { id, x, y, blocked: Boolean(meta.crossOrigin) },
    ]);
    const timer = window.setTimeout(() => {
      setRipples((current) => current.filter((r) => r.id !== id));
      timersRef.current.delete(id);
    }, 700);
    timersRef.current.set(id, timer);
  }, []);

  useImperativeHandle(ref, () => ({ addRipple }), [addRipple]);

  const moveTargetFromPointer = useCallback(
    (clientX, clientY) => {
      const stage = stageRef?.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const xPct = clamp(((clientX - rect.left) / rect.width) * 100, 1.5, 98.5);
      const yPct = clamp(((clientY - rect.top) / rect.height) * 100, 1.5, 98.5);
      onTargetChange({ xPct: round1(xPct), yPct: round1(yPct) });
    },
    [onTargetChange, stageRef],
  );

  const handlePointerDown = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDragging(true);

      const onMove = (moveEvent) => moveTargetFromPointer(moveEvent.clientX, moveEvent.clientY);
      const onEnd = () => {
        setDragging(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
      moveTargetFromPointer(event.clientX, event.clientY);
    },
    [moveTargetFromPointer],
  );

  const handleKeyDown = useCallback(
    (event) => {
      const step = event.shiftKey ? 5 : 1;
      let { xPct, yPct } = target;
      if (event.key === 'ArrowLeft') xPct -= step;
      else if (event.key === 'ArrowRight') xPct += step;
      else if (event.key === 'ArrowUp') yPct -= step;
      else if (event.key === 'ArrowDown') yPct += step;
      else return;
      event.preventDefault();
      onTargetChange({
        xPct: round1(clamp(xPct, 1.5, 98.5)),
        yPct: round1(clamp(yPct, 1.5, 98.5)),
      });
    },
    [onTargetChange, target],
  );

  return (
    <div className={`pointer-events-none absolute inset-0 z-20 ${className}`} aria-hidden="false">
      {/* jejak ketukan */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={`tap-ripple pointer-events-none absolute h-11 w-11 rounded-full border-2 ${
            ripple.blocked
              ? 'border-amber-400 bg-amber-400/20'
              : 'border-tik-cyan bg-tik-cyan/20'
          }`}
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}

      {/* garis bidik halus */}
      <div
        className="absolute left-0 right-0 border-t border-dashed border-white/10"
        style={{ top: `${target.yPct}%` }}
      />
      <div
        className="absolute bottom-0 top-0 border-l border-dashed border-white/10"
        style={{ left: `${target.xPct}%` }}
      />

      {/* target pointer yang bisa digeser */}
      <div
        role="slider"
        aria-label="Target pointer — geser untuk menentukan koordinat tap"
        aria-valuenow={Math.round(target.xPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        data-tap-handle=""
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        className="group pointer-events-auto absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full outline-none active:cursor-grabbing"
        style={{ left: `${target.xPct}%`, top: `${target.yPct}%` }}
      >
        {running && (
          <span className="target-pulse absolute left-1/2 top-1/2 h-14 w-14 rounded-full border-2 border-tik-pink" />
        )}
        <span className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-tik-cyan shadow-md shadow-tik-cyan/20" />
        <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-tik-pink bg-ink-950/40" />
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        <span
          className={`absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
            dragging
              ? 'border-tik-cyan/60 bg-ink-900 text-tik-cyan'
              : 'border-ink-600 bg-ink-900/90 text-ink-300'
          }`}
        >
          {target.xPct.toFixed(1)}% · {target.yPct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
});
