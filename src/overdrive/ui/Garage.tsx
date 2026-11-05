import { useMemo, useState } from "react";
import type { CarId, CarSpec, ScreenName, Settings, TrackDef } from "../types";
import { formatTime } from "../types";
import { CarIcon, FlagIcon, GaugeIcon, TrophyIcon } from "../../components/Icons";
import { Footer, Header, KeyValue, SectionTitle, StatBar, carImage } from "./common";
import { VehicleViewer } from "./VehicleViewer";
import type { ViewerAngle } from "./VehicleViewer";

interface GarageProps {
  cars: CarSpec[];
  car: CarSpec;
  track: TrackDef;
  settings: Settings;
  bestLap: number | null;
  muted: boolean;
  onSelect: (id: CarId) => void;
  onNavigate: (screen: ScreenName) => void;
  onSound: () => void;
  onStart: () => void;
}

const FILTERS = ["All", "Indian", "Performance", "Supercar", "Off-road", "Rally"] as const;

export const Garage = ({ cars, car, track, settings, bestLap, muted, onSelect, onNavigate, onSound, onStart }: GarageProps) => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [view, setView] = useState<ViewerAngle>("threequarter");
  const visible = useMemo(() => (filter === "All" ? cars : cars.filter((c) => c.category === filter)), [cars, filter]);
  return (
    <div className="screen">
      <Header current="garage" muted={muted} onNavigate={onNavigate} onSound={onSound} onRace={onStart} />
      <main className="page-container pb-14 pt-7">
        <SectionTitle
          index="01"
          eyebrow="Vehicle collection"
          title={
            <>
              The <span className="text-[var(--accent)]">garage</span>
            </>
          }
          description="Eleven real production machines, each with its own mass, torque, gear ratios, drivetrain and grip ceiling. A hatchback and a 819 hp hybrid do not drive the same — and they shouldn't."
          right={
            <div className="flex items-center gap-2">
              <a href="#models" className="btn btn-outline btn-sm">Model studio</a>
              <div className="flex items-center gap-2 border border-[var(--line)] px-3 py-2">
                <CarIcon size={14} className="text-[var(--muted)]" />
                <span className="section-label">{cars.length} available</span>
              </div>
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="panel flex max-h-[760px] flex-col">
            <div className="border-b border-[var(--line)] p-2">
              <div className="flex flex-wrap gap-1">
                {FILTERS.map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`px-2 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.06em] transition ${
                      filter === item ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
              {visible.map((item) => (
                <button
                  key={item.id}
                  className="car-card mb-1"
                  data-active={item.id === car.id}
                  onClick={() => onSelect(item.id)}
                >
                  <img src={carImage(item)} alt={`${item.make} ${item.model}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-[var(--font-number)] text-[0.55rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {item.make}
                    </span>
                    <span className="block truncate text-[0.78rem] font-semibold text-white">{item.model}</span>
                    <span className="mt-0.5 flex items-center gap-2 font-[var(--font-number)] text-[0.58rem] text-[var(--muted)]">
                      <span>{item.power} hp</span>
                      <span className="h-2.5 w-px bg-[var(--line-strong)]" />
                      <span>{item.drivetrain}</span>
                    </span>
                  </span>
                  {item.id === car.id && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />}
                </button>
              ))}
              {visible.length === 0 && <p className="p-4 text-[0.72rem] text-[var(--muted)]">No cars in this category.</p>}
            </div>
          </aside>

          <div className="flex flex-col gap-4">
            <section className="panel overflow-hidden">
              <div className="relative bg-[#0b0d10]">
                <VehicleViewer car={car} quality={settings.quality} angle={view} height={380} />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(16,18,20,0.92)_0%,rgba(16,18,20,0.05)_34%,rgba(16,18,20,0.3)_100%)]" />
                <div className="pointer-events-none absolute left-4 top-12 flex flex-wrap gap-1.5">
                  <span className="chip chip-accent">{car.category}</span>
                  <span className="chip">{car.drivetrain}</span>
                  <span className="chip">{car.year}</span>
                </div>
                <div className="absolute bottom-3 left-0 right-0 flex items-end justify-between gap-3 px-4 sm:px-5">
                  <div>
                    <p className="font-[var(--font-number)] text-[0.58rem] uppercase tracking-[0.28em] text-[var(--muted)]">{car.make}</p>
                    <h2 className="display text-[2rem] leading-none text-white sm:text-[2.6rem]">{car.model}</h2>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {(["front", "threequarter", "side", "rear"] as ViewerAngle[]).map((angle) => (
                      <button
                        key={angle}
                        onClick={() => setView(angle)}
                        className={`border px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.08em] transition ${
                          view === angle
                            ? "border-[var(--accent)] bg-[rgba(224,75,42,0.2)] text-white"
                            : "border-white/20 bg-black/40 text-white/60 hover:text-white"
                        }`}
                      >
                        {angle === "threequarter" ? "3/4" : angle}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="absolute right-4 top-11 text-right font-[var(--font-number)] text-[0.52rem] uppercase tracking-[0.12em] text-white/45">
                  {car.body.toUpperCase()} · {car.mass} kg
                </p>
              </div>
              <div className="border-t border-[var(--line)] px-4 py-3">
                <p className="text-[0.76rem] leading-relaxed text-[#c4c6c4]">{car.blurb}</p>
              </div>
              <div className="grid grid-cols-2 gap-px border-t border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
                {[
                  { label: "Power", value: `${car.power} hp` },
                  { label: "Torque", value: `${car.torque} Nm` },
                  { label: "Weight", value: `${car.mass} kg` },
                  { label: "0–100 km/h", value: `${car.zeroTo100}s` },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#121417] px-3 py-2.5">
                    <p className="section-label !text-[0.46rem]">{stat.label}</p>
                    <p className="mono mt-1 text-[0.92rem] font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <section className="panel p-4">
                <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                  <span className="section-label">Performance profile</span>
                  <span className="mono text-[0.6rem] text-[var(--muted)]">{track.name}</span>
                </div>
                <div className="space-y-3">
                  <StatBar label="Power / weight" value={Math.min(100, (car.power / car.mass) * 220)} suffix={`${(car.power / car.mass * 1000).toFixed(0)} hp/t`} />
                  <StatBar label="Top speed" value={(car.topSpeed / 335) * 100} suffix={`${car.topSpeed} km/h`} gold />
                  <StatBar label="Grip ceiling" value={car.grip * 9.5} suffix={`${car.grip.toFixed(1)}`} />
                  <StatBar label="Handling balance" value={car.handling * 70} suffix={car.drivetrain} gold />
                </div>
                <div className="mt-4 border-t border-[var(--line)] pt-2">
                  <KeyValue label="Gearbox" value={`${car.gears.length}-speed`} />
                  <KeyValue label="Final drive" value={car.finalDrive.toFixed(2)} />
                  <KeyValue label="Redline" value={`${car.redline.toLocaleString()} rpm`} />
                  <KeyValue label="Best lap here" value={bestLap ? formatTime(bestLap) : "Not set"} />
                </div>
              </section>

              <section className="panel p-4">
                <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                  <span className="section-label">Vehicle notes</span>
                  <TrophyIcon size={14} className="text-[var(--gold)]" />
                </div>
                <ul className="space-y-2">
                  {car.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2 text-[0.72rem] text-[#c3c5c3]">
                      <span className="mt-1.5 h-1 w-1 shrink-0 bg-[var(--accent)]" />
                      {highlight}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 border-l-2 border-[var(--gold)] bg-[rgba(201,164,104,0.06)] px-3 py-2">
                  <p className="section-label !text-[0.46rem]">Driving character</p>
                  <p className="mt-1 text-[0.7rem] leading-relaxed text-[var(--muted)]">
                    {car.body === "suv" || car.body === "offroad"
                      ? "Heavy and high. Brake earlier, let the body settle, then get on the power gently."
                      : car.body === "hatch" || car.body === "sedan"
                        ? "Light and forgiving. Momentum and clean lines matter more than raw power."
                        : "High grip and a sharp front end. Respect the throttle on corner exit — especially in the wet."}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="btn btn-primary" onClick={onStart}>
                    <FlagIcon size={14} />
                    Drive
                  </button>
                  <button className="btn btn-outline" onClick={() => onNavigate("tracks")}>
                    <GaugeIcon size={14} />
                    Circuits
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
        <p className="mt-5 border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-[0.63rem] leading-relaxed text-[var(--muted)]">
          Vehicle names identify real production models for context. OVERDRIVE is an unofficial fan project and is not
          affiliated with, sponsored by or endorsed by any manufacturer. Specifications are approximate published figures.
        </p>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
