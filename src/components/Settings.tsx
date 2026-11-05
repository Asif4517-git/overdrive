import { useState } from "react";
import type { ReactNode } from "react";
import { TRACKS, formatTime } from "../game/data";
import { DEVELOPER } from "../game/credits";
import { ChevronIcon, InstagramIcon, MailIcon, PortfolioIcon } from "./Icons";
import type { Quality, ScreenName, Settings as SettingsType, TrackId } from "../game/types";
import { cn } from "../utils/cn";
import {
  BoltIcon,
  CheckIcon,
  FullscreenIcon,
  GaugeIcon,
  InfoIcon,
  MuteIcon,
  RestartIcon,
  SettingsIcon,
  VolumeIcon,
} from "./Icons";
import { Button, GameHeader, PageHeading } from "./ui";

interface SettingsProps {
  settings: SettingsType;
  bestTimes: Partial<Record<TrackId, number>>;
  muted: boolean;
  onChange: (patch: Partial<SettingsType>) => void;
  onReset: () => void;
  onResetData: () => void;
  onTestSound: () => void;
  onToggleSound: () => void;
  onNavigate: (screen: ScreenName) => void;
  onStartRace: () => void;
  onBack: () => void;
  onOpenAbout: () => void;
}

const Toggle = ({ active, onChange, label }: { active: boolean; onChange: (value: boolean) => void; label: string }) => (
  <button
    className="group flex items-center gap-3"
    onClick={() => onChange(!active)}
    role="switch"
    aria-checked={active}
    aria-label={label}
  >
    <span
      className={cn(
        "relative h-6 w-11 border transition",
        active ? "border-[var(--cyan)] bg-[var(--cyan)]/20" : "border-white/20 bg-white/5"
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-3.5 w-3.5 transition-all duration-200",
          active ? "left-[1.55rem] bg-[var(--cyan)] shadow-[0_0_9px_var(--cyan)]" : "left-1 bg-white/40"
        )}
      />
    </span>
    <span className={cn("hud-label transition", active ? "text-white" : "text-[var(--muted)]")}>{active ? "Enabled" : "Disabled"}</span>
  </button>
);

const VolumeSlider = ({
  label,
  value,
  onChange,
  accent = "cyan",
  muted,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  accent?: "cyan" | "magenta";
  muted?: boolean;
}) => (
  <div className="border-b border-white/[0.07] py-4 last:border-0">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {muted ? <MuteIcon size={16} className="text-[var(--muted)]" /> : <VolumeIcon size={16} className="text-[var(--muted)]" />}
        <span className="hud-label text-white">{label}</span>
      </div>
      <span className="mono text-sm font-semibold" style={{ color: accent === "cyan" ? "var(--cyan)" : "var(--magenta)" }}>
        {Math.round(value * 100)}%
      </span>
    </div>
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className={cn("range", accent === "magenta" && "magenta")}
      style={{ "--value": `${value * 100}%` } as React.CSSProperties}
      aria-label={label}
    />
  </div>
);

const QUALITY_OPTIONS: { id: Quality; title: string; subtitle: string; detail: string }[] = [
  { id: "low", title: "Performance", subtitle: "60 fps target", detail: "No bloom · no shadows · reduced city density. Best on integrated graphics." },
  { id: "medium", title: "Balanced", subtitle: "Quality / speed", detail: "Bloom · 1024 shadows · full city. The sweet spot for most laptops." },
  { id: "high", title: "Cinematic", subtitle: "Full effects", detail: "HDR bloom · soft 2048 shadows · max pixel ratio · maximum neon." },
];

type Tab = "graphics" | "audio" | "data" | "about";

