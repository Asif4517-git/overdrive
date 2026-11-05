import type { CarSpec, RaceResult, ScreenName, TrackDef } from "../game/types";
import { formatTime } from "../game/data";
import { cn } from "../utils/cn";
import { ArrowRight, BoltIcon, ChevronIcon, FlagIcon, HomeIcon, RestartIcon, TrophyIcon } from "./Icons";
import { Button, CAR_IMAGES, Logo, TrackMap } from "./ui";

interface ResultsProps {
  result: RaceResult;
  car: CarSpec;
  track: TrackDef;
  previousBest: number | null;
  newRecord: boolean;
  totalWins: number;
  onRestart: () => void;
  onGarage: () => void;
  onMenu: () => void;
  onNavigate: (screen: ScreenName) => void;
}

const positionWord = (position: number) => {
  if (position === 1) return "VICTORY";
  if (position === 2) return "P2 PODIUM";
  if (position === 3) return "P3 PODIUM";
  return "RACE COMPLETE";
};

const ordinal = (position: number) => {
  const suffix = position === 1 ? "ST" : position === 2 ? "ND" : position === 3 ? "RD" : "TH";
  return `${position}${suffix}`;
};

export const Results = ({
  result,
  car,
  track,
  previousBest,
  newRecord,
  totalWins,
  onRestart,
  onGarage,
  onMenu,
  onNavigate,
}: ResultsProps) => {
  const winnerTime = result.standings[0]?.time ?? result.totalTime;
  return (
    <div className="screen scanlines">
      <div className="screen-grid" />
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          background: `radial-gradient(circle at 20% 15%, ${track.accent}33, transparent 45%), radial-gradient(circle at 82% 10%, ${track.accent2}33, transparent 42%)`,
        }}
      />
      <div className="page-container relative z-10 flex min-h-dvh flex-col pb-8 pt-5">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Logo compact onClick={onMenu} />
          <div className="flex items-center gap-3">
            <span className="badge badge-cyan">Session complete</span>
            <button className="hidden items-center gap-2 border border-white/10 px-3 py-2 text-[var(--muted)] transition hover:text-white sm:flex" onClick={onMenu}>
              <HomeIcon size={14} />
              <span className="hud-label">Main menu</span>
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-6">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <section>
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn("badge", result.won ? "badge-lime" : "badge-magenta")}>
                  {result.won ? <TrophyIcon size={12} /> : <FlagIcon size={12} />}
                  {result.won ? "Winner" : "Classification final"}
                </span>
                <span className="hud-label">{track.name} // {track.location}</span>
                {newRecord && (
                  <span className="badge badge-cyan animate-fade-in">
                    <BoltIcon size={11} /> New track record
                  </span>
                )}
              </div>

              <h1
                className={cn(
                  "display mt-4 text-[clamp(3rem,7vw,6rem)] uppercase italic leading-[0.84] tracking-[-0.04em]",
                  result.won ? "text-[var(--lime)]" : "text-white"
                )}
                style={result.won ? { textShadow: "0 0 60px rgba(201,255,53,.24)" } : undefined}
              >
                {positionWord(result.position)}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#b8bcd6]">
                {result.won
                  ? "The city is yours. Clean lines, perfect deployment and a grid full of mirrors — that is how a race is won."
                  : result.position <= 3
                    ? "A podium on the grid. There is time left in those corners — find it and come back for the top step."
                    : "The lights went out and the night got away. Brake later, rotate cleaner, deploy earlier. Run it back."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="primary" size="lg" onClick={onRestart} leading={<RestartIcon size={16} />} trailing={<ArrowRight size={16} />}>
                  Race again
                </Button>
                <Button size="lg" onClick={onGarage} leading={<ChevronIcon size={15} />}>
                  Change machine
                </Button>
                <Button size="lg" variant="ghost" onClick={onMenu}>
                  Main menu
                </Button>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4">
                {[
                  { label: "Finish position", value: ordinal(result.position), color: result.won ? "var(--lime)" : "var(--cyan)" },
                  { label: "Race time", value: formatTime(result.totalTime), color: "#fff" },
                  { label: "Best lap", value: result.bestLap ? formatTime(result.bestLap) : "—", color: "#fff" },
                  { label: "Top speed", value: `${result.topSpeed} KM/H`, color: "#fff" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#090a15]/95 px-3.5 py-3">
                    <p className="hud-label !text-[0.46rem]">{stat.label}</p>
                    <p className="mono mt-1.5 text-[0.9rem] font-semibold" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.64rem] text-[var(--muted)]">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rotate-45" style={{ background: car.accentColor }} />
                  {car.name} · {car.klass}
                </span>
                <span>{result.laps} laps completed</span>
                <span>{track.turns} turns</span>
                <span>
                  Total wins <span className="text-white">{totalWins}</span>
                </span>
                {previousBest && !newRecord && <span>Your record {formatTime(previousBest)}</span>}
              </div>
            </section>

            <aside className="panel chamfer overflow-hidden" style={{ animationDelay: "120ms" }}>
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <TrophyIcon size={14} className="text-[var(--lime)]" />
                  <span className="hud-label">Final classification</span>
                </div>
                <span className="mono text-[0.6rem] tracking-widest text-[var(--muted)]">{track.laps} LAPS</span>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {result.standings.map((standing) => (
                  <div
                    key={`${standing.position}-${standing.name}`}
                    className={cn("flex items-center gap-3 px-4 py-2.5", standing.isPlayer && "bg-white/[0.055]")}
                    style={standing.isPlayer ? { boxShadow: `inset 3px 0 0 ${car.accentColor}` } : undefined}
                  >
                    <span className={cn("mono w-5 text-center text-[0.8rem] font-bold", standing.position === 1 ? "text-[var(--lime)]" : standing.isPlayer ? "text-white" : "text-white/35")}>
                      {standing.position}
                    </span>
                    <span className="h-2 w-2 rotate-45" style={{ background: standing.color }} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-[0.74rem] font-medium", standing.isPlayer ? "text-white" : "text-white/70")}>
                        {standing.isPlayer ? "YOU" : standing.name}
                      </p>
                      <p className="font-mono text-[0.52rem] uppercase tracking-wider text-[var(--muted)]">{standing.car}</p>
                    </div>
                    <span className="mono text-[0.68rem] font-semibold text-white/70">
                      {standing.position === 1 ? formatTime(standing.time) : `+${Math.max(0, standing.time - winnerTime).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 p-4">
                <div className="relative h-[120px]">
                  <TrackMap track={track} color={track.accent} showLabels={false} />
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-12 overflow-hidden bg-black">
                      <img src={CAR_IMAGES[car.id]} alt={car.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="hud-label !text-[0.42rem]">Your machine</p>
                      <p className="display text-[0.72rem] uppercase text-white">{car.name}</p>
                    </div>
                  </div>
                  <button className="badge !px-2 hover:bg-white/10" onClick={() => onNavigate("circuits")}>
                    Next circuit <ChevronIcon size={11} />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </main>

        <footer className="flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-[0.58rem] uppercase tracking-[0.22em] text-white/35">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
            Race archived to local profile
          </div>
          <div className="flex gap-4">
            <button className="nav-link" onClick={() => onNavigate("garage")}>Garage</button>
            <button className="nav-link" onClick={() => onNavigate("circuits")}>Circuits</button>
            <button className="nav-link" onClick={() => onNavigate("settings")}>Settings</button>
            <button className="nav-link" onClick={onMenu}>Exit</button>
          </div>
          <p className="mono text-[0.55rem] tracking-[0.18em] text-white/25">NEON RUSH / SESSION {result.totalTime.toFixed(1)}S</p>
        </footer>
      </div>
    </div>
  );
};
