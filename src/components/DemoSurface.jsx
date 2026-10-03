import { useMemo, useState } from 'react';
import { formatNumber } from '../lib/format.js';

/**
 * DemoSurface — area uji end-to-end engine.
 * Tombol "like" di sini adalah elemen DOM asli: setiap tap sintetis dari
 * engine akan memicu onClick React seperti ketukan manusia. Jika counter
 * naik saat auto-tap menyala, berarti simulasi MouseEvent/TouchEvent
 * benar-benar bekerja.
 */
export function DemoSurface() {
  const [likes, setLikes] = useState(128400);

  const hearts = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => ({
        id: index,
        left: 6 + Math.random() * 74,
        delay: Math.random() * 5,
        duration: 3.4 + Math.random() * 2.6,
        scale: 0.6 + Math.random() * 0.7,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#1b0b2e] via-[#2a0f3f] to-[#0a0612]">
      {/* header palsu ala live */}
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="live-blink rounded-md bg-tik-pink px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white">
          LIVE
        </span>
        <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-ink-200">
          👁 1,2K menonton
        </span>
      </div>

      {/* area hati melayang */}
      <div className="pointer-events-none relative flex-1 overflow-hidden">
        {hearts.map((heart) => (
          <span
            key={heart.id}
            className="heart-float absolute bottom-6 text-tik-pink/80"
            style={{
              left: `${heart.left}%`,
              animationDelay: `${heart.delay}s`,
              animationDuration: `${heart.duration}s`,
              fontSize: `${26 * heart.scale}px`,
            }}
          >
            ❤️
          </span>
        ))}

        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-5 text-center">
          <p className="text-[11px] font-medium uppercase tracking-widest text-tik-cyan">
            Demo Mode
          </p>
          <h3 className="mt-1 text-sm font-bold text-ink-100">Uji Engine Auto-Tap</h3>
          <p className="mx-auto mt-1.5 max-w-[240px] text-[11px] leading-relaxed text-ink-300">
            Geser lingkaran target ke tombol hati di bawah, nyalakan auto-tap, dan lihat
            counter bertambah — bukti event simulasi sampai ke elemen asli.
          </p>
        </div>
      </div>

      {/* tombol like asli (target uji) */}
      <div className="relative z-10 flex flex-col items-center gap-2 px-4 pb-8">
        <button
          type="button"
          id="demo-like-button"
          className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-tik-pink/70 bg-tik-pink/15 text-4xl shadow-lg shadow-tik-pink/20 transition-transform active:scale-90"
          onClick={() => setLikes((value) => value + 1)}
          aria-label="Tombol like demo"
        >
          ❤️
        </button>
        <p className="text-xs font-semibold tabular-nums text-ink-200" id="demo-like-count">
          {formatNumber(likes)} suka
        </p>
      </div>
    </div>
  );
}
