import { useEffect, useRef, useState } from "react";
import type { CarSpec, HudState, KeyBindings, Quality, RaceConfig, Settings, TrackDef, RaceResult } from "../types";
import { formatTime } from "../types";
import { WEATHER_LABEL, getMode } from "../data";
import { OverdriveGame } from "../engine";
import { getDriveAudio } from "../audio";
import {
  CameraIcon,
  FuelIcon,
  GaugeIcon,
  GearIcon,
  MuteIcon,
  PauseIcon,
  RestartIcon,
  VolumeIcon,
  WeatherIcon,
  WrenchIcon,
  CloseIcon,
  HomeIcon,
} from "../../components/Icons";

interface RaceScreenProps {
  config: RaceConfig;
  car: CarSpec;
  track: TrackDef;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onFinish: (result: RaceResult) => void;
  onExit: () => void;
  muted: boolean;
  onToggleSound: () => void;
}

const TouchButton = ({
  label,
  action,
  onInput,
  className = "",
  accent,
}: {
  label: string;
  action: keyof KeyBindings;
  onInput: (action: keyof KeyBindings, down: boolean) => void;
  className?: string;
  accent?: boolean;
}) => {
  const [pressed, setPressed] = useState(false);
  const set = (down: boolean) => {
    setPressed(down);
    onInput(action, down);
  };
  return (
    <button
      className={`touch-btn ${className}`}
      data-pressed={pressed}
      style={accent ? { borderColor: "var(--accent)", color: "#ffb4a0" } : undefined}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onPointerLeave={() => pressed && set(false)}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={label}
    >
      {label}
    </button>
  );
};

