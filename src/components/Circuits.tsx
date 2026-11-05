import { TRACKS, formatTime } from "../game/data";
import type { CarSpec, ScreenName, TrackDef, TrackId } from "../game/types";
import { ArrowRight, BoltIcon, CarIcon, CheckIcon, FlagIcon, GaugeIcon, PlayIcon, TrackIcon, TrophyIcon } from "./Icons";
import { Button, CAR_IMAGES, GameHeader, PageHeading, TrackMap } from "./ui";

interface CircuitsProps {
  car: CarSpec;
  track: TrackDef;
  bestTimes: Partial<Record<TrackId, number>>;
  muted: boolean;
  onToggleSound: () => void;
  onNavigate: (screen: ScreenName) => void;
  onSelect: (id: TrackId) => void;
  onStartRace: () => void;
}

export const Circuits = ({
  car,
  track,
  bestTimes,
  muted,
  onToggleSound,
  onNavigate,
  onSelect,
  onStartRace,
}: CircuitsProps) => (
  <div className="screen scanlines">
    <div className="screen-grid" />
    <div className="relative z-10">
      <GameHeader current="circuits" onNavigate={onNavigate} onSound={onToggleSound} muted={muted} onRace={onStartRace} />
      <main className="page-container pb-14 pt-7">
        <PageHeading
          index="02 / 04"
          eyebrow="World tour / midnight calendar"
          title={
            <>
              Choose your <span className="text-[var(--magenta)]">line</span>
            </>
          }
          description="Three very different ways to lose your licence. Sweeping elevated overpasses, technical dockyard switchbacks and a downtown street circuit built for the brave."
          right={
            <div className="flex items-center gap-3 border border-white/10 px-3 py-2">
              <img src={CAR_IMAGES[car.id]} alt={car.name} className="h-9 w-14 object-cover" />
              <div>
                <p className="hud-label !text-[0.45rem]">Machine</p>
                <p className="display text-[0.8rem] uppercase text-white">{car.name}</p>
              </div>
              <button className="badge !px-2" onClick={() => onNavigate("garage")} aria-label="Change car">
                <CarIcon size={12} />
              </button>
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {TRACKS.map((item) => {
            const selected = item.id === track.id;
            return (
              <article
                key={item.id}
                className="track-card flex flex-col p-0"
                data-selected={selected}
                style={{ "--selection": item.accent } as React.CSSProperties}
              >
                <div className="relative h-[210px] overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_50%,#1a1f3d,#05060f_75%)]">
                  <div className="track-glow opacity-25" />
                  <div
                    className="absolute inset-0 opacity-45"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(110,145,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(110,145,255,.1) 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />
                  <div className="absolute inset-0 p-5 pb-1">
                    <TrackMap track={item} color={item.accent} />
                  </div>
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span className="mono text-[0.58rem] tracking-[0.28em] text-white/40">
                      {item.id.toUpperCase()} / {item.difficulty}
                    </span>
                  </div>
                  {selected && (
                    <div className="absolute right-4 top-4 badge badge-cyan">
                      <CheckIcon size={10} /> Selected
                    </div>
                  )}
                  {bestTimes[item.id] && (
                    <div className="absolute bottom-3 right-4 flex items-center gap-1.5 bg-black/40 px-2 py-1 backdrop-blur-sm">
                      <TrophyIcon size={11} className="text-[var(--lime)]" />
                      <span className="mono text-[0.6rem] font-semibold text-white/80">{formatTime(bestTimes[item.id]!)}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="font-mono text-[0.56rem] uppercase tracking-[0.26em]" style={{ color: item.accent }}>
                    {item.location}
                  </p>
                  <h2 className="display mt-1.5 text-2xl uppercase leading-none text-white">{item.name}</h2>
                  <p className="mt-2 text-[0.78rem] leading-relaxed text-[var(--muted)]">{item.description}</p>

                  <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10">
                    {[
                      { icon: <GaugeIcon size={12} />, label: "Length", value: item.lengthLabel },
                      { icon: <FlagIcon size={12} />, label: "Laps", value: item.laps.toString().padStart(2, "0") },
                      { icon: <BoltIcon size={12} />, label: "Turns", value: item.turns.toString().padStart(2, "0") },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[#090a15] px-2 py-2">
                        <div className="flex items-center gap-1 text-[var(--muted)]">
                          {stat.icon}
                          <span className="hud-label !text-[0.42rem]">{stat.label}</span>
                        </div>
                        <p className="mono mt-1 text-[0.72rem] font-semibold text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="hud-label !text-[0.48rem]">Grip level</span>
                    <div className="flex flex-1 gap-[3px]">
                      {Array.from({ length: 10 }, (_, i) => (
                        <span
                          key={i}
                          className="h-1 flex-1"
                          style={{ background: i < Math.round(item.grip * 9) ? item.accent : "rgba(255,255,255,.09)", boxShadow: i < item.grip * 9 ? `0 0 6px ${item.accent}66` : "none" }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    className={selected ? "btn btn-primary mt-4 w-full py-3" : "btn btn-outline mt-4 w-full py-3"}
                    onClick={() => {
                      onSelect(item.id);
                      if (selected) onStartRace();
                    }}
                  >
                    {selected ? (
                      <>
                        <PlayIcon size={14} /> Start this circuit
                      </>
                    ) : (
                      <>
                        <TrackIcon size={14} /> Select circuit
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="panel chamfer flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
            <div className="relative h-20 w-32 shrink-0 overflow-hidden bg-black">
              <img src={CAR_IMAGES[car.id]} alt={car.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0b0c1a]" />
            </div>
            <div className="flex-1">
              <p className="hud-label">Race setup locked</p>
              <p className="display mt-1 text-lg uppercase text-white">
                {car.name} <span className="mx-2 text-white/25">/</span> {track.name}
              </p>
              <p className="mt-1 text-[0.72rem] text-[var(--muted)]">
                {track.laps} laps · 6-car grid · standing start · dry asphalt · automated traction control
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button variant="primary" onClick={onStartRace} trailing={<ArrowRight size={16} />}>
                Start engine
              </Button>
            </div>
          </div>
          <div className="hidden items-center gap-4 border border-white/10 px-5 lg:flex">
            <div className="text-center">
              <p className="hud-label !text-[0.45rem]">Grid</p>
              <p className="mono text-lg font-semibold">06</p>
            </div>
            <span className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="hud-label !text-[0.45rem]">Weather</p>
              <p className="mono text-lg font-semibold">CLEAR</p>
            </div>
            <span className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="hud-label !text-[0.45rem]">Surface</p>
              <p className="mono text-lg font-semibold">DRY</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
);
