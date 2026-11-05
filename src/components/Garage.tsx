import { CARS, formatTime } from "../game/data";
import type { CarId, CarSpec, ScreenName, TrackDef } from "../game/types";
import { cn } from "../utils/cn";
import { ArrowRight, CarIcon, CheckIcon, ChevronIcon, GaugeIcon } from "./Icons";
import { Button, CAR_IMAGES, GameHeader, PageHeading, StatBar } from "./ui";

interface GarageProps {
  car: CarSpec;
  carId: CarId;
  track: TrackDef;
  bestTime: number | null;
  muted: boolean;
  onToggleSound: () => void;
  onNavigate: (screen: ScreenName) => void;
  onSelect: (id: CarId) => void;
  onContinue: () => void;
  onStartRace: () => void;
}

export const Garage = ({
  car,
  carId,
  track,
  bestTime,
  muted,
  onToggleSound,
  onNavigate,
  onSelect,
  onContinue,
  onStartRace,
}: GarageProps) => (
  <div className="screen scanlines">
    <div className="screen-grid" />
    <div className="relative z-10">
      <GameHeader current="garage" onNavigate={onNavigate} onSound={onToggleSound} muted={muted} onRace={onStartRace} />
      <main className="page-container pb-14 pt-7">
        <PageHeading
          index="01 / 04"
          eyebrow="Vehicle assembly"
          title={
            <>
              The <span style={{ color: car.accentColor }}>garage</span>
            </>
          }
          description="Three purpose-built electric weapons. Pick your character — every machine carries a different balance of top end, launch and rotation."
          right={
            <div className="hidden items-center gap-2 border border-white/10 bg-white/[0.025] px-3 py-2 sm:flex">
              <CarIcon size={15} className="text-[var(--muted)]" />
              <span className="hud-label">Owned 3 / 3</span>
            </div>
          }
        />

        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="track-card group relative min-h-[400px] overflow-hidden p-0 sm:min-h-[470px]" style={{ "--selection": car.accentColor } as React.CSSProperties} data-selected>
            <img src={CAR_IMAGES[car.id]} alt={car.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,4,13,.82)_0%,rgba(5,4,13,.18)_50%,rgba(5,4,13,.55)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,#070811_0%,rgba(7,8,17,0)_55%)]" />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
              <div className="flex items-center gap-2">
                <span className="badge badge-cyan">Selected</span>
                <span className="badge">{car.drivetrain}</span>
              </div>
              <span className="mono text-[0.62rem] tracking-[0.25em] text-white/55">NR / {car.id.toUpperCase()}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[var(--muted)]">{car.maker}</p>
              <h2 className="display mt-1 text-4xl uppercase leading-none text-white sm:text-5xl" style={{ textShadow: `0 0 34px ${car.accentColor}55` }}>
                {car.name}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#c1c4dc]">{car.blurb}</p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 border-r border-white/15 pr-4">
                  <span style={{ color: car.accentColor }}><GaugeIcon size={16} /></span>
                  <div>
                    <p className="hud-label !text-[0.45rem]">Top speed</p>
                    <p className="mono text-sm font-semibold">{Math.round(car.topSpeed * 3.6)} KM/H</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rotate-45" style={{ background: car.accentColor }} />
                  <div>
                    <p className="hud-label !text-[0.45rem]">Best on {track.name}</p>
                    <p className="mono text-sm font-semibold">{bestTime ? formatTime(bestTime) : "UNSET"}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="panel chamfer flex flex-col p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="hud-label">Telemetry / live spec</span>
              <span className="mono text-[0.62rem]" style={{ color: car.accentColor }}>
                {car.klass}
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <StatBar label="Top speed" value={car.stats.speed} color={car.accentColor} suffix={`${Math.round(car.topSpeed * 3.6)} km/h`} segments />
              <StatBar label="Acceleration" value={car.stats.accel} color={car.accentColor} segments />
              <StatBar label="Cornering grip" value={car.stats.grip} color={car.accentColor} segments />
              <StatBar label="Nitro output" value={Math.round(car.nitroPower * 70)} color={car.accentColor} segments />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10">
              {[
                ["Drivetrain", car.drivetrain],
                ["Weight", car.weight],
                ["Chassis", "Carbon monocoque"],
                ["Output", car.id === "spectre" ? "1,020 bhp" : car.id === "ronin" ? "860 bhp" : "940 bhp"],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#090a15] px-3 py-2.5">
                  <p className="hud-label !text-[0.45rem]">{label}</p>
                  <p className="mono mt-1 text-[0.78rem] font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-sm border-l-2 bg-white/[0.025] px-3 py-2.5" style={{ borderColor: car.accentColor }}>
              <p className="text-[0.7rem] leading-relaxed text-[#b6b9d4]">
                <span style={{ color: car.accentColor }}>ENGINEER:</span> {car.blurb}
              </p>
            </div>

            <div className="mt-auto pt-5">
              <Button variant="primary" className="w-full" onClick={onContinue} trailing={<ArrowRight size={16} />}>
                Continue to circuit
              </Button>
              <button className="btn btn-ghost mt-1.5 w-full" onClick={onStartRace} style={{ color: car.accentColor }}>
                Race this machine now
              </button>
            </div>
          </aside>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {CARS.map((item) => {
            const selected = item.id === carId;
            return (
              <button
                key={item.id}
                className="carousel-card group text-left"
                data-selected={selected}
                style={{ "--accent": item.accentColor } as React.CSSProperties}
                onClick={() => onSelect(item.id)}
              >
                <div className="relative aspect-[16/8] overflow-hidden bg-black">
                  <img src={CAR_IMAGES[item.id]} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070812] via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    {selected && <span className="badge badge-cyan !py-1"><CheckIcon size={10} /> Active</span>}
                  </div>
                  <span className="absolute right-3 top-3 mono text-[0.55rem] tracking-widest text-white/50">{item.drivetrain}</span>
                </div>
                <div className="flex items-center justify-between p-3.5">
                  <div>
                    <h3 className="display text-[0.95rem] uppercase text-white">{item.name}</h3>
                    <p className="mt-0.5 font-mono text-[0.55rem] uppercase tracking-[0.15em] text-[var(--muted)]">{item.klass}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      ["S", item.stats.speed],
                      ["A", item.stats.accel],
                      ["G", item.stats.grip],
                    ].map(([label, value]) => (
                      <div key={label as string} className="text-center">
                        <p className="mono text-[0.7rem] font-semibold" style={{ color: item.accentColor }}>
                          {value as number}
                        </p>
                        <p className="hud-label !text-[0.4rem]">{label}</p>
                      </div>
                    ))}
                    <ChevronIcon size={14} className={cn("ml-1 transition", selected ? "text-white" : "text-white/25 group-hover:text-white/60")} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  </div>
);