export const Settings = ({
  settings,
  bestTimes,
  muted,
  onChange,
  onReset,
  onResetData,
  onTestSound,
  onToggleSound,
  onNavigate,
  onStartRace,
  onBack,
  onOpenAbout,
}: SettingsProps) => {
  const [tab, setTab] = useState<Tab>("graphics");
  const tabs: { id: Tab; label: string; icon: ReactNode; caption: string }[] = [
    { id: "graphics", label: "Graphics", icon: <GaugeIcon size={17} />, caption: "Quality & effects" },
    { id: "audio", label: "Audio", icon: <VolumeIcon size={17} />, caption: "Mix & levels" },
    { id: "data", label: "Career data", icon: <RestartIcon size={17} />, caption: "Records & resets" },
    { id: "about", label: "About", icon: <InfoIcon size={17} />, caption: "Developer & credits" },
  ];

  return (
    <div className="screen scanlines">
      <div className="screen-grid" />
      <div className="relative z-10">
        <GameHeader current="settings" onNavigate={onNavigate} onSound={onToggleSound} muted={muted} onRace={onStartRace} />
        <main className="page-container pb-14 pt-7">
          <PageHeading
            index="03 / 04"
            eyebrow="System configuration"
            title={
              <>
                Race <span className="text-[var(--cyan)]">control</span>
              </>
            }
            description="Tune the presentation to your hardware and your ears. All preferences persist locally on this device."
            right={
              <button className="hidden items-center gap-2 border border-white/10 px-3 py-2 text-[var(--muted)] transition hover:text-white sm:flex" onClick={onTestSound}>
                <InfoIcon size={14} />
                <span className="hud-label">Test audio</span>
              </button>
            }
          />

          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <nav className="panel chamfer h-fit p-2">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border border-transparent px-3 py-3 text-left transition",
                    tab === item.id ? "border-[var(--cyan)]/25 bg-white/[0.06] text-white" : "text-[var(--muted)] hover:bg-white/[0.03] hover:text-white"
                  )}
                >
                  <span className={cn("grid h-8 w-8 place-items-center border", tab === item.id ? "border-[var(--cyan)]/40 text-[var(--cyan)]" : "border-white/10")}>
                    {item.icon}
                  </span>
                  <span>
                    <span className="display block text-[0.78rem] uppercase">{item.label}</span>
                    <span className="block text-[0.62rem] text-[var(--muted)]">{item.caption}</span>
                  </span>
                  {tab === item.id && <span className="ml-auto h-1.5 w-1.5 rotate-45 bg-[var(--cyan)]" />}
                </button>
              ))}
              <div className="mt-2 border-t border-white/10 px-3 pb-2 pt-3">
                <p className="hud-label !text-[0.48rem]">Build</p>
                <p className="mono text-[0.75rem] text-white/70">NEON RUSH / 1.0.7</p>
                <button
                  onClick={onOpenAbout}
                  className="mt-2.5 flex w-full items-center gap-2 border border-white/10 bg-white/[0.03] p-2 text-left transition hover:border-[var(--cyan)]/45 hover:bg-[var(--cyan)]/[0.06]"
                  aria-label="Open the About developer page"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center border border-[var(--cyan)]/25 bg-[linear-gradient(145deg,rgba(49,244,255,0.16),rgba(255,46,166,0.12))] font-display text-[0.7rem] font-bold uppercase text-white">
                    {DEVELOPER.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.08em] text-white">
                      {DEVELOPER.name}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[0.48rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                      Developer profile
                    </span>
                  </span>
                  <ChevronIcon size={11} className="shrink-0 text-[var(--cyan)]" />
                </button>
              </div>
            </nav>

            <section className="panel chamfer min-h-[450px] p-5 sm:p-7">
              {tab === "graphics" && (
                <div className="animate-fade-in">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h2 className="display text-xl uppercase text-white">Visual quality</h2>
                      <p className="mt-1 text-[0.75rem] text-[var(--muted)]">Applies the next time you enter a race.</p>
                    </div>
                    <span className="badge badge-cyan">{settings.quality}</span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {QUALITY_OPTIONS.map((option) => {
                      const active = settings.quality === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => onChange({ quality: option.id })}
                          className={cn(
                            "relative border p-4 text-left transition",
                            active
                              ? "border-[var(--cyan)] bg-[var(--cyan)]/[0.06] shadow-[0_0_30px_rgba(49,244,255,0.09)]"
                              : "border-white/10 bg-white/[0.02] hover:border-white/25"
                          )}
                        >
                          {active && (
                            <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center bg-[var(--cyan)] text-[#041018]">
                              <CheckIcon size={12} />
                            </span>
                          )}
                          <span className="mono text-[0.55rem] uppercase tracking-[0.2em] text-[var(--muted)]">{option.subtitle}</span>
                          <span className="display mt-1 block text-[0.95rem] uppercase text-white">{option.title}</span>
                          <span className="mt-2 block text-[0.66rem] leading-relaxed text-[var(--muted)]">{option.detail}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between border border-white/10 bg-white/[0.02] p-4">
                      <div>
                        <p className="hud-label text-white">Camera shake</p>
                        <p className="mt-1 text-[0.65rem] text-[var(--muted)]">Impacts, kerbs and nitro rumble.</p>
                      </div>
                      <Toggle active={settings.cameraShake} onChange={(value) => onChange({ cameraShake: value })} label="Camera shake" />
                    </div>
                    <div className="flex items-center justify-between border border-white/10 bg-white/[0.02] p-4">
                      <div>
                        <p className="hud-label text-white">UI blips</p>
                        <p className="mt-1 text-[0.65rem] text-[var(--muted)]">Menu confirms and countdowns.</p>
                      </div>
                      <Toggle active={settings.blips} onChange={(value) => onChange({ blips: value })} label="Interface sounds" />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 border border-white/10 bg-[linear-gradient(110deg,rgba(49,244,255,0.06),transparent)] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <FullscreenIcon size={18} className="text-[var(--cyan)]" />
                      <div>
                        <p className="hud-label text-white">Fullscreen mode</p>
                        <p className="text-[0.65rem] text-[var(--muted)]">Recommended for the full cinema effect.</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (document.fullscreenElement) void document.exitFullscreen();
                        else void document.documentElement.requestFullscreen().catch(() => undefined);
                      }}
                    >
                      Toggle fullscreen
                    </Button>
                  </div>
                </div>
              )}

              {tab === "audio" && (
                <div className="animate-fade-in">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h2 className="display text-xl uppercase text-white">Audio mix</h2>
                      <p className="mt-1 text-[0.75rem] text-[var(--muted)]">Synthesised in real time with the Web Audio API. No audio files, no waiting.</p>
                    </div>
                    <button className="badge badge-cyan" onClick={onToggleSound}>
                      {muted ? <MuteIcon size={12} /> : <VolumeIcon size={12} />}
                      {muted ? "Muted" : "Live"}
                    </button>
                  </div>
                  <VolumeSlider label="Master output" value={settings.master} onChange={(value) => onChange({ master: value })} muted={muted} />
                  <VolumeSlider label="Synthwave soundtrack" value={settings.music} onChange={(value) => onChange({ music: value })} accent="magenta" />
                  <VolumeSlider label="Engine & effects" value={settings.sfx} onChange={(value) => onChange({ sfx: value })} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={onTestSound} leading={<VolumeIcon size={13} />}>
                      Hear engine
                    </Button>
                    <Button size="sm" onClick={() => onChange({ master: 1, music: 0.7, sfx: 1, blips: true })}>
                      Full send preset
                    </Button>
                    <Button size="sm" onClick={() => onChange({ master: 0.55, music: 0.18, sfx: 0.6, blips: true })}>
                      Night cruise
                    </Button>
                  </div>
                  <div className="mt-5 border border-white/10 bg-white/[0.02] p-4">
                    <p className="hud-label text-white">Sound design</p>
                    <p className="mt-2 text-[0.72rem] leading-relaxed text-[var(--muted)]">
                      The engine is a triple-oscillator stack with RPM-reactive filtering. Drift squeal, road noise, turbo whoosh,
                      gear shifts and impacts are layered live. Audio initialises only after you interact with the game.
                    </p>
                  </div>
                </div>
              )}

              {tab === "data" && (
                <div className="animate-fade-in">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h2 className="display text-xl uppercase text-white">Career records</h2>
                      <p className="mt-1 text-[0.75rem] text-[var(--muted)]">Personal bests are stored in this browser.</p>
                    </div>
                    <span className="badge">Local save</span>
                  </div>
                  <div className="mt-5 divide-y divide-white/[0.07] border border-white/10">
                    {TRACKS.map((track, index) => (
                      <div key={track.id} className="flex items-center gap-4 px-4 py-3.5">
                        <span className="mono w-6 text-[0.65rem] text-white/30">0{index + 1}</span>
                        <span className="h-2 w-2 rotate-45" style={{ background: track.accent }} />
                        <div className="flex-1">
                          <p className="display text-[0.82rem] uppercase text-white">{track.name}</p>
                          <p className="font-mono text-[0.56rem] uppercase tracking-wider text-[var(--muted)]">{track.location}</p>
                        </div>
                        <span className="mono text-sm font-semibold" style={{ color: bestTimes[track.id] ? "var(--lime)" : "rgba(255,255,255,.25)" }}>
                          {bestTimes[track.id] ? formatTime(bestTimes[track.id]!) : "—:—.———"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button onClick={() => onChange({ master: 0.8, music: 0.35, sfx: 0.8, quality: "high", cameraShake: true, blips: true })} className="flex items-center justify-between border border-white/10 p-4 text-left transition hover:border-white/25">
                      <div>
                        <p className="hud-label text-white">Restore defaults</p>
                        <p className="mt-1 text-[0.65rem] text-[var(--muted)]">Reset every preference.</p>
                      </div>
                      <RestartIcon size={17} className="text-[var(--muted)]" />
                    </button>
                    <button onClick={() => onChange({ master: 0 })} className="flex items-center justify-between border border-white/10 p-4 text-left transition hover:border-white/25">
                      <div>
                        <p className="hud-label text-white">Silence everything</p>
                        <p className="mt-1 text-[0.65rem] text-[var(--muted)]">Sets master volume to zero.</p>
                      </div>
                      <MuteIcon size={17} className="text-[var(--muted)]" />
                    </button>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 border border-[var(--magenta)]/20 bg-[var(--magenta)]/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <BoltIcon size={17} className="text-[var(--magenta)]" />
                      <div>
                        <p className="hud-label text-white">Wipe career data</p>
                        <p className="text-[0.65rem] text-[var(--muted)]">Deletes all lap records. This cannot be undone.</p>
                      </div>
                    </div>
                    <button className="badge badge-magenta !px-3 !py-2 transition hover:bg-[var(--magenta)]/15" onClick={onResetData}>
                      Erase records
                    </button>
                  </div>
                </div>
              )}

              {tab === "about" && (
                <div className="animate-fade-in">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h2 className="display text-xl uppercase text-white">About the developer</h2>
                      <p className="mt-1 text-[0.75rem] text-[var(--muted)]">Creator and developer of NEON RUSH.</p>
                    </div>
                    <span className="badge badge-cyan"><InfoIcon size={11} /> Full profile</span>
                  </div>

                  <div className="mt-5 flex flex-col gap-4 border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-[var(--cyan)]/30 bg-[linear-gradient(145deg,rgba(49,244,255,0.16),rgba(255,46,166,0.14))]">
                      <span className="display text-2xl uppercase text-white glow-cyan">{DEVELOPER.name.slice(0, 1)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="display text-xl uppercase leading-none text-white">{DEVELOPER.name}</p>
                      <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-[var(--cyan)]">{DEVELOPER.role}</p>
                      <p className="mt-2 text-[0.7rem] leading-relaxed text-[var(--muted)]">
                        {DEVELOPER.name} created and developed NEON RUSH. These are the developer&apos;s supplied contact details.
                      </p>
                    </div>
                    <Button size="sm" variant="primary" onClick={onOpenAbout} trailing={<CheckIcon size={13} />}>
                      About page
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <a href={DEVELOPER.portfolio} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 border border-white/10 p-3 transition hover:border-[var(--cyan)]/50 hover:bg-white/[0.04]">
                      <PortfolioIcon size={16} className="shrink-0 text-[var(--cyan)]" />
                      <span className="min-w-0 flex-1">
                        <span className="hud-label block !text-[0.44rem]">Portfolio</span>
                        <span className="mt-0.5 block truncate font-mono text-[0.72rem] text-white">{DEVELOPER.portfolioLabel}</span>
                      </span>
                      <span className="text-[0.55rem] uppercase tracking-[0.14em] text-white/30 group-hover:text-white">Open ↗</span>
                    </a>
                    <a href={DEVELOPER.instagram} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 border border-white/10 p-3 transition hover:border-[var(--magenta)]/50 hover:bg-white/[0.04]">
                      <InstagramIcon size={16} className="shrink-0 text-[var(--magenta)]" />
                      <span className="min-w-0 flex-1">
                        <span className="hud-label block !text-[0.44rem]">Instagram</span>
                        <span className="mt-0.5 block truncate font-mono text-[0.72rem] text-white">{DEVELOPER.instagramHandle}</span>
                      </span>
                      <span className="text-[0.55rem] uppercase tracking-[0.14em] text-white/30 group-hover:text-white">Open ↗</span>
                    </a>
                    <a href={DEVELOPER.emailHref} className="group flex items-center gap-3 border border-white/10 p-3 transition hover:border-[var(--lime)]/50 hover:bg-white/[0.04]">
                      <MailIcon size={16} className="shrink-0 text-[var(--lime)]" />
                      <span className="min-w-0 flex-1">
                        <span className="hud-label block !text-[0.44rem]">Email</span>
                        <span className="mt-0.5 block truncate font-mono text-[0.72rem] text-white">{DEVELOPER.email}</span>
                      </span>
                      <span className="text-[0.55rem] uppercase tracking-[0.14em] text-white/30 group-hover:text-white">Mail ↗</span>
                    </a>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="border border-white/10 bg-white/[0.02] p-3">
                      <p className="hud-label !text-[0.44rem]">Project</p>
                      <p className="display mt-1 text-sm uppercase text-white">{DEVELOPER.project}</p>
                    </div>
                    <div className="border border-white/10 bg-white/[0.02] p-3">
                      <p className="hud-label !text-[0.44rem]">Role</p>
                      <p className="display mt-1 text-sm uppercase text-white">Creator / Developer</p>
                    </div>
                  </div>
                  <p className="mt-4 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/30">
                    © {new Date().getFullYear()} {DEVELOPER.name} — {DEVELOPER.project}
                  </p>
                </div>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <button className="btn btn-ghost" onClick={onReset}>
                  <RestartIcon size={14} />
                  Restore all defaults
                </button>
                <div className="flex gap-2">
                  <Button onClick={onBack}>Back</Button>
                  <Button variant="primary" onClick={onBack} trailing={<CheckIcon size={14} />}>
                    Save & close
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[0.6rem] text-[var(--muted)]">
            <SettingsIcon size={13} />
            Settings save automatically. Master volume currently {muted ? "off" : `${Math.round(settings.master * 100)}%`}.
          </div>
        </main>
      </div>
    </div>
  );
};
