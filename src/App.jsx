import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppHeader } from './components/AppHeader.jsx';
import { InstallBanner } from './components/InstallBanner.jsx';
import { PlayerStage } from './components/PlayerStage.jsx';
import { PacerPanel } from './components/PacerPanel.jsx';
import { ScriptPanel } from './components/ScriptPanel.jsx';
import { MiniPacerBar } from './components/MiniPacerBar.jsx';
import { ControlPanel } from './components/ControlPanel.jsx';
import { StatsPanel } from './components/StatsPanel.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { resolveTikTokEmbed } from './lib/tiktok.js';
import { useAutoTap } from './hooks/useAutoTap.js';
import { usePacer } from './hooks/usePacer.js';
import { useInstallPrompt } from './hooks/useInstallPrompt.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useWakeLock } from './hooks/useWakeLock.js';
import {
  APP_NAME,
  DEFAULT_PACER,
  DEFAULT_SETTINGS,
  DEFAULT_STAGE,
  DEFAULT_TARGET,
  STORAGE_KEYS,
} from './config/defaults.js';

export default function App() {
  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS, {
    merge: true,
  });
  const [target, setTarget] = useLocalStorage(STORAGE_KEYS.target, DEFAULT_TARGET, {
    merge: true,
  });
  const [stage, setStage] = useLocalStorage(STORAGE_KEYS.stage, DEFAULT_STAGE, { merge: true });
  const [installDismissed, setInstallDismissed] = useLocalStorage(
    STORAGE_KEYS.installDismissed,
    false,
  );
  const [pacerPrefs, setPacerPrefs] = useLocalStorage(STORAGE_KEYS.pacer, DEFAULT_PACER, {
    merge: true,
  });

  const stageRef = useRef(null);
  const tapLayerRef = useRef(null);

  const resolved = useMemo(() => resolveTikTokEmbed(stage.input), [stage.input]);

  const handleTapFeedback = useCallback((tap) => {
    tapLayerRef.current?.addRipple(tap.x, tap.y, { crossOrigin: tap.crossOrigin });
  }, []);

  const engine = useAutoTap({ settings, target, stageRef, onTap: handleTapFeedback });
  const wakeLockSupported = useWakeLock(engine.running);
  const install = useInstallPrompt();
  const pacer = usePacer({
    settings,
    soundOn: pacerPrefs.soundOn,
    vibrationOn: pacerPrefs.vibrationOn,
  });

  // Link "siap pakai" dari tombol 🔗 di panel player: /?u=<link tiktok>
  // akan langsung memuat target saat aplikasi dibuka (mis. dari HP lain).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('u') || params.get('url');
    if (!shared) return;
    setStage((current) => ({ ...current, input: shared, mode: 'embed' }));
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      /* abaikan — fitur tetap berfungsi walau query tidak dibersihkan */
    }
    // dijalankan sekali saat mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (install.canPrompt) {
      await install.promptInstall();
      return;
    }
    // iOS / tanpa prompt API: tampilkan kembali banner panduan lalu scroll ke sana.
    setInstallDismissed(false);
    window.requestAnimationFrame(() => {
      document
        .getElementById('install-banner')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [install, setInstallDismissed]);

  return (
    <div className="min-h-dvh">
      {/* Header + bilah mini pacer dalam satu blok sticky supaya bilah irama
          tetap terlihat saat aplikasi dikecilkan untuk split-screen di HP. */}
      <div className="sticky top-0 z-40">
        <AppHeader install={install} onInstallClick={handleInstallClick} />
        <MiniPacerBar pacer={pacer} />
      </div>

      <main className="pb-safe mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4">
        <nav aria-label="Navigasi cepat" className="flex flex-wrap gap-1.5">
          {[
            ['#player', '▶ Player'],
            ['#pacer', '🥁 Pacer HP'],
            ['#script', '💻 Script Laptop'],
            ['#kontrol', '🎛 Kontrol'],
            ['#dashboard', '📊 Dashboard'],
            ['#setelan', '⚙ Setelan'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-ink-600 px-2.5 py-1 text-[11px] font-medium text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100"
            >
              {label}
            </a>
          ))}
        </nav>

        <InstallBanner
          install={install}
          dismissed={installDismissed}
          onDismiss={() => setInstallDismissed(true)}
        />

        <div id="player" className="scroll-mt-32">
          <PlayerStage
            mode={stage.mode}
            onModeChange={(mode) => setStage((current) => ({ ...current, mode }))}
            input={stage.input}
            onInputChange={(input) => setStage((current) => ({ ...current, input }))}
            resolved={resolved}
            stageRef={stageRef}
            target={target}
            onTargetChange={setTarget}
            tapLayerRef={tapLayerRef}
            running={engine.running}
          />
        </div>

        <div id="pacer" className="scroll-mt-32">
          <PacerPanel
            pacer={pacer}
            settings={settings}
            prefs={pacerPrefs}
            onPrefsChange={setPacerPrefs}
          />
        </div>

        <div id="script" className="scroll-mt-32">
          <ScriptPanel settings={settings} resolved={resolved} />
        </div>

        <div id="kontrol" className="scroll-mt-32">
          <ControlPanel
            running={engine.running}
            onToggle={engine.toggle}
            onReset={engine.reset}
            tapCount={engine.tapCount}
            lastStopReason={engine.lastStopReason}
            wakeLockSupported={wakeLockSupported}
            settings={settings}
          />
        </div>

        <div id="dashboard" className="scroll-mt-32">
          <StatsPanel
            tapCount={engine.tapCount}
            elapsedMs={engine.elapsedMs}
            tapsPerMinute={engine.tapsPerMinute}
            delivery={engine.delivery}
            running={engine.running}
          />
        </div>

        <div id="setelan" className="scroll-mt-32">
          <SettingsPanel settings={settings} onChange={setSettings} />
        </div>

        <footer className="mt-2 space-y-2 rounded-2xl border border-ink-800 bg-ink-900/60 p-4 text-[11px] leading-relaxed text-ink-500">
          <p>
            <b className="text-ink-400">{APP_NAME}</b> adalah alat bantu personal untuk menguji
            interaksi tap — tidak berafiliasi dengan TikTok. Gunakan secara bertanggung jawab:
            hanya pada konten/akun milikmu sendiri dan tetap patuhi Ketentuan Layanan platform.
          </p>
          <p>
            Engine memakai DOM Event asli (PointerEvent → TouchEvent → MouseEvent → click) dengan
            delay acak, jitter koordinat, dan micro-pause. Event sintetis tidak dapat menembus
            iframe cross-origin karena batasan keamanan browser — untuk tap yang benar-benar
            sampai ke TikTok, gunakan <b>💻 Script Auto-Tap</b> (laptop) atau{' '}
            <b>🥁 Pacer Irama</b> (HP).
          </p>
        </footer>
      </main>
    </div>
  );
}
