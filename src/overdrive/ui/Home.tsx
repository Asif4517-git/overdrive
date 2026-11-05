import type { CarSpec, RaceMode, ScreenName, Settings, TrackDef } from "../types";
import { MODES, WEATHER_LABEL } from "../data";
import { formatTime } from "../types";
import { ArrowRight, BoltIcon, CameraIcon, CarIcon, FlagIcon, GaugeIcon, KeyIcon, TrophyIcon } from "../../components/Icons";
import hero from "../../assets/od-hero.jpg";
import { Footer, Header, StatBar, TrackMap, carImage } from "./common";

interface HomeProps {
  car: CarSpec;
  track: TrackDef;
  mode: RaceMode;
  settings: Settings;
  bestLap: number | null;
  muted: boolean;
  onNavigate: (screen: ScreenName) => void;
  onMode: (mode: RaceMode) => void;
  onChange: (patch: Partial<Settings>) => void;
  onStart: () => void;
  onSound: () => void;
}

export const Home = ({ car, track, mode, settings, bestLap, muted, onNavigate, onMode, onChange, onStart, onSound }: HomeProps) => {
  const modeInfo = MODES.find((m) => m.id === mode) ?? MODES[0];
  const weather = settings.weather === "track" ? track.weather : settings.weather;
  const timeOfDay = settings.timeOfDay === "track" ? track.timeOfDay : settings.timeOfDay;
  return (
    <div className="screen">
      <Header current="home" muted={muted} onNavigate={onNavigate} onSound={onSound} onRace={onStart} />
      <section className="hero">
        <div className="hero-image" style={{ backgroundImage: `url(${hero})` }} />
        <div className="page-container relative z-10 grid flex-1 items-center gap-8 py-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="max-w-2xl">
            <div className="animate-fade-up flex flex-wrap items-center gap-2">
              <span className="chip chip-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                Realistic driving
              </span>
              <span className="chip">11 cars · 6 circuits</span>
              <span className="chip chip-muted">No downloads</span>
            </div>
            <h1 className="hero-title mt-5 animate-fade-up text-white" style={{ animationDelay: "50ms" }}>
              Real roads.
              <br />
              Real machines.
              <br />
              <span className="accent">Pure driving.</span>
            </h1>
            <p className="mt-5 max-w-lg animate-fade-up text-[0.88rem] leading-relaxed text-[#c3c5c4]" style={{ animationDelay: "110ms" }}>
              A browser driving game with a real gearbox, a torque curve, changing weather and actual grip limits.
              Take a 500 hp rear-drive saloon up a wet ghat road — or pick the hatchback and learn the racing line.
            </p>
            <div className="mt-6 flex animate-fade-up flex-wrap items-center gap-2.5" style={{ animationDelay: "160ms" }}>
              <button className="btn btn-primary btn-lg" onClick={onStart}>
                <FlagIcon size={15} />
                Drive now
                <ArrowRight size={15} />
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => onNavigate("garage")}>
                <CarIcon size={15} />
                Choose a car
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => onNavigate("tracks")}>
                Circuits
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="mt-7 grid max-w-xl animate-fade-up grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4" style={{ animationDelay: "220ms" }}>
              {[
                { label: "Vehicle", value: car.model },
                { label: "Circuit", value: track.name },
                { label: "Transmission", value: settings.transmission === "auto" ? "Automatic" : "Manual" },
                { label: "Best lap", value: bestLap ? formatTime(bestLap) : "—:—.———" },
              ].map((item) => (
                <div key={item.label} className="bg-[#0c0e10]/90 px-3 py-2.5">
                  <p className="section-label !text-[0.46rem]">{item.label}</p>
                  <p className="mono mt-1 truncate text-[0.72rem] font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 hidden max-w-xl grid-cols-2 gap-x-5 gap-y-2 animate-fade-up sm:grid">
              {[
                { icon: <GaugeIcon size={13} />, text: "RPM, torque curve and real gear ratios" },
                { icon: <BoltIcon size={13} />, text: "Wet-weather grip and hydroplaning risk" },
                { icon: <KeyIcon size={13} />, text: "Fully rebindable keyboard controls" },
                { icon: <CameraIcon size={13} />, text: "Chase, hood and right-hand-drive cockpit" },
                { icon: <CarIcon size={13} />, text: "11 cars: hatchbacks, SUVs and supercars" },
                { icon: <TrophyIcon size={13} />, text: "Race, time trial, sprint and drift modes" },
              ].map((feature) => (
                <div key={feature.text} className="feature-line">
                  <span className="text-[var(--accent)]">{feature.icon}</span>
                  <span className="text-[0.71rem]">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="animate-fade-up lg:justify-self-end lg:w-full lg:max-w-[430px]" style={{ animationDelay: "120ms" }}>
            <div className="setup-panel">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rotate-45 bg-[var(--accent)]" />
                  <span className="section-label">Race setup</span>
                </div>
                <span className="mono text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">
                  {modeInfo.tag}
                </span>
              </div>

              <div className="relative h-[170px] overflow-hidden border-b border-[var(--line)] bg-[#0b0d10]">
                <img src={carImage(car)} alt={`${car.make} ${car.model}`} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d10] via-transparent to-transparent" />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <span className="chip chip-accent">{car.category}</span>
                  <span className="chip">{car.drivetrain}</span>
                </div>
                <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                  <div>
                    <p className="mono text-[0.54rem] uppercase tracking-[0.2em] text-[var(--muted)]">{car.make}</p>
                    <p className="display text-[1.35rem] leading-none text-white">{car.model}</p>
                  </div>
                  <button className="chip chip-muted transition hover:text-white" onClick={() => onNavigate("garage")}>
                    Change
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[var(--line)] border-b border-[var(--line)]">
                <div className="px-3 py-2">
                  <StatBar label="Power" value={(car.power / 830) * 100} suffix={`${car.power} hp`} />
                </div>
                <div className="px-3 py-2">
                  <StatBar label="0–100" value={Math.max(10, 100 - car.zeroTo100 * 22)} suffix={`${car.zeroTo100}s`} gold />
                </div>
                <div className="px-3 py-2">
                  <StatBar label="Top speed" value={(car.topSpeed / 335) * 100} suffix={`${car.topSpeed}`} />
                </div>
              </div>

              <div className="p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="section-label">Event type</span>
                  <span className="section-label !text-[0.46rem] text-[var(--muted)]">{modeInfo.description}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {MODES.map((m) => (
                    <button key={m.id} className="mode-tab" data-active={mode === m.id} onClick={() => onMode(m.id)}>
                      <span className="mode-name">{m.name}</span>
                      <span className="mode-tag">{m.tag}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="h-12 w-16 shrink-0">
                      <TrackMap track={track} />
                    </div>
                    <div className="min-w-0">
                      <p className="section-label !text-[0.44rem]">Circuit</p>
                      <p className="truncate text-[0.72rem] font-semibold text-white">{track.name}</p>
                      <p className="truncate font-[var(--font-number)] text-[0.58rem] text-[var(--muted)]">{track.location}</p>
                    </div>
                  </div>
                  <button className="chip !px-2 !text-[0.54rem]" onClick={() => onNavigate("tracks")}>
                    Change
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="section-label !text-[0.45rem]">Conditions</span>
                    <select
                      className="select mt-1"
                      value={settings.weather}
                      onChange={(event) => onChange({ weather: event.target.value as Settings["weather"] })}
                      aria-label="Weather"
                    >
                      <option value="track">Track default</option>
                      <option value="clear">Clear</option>
                      <option value="overcast">Overcast</option>
                      <option value="rain">Monsoon rain</option>
                      <option value="sunset">Golden hour</option>
                      <option value="night">Night</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="section-label !text-[0.45rem]">Time of day</span>
                    <select
                      className="select mt-1"
                      value={settings.timeOfDay}
                      onChange={(event) => onChange({ timeOfDay: event.target.value as Settings["timeOfDay"] })}
                      aria-label="Time of day"
                    >
                      <option value="track">Track default</option>
                      <option value="day">Day</option>
                      <option value="sunset">Sunset</option>
                      <option value="night">Night</option>
                    </select>
                  </label>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--line)] pt-2.5">
                  <div className="flex items-center gap-2">
                    <span className="section-label !text-[0.46rem]">Gearbox</span>
                    <div className="flex border border-[var(--line)]">
                      {(["auto", "manual"] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => onChange({ transmission: option })}
                          className={`px-2 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.08em] ${
                            settings.transmission === option ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-white"
                          }`}
                        >
                          {option === "auto" ? "Auto" : "Manual"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="mono text-[0.58rem] text-[var(--muted)]">
                    {WEATHER_LABEL[weather]} · {timeOfDay === "day" ? "Day" : timeOfDay === "sunset" ? "Sunset" : "Night"}
                  </span>
                </div>

                <button className="btn btn-primary mt-3.5 w-full !justify-between" onClick={onStart}>
                  <span className="flex items-center gap-2">
                    <FlagIcon size={14} />
                    Ignition
                  </span>
                  <span className="flex items-center gap-2">
                    {track.laps > 1 ? `${mode === "sprint" ? 1 : track.laps} laps` : "Style run"}
                    <ArrowRight size={15} />
                  </span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
