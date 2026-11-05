import { useEffect, useState } from "react";
import type { Quality, ScreenName, Settings } from "../types";
import { DEFAULT_KEYS, KEY_ACTIONS, formatKey, formatTime } from "../types";
import type { KeyBindings } from "../types";
import { TRACKS } from "../data";
import {
  CheckIcon,
  GearIcon,
  GaugeIcon,
  InfoIcon,
  KeyIcon,
  MuteIcon,
  RestartIcon,
  SettingsIcon,
  VolumeIcon,
  WeatherIcon,
  WrenchIcon,
} from "../../components/Icons";
import { Footer, Header, SectionTitle } from "./common";
import { FullscreenIcon } from "../../components/Icons";

interface SettingsProps {
  settings: Settings;
  muted: boolean;
  bestLaps: Record<string, number>;
  wins: number;
  races: number;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onResetData: () => void;
  onToggleSound: () => void;
  onTestSound: () => void;
  onNavigate: (screen: ScreenName) => void;
  onStart: () => void;
}

type Tab = "driving" | "controls" | "audio" | "graphics" | "data";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "driving", label: "Driving", icon: <GaugeIcon size={15} /> },
  { id: "controls", label: "Controls", icon: <KeyIcon size={15} /> },
  { id: "audio", label: "Audio", icon: <VolumeIcon size={15} /> },
  { id: "graphics", label: "Graphics", icon: <SettingsIcon size={15} /> },
  { id: "data", label: "Data & about", icon: <InfoIcon size={15} /> },
];

const QUALITIES: { id: Quality; label: string; detail: string }[] = [
  { id: "low", label: "Performance", detail: "No bloom, no shadows, reduced density. Best for integrated graphics." },
  { id: "medium", label: "Balanced", detail: "Full geometry and lighting, no heavy post effects. The safe default." },
  { id: "high", label: "Cinematic", detail: "Soft shadows, high pixel ratio and subtle bloom. Best image quality." },
];

const Slider = ({
  label,
  value,
  onChange,
  display,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  display: string;
}) => (
  <div className="setting-row">
    <div>
      <p className="text-[0.74rem] font-medium text-white">{label}</p>
    </div>
    <div className="flex w-[52%] items-center gap-3">
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range"
        style={{ "--value": `${value * 100}%` } as React.CSSProperties}
        aria-label={label}
      />
      <span className="mono w-9 text-right text-[0.7rem] text-[var(--muted)]">{display}</span>
    </div>
  </div>
);

