import { useEffect, useState } from 'react';
import { Chip, SectionCard, Segmented } from './ui.jsx';
import { DemoSurface } from './DemoSurface.jsx';
import { TapLayer } from './TapLayer.jsx';

/**
 * PlayerStage — wadah "web view" TikTok + overlay target pointer.
 *
 * Mode:
 *  - "embed": iframe TikTok (player resmi untuk video, best-effort untuk LIVE)
 *  - "demo" : DemoSurface internal untuk menguji engine end-to-end
 *
 * TapLayer selalu berada di atas konten, jadi target pointer & ripple tetap
 * tampil di kedua mode.
 */
export function PlayerStage({
  mode,
  onModeChange,
  input,
  onInputChange,
  resolved,
  stageRef,
  target,
  onTargetChange,
  tapLayerRef,
  running,
}) {
  const [draft, setDraft] = useState(input);

  useEffect(() => {
    setDraft(input);
  }, [input]);

  const submit = (event) => {
    event.preventDefault();
    onInputChange(draft.trim());
    onModeChange('embed');
  };

  const showFrame = mode === 'embed' && resolved.ok && resolved.embedUrl;

  return (
    <SectionCard
      title="TikTok Web Player"
      subtitle="Tempel link/live atau @username, lalu geser target untuk menentukan titik tap"
      actions={
        <Segmented
          label="Mode player"
          value={mode === 'embed' ? 'embed' : 'demo'}
          onChange={(next) => onModeChange(next)}
          options={[
            { value: 'embed', label: 'TikTok' },
            { value: 'demo', label: 'Demo' },
          ]}
        />
      }
    >
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="https://www.tiktok.com/@user/live  atau  @username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-ink-600 bg-ink-950/70 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-tik-cyan/60 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-tik-cyan/40 bg-tik-cyan/10 px-3.5 py-2 text-xs font-bold text-tik-cyan transition-colors hover:bg-tik-cyan/20"
        >
          Muat
        </button>
        {resolved.sourceUrl && (
          <a
            href={resolved.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="hidden shrink-0 items-center rounded-lg border border-ink-600 px-3.5 py-2 text-xs font-medium text-ink-300 transition-colors hover:border-ink-500 sm:flex"
          >
            Buka ↗
          </a>
        )}
      </form>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {mode === 'embed' && resolved.ok && <Chip tone="green">Terhubung · {resolved.label}</Chip>}
        {mode === 'embed' && !resolved.ok && <Chip tone="amber">Menunggu link valid</Chip>}
        {mode === 'demo' && <Chip tone="cyan">Demo Mode — engine siap diuji</Chip>}
        {resolved.sourceUrl && (
          <a
            href={resolved.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[11px] font-medium text-tik-cyan underline-offset-2 hover:underline sm:hidden"
          >
            Buka di TikTok ↗
          </a>
        )}
      </div>

      {/* stage: konten + overlay target */}
      <div className="mt-3 flex justify-center">
        <div
          ref={stageRef}
          className="relative h-[62dvh] max-h-[620px] min-h-[380px] w-auto max-w-full select-none overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 shadow-2xl shadow-black/60"
          style={{ aspectRatio: '9 / 16' }}
        >
          {showFrame ? (
            <iframe
              title="TikTok Player"
              src={resolved.embedUrl}
              className="absolute inset-0 h-full w-full border-0 bg-black"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
            />
          ) : mode === 'embed' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-ink-900 to-ink-950 px-6 text-center">
              <span className="text-3xl">🔗</span>
              <p className="text-sm font-semibold text-ink-100">Belum ada embed aktif</p>
              <p className="max-w-[260px] text-[11px] leading-relaxed text-ink-400">
                Tempel link video TikTok, link LIVE (@user/live), atau username @akun pada
                kolom di atas, lalu tekan <b>Muat</b>. Ingin langsung mencoba engine? Pindah
                ke <b>Demo</b>.
              </p>
              <button
                type="button"
                onClick={() => onModeChange('demo')}
                className="rounded-full bg-gradient-to-r from-tik-cyan to-tik-pink px-4 py-2 text-xs font-bold text-ink-950 transition-transform active:scale-95"
              >
                Coba Demo Mode
              </button>
            </div>
          ) : (
            <DemoSurface />
          )}

          <TapLayer
            ref={tapLayerRef}
            stageRef={stageRef}
            target={target}
            onTargetChange={onTargetChange}
            running={running}
          />
        </div>
      </div>

      {mode === 'embed' && resolved.notes.length > 0 && (
        <ul className="mt-3 space-y-1.5 rounded-xl border border-ink-700 bg-ink-950/60 px-3 py-2.5">
          {resolved.notes.map((note) => (
            <li key={note} className="flex gap-2 text-[11px] leading-relaxed text-ink-400">
              <span aria-hidden="true" className="text-tik-cyan">
                •
              </span>
              {note}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
        💡 Geser lingkaran cyan-pink untuk memindahkan titik tap. Di mode TikTok, tap tetap
        dihitung & tampil di overlay meskipun browser memblokir event masuk ke iframe
        cross-origin — gunakan Demo Mode untuk verifikasi penuh.
      </p>

    </SectionCard>
  );
}
