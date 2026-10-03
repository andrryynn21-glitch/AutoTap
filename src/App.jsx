import { useCallback, useMemo, useRef } from 'react';
import { AppHeader } from './components/AppHeader.jsx';
import { InstallBanner } from './components/InstallBanner.jsx';
import { PlayerStage } from './components/PlayerStage.jsx';
import { ControlPanel } from './components/ControlPanel.jsx';
import { StatsPanel } from './components/StatsPanel.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { resolveTikTokEmbed } from './lib/tiktok.js';
import { useAutoTap } from './hooks/useAutoTap.js';
import { useInstallPrompt } from './hooks/useInstallPrompt.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useWakeLock } from './hooks/useWakeLock.js';
import {
  APP_NAME,
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

  const stageRef = useRef(null);
  const tapLayerRef = useRef(null);

  const resolved = useMemo(() => resolveTikTokEmbed(stage.input), [stage.input]);

  const handleTapFeedback = useCallback((tap) => {
    tapLayerRef.current?.addRipple(tap.x, tap.y, { crossOrigin: tap.crossOrigin });
  }, []);

  const engine = useAutoTap({ settings, target, stageRef, onTap: handleTapFeedback });
  const wakeLockSupported = useWakeLock(engine.running);
  const install = useInstallPrompt();

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
      <AppHeader install={install} onInstallClick={handleInstallClick} />

      <main className="pb-safe mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4">
        <InstallBanner
          install={install}
          dismissed={installDismissed}
          onDismiss={() => setInstallDismissed(true)}
        />

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

        <ControlPanel
          running={engine.running}
          onToggle={engine.toggle}
          onReset={engine.reset}
          tapCount={engine.tapCount}
          lastStopReason={engine.lastStopReason}
          wakeLockSupported={wakeLockSupported}
          settings={settings}
        />

        <StatsPanel
          tapCount={engine.tapCount}
          elapsedMs={engine.elapsedMs}
          tapsPerMinute={engine.tapsPerMinute}
          delivery={engine.delivery}
          running={engine.running}
        />

        <SettingsPanel settings={settings} onChange={setSettings} />

        <footer className="mt-2 space-y-2 rounded-2xl border border-ink-800 bg-ink-900/60 p-4 text-[11px] leading-relaxed text-ink-500">
          <p>
            <b className="text-ink-400">{APP_NAME}</b> adalah alat bantu personal untuk menguji
            interaksi tap — tidak berafiliasi dengan TikTok. Gunakan secara bertanggung jawab:
            hanya pada konten/akun milikmu sendiri dan tetap patuhi Ketentuan Layanan platform.
          </p>
          <p>
            Engine memakai DOM Event asli (PointerEvent → TouchEvent → MouseEvent → click) dengan
            delay acak, jitter koordinat, dan micro-pause. Event sintetis tidak dapat menembus
            iframe cross-origin karena batasan keamanan browser.
          </p>
        </footer>
      </main>
    </div>
  );
}
