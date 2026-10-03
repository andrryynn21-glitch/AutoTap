import { DEFAULT_SETTINGS, SETTING_LIMITS } from '../config/defaults.js';
import { RangeField, SectionCard, Segmented, Toggle } from './ui.jsx';

const TAP_MODE_OPTIONS = [
  { value: 'both', label: 'Semua' },
  { value: 'pointer', label: 'Pointer' },
  { value: 'touch', label: 'Touch' },
  { value: 'mouse', label: 'Mouse' },
];

/**
 * SettingsPanel — pengaturan kecepatan & anti-deteksi.
 * Semua perubahan langsung diterapkan ke engine (tanpa tombol simpan).
 */
export function SettingsPanel({ settings, onChange }) {
  const update = (patch) => onChange({ ...settings, ...patch });

  const setMinDelay = (value) =>
    update({ minDelayMs: value, maxDelayMs: Math.max(value, settings.maxDelayMs) });
  const setMaxDelay = (value) =>
    update({ maxDelayMs: value, minDelayMs: Math.min(value, settings.minDelayMs) });
  const setPauseMin = (value) =>
    update({
      microPauseMinMs: value,
      microPauseMaxMs: Math.max(value, settings.microPauseMaxMs),
    });
  const setPauseMax = (value) =>
    update({
      microPauseMaxMs: value,
      microPauseMinMs: Math.min(value, settings.microPauseMinMs),
    });

  return (
    <SectionCard
      title="Kecepatan & Anti-Deteksi"
      subtitle="Atur ritme ketukan agar tidak terasa seperti mesin"
      actions={
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_SETTINGS })}
          className="rounded-full border border-ink-600 px-3 py-1.5 text-[11px] font-medium text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100"
        >
          Default
        </button>
      }
    >
      <div className="space-y-4">
        <RangeField
          label="Interval minimum"
          value={settings.minDelayMs}
          onChange={setMinDelay}
          min={SETTING_LIMITS.delayMin}
          max={SETTING_LIMITS.delayMax}
          step={10}
          suffix="ms"
          hint="Jarak waktu tercepat antar ketukan."
        />
        <RangeField
          label="Interval maksimum"
          value={settings.maxDelayMs}
          onChange={setMaxDelay}
          min={SETTING_LIMITS.delayMin}
          max={SETTING_LIMITS.delayMax}
          step={10}
          suffix="ms"
          hint="Delay berikutnya diacak di antara min–max setiap ketukan."
        />
        <RangeField
          label="Random jitter titik tap"
          value={settings.jitterPx}
          onChange={(value) => update({ jitterPx: value })}
          min={0}
          max={SETTING_LIMITS.jitterMax}
          suffix="px"
          hint="Titik tap digeser acak di dalam radius ini (±10–20px disarankan) agar koordinat tidak selalu identik."
        />

        <div>
          <p className="mb-1.5 text-sm text-ink-200">Jenis event yang dikirim</p>
          <Segmented
            label="Jenis event tap"
            value={settings.tapMode}
            onChange={(value) => update({ tapMode: value })}
            options={TAP_MODE_OPTIONS}
          />
          <p className="mt-1 text-[11px] leading-snug text-ink-500">
            “Semua” mengirim PointerEvent → TouchEvent → MouseEvent → click berurutan, paling
            kompatibel dengan beragam handler.
          </p>
        </div>

        <div className="space-y-1 border-t border-ink-700 pt-3">
          <Toggle
            checked={settings.humanize}
            onChange={(value) => update({ humanize: value })}
            label="Humanize delay"
            description="Tiap delay dikali acak 0.88x–1.18x plus jeda “ragu” sesekali."
          />
          <Toggle
            checked={settings.microPauseEnabled}
            onChange={(value) => update({ microPauseEnabled: value })}
            label="Micro-pause berkala"
            description="Berhenti sesaat setiap N ketukan, seperti manusia yang mengangkat jari."
          />
        </div>

        {settings.microPauseEnabled && (
          <div className="space-y-4 rounded-xl border border-ink-700 bg-ink-950/50 p-3">
            <RangeField
              label="Micro-pause setiap"
              value={settings.microPauseEvery}
              onChange={(value) => update({ microPauseEvery: value })}
              min={SETTING_LIMITS.pauseEveryMin}
              max={SETTING_LIMITS.pauseEveryMax}
              step={1}
              suffix="tap"
            />
            <RangeField
              label="Durasi pause minimum"
              value={settings.microPauseMinMs}
              onChange={setPauseMin}
              min={SETTING_LIMITS.pauseMsMin}
              max={SETTING_LIMITS.pauseMsMax}
              step={50}
              suffix="ms"
            />
            <RangeField
              label="Durasi pause maksimum"
              value={settings.microPauseMaxMs}
              onChange={setPauseMax}
              min={SETTING_LIMITS.pauseMsMin}
              max={SETTING_LIMITS.pauseMsMax}
              step={50}
              suffix="ms"
            />
          </div>
        )}

        <div className="border-t border-ink-700 pt-3">
          <Toggle
            checked={settings.pauseWhenHidden}
            onChange={(value) => update({ pauseWhenHidden: value })}
            label="Auto-pause saat tab disembunyikan"
            description="Mencegah browser men-throttle timer di background sehingga ritme tetap natural."
          />
        </div>
      </div>
    </SectionCard>
  );
}