const HUD = ({
  hud,
  car,
  track,
  settings,
  paused,
  onPause,
  onCamera,
  onInput,
  onToggleSound,
}: {
  hud: HudState;
  car: CarSpec;
  track: TrackDef;
  settings: Settings;
  paused: boolean;
  onPause: () => void;
  onCamera: () => void;
  onInput: (action: keyof KeyBindings, down: boolean) => void;
  onToggleSound: () => void;
}) => {
  const speed = settings.units === "mph" ? Math.round(hud.speed / 1.6) : hud.speed;
  const unit = settings.units === "mph" ? "MPH" : "KM/H";
  const minimapPath = hud.minimap.length
    ? hud.minimap
        .filter((_, index) => index % 4 === 0)
        .map((point, index) => `${index === 0 ? "M" : "L"} ${(point.x * 100).toFixed(1)} ${(point.y * 100).toFixed(1)}`)
        .join(" ") + " Z"
    : "";
  const isRace = hud.mode === "race" || hud.mode === "sprint";
  const modeInfo = getMode(hud.mode);
  const speedRatio = Math.min(1, hud.speed / (car.topSpeed || 1));
  return (
    <>
      <div className="speed-vignette" style={{ opacity: 0.25 + speedRatio * 0.5 }} />
      {hud.weather === "rain" && <div className="rain-overlay" />}
      {hud.drifting && <div className="drift-vignette" />}
      <div className="hud">
        <div className="flex items-start justify-between gap-2">
          <div className="animate-fade-in">
            <div className="hud-panel px-3 py-2 sm:px-3.5">
              <div className="flex items-end gap-4">
                <div>
                  <p className="hud-label">{isRace ? "Position" : modeInfo.name}</p>
                  <p className="hud-num text-[2.4rem] text-white sm:text-[2.8rem]">
                    {isRace ? (
                      <>
                        {hud.position}
                        <span className="ml-1 font-[var(--font-body)] text-[0.58rem] font-medium tracking-wider text-[var(--muted)]">
                          / {hud.totalRacers}
                        </span>
                      </>
                    ) : (
                      <span className="text-[1.5rem]">{hud.mode === "drift" ? Math.round(hud.driftScore) : "TT"}</span>
                    )}
                  </p>
                </div>
                <div className="border-l border-white/15 pl-3 pb-0.5">
                  <p className="hud-label">Lap</p>
                  <p className="hud-num text-[1.25rem] text-white">
                    {hud.lap}
                    <span className="font-[var(--font-body)] text-[0.55rem] font-medium text-[var(--muted)]"> /{hud.totalLaps}</span>
                  </p>
                </div>
                <div className="hidden border-l border-white/15 pl-3 pb-0.5 sm:block">
                  <p className="hud-label">Race time</p>
                  <p className="hud-num text-[1.05rem] text-white">{formatTime(hud.time, false)}</p>
                </div>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-2 border-t border-white/10 pt-1.5">
                <div>
                  <p className="hud-label !text-[0.4rem]">Lap time</p>
                  <p className="mono text-[0.68rem] font-semibold text-white/90">{hud.lapTime.toFixed(2)}</p>
                </div>
                <div>
                  <p className="hud-label !text-[0.4rem]">Best lap</p>
                  <p className="mono text-[0.68rem] font-semibold" style={{ color: hud.bestLap ? "var(--gold)" : "rgba(255,255,255,.35)" }}>
                    {hud.bestLap ? hud.bestLap.toFixed(2) : "—.——"}
                  </p>
                </div>
                <div>
                  <p className="hud-label !text-[0.4rem]">Sectors</p>
                  <div className="mt-1 flex gap-1">
                    {[1, 2].map((sector) => (
                      <span
                        key={sector}
                        className="h-1 flex-1"
                        style={{
                          background: hud.sector & sector ? "var(--green)" : "rgba(255,255,255,.16)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="chip !border-white/15 !bg-black/40 !text-[0.54rem]">{track.name}</span>
              <span className="chip !border-white/15 !bg-black/40 !text-[0.54rem]">
                <WeatherIcon size={10} /> {WEATHER_LABEL[hud.weather]}
              </span>
              <span className="chip !border-white/15 !bg-black/40 !text-[0.54rem]">
                <GearIcon size={10} /> {settings.transmission === "manual" ? "Manual" : "Auto"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <button className="hud-exit" onClick={onCamera} aria-label="Change camera" title="Change camera">
                <CameraIcon size={15} />
              </button>
              <button className="hud-exit" onClick={onToggleSound} aria-label="Mute or enable sound">
                <VolumeIcon size={15} />
              </button>
              <button className="hud-exit" onClick={onPause} aria-label="Pause">
                <PauseIcon size={14} />
              </button>
            </div>
            {settings.hudMinimap && (
              <div className="hud-panel hud-minimap p-1.5">
                <div className="relative h-[104px] w-[108px] sm:h-[128px] sm:w-[136px]">
                  <svg viewBox="0 0 100 100" aria-hidden>
                    <path d={minimapPath} fill="none" stroke="rgba(0,0,0,.6)" strokeWidth="5" strokeLinejoin="round" />
                    <path d={minimapPath} fill="none" stroke="rgba(241,239,232,.8)" strokeWidth="1.9" strokeLinejoin="round" />
                    {hud.standings.map((racer) => (
                      <g key={racer.id}>
                        {racer.isPlayer && <circle cx={racer.x * 100} cy={racer.y * 100} r="4.4" fill="none" stroke="#fff" strokeWidth="0.7" opacity="0.8" />}
                        <circle cx={racer.x * 100} cy={racer.y * 100} r={racer.isPlayer ? 2.2 : 1.5} fill={racer.isPlayer ? "#f15a38" : racer.color} />
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            )}
            {settings.hudStandings && isRace && (
              <div className="hud-panel hud-compact-hide hidden w-[190px] px-2.5 py-2 sm:block">
                <div className="mb-1 flex items-center justify-between">
                  <span className="hud-label">Standings</span>
                  <span className="mono text-[0.5rem] text-white/35">{modeInfo.tag}</span>
                </div>
                {hud.standings.map((racer) => (
                  <div
                    key={racer.id}
                    className="flex items-center gap-1.5 border-b border-white/[0.05] py-[2px] last:border-0"
                    style={racer.isPlayer ? { background: "rgba(224,75,42,0.1)" } : undefined}
                  >
                    <span className="mono w-3 text-[0.56rem]" style={{ color: racer.isPlayer ? "var(--accent)" : "rgba(255,255,255,.4)" }}>
                      {racer.position}
                    </span>
                    <span className="h-1.5 w-1.5 shrink-0" style={{ background: racer.color }} />
                    <span className={`flex-1 truncate text-[0.57rem] ${racer.isPlayer ? "text-white" : "text-white/60"}`}>{racer.name}</span>
                    {racer.finished ? <span className="mono text-[0.48rem] text-[var(--green)]">FIN</span> : <span className="mono text-[0.48rem] text-white/30">L{racer.lap}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pointer-events-none flex flex-col items-center gap-1.5">
          {hud.wrongWay && (
            <div className="toast border-[rgba(207,74,60,0.6)] bg-[rgba(60,18,14,0.8)] px-3 py-1.5">
              <p className="display text-[0.78rem] text-white">Wrong way</p>
            </div>
          )}
          {hud.checkpoint && (
            <div className="toast px-3 py-1.5">
              <p className="font-[var(--font-number)] text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-white">{hud.checkpoint}</p>
            </div>
          )}
          {hud.drifting && (
            <div className="drift-badge px-3 py-1.5">
              <p className="font-[var(--font-number)] text-[0.72rem] font-semibold uppercase tracking-[0.12em]">
                Drift {Math.round(hud.driftAngle)}° · {Math.round(hud.driftScore)}
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-end justify-between gap-2">
            <div className="hud-panel flex items-stretch overflow-hidden">
              <div className="flex flex-col justify-center border-r border-white/10 px-2.5 py-2">
                <p className="hud-label">Speed</p>
                <div className="flex items-end gap-1.5">
                  <span className="hud-num text-[2.6rem] leading-[0.8] text-white sm:text-[3.1rem]">{speed.toString().padStart(3, "0")}</span>
                  <span className="mb-0.5 mono text-[0.52rem] font-semibold tracking-widest text-[var(--muted)]">{unit}</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center border-r border-white/10 px-2 py-2">
                <p className="hud-label !text-[0.4rem]">Gear</p>
                <div className={`gear-box mt-1 ${hud.rpm > 0.92 ? "redline" : ""}`}>{hud.gear}</div>
              </div>
              <div className="flex min-w-[130px] flex-col justify-center gap-1.5 px-2.5 py-2 sm:min-w-[190px]">
                <div className="flex items-center justify-between">
                  <span className="hud-label !text-[0.4rem]">RPM ×100</span>
                  <span className="mono text-[0.6rem] font-semibold text-white/80">{Math.round((hud.rpm * (car.redline - car.idle) + car.idle) / 100)}</span>
                </div>
                <div className="flex gap-[2px]">
                  {Array.from({ length: 26 }, (_, index) => {
                    const active = (index + 1) / 26 <= hud.rpm;
                    const redline = index >= 21;
                    return (
                      <span
                        key={index}
                        className="tacho-seg"
                        style={{
                          background: active ? (redline ? "var(--red)" : "var(--ink)") : "rgba(255,255,255,.1)",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 hud-label !text-[0.4rem]">
                    <FuelIcon size={10} /> {Math.round(hud.fuel)}%
                  </span>
                  {settings.damage && (
                    <span className="flex items-center gap-1 hud-label !text-[0.4rem]" style={{ color: hud.damage > 55 ? "#e2a27e" : undefined }}>
                      <WrenchIcon size={10} /> {Math.round(hud.damage)}%
                    </span>
                  )}
                  <span className="mono text-[0.52rem] text-[var(--muted)]">{hud.topSpeed} max</span>
                </div>
              </div>
            </div>

            <div className="hidden flex-col items-end gap-1 md:flex">
              <div className="hud-panel px-3 py-2 text-right">
                <p className="hud-label !text-[0.4rem]">Lap time</p>
                <p className="mono text-[0.95rem] font-semibold text-white">{formatTime(hud.lapTime)}</p>
                <p className="hud-label !text-[0.4rem] mt-1">Best</p>
                <p className="mono text-[0.78rem] font-semibold" style={{ color: hud.bestLap ? "var(--gold)" : "var(--muted)" }}>
                  {hud.bestLap ? formatTime(hud.bestLap) : "—:—.———"}
                </p>
              </div>
              <div className="hud-panel hidden items-center gap-2 px-2 py-1.5 lg:flex">
                <span className="keycap !h-5 !min-w-5 !text-[0.48rem]">C</span>
                <span className="hud-label !text-[0.4rem]">Camera</span>
                <span className="keycap !h-5 !min-w-5 !text-[0.48rem]">L</span>
                <span className="hud-label !text-[0.4rem]">Lights</span>
                <span className="keycap !h-5 !min-w-5 !text-[0.48rem]">R</span>
                <span className="hud-label !text-[0.4rem]">Reset</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="touch-pad">
        <div className="pointer-events-auto flex gap-2">
          <TouchButton label="◀" action="left" onInput={onInput} />
          <TouchButton label="▶" action="right" onInput={onInput} />
        </div>
        <div className="pointer-events-auto flex items-end gap-1.5">
          {settings.transmission === "manual" && (
            <div className="flex flex-col gap-1">
              <TouchButton label="▲" action="shiftUp" onInput={onInput} />
              <TouchButton label="▼" action="shiftDown" onInput={onInput} />
            </div>
          )}
          <TouchButton label="DRIFT" action="handbrake" onInput={onInput} />
          <TouchButton label="BRK" action="brake" onInput={onInput} />
          <TouchButton label="GAS" action="accelerate" onInput={onInput} accent className="!h-16 !w-16" />
        </div>
      </div>

      {hud.countdown !== null && !paused && (
        <div className="pointer-events-none absolute inset-x-0 top-[26%] z-20 flex flex-col items-center">
          <div className="hud-panel flex flex-col items-center gap-2 px-5 py-3">
            <div className="flex gap-3">
              {[3, 2, 1].map((light) => {
                const state = hud.countdown === 0 ? "go" : hud.countdown !== null && hud.countdown <= light ? "on" : "";
                return <span key={light} className={`start-light ${state}`} />;
              })}
            </div>
            <p className="font-[var(--font-body)] text-[0.56rem] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
              {hud.countdown === 0 ? "Lights out" : "Formation · hold the clutch"}
            </p>
          </div>
          <div className="countdown-ring mt-3">{hud.countdown === 0 ? "GO" : hud.countdown}</div>
          <p className="mt-2 font-[var(--font-number)] text-[0.6rem] uppercase tracking-[0.3em] text-white/55">
            {settings.transmission === "manual" ? "Gear 1 · upshift on the lights" : "Throttle on the lights"}
          </p>
        </div>
      )}
    </>
  );
};

export const RaceScreen = ({ config, car, track, settings, onSettingsChange, onFinish, onExit, muted, onToggleSound }: RaceScreenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<OverdriveGame | null>(null);
  const pausedRef = useRef(false);
  const [hud, setHud] = useState<HudState | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"main" | "options">("main");
  const [confirmExit, setConfirmExit] = useState(false);
  const [liveSettings, setLiveSettings] = useState(settings);

  useEffect(() => {
    if (!containerRef.current) return;
    const game = new OverdriveGame(containerRef.current, config, {
      onHud: (next) => setHud(next),
      onFinish,
      onPause: () => {
        const active = gameRef.current;
        if (!active) return;
        if (pausedRef.current) {
          active.resume();
          pausedRef.current = false;
          setPaused(false);
        } else {
          active.pause();
          pausedRef.current = true;
          setPaused(true);
          setTab("main");
          getDriveAudio().uiClick();
        }
      },
      onReady: () => setReady(true),
    });
    gameRef.current = game;
    setHud(game.getHudForDebug());
    return () => {
      gameRef.current = null;
      game.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    getDriveAudio().setSettings({ master: settings.master, music: settings.music, sfx: settings.sfx });
  }, [settings.master, settings.music, settings.sfx]);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden || pausedRef.current || !gameRef.current) return;
      gameRef.current.pause();
      pausedRef.current = true;
      setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const pause = () => {
    if (!gameRef.current || pausedRef.current) return;
    gameRef.current.pause();
    pausedRef.current = true;
    setPaused(true);
    setTab("main");
  };
  const resume = () => {
    gameRef.current?.resume();
    pausedRef.current = false;
    setPaused(false);
  };
  const restart = () => {
    gameRef.current?.restart();
    pausedRef.current = false;
    setPaused(false);
    setTab("main");
  };
  const exit = () => {
    getDriveAudio().uiBack();
    gameRef.current?.pause();
    onExit();
  };
  const changeQuality = (quality: Quality) => {
    onSettingsChange({ quality });
    setLiveSettings((s) => ({ ...s, quality }));
    gameRef.current?.setQuality(quality);
  };
  const updateSetting = (patch: Partial<Settings>) => {
    onSettingsChange(patch);
    setLiveSettings((s) => ({ ...s, ...patch }));
  };

  return (
    <div className="race-shell">
      <div ref={containerRef} className="race-canvas" />
      {hud ? (
        <HUD
          hud={hud}
          car={car}
          track={track}
          settings={liveSettings}
          paused={paused}
          onPause={pause}
          onCamera={() => gameRef.current?.cycleCamera()}
          onInput={(action, down) => gameRef.current?.setVirtualInput(action, down)}
          onToggleSound={onToggleSound}
        />
      ) : null}

      {!ready && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[#08090b]">
          <div className="text-center">
            <p className="display text-[1.35rem] text-white">Preparing the car</p>
            <p className="mt-1 font-[var(--font-number)] text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
              {track.name} · {car.make} {car.model}
            </p>
            <div className="mx-auto mt-4 h-[2px] w-44 overflow-hidden bg-white/10">
              <div className="h-full w-1/2 animate-[toast-in_1.1s_ease-in-out_infinite_alternate] bg-[var(--accent)]" />
            </div>
          </div>
        </div>
      )}

      {paused && hud && (
        <div className="overlay">
          <div className="panel w-full max-w-[500px] animate-fade-up">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <div>
                <p className="display text-[1.2rem] leading-none text-white">{tab === "main" ? "Paused" : "Options"}</p>
                <p className="mt-1 font-[var(--font-number)] text-[0.56rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                  {track.name} · {formatTime(hud.time)}
                </p>
              </div>
              <button className="hud-exit" onClick={resume} aria-label="Resume">
                <CloseIcon size={16} />
              </button>
            </div>

            {tab === "main" ? (
              <div className="p-4">
                <div className="grid gap-2">
                  <button className="btn btn-primary" onClick={resume}>
                    <GaugeIcon size={14} /> Resume
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn btn-outline" onClick={restart}>
                      <RestartIcon size={14} /> Restart
                    </button>
                    <button className="btn btn-outline" onClick={() => setTab("options")}>
                      <WrenchIcon size={14} /> Options
                    </button>
                  </div>
                  <button className="btn btn-ghost !justify-between !text-[var(--muted)] hover:!text-white" onClick={() => setConfirmExit(true)}>
                    <span className="flex items-center gap-2">
                      <HomeIcon size={14} /> Leave event
                    </span>
                    <span>→</span>
                  </button>
                </div>
                {confirmExit && (
                  <div className="mt-3 border border-[rgba(207,74,60,0.4)] bg-[rgba(207,74,60,0.08)] p-3">
                    <p className="text-[0.7rem] text-white">Leave this event? Progress will be lost.</p>
                    <div className="mt-2 flex gap-2">
                      <button className="btn btn-danger btn-sm" onClick={exit}>
                        Leave
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmExit(false)}>
                        Stay
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3 border border-[var(--line)] px-3 py-2">
                  <span className="keycap">Esc</span>
                  <span className="text-[0.62rem] text-[var(--muted)]">Resume · {settings.transmission === "manual" ? "E / Q shift" : "Auto gearbox"} · {formatKeyLabel(settings.keys.camera)} camera · {formatKeyLabel(settings.keys.reset)} reset</span>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <span className="section-label">Audio</span>
                {[
                  { key: "master" as const, label: "Master" },
                  { key: "music" as const, label: "Music" },
                  { key: "sfx" as const, label: "Engine / FX" },
                ].map((row) => (
                  <div key={row.key} className="mt-2 flex items-center gap-3">
                    <span className="w-20 text-[0.64rem] text-white">{row.label}</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={liveSettings[row.key]}
                      onChange={(e) => updateSetting({ [row.key]: Number(e.target.value) } as Partial<Settings>)}
                      className="range"
                      style={{ "--value": `${liveSettings[row.key] * 100}%` } as React.CSSProperties}
                      aria-label={row.label}
                    />
                    <span className="mono w-8 text-right text-[0.62rem] text-[var(--muted)]">{Math.round(liveSettings[row.key] * 100)}%</span>
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-between">
                  <button className="btn btn-outline btn-sm" onClick={onToggleSound}>
                    {muted ? <MuteIcon size={12} /> : <VolumeIcon size={12} />} {muted ? "Enable audio" : "Mute"}
                  </button>
                  <div className="flex gap-1.5">
                    {(["low", "medium", "high"] as Quality[]).map((quality) => (
                      <button
                        key={quality}
                        onClick={() => changeQuality(quality)}
                        className={`border px-2.5 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.08em] ${
                          liveSettings.quality === quality ? "border-[var(--accent)] bg-[rgba(224,75,42,0.12)] text-white" : "border-[var(--line)] text-[var(--muted)]"
                        }`}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3 text-[0.63rem] leading-relaxed text-[var(--muted)]">
                  Gearbox and assists are fixed for this session. Change them in Settings before an event, or restart.
                </div>
                <div className="mt-3 flex justify-between gap-2">
                  <button className="btn btn-outline btn-sm" onClick={() => setTab("main")}>
                    Back
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={resume}>
                    Resume
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-2">
              <span className="font-[var(--font-number)] text-[0.55rem] uppercase tracking-[0.14em] text-[var(--muted)]">{car.make} {car.model}</span>
              <span className="font-[var(--font-number)] text-[0.55rem] uppercase tracking-[0.14em] text-[var(--muted)]">{WEATHER_LABEL[hud.weather]}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const formatKeyLabel = (code: string) => code.replace("Key", "").replace("Digit", "");
