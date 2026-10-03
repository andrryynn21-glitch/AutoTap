import { formatDuration, formatNumber } from '../lib/format.js';
import { Chip, SectionCard, StatCard } from './ui.jsx';

/**
 * Dashboard real-time: tap counter, timer durasi, taps/menit, dan status
 * pengiriman event tap terakhir (delivered / diblokir iframe cross-origin).
 */
export function StatsPanel({ tapCount, elapsedMs, tapsPerMinute, delivery, running }) {
  const delivered = delivery?.delivered ?? true;

  return (
    <SectionCard
      title="Dashboard Real-time"
      subtitle="Statistik sesi auto-tap yang sedang berjalan"
      actions={
        <Chip tone={running ? 'pink' : 'neutral'}>
          <span
            className={`h-1.5 w-1.5 rounded-full ${running ? 'live-blink bg-tik-pink' : 'bg-ink-500'}`}
            aria-hidden="true"
          />
          {running ? 'REC' : 'Idle'}
        </Chip>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard
          label="Total Tap"
          value={formatNumber(tapCount)}
          accent="cyan"
          pulse={running}
        />
        <StatCard label="Durasi" value={formatDuration(elapsedMs)} accent="white" />
        <StatCard label="Tap / Menit" value={formatNumber(tapsPerMinute)} accent="pink" />
        <StatCard
          label="Terakhir Dikirim Ke"
          value={delivery ? delivery.targetLabel : '—'}
          accent={delivery ? (delivered ? 'green' : 'amber') : 'white'}
          sub={
            delivery
              ? `(${Math.round(delivery.x)}, ${Math.round(delivery.y)}) px · ${delivery.events.length} event`
              : 'Belum ada ketukan'
          }
        />
      </div>

      {delivery && !delivered && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-300">
          Ketukan mengenai <b>iframe cross-origin</b> (embed TikTok). Browser dengan sengaja
          memblokir event sintetis agar tidak bisa menembus halaman pihak ketiga — tap tetap
          dihitung dan divisualisasikan di overlay. Untuk uji end-to-end engine, gunakan{' '}
          <b>Demo Mode</b>.
        </p>
      )}

      {delivery && delivered && (
        <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] leading-relaxed text-emerald-300">
          Event ketukan ({delivery.events.join(' → ')}) berhasil terkirim ke elemen{' '}
          <b>{delivery.targetLabel}</b>.
        </p>
      )}
    </SectionCard>
  );
}
