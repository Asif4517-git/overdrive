import { useId, useMemo, useState } from "react";
import type { CarSpec, HudState, TrackDef } from "../game/types";
import { formatTime } from "../game/data";
import { cn } from "../utils/cn";
import {
  BoltIcon,
  ChevronIcon,
  DriftIcon,
  FlagIcon,
  PauseIcon,
  TrophyIcon,
} from "./Icons";

export const CameraIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H8l1.4-2h5.2L16 6h2.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
    <circle cx="12" cy="12.5" r="3.4" />
  </svg>
);

interface HudProps {
  hud: HudState;
  car: CarSpec;
  track: TrackDef;
  paused: boolean;
  onPause: () => void;
  onCycleCamera: () => void;
  onTouch: (code: string, down: boolean) => void;
}

const TouchButton = ({
  code,
  label,
  onTouch,
  accent,
  className,
}: {
  code: string;
  label: string;
  onTouch: (code: string, down: boolean) => void;
  accent?: string;
  className?: string;
}) => {
  const [pressed, setPressed] = useState(false);
  const press = (down: boolean) => {
    setPressed(down);
    onTouch(code, down);
  };
  return (
    <button
      className={cn("touch-btn", className)}
      data-pressed={pressed}
      style={{ borderColor: accent ? `${accent}55` : undefined, color: accent }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        press(true);
      }}
      onPointerUp={() => press(false)}
      onPointerCancel={() => press(false)}
      onPointerLeave={() => pressed && press(false)}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={label}
    >
      {label}
    </button>
  );
};