const Toggle = ({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) => (
  <div className="setting-row">
    <div className="pr-4">
      <p className="text-[0.74rem] font-medium text-white">{label}</p>
      <p className="mt-0.5 text-[0.63rem] leading-relaxed text-[var(--muted)]">{description}</p>
    </div>
    <button className="switch shrink-0" data-on={value} onClick={() => onChange(!value)} role="switch" aria-checked={value} aria-label={label} />
  </div>
);

export const SettingsPage = ({
  settings,
  muted,
  bestLaps,
  wins,
  races,
  onChange,
  onReset,
  onResetData,
  onToggleSound,
  onTestSound,
  onNavigate,
  onStart,
}: SettingsProps) => {
  const [tab, setTab] = useState<Tab>("driving");
  const [listening, setListening] = useState<keyof KeyBindings | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!listening) return;
    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.code === "Escape") {
        setListening(null);
        return;
      }
      onChange({ keys: { ...settings.keys, [listening]: event.code } });
      setListening(null);
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [listening, onChange, settings.keys]);

  const duplicates = (() => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    (Object.keys(settings.keys) as (keyof KeyBindings)[]).forEach((action) => {
      const code = settings.keys[action];
      if (seen.has(code)) dupes.push(`${formatKey(code)} is assigned to two actions`);
      seen.set(code, action);
    });
    return dupes;
  })();

  return (
    <div className="screen">
      <Header current="settings" muted={muted} onNavigate={onNavigate} onSound={onToggleSound} onRace={onStart} />
      <main className="page-container pb-14 pt-7">
        <SectionTitle
          index="03"
          eyebrow="System & gameplay"
          title={
            <>
              Set up the <span className="text-[var(--accent)]">drive</span>
            </>
          }
          description="Gearbox, assists, cameras, sound mix, graphics and every keyboard binding. Preferences save automatically to this browser."
          right={
            <button className="btn btn-outline btn-sm" onClick={onTestSound}>
              <VolumeIcon size={13} /> Test audio
            </button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
          <nav className="tabs h-fit flex-row overflow-x-auto border border-[var(--line)] bg-[#111316] p-1 lg:flex-col lg:overflow-visible">
            {TABS.map((item) => (
              <button
                key={item.id}
                className="tab flex items-center gap-2 border-b-0 border-l-2 lg:w-full"
                data-active={tab === item.id}
                onClick={() => setTab(item.id)}
                style={tab === item.id ? { borderLeftColor: "var(--accent)", borderBottomColor: "transparent" } : { borderLeftColor: "transparent" }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="mt-auto hidden border-t border-[var(--line)] px-3 py-3 lg:block">
              <p className="section-label !text-[0.44rem]">Build</p>
              <p className="mono text-[0.7rem] text-white/70">OVERDRIVE 1.0</p>
              <p className="mt-1 text-[0.58rem] leading-relaxed text-[var(--muted)]">Procedural cars, roads and audio. No backend.</p>
            </div>
          </nav>

          <section className="panel p-4 sm:p-5">
            {tab === "driving" && (
              <div className="animate-fade-in">
                <div className="mb-4 flex items-center gap-2 border-b border-[var(--line)] pb-3">
                  <GearIcon size={15} className="text-[var(--accent)]" />
                  <span className="section-label">Gearbox & assists</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border border-[var(--line)] p-3">
                    <p className="text-[0.74rem] font-medium text-white">Transmission</p>
                    <p className="mt-0.5 text-[0.63rem] text-[var(--muted)]">Manual uses the shift up/down keys.</p>
                    <div className="mt-2 flex">
                      {(["auto", "manual"] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => onChange({ transmission: option })}
                          className={`flex-1 border py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] ${
                            settings.transmission === option
                              ? "border-[var(--accent)] bg-[rgba(224,75,42,0.14)] text-white"
                              : "border-[var(--line)] text-[var(--muted)] hover:text-white"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border border-[var(--line)] p-3">
                    <p className="text-[0.74rem] font-medium text-white">Default camera</p>
                    <p className="mt-0.5 text-[0.63rem] text-[var(--muted)]">Cycle in-race with the camera key.</p>
                    <select
                      className="select mt-2"
                      value={settings.camera}
                      onChange={(event) => onChange({ camera: event.target.value as Settings["camera"] })}
                      aria-label="Default camera"
                    >
                      <option value="chase">Chase</option>
                      <option value="far">Wide chase</option>
                      <option value="hood">Hood</option>
                      <option value="cockpit">Cockpit (RHD)</option>
                    </select>
                  </div>
                </div>

                <Toggle label="Driving assists" description="Stability control and traction assist. Turn off for sharper oversteer and more wheelspin." value={settings.assists} onChange={(v) => onChange({ assists: v })} />
                <Toggle label="Mechanical damage" description="Impacts reduce engine output and add panel/mechanical damage. Disable for relaxed driving." value={settings.damage} onChange={(v) => onChange({ damage: v })} />
                <Toggle label="Show racing line" description="A subtle braking and apex guide on the road surface." value={settings.showRacingLine} onChange={(v) => onChange({ showRacingLine: v })} />

                <div className="setting-row">
                  <div className="pr-4">
                    <p className="text-[0.74rem] font-medium text-white">Steering sensitivity</p>
                    <p className="mt-0.5 text-[0.63rem] text-[var(--muted)]">Lower for smoother inputs, higher for quicker response.</p>
                  </div>
                  <div className="flex w-[45%] items-center gap-3">
                    <input
                      type="range"
                      min={0.5}
                      max={1.6}
                      step={0.05}
                      value={settings.steeringSensitivity}
                      onChange={(event) => onChange({ steeringSensitivity: Number(event.target.value) })}
                      className="range"
                      style={{ "--value": `${((settings.steeringSensitivity - 0.5) / 1.1) * 100}%` } as React.CSSProperties}
                      aria-label="Steering sensitivity"
                    />
                    <span className="mono w-8 text-right text-[0.7rem] text-[var(--muted)]">{settings.steeringSensitivity.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-3">
                  <label>
                    <span className="section-label !text-[0.46rem]">Default weather</span>
                    <select className="select mt-1" value={settings.weather} onChange={(e) => onChange({ weather: e.target.value as Settings["weather"] })}>
                      <option value="track">Track default</option>
                      <option value="clear">Clear</option>
                      <option value="overcast">Overcast</option>
                      <option value="rain">Monsoon rain</option>
                      <option value="sunset">Golden hour</option>
                      <option value="night">Night</option>
                    </select>
                  </label>
                  <label>
                    <span className="section-label !text-[0.46rem]">Default time</span>
                    <select className="select mt-1" value={settings.timeOfDay} onChange={(e) => onChange({ timeOfDay: e.target.value as Settings["timeOfDay"] })}>
                      <option value="track">Track default</option>
                      <option value="day">Day</option>
                      <option value="sunset">Sunset</option>
                      <option value="night">Night</option>
                    </select>
                  </label>
                  <label>
                    <span className="section-label !text-[0.46rem]">Units</span>
                    <select className="select mt-1" value={settings.units} onChange={(e) => onChange({ units: e.target.value as Settings["units"] })}>
                      <option value="kmh">km/h</option>
                      <option value="mph">mph</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 border-t border-[var(--line)] pt-3">
                  <span className="section-label">HUD elements</span>
                  <div className="mt-1">
                    <Toggle label="Mini-map" description="Track outline and live rival positions." value={settings.hudMinimap} onChange={(v) => onChange({ hudMinimap: v })} />
                    <Toggle label="Standings" description="Live classification panel during a race." value={settings.hudStandings} onChange={(v) => onChange({ hudStandings: v })} />
                  </div>
                </div>
              </div>
            )}

            {tab === "controls" && (
              <div className="animate-fade-in">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                  <div className="flex items-center gap-2">
                    <KeyIcon size={15} className="text-[var(--accent)]" />
                    <span className="section-label">Keyboard bindings</span>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => onChange({ keys: { ...DEFAULT_KEYS } })}>
                    <RestartIcon size={12} /> Reset keys
                  </button>
                </div>
                <p className="mb-3 text-[0.66rem] leading-relaxed text-[var(--muted)]">
                  Click an action, then press the key you want. Escape cancels. Touch controls mirror these actions on
                  mobile. Conflict warnings appear below.
                </p>
                {duplicates.length > 0 && (
                  <div className="mb-3 border border-[rgba(216,163,63,0.4)] bg-[rgba(216,163,63,0.08)] px-3 py-2 text-[0.64rem] text-[#e2c68f]">
                    {duplicates.map((dupe) => (
                      <p key={dupe}>{dupe}</p>
                    ))}
                  </div>
                )}
                {(["Driving", "Gearbox", "View & vehicle", "Session"] as const).map((group) => (
                  <div key={group} className="mb-5">
                    <p className="mb-1.5 font-[var(--font-number)] text-[0.56rem] uppercase tracking-[0.2em] text-[var(--gold)]">{group}</p>
                    <div className="border border-[var(--line)]">
                      {KEY_ACTIONS.filter((action) => action.group === group).map((action) => (
                        <div key={action.key} className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2 last:border-0">
                          <span className="text-[0.72rem] text-white">{action.label}</span>
                          <button
                            className="rebind-btn"
                            data-listening={listening === action.key}
                            onClick={() => setListening(action.key)}
                          >
                            {listening === action.key ? "PRESS A KEY…" : formatKey(settings.keys[action.key])}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-2 border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
                  <InfoIcon size={13} className="mt-0.5 shrink-0 text-[var(--muted)]" />
                  <p className="text-[0.63rem] leading-relaxed text-[var(--muted)]">
                    Arrow keys are accepted as alternate driving inputs. Gamepad and touch support are available in-race;
                    rebinding applies to the active keyboard layout.
                  </p>
                </div>
              </div>
            )}

            {tab === "audio" && (
              <div className="animate-fade-in">
                <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <div className="flex items-center gap-2">
                    <VolumeIcon size={15} className="text-[var(--accent)]" />
                    <span className="section-label">Audio mix</span>
                  </div>
                  <button className="chip" onClick={onToggleSound}>
                    {muted ? <MuteIcon size={11} /> : <VolumeIcon size={11} />} {muted ? "Muted" : "Live"}
                  </button>
                </div>
                <Slider label="Master output" value={settings.master} onChange={(v) => onChange({ master: v })} display={`${Math.round(settings.master * 100)}%`} />
                <Slider label="Music" value={settings.music} onChange={(v) => onChange({ music: v })} display={`${Math.round(settings.music * 100)}%`} />
                <Slider label="Engine & effects" value={settings.sfx} onChange={(v) => onChange({ sfx: v })} display={`${Math.round(settings.sfx * 100)}%`} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn btn-outline btn-sm" onClick={onTestSound}>
                    <VolumeIcon size={12} /> Test audio
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => onChange({ master: 1, music: 0.55, sfx: 1 })}>
                    Full mix
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => onChange({ master: 0.55, music: 0.12, sfx: 0.7 })}>
                    Quiet cruise
                  </button>
                </div>
                <div className="mt-4 border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3">
                  <p className="section-label">About the audio</p>
                  <p className="mt-1.5 text-[0.67rem] leading-relaxed text-[var(--muted)]">
                    The engine note is synthesised live from RPM and throttle with layered oscillators and exhaust noise.
                    Gear changes trigger a pop, turbo boost adds a whoosh, and tyres, rain, wind, gravel and impacts are
                    separate layers. Music is original and generated in the browser. Audio begins only after your first
                    interaction.
                  </p>
                </div>
              </div>
            )}

            {tab === "graphics" && (
              <div className="animate-fade-in">
                <div className="mb-4 flex items-center gap-2 border-b border-[var(--line)] pb-3">
                  <SettingsIcon size={15} className="text-[var(--accent)]" />
                  <span className="section-label">Rendering quality</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {QUALITIES.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => onChange({ quality: option.id })}
                      className={`border p-3 text-left transition ${
                        settings.quality === option.id
                          ? "border-[var(--accent)] bg-[rgba(224,75,42,0.09)]"
                          : "border-[var(--line)] hover:border-[var(--line-strong)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[0.76rem] font-semibold text-white">{option.label}</span>
                        {settings.quality === option.id && <CheckIcon size={13} className="text-[var(--accent)]" />}
                      </div>
                      <p className="mt-1 text-[0.62rem] leading-relaxed text-[var(--muted)]">{option.detail}</p>
                    </button>
                  ))}
                </div>
                <Toggle label="Mini-map" description="Keeps the live track map in the HUD." value={settings.hudMinimap} onChange={(v) => onChange({ hudMinimap: v })} />
                <Toggle label="Standings" description="Keeps the classification tower in the HUD." value={settings.hudStandings} onChange={(v) => onChange({ hudStandings: v })} />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-[var(--line)] p-3">
                  <div className="flex items-center gap-2">
                    <FullscreenIcon size={15} className="text-[var(--muted)]" />
                    <div>
                      <p className="text-[0.72rem] text-white">Fullscreen</p>
                      <p className="text-[0.62rem] text-[var(--muted)]">Recommended for driving.</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      if (document.fullscreenElement) void document.exitFullscreen();
                      else void document.documentElement.requestFullscreen().catch(() => undefined);
                    }}
                  >
                    Toggle
                  </button>
                </div>
                <div className="mt-3 flex items-start gap-2 border border-[var(--line)] px-3 py-2">
                  <WeatherIcon size={13} className="mt-0.5 shrink-0 text-[var(--muted)]" />
                  <p className="text-[0.64rem] leading-relaxed text-[var(--muted)]">
                    Higher quality increases shadow resolution and render scale. The simulation runs at a fixed 60 Hz
                    timestep regardless of frame rate, so physics stays consistent on slower machines.
                  </p>
                </div>
              </div>
            )}

            {tab === "data" && (
              <div className="animate-fade-in">
                <div className="mb-4 flex items-center gap-2 border-b border-[var(--line)] pb-3">
                  <InfoIcon size={15} className="text-[var(--accent)]" />
                  <span className="section-label">Local data & developer</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Events", String(races)],
                    ["Wins", String(wins)],
                    ["Cars", "11"],
                    ["Circuits", "6"],
                  ].map(([label, value]) => (
                    <div key={label} className="border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
                      <p className="section-label !text-[0.44rem]">{label}</p>
                      <p className="mono mt-1 text-[1rem] font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border border-[var(--line)]">
                  <div className="border-b border-[var(--line)] px-3 py-2">
                    <span className="section-label">Personal best lap times</span>
                  </div>
                  <div className="divide-y divide-white/[0.05]">
                    {TRACKS.map((track) => (
                      <div key={track.id} className="flex items-center justify-between px-3 py-2">
                        <span className="text-[0.7rem] text-white">{track.name}</span>
                        <span className="mono text-[0.7rem] font-semibold text-[var(--muted)]">
                          {bestLaps[track.id] ? formatTime(bestLaps[track.id]) : "—:—.———"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 border border-[var(--line)] bg-[rgba(224,75,42,0.05)] p-3">
                  <p className="text-[0.72rem] font-semibold text-white">Created by Asif</p>
                  <p className="mt-1 text-[0.65rem] leading-relaxed text-[var(--muted)]">
                    OVERDRIVE was created and developed by Asif.{" "}
                    <button className="text-[var(--accent)] underline decoration-[rgba(224,75,42,0.4)] underline-offset-2" onClick={() => onNavigate("about")}>
                      Full developer profile and credits
                    </button>
                    .
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <a href="https://asif4517-git.github.io/" target="_blank" rel="noopener noreferrer" className="text-[0.62rem] text-[var(--muted)] underline underline-offset-2 hover:text-white">
                      Portfolio
                    </a>
                    <a href="https://instagram.com/asif_xrk" target="_blank" rel="noopener noreferrer" className="text-[0.62rem] text-[var(--muted)] underline underline-offset-2 hover:text-white">
                      @asif_xrk
                    </a>
                    <a href="mailto:asifsrk4517@gmail.com" className="text-[0.62rem] text-[var(--muted)] underline underline-offset-2 hover:text-white">
                      Email
                    </a>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-[var(--line)] p-3">
                  <div>
                    <p className="text-[0.72rem] font-medium text-white">Reset all progress</p>
                    <p className="mt-0.5 text-[0.62rem] text-[var(--muted)]">Deletes lap records, wins and event counts. Settings are kept.</p>
                  </div>
                  {confirmReset ? (
                    <div className="flex gap-2">
                      <button className="btn btn-danger btn-sm" onClick={() => { onResetData(); setConfirmReset(false); }}>
                        Confirm erase
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={() => setConfirmReset(true)}>
                      <WrenchIcon size={12} /> Reset data
                    </button>
                  )}
                </div>
                <p className="mt-3 text-[0.6rem] leading-relaxed text-[var(--muted)]">
                  Progress is stored in this browser only. Clearing browser data or using a different browser/device will
                  remove it. No account or cloud backup exists.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-4">
              <button className="btn btn-ghost btn-sm" onClick={onReset}>
                <RestartIcon size={12} /> Restore defaults
              </button>
              <div className="flex gap-2">
                <button className="btn btn-outline btn-sm" onClick={() => onNavigate("home")}>
                  Back
                </button>
                <button className="btn btn-primary btn-sm" onClick={onStart}>
                  <GaugeIcon size={12} /> Save & drive
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
