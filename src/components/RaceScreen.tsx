import { useEffect, useRef, useState } from "react";
import { RaceGame } from "../game/GameEngine";
import { getAudio } from "../game/audio";
import type { CarSpec, HudState, Quality, RaceConfig, RaceResult, Settings, TrackDef } from "../game/types";
import { formatTime } from "../game/data";
import { cn } from "../utils/cn";
import { Hud } from "./Hud";
import {
  BoltIcon,
  CloseIcon,
  FlagIcon,
  HomeIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  RestartIcon,
  SettingsIcon,
  TrophyIcon,
  VolumeIcon,
} from "./Icons";

interface RaceScreenProps {
  config: RaceConfig;
  car: CarSpec;
  track: TrackDef;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onFinish: (result: RaceResult) => void;
  onExit: () => void;
}

const QualityButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "border px-2.5 py-1.5 font-display text-[0.6rem] uppercase tracking-[0.14em] transition",
      active ? "border-[var(--cyan)] bg-[var(--cyan)]/15 text-white" : "border-white/15 text-white/45 hover:text-white"
    )}
  >
    {label}
  </button>
);

export const RaceScreen = ({ config, car, track, settings, onSettingsChange, onFinish, onExit }: RaceScreenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RaceGame | null>(null);
  const pausedRef = useRef(false);
  const [hud, setHud] = useState<HudState | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const game = new RaceGame(containerRef.current, config, {
      onHud: (next) => setHud(next),
      onFinish: (result) => {
        pausedRef.current = false;
        onFinish(result);
      },
      onPauseRequest: () => {
        const activeGame = engineRef.current;
        if (!activeGame) return;
        if (pausedRef.current) {
          activeGame.resume();
          pausedRef.current = false;
          setPaused(false);
          setShowOptions(false);
        } else {
          activeGame.pause();
          pausedRef.current = true;
          setPaused(true);
        }
      },
      onReady: () => setReady(true),
    });
    engineRef.current = game;
    setHud(game.getSnapshot());
    return () => {
      engineRef.current = null;
      game.dispose();
    };
    // The race session is created once per race configuration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    const audio = getAudio();
    audio.setSettings({ master: settings.master, music: settings.music, sfx: settings.sfx });
  }, [settings.master, settings.music, settings.sfx]);

  useEffect(() => {
    if (!showOptions) return;
    getAudio().uiClick();
  }, [showOptions]);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden || pausedRef.current || !engineRef.current) return;
      engineRef.current.pause();
      pausedRef.current = true;
      setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const pauseGame = () => {
    if (!engineRef.current || pausedRef.current) return;
    engineRef.current.pause();
    pausedRef.current = true;
    setPaused(true);
    getAudio().uiClick();
  };

  const resumeGame = () => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    pausedRef.current = false;
    setPaused(false);
    setShowOptions(false);
    getAudio().uiConfirm();
  };

  const restartRace = () => {
    engineRef.current?.restart();
    pausedRef.current = false;
    setPaused(false);
    setShowOptions(false);
    getAudio().setEngineMuted(false);
    getAudio().uiConfirm();
  };

  const exitRace = () => {
    getAudio().uiBack();
    if (engineRef.current) engineRef.current.pause();
    onExit();
  };

  const changeQuality = (quality: Quality) => {
    onSettingsChange({ quality });
    engineRef.current?.setQuality(quality);
  };

  const updateSetting = (patch: Partial<Settings>) => {
    onSettingsChange(patch);
    if (patch.quality) engineRef.current?.setQuality(patch.quality);
  };

  return (
    <div className="race-shell">
      <div ref={containerRef} className="race-canvas" />
      {hud ? (
        <Hud
          hud={hud}
          car={car}
          track={track}
          paused={paused}
          onPause={pauseGame}
          onCycleCamera={() => engineRef.current?.cycleCamera()}
          onTouch={(code, down) => engineRef.current?.setVirtualInput(code, down)}
        />
      ) : null}

      {(!ready || !hud) && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#04030b]">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-ping bg-[var(--cyan)]" />
            <span className="display text-lg uppercase tracking-[0.2em] text-white">Synchronising grid</span>
          </div>
          <div className="h-[2px] w-56 overflow-hidden bg-white/10">
            <div className="h-full w-1/2 animate-[marquee_1.2s_linear_infinite] bg-[var(--cyan)]" />
          </div>
          <p className="mono text-[0.6rem] tracking-[0.24em] text-[var(--muted)]">{track.name} · {car.name}</p>
        </div>
      )}

      {paused && (
        <div className="pause-scrim">
          <div className="panel panel-glow chamfer w-full max-w-[520px] overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center border border-white/15 text-[var(--cyan)]">
                  <PauseIcon size={15} />
                </span>
                <div>
                  <p className="display text-lg uppercase leading-none text-white">Race paused</p>
                  <p className="mt-1 font-mono text-[0.56rem] uppercase tracking-[0.2em] text-[var(--muted)]">
                    {track.name} · {formatTime(hud?.time ?? 0)}
                  </p>
                </div>
              </div>
              <button className="text-white/40 transition hover:text-white" onClick={resumeGame} aria-label="Close pause menu">
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <button className="btn btn-primary sm:col-span-2" onClick={resumeGame}>
                  <PlayIcon size={14} /> Resume race
                </button>
                <button className="btn btn-outline" onClick={restartRace}>
                  <RestartIcon size={14} /> Restart
                </button>
                <button className={cn("btn", showOptions ? "btn-primary" : "btn-outline")} onClick={() => setShowOptions((prev) => !prev)}>
                  <SettingsIcon size={14} /> Options
                </button>
              </div>

              {showOptions && (
                <div className="mt-4 animate-fade-up border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="hud-label">Graphics quality</span>
                    <span className="mono text-[0.58rem] text-[var(--muted)]">applied live</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {(["low", "medium", "high"] as Quality[]).map((quality) => (
                      <QualityButton key={quality} label={quality} active={settings.quality === quality} onClick={() => changeQuality(quality)} />
                    ))}
                  </div>
                  {[
                    { key: "master" as const, label: "Master", icon: <VolumeIcon size={13} /> },
                    { key: "music" as const, label: "Music", icon: <BoltIcon size={13} /> },
                    { key: "sfx" as const, label: "Engine / SFX", icon: <FlagIcon size={13} /> },
                  ].map((row) => (
                    <div key={row.key} className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 hud-label !text-[0.5rem] text-white/80">
                          {row.icon}
                          {row.label}
                        </span>
                        <span className="mono text-[0.62rem] text-white/60">{Math.round(settings[row.key] * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={settings[row.key]}
                        onChange={(event) => updateSetting({ [row.key]: Number(event.target.value) } as Partial<Settings>)}
                        className={cn("range", row.key === "music" && "magenta")}
                        style={{ "--value": `${settings[row.key] * 100}%` } as React.CSSProperties}
                        aria-label={row.label}
                      />
                    </div>
                  ))}
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="hud-label !text-[0.5rem]">Camera shake</span>
                    <button
                      onClick={() => updateSetting({ cameraShake: !settings.cameraShake })}
                      className={cn("border px-2.5 py-1 font-display text-[0.58rem] uppercase tracking-wider", settings.cameraShake ? "border-[var(--cyan)]/50 bg-[var(--cyan)]/10 text-white" : "border-white/15 text-white/40")}
                    >
                      {settings.cameraShake ? "On" : "Off"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border border-white/10 bg-black/25 px-3 py-2.5">
                <InfoIcon size={14} className="text-[var(--cyan)]" />
                <p className="text-[0.62rem] leading-relaxed text-[var(--muted)]">
                  <span className="text-white/80">Esc</span> resume · <span className="text-white/80">R</span> recover to track ·{" "}
                  <span className="text-white/80">C</span> camera
                </p>
              </div>

              <button className="btn btn-ghost mt-3 w-full !justify-between !text-[var(--muted)] hover:!text-white" onClick={exitRace}>
                <span className="flex items-center gap-2">
                  <HomeIcon size={14} /> Abandon session
                </span>
                <CloseIcon size={13} />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-black/25 px-5 py-2.5">
              <span className="flex items-center gap-2 hud-label !text-[0.45rem]">
                <TrophyIcon size={11} className="text-[var(--lime)]" />
                {track.laps} laps · {track.difficulty}
              </span>
              <span className="mono text-[0.55rem] tracking-[0.15em] text-white/30">GRID LOCKED · {car.name}</span>
            </div>
          </div>
        </div>
      )}

      {ready && !hud && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
          <div className="border border-white/10 bg-black/40 px-5 py-3 text-center backdrop-blur">
            <p className="hud-label">Telemetry offline</p>
            <p className="mt-1 font-mono text-[0.62rem] text-white/50">Your browser could not initialise WebGL.</p>
          </div>
        </div>
      )}
    </div>
  );
};