export const Hud = ({ hud, car, track, paused, onPause, onCycleCamera, onTouch }: HudProps) => {
  const gradientId = useId().replace(/:/g, "");
  const minimapPath = useMemo(() => {
    if (!hud.minimap.length) return "";
    const points = hud.minimap.filter((_, index) => index % 4 === 0);
    return (
      points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${(point.x * 100).toFixed(1)} ${(point.y * 100).toFixed(1)}`)
        .join(" ") + " Z"
    );
  }, [hud.minimap]);

  const speedRatio = Math.min(1, hud.speed / 310);
  const nitroSegments = 22;
  const boost = hud.boostFlash;

  return (
    <>
      <div
        className="speed-flash"
        style={{ opacity: boost * 0.8, background: `radial-gradient(circle at 50% 62%, transparent 26%, ${car.accentColor}33 100%)` }}
      />
      <div className="speed-lines" style={{ opacity: paused ? 0 : boost * 0.75 + speedRatio * 0.12 }} />
      {hud.drifting && <div className="drift-glow" style={{ boxShadow: `inset 0 -90px 150px ${track.accent}2e` }} />}

      <div className="hud-layer flex flex-col justify-between">
        {/* ------------------------------------------------ top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="animate-slide-right">
            <div className="hud-panel chamfer-sm relative overflow-hidden px-3 py-2.5 sm:px-4 sm:py-3">
              <span className="absolute left-0 top-0 h-full w-[2px]" style={{ background: car.accentColor }} />
              <div className="flex items-end gap-4">
                <div>
                  <p className="hud-label">Position</p>
                  <p className="hud-num text-[2.6rem] sm:text-[3.3rem]" style={{ color: hud.position === 1 ? "var(--lime)" : "#fff" }}>
                    {hud.position}
                    <span className="ml-1 font-display text-[0.62rem] font-medium tracking-wider text-white/40">/ {hud.totalRacers}</span>
                  </p>
                </div>
                <div className="mb-1 hidden border-l border-white/10 pl-4 sm:block">
                  <p className="hud-label">Lap</p>
                  <p className="hud-num text-[1.5rem] text-white">
                    {hud.lap}
                    <span className="font-display text-[0.6rem] font-medium text-white/40"> /{hud.totalLaps}</span>
                  </p>
                </div>
                <div className="mb-1 border-l border-white/10 pl-4">
                  <p className="hud-label">Race</p>
                  <p className="hud-num text-[1.1rem] text-white sm:text-[1.3rem]">{formatTime(hud.time, false)}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-white/[0.08] pt-1.5">
                <div>
                  <p className="hud-label !text-[0.42rem]">Lap time</p>
                  <p className="mono text-[0.72rem] font-semibold text-white/85">{hud.lapTime.toFixed(2)}</p>
                </div>
                <div>
                  <p className="hud-label !text-[0.42rem]">Best</p>
                  <p className="mono text-[0.72rem] font-semibold" style={{ color: hud.bestLap ? "var(--lime)" : "rgba(255,255,255,.35)" }}>
                    {hud.bestLap ? hud.bestLap.toFixed(2) : "—.——"}
                  </p>
                </div>
                <div>
                  <p className="hud-label !text-[0.42rem]">Sectors</p>
                  <div className="mt-1 flex gap-1">
                    {[1, 2].map((sector) => (
                      <span
                        key={sector}
                        className="h-1 flex-1"
                        style={{ background: hud.sector & sector ? track.accent : "rgba(255,255,255,.15)", boxShadow: hud.sector & sector ? `0 0 6px ${track.accent}` : "none" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="hud-panel hud-standings mt-2 hidden w-[244px] px-3 py-2.5 xl:block">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="hud-label">Live standings</span>
                <span className="mono text-[0.55rem] tracking-widest text-white/30">{track.name}</span>
              </div>
              {hud.standings.map((racer) => (
                <div
                  key={racer.id}
                  className={cn("flex items-center gap-2 border-b border-white/[0.05] py-[3px] last:border-0")}
                  style={{ background: racer.isPlayer ? `${car.accentColor}12` : "transparent" }}
                >
                  <span className="mono w-3 text-[0.6rem]" style={{ color: racer.isPlayer ? car.accentColor : "rgba(255,255,255,.4)" }}>
                    {racer.position}
                  </span>
                  <span className="h-1.5 w-1.5 shrink-0" style={{ background: racer.color }} />
                  <span className={cn("flex-1 truncate text-[0.6rem] font-medium tracking-wide", racer.isPlayer ? "text-white" : "text-white/55")}>
                    {racer.name}
                  </span>
                  {racer.finished ? (
                    <span className="mono text-[0.52rem] text-[var(--lime)]">FIN</span>
                  ) : (
                    <span className="mono text-[0.52rem] text-white/35">L{racer.lap}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-1 hidden flex-col items-center gap-1.5 md:flex">
            <div className="flex items-center gap-2 border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--magenta)] shadow-[0_0_7px_var(--magenta)]" />
              <span className="hud-label !text-[0.5rem]">Live · {track.location}</span>
            </div>
            {hud.wrongWay && (
              <div className="wrong-way mt-2 border border-[var(--magenta)]/60 bg-[var(--magenta)]/20 px-4 py-2 backdrop-blur-md">
                <p className="display text-sm uppercase tracking-[0.15em] text-white">Wrong way</p>
                <p className="mt-0.5 text-center font-mono text-[0.52rem] uppercase tracking-widest text-[var(--magenta)]">Turn around</p>
              </div>
            )}
            {hud.drifting && (
              <div className="mt-2 flex items-center gap-2 border px-3 py-1.5 backdrop-blur-md" style={{ borderColor: `${track.accent}66`, background: `${track.accent}18` }}>
                <DriftIcon size={13} style={{ color: track.accent }} />
                <span className="display text-[0.7rem] uppercase tracking-[0.15em] text-white">Drifting</span>
                <span className="mono text-[0.7rem] font-semibold" style={{ color: track.accent }}>
                  +{hud.driftScore}
                </span>
              </div>
            )}
            {hud.checkpoint && (
              <div className="mt-1 animate-fade-in border border-white/15 bg-black/45 px-3 py-1.5 backdrop-blur-md">
                <p className="display text-[0.63rem] uppercase tracking-[0.16em]" style={{ color: track.accent }}>
                  {hud.checkpoint}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onCycleCamera}
                className="hud-panel flex h-9 items-center gap-1.5 px-2.5 text-white/70 transition hover:text-white"
                aria-label="Change camera"
                title="Change camera (C)"
              >
                <CameraIcon size={15} />
                <span className="hud-label !text-[0.46rem]">{hud.cameraMode}</span>
              </button>
              <button
                onClick={onPause}
                className="hud-panel grid h-9 w-9 place-items-center text-white transition hover:border-white/40"
                aria-label="Pause race"
              >
                <PauseIcon size={14} />
              </button>
            </div>
            <div className="hud-panel hud-minimap chamfer-sm relative p-1.5 sm:p-2">
              <div className="relative h-[132px] w-[140px] sm:h-[168px] sm:w-[180px]">
                <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
                  <defs>
                    <linearGradient id={`mapgrad-${gradientId}`} x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor={track.accent} />
                      <stop offset="1" stopColor={car.accentColor} />
                    </linearGradient>
                  </defs>
                  {Array.from({ length: 4 }, (_, i) => (
                    <line key={i} x1={20 + i * 20} y1="0" x2={20 + i * 20} y2="100" stroke="rgba(150,175,255,.07)" strokeWidth="0.35" />
                  ))}
                  <path d={minimapPath} fill="none" stroke="rgba(0,0,0,.65)" strokeWidth="5" strokeLinejoin="round" />
                  <path d={minimapPath} fill="none" stroke={`url(#mapgrad-${gradientId})`} strokeWidth="2.1" strokeLinejoin="round" />
                  {hud.standings.map((racer) => (
                    <g key={racer.id}>
                      {racer.isPlayer && <circle cx={racer.x * 100} cy={racer.y * 100} r="4.2" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.7" />}
                      <circle cx={racer.x * 100} cy={racer.y * 100} r={racer.isPlayer ? 2.1 : 1.5} fill={racer.isPlayer ? "#ffffff" : racer.color} />
                    </g>
                  ))}
                  <circle cx={hud.minimap[0]?.x ? hud.minimap[0].x * 100 : 0} cy={hud.minimap[0]?.y ? hud.minimap[0].y * 100 : 0} r="1.4" fill="#fff" opacity="0.8" />
                </svg>
                <span className="absolute bottom-1 left-1 mono text-[0.5rem] uppercase tracking-[0.14em] text-white/40">{track.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ bottom row */}
        <div className="flex items-end justify-between gap-3">
          <div className="hud-panel hud-speed chamfer-sm relative overflow-hidden p-3 sm:min-w-[250px] sm:p-3.5">
            <span className="absolute left-0 top-0 h-full w-[2px]" style={{ background: car.accentColor }} />
            <div className="flex items-center justify-between">
              <span className="hud-label">Speed</span>
              <span className="mono text-[0.54rem] tracking-[0.14em] text-white/40">{car.name}</span>
            </div>
            <div className="mt-1 flex items-end gap-2">
              <p className="hud-num text-[3.4rem] leading-[0.7] text-white sm:text-[4.4rem]" style={{ textShadow: `0 0 24px ${car.accentColor}55` }}>
                {hud.speed.toString().padStart(3, "0")}
              </p>
              <div className="mb-0.5">
                <p className="mono text-[0.62rem] font-semibold tracking-widest text-white/50">KM/H</p>
                <div className="mt-1 flex h-8 w-8 items-center justify-center border border-white/20 bg-white/[0.05]">
                  <span className="mono text-sm font-bold" style={{ color: car.accentColor }}>
                    {hud.gear === 0 ? "R" : hud.gear}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex flex-1 gap-[2px]">
                {Array.from({ length: 24 }, (_, index) => {
                  const active = (index + 1) / 24 <= hud.rpm;
                  return (
                    <span
                      key={index}
                      className="h-[3px] flex-1"
                      style={{
                        background: active ? (index > 19 ? "var(--magenta)" : car.accentColor) : "rgba(255,255,255,.1)",
                        boxShadow: active ? `0 0 5px ${index > 19 ? "#ff2ea6" : car.accentColor}` : "none",
                      }}
                    />
                  );
                })}
              </div>
              <span className="mono text-[0.65rem] font-semibold text-white/60">
                {(hud.rpm * 100).toFixed(0)}
                <span className="text-[0.45rem]"> RPM×100</span>
              </span>
            </div>
            <div className="mt-2 hidden items-center gap-3 border-t border-white/[0.07] pt-1.5 sm:flex">
              <span className="hud-label flex items-center gap-1 !text-[0.42rem]">
                <TrophyIcon size={10} className="text-[var(--lime)]" /> {hud.topSpeed.toFixed(0)} top
              </span>
              <span className="hud-label flex items-center gap-1 !text-[0.42rem]">
                <FlagIcon size={10} /> {hud.lap}/{hud.totalLaps}
              </span>
              <span className="hud-label flex items-center gap-1 !text-[0.42rem]">
                <ChevronIcon size={10} /> {formatTime(hud.lapTime, false)}
              </span>
            </div>
          </div>

          <div className="hidden flex-1 items-end justify-center md:flex">
            <div className="hud-panel w-full max-w-[420px] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BoltIcon size={14} style={{ color: car.accentColor }} />
                  <span className="hud-label text-white">Nitro cell</span>
                </div>
                <span className="mono text-[0.85rem] font-bold" style={{ color: hud.boosting ? "#fff" : car.accentColor }}>
                  {Math.round(hud.nitro)}
                  <span className="text-[0.5rem] text-white/40">%</span>
                </span>
              </div>
              <div className="mt-2 flex gap-[3px]">
                {Array.from({ length: nitroSegments }, (_, index) => {
                  const active = (index + 1) / nitroSegments <= hud.nitro / 100;
                  return (
                    <span
                      key={index}
                      className="h-[9px] flex-1 skew-x-[-14deg] transition-colors duration-100"
                      style={{
                        background: active ? (hud.boosting ? "#ffffff" : car.accentColor) : "rgba(255,255,255,.09)",
                        boxShadow: active && hud.boosting ? `0 0 9px #fff` : active ? `0 0 6px ${car.accentColor}88` : "none",
                      }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="keycap !h-6 !min-w-10 !text-[0.55rem]">SHIFT</span>
                  <span className={cn("hud-label !text-[0.46rem]", hud.boosting && "!text-white")}>{hud.boosting ? "Overboost engaged" : hud.nitro > 5 ? "Ready" : "Recharging"}</span>
                </div>
                <div className="keyboard-hint flex items-center gap-1.5">
                  <span className="keycap !h-5 !min-w-5 !text-[0.5rem]">SPACE</span>
                  <span className="hud-label !text-[0.42rem]">Drift</span>
                  <span className="keycap !h-5 !min-w-5 !text-[0.5rem]">C</span>
                  <span className="hud-label !text-[0.42rem]">Cam</span>
                </div>
              </div>
            </div>
          </div>

          <div className="keyboard-hint hidden flex-col items-end gap-1.5 lg:flex">
            <div className="hud-panel px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="keycap !h-6 !min-w-6 !text-[0.55rem]">W</span>
                <span className="keycap !h-6 !min-w-6 !text-[0.55rem]">A</span>
                <span className="keycap !h-6 !min-w-6 !text-[0.55rem]">S</span>
                <span className="keycap !h-6 !min-w-6 !text-[0.55rem]">D</span>
                <span className="hud-label !text-[0.42rem]">Drive</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="keycap !h-6 !min-w-12 !text-[0.5rem]">ESC</span>
                <span className="hud-label !text-[0.42rem]">Pause</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nitro strip */}
        <div className="hud-panel mt-1 flex items-center gap-2 px-3 py-2 md:hidden">
          <span className="mono text-lg font-bold leading-none text-white">{hud.speed.toString().padStart(3, "0")}</span>
          <span className="mono text-[0.45rem] leading-tight text-white/40">KM/H<br />G{hud.gear === 0 ? "R" : hud.gear}</span>
          <span className="mx-1 h-5 w-px bg-white/15" />
          <BoltIcon size={13} style={{ color: car.accentColor }} />
          <div className="flex flex-1 gap-[2px]">
            {Array.from({ length: 16 }, (_, index) => (
              <span
                key={index}
                className="h-[6px] flex-1 skew-x-[-14deg]"
                style={{ background: (index + 1) / 16 <= hud.nitro / 100 ? car.accentColor : "rgba(255,255,255,.1)" }}
              />
            ))}
          </div>
          <span className="mono text-[0.6rem]" style={{ color: car.accentColor }}>
            {Math.round(hud.nitro)}%
          </span>
        </div>
      </div>

      {/* Countdown / start lights */}
      {hud.countdown !== null && !paused && hud.countdown !== undefined && (
        <div className="pointer-events-none absolute inset-x-0 top-[27%] z-20 flex flex-col items-center">
          <div className="hud-panel relative flex items-center gap-3 px-5 py-3 sm:gap-4 sm:px-6 sm:py-4">
            <span className="absolute left-0 top-0 h-full w-[2px]" style={{ background: hud.countdown === 0 ? "var(--lime)" : "var(--magenta)" }} />
            <div className="flex gap-2">
              {[1, 2, 3].map((light) => {
                const count = hud.countdown ?? 0;
                const active = count === 0 || light > count;
                return (
                  <span
                    key={light}
                    className="h-3 w-3 rotate-45 transition-all duration-200 sm:h-3.5 sm:w-3.5"
                    style={{
                      background: active ? (hud.countdown === 0 ? "var(--lime)" : "var(--magenta)") : "rgba(255,255,255,0.12)",
                      boxShadow: active ? `0 0 14px ${hud.countdown === 0 ? "var(--lime)" : "var(--magenta)"}` : "none",
                    }}
                  />
                );
              })}
            </div>
            <span className="h-8 w-px bg-white/15" />
            <div className="text-center">
              <p className="hud-label !text-[0.46rem]">{hud.countdown === 0 ? "Launch control" : "Start sequence"}</p>
              <p
                key={hud.countdown}
                className={cn(
                  "mono mt-1 text-3xl font-bold leading-none tracking-[0.18em] sm:text-4xl",
                  hud.countdown === 0 ? "text-[var(--lime)]" : "text-white"
                )}
                style={{ textShadow: hud.countdown === 0 ? "0 0 24px rgba(201,255,53,.5)" : "0 0 20px rgba(49,244,255,.4)" }}
              >
                {hud.countdown === 0 ? "GO" : `00:0${hud.countdown}`}
              </p>
            </div>
          </div>
          <p className="mt-2.5 font-display text-[0.6rem] uppercase tracking-[0.32em] text-white/55">
            {hud.countdown === 0 ? "Full send" : "Hold the revs"}
          </p>
        </div>
      )}

      {/* Touch layout */}
      <div className="touch-controls pointer-events-none absolute inset-x-0 bottom-[5.2rem] z-20 items-end justify-between px-2.5 sm:px-4 md:hidden">
        <div className="pointer-events-auto flex gap-2">
          <TouchButton code="arrowleft" label="◀" onTouch={onTouch} />
          <TouchButton code="arrowright" label="▶" onTouch={onTouch} />
        </div>
        <div className="pointer-events-auto flex items-end gap-2">
          <TouchButton code="space" label="DRIFT" onTouch={onTouch} />
          <TouchButton code="shiftleft" label="N₂O" onTouch={onTouch} accent={car.accentColor} />
          <TouchButton code="arrowsdown" label="BRK" onTouch={onTouch} />
          <TouchButton code="arrowup" label="GAS" onTouch={onTouch} accent="#c9ff35" className="!h-16 !w-16" />
        </div>
      </div>
    </>
  );
};
