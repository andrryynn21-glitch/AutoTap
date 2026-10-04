import { formatNumber } from '../lib/format.js';

/**
 * MiniPacerBar — bilah tipis yang menempel di bawah header selama pacer
 * irama aktif. Dirancang untuk pemakaian split-screen di HP: aplikasi
 * dikecilkan di bagian atas layar dan bilah ini tetap terlihat sebagai
 * pemandu + tombol henti cepat.
 */
export function MiniPacerBar({ pacer }) {
  if (!pacer.running) return null;

  return (
    <div className="border-b border-tik-cyan/30 bg-ink-900/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2.5 px-4 py-2">
        <span
          key={pacer.beatCount}
          className="pacer-beat-dot h-2.5 w-2.5 shrink-0 rounded-full bg-tik-cyan"
          aria-hidden="true"
        />
        <span className="text-[11px] font-semibold text-tik-cyan">Irama aktif</span>
        <span className="text-[11px] tabular-nums text-ink-300">
          ketukan {formatNumber(pacer.beatCount)}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={pacer.stop}
            className="rounded-full border border-tik-pink/50 bg-tik-pink/10 px-3 py-1 text-[11px] font-bold text-tik-pink transition-colors hover:bg-tik-pink/20"
          >
            ■ Hentikan
          </button>
        </span>
      </div>
    </div>
  );
}
