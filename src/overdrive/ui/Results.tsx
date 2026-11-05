import type { CarSpec, RaceResult, ScreenName, TrackDef } from "../types";
import { formatTime, ordinal } from "../types";
import { getMode } from "../data";
import { ArrowRight, CheckIcon, FlagIcon, HomeIcon, RestartIcon, TrophyIcon } from "../../components/Icons";
import { Footer, Header, SectionTitle, TrackMap, carImage } from "./common";

interface ResultsProps {
  result: RaceResult;
  car: CarSpec;
  track: TrackDef;
  previousBest: number | null;
  muted: boolean;
  onSound: () => void;
  onNavigate: (screen: ScreenName) => void;
  onRestart: () => void;
  onGarage: () => void;
  onTracks: () => void;
}

export const Results = ({
  result,
  car,
  track,
  previousBest,
  muted,
  onSound,
  onNavigate,
  onRestart,
  onGarage,
  onTracks,
}: ResultsProps) => {
  const mode = getMode(result.mode);
  const isRace = result.mode === "race" || result.mode === "sprint";
  const headline = isRace
    ? result.won
      ? "Race won"
      : `Finished ${ordinal(result.position)}`
    : result.mode === "drift"
      ? "Drift complete"
      : "Time trial complete";
  const subline = isRace
    ? result.won
      ? "Clean, consistent and quickest when it mattered. The setup worked."
      : "A complete run. Study the lap times, pick a braking point to improve and go again."
    : result.mode === "drift"
      ? "A style run. Link the slides, keep the angle and build the score."
      : "Solo running. Compare your best lap with your personal record.";
  return (
    <div className="screen results-wrap">
      <Header current="results" muted={muted} onNavigate={onNavigate} onSound={onSound} onRace={onRestart} />
      <main className="page-container pb-14 pt-7">
        <SectionTitle
          eyebrow={`${track.name} · ${mode.name}`}
          title={
            <>
              {headline.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-[var(--accent)]">{headline.split(" ").slice(-1)}</span>
            </>
          }
          description={subline}
          right={
            <div className="flex flex-wrap items-center gap-1.5">
              {result.newRecord && (
                <span className="chip chip-green">
                  <CheckIcon size={10} /> New personal best
                </span>
              )}
              {previousBest && !result.newRecord && (
                <span className="chip chip-muted">Record {formatTime(previousBest)}</span>
              )}
              <span className="chip">{track.lengthLabel}</span>
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col gap-4">
            <div className="panel overflow-hidden">
              <div className="relative h-[190px] sm:h-[230px]">
                <img src={carImage(car)} alt={car.model} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,#111316_0%,rgba(17,19,22,0.15)_55%,rgba(17,19,22,0.3)_100%)]" />
                <div className="absolute left-4 top-4 flex gap-1.5">
                  <span className="chip chip-gold">{mode.name}</span>
                  <span className="chip">{car.drivetrain}</span>
                </div>
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <p className="font-[var(--font-number)] text-[0.58rem] uppercase tracking-[0.24em] text-white/60">{car.make}</p>
                    <p className="display text-[1.7rem] leading-none text-white">{car.model}</p>
                  </div>
                  <p className="mono text-[0.62rem] text-white/60">{weatherLabel(result, track)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-4">
                {(isRace
                  ? [
                      { label: "Position", value: ordinal(result.position), accent: result.won },
                      { label: "Total time", value: formatTime(result.totalTime) },
                      { label: "Best lap", value: result.bestLap ? formatTime(result.bestLap) : "—" },
                      { label: "Top speed", value: `${result.topSpeed} km/h` },
                    ]
                  : result.mode === "drift"
                    ? [
                        { label: "Drift score", value: result.driftScore.toLocaleString(), accent: true },
                        { label: "Session time", value: formatTime(result.totalTime) },
                        { label: "Best angle", value: `${Math.round(result.driftScore / Math.max(1, result.laps) / 8)}°` },
                        { label: "Top speed", value: `${result.topSpeed} km/h` },
                      ]
                    : [
                        { label: "Best lap", value: result.bestLap ? formatTime(result.bestLap) : "—", accent: true },
                        { label: "Total time", value: formatTime(result.totalTime) },
                        { label: "Laps", value: String(result.laps) },
                        { label: "Top speed", value: `${result.topSpeed} km/h` },
                      ]
                ).map((stat) => (
                  <div key={stat.label} className="bg-[#121417] px-3 py-3">
                    <p className="section-label !text-[0.44rem]">{stat.label}</p>
                    <p className="mono mt-1 text-[0.95rem] font-semibold" style={{ color: stat.accent ? "var(--accent)" : "#fff" }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                <div className="flex items-center gap-2">
                  <FlagIcon size={14} className="text-[var(--muted)]" />
                  <span className="section-label">Event summary</span>
                </div>
                <span className="mono text-[0.6rem] text-[var(--muted)]">{track.name}</span>
              </div>
              <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
                {[
                  ["Event", mode.name],
                  ["Circuit", track.name],
                  ["Vehicle", `${car.make} ${car.model}`],
                  ["Drivetrain", car.drivetrain],
                  ["Race distance", isRace ? `${result.laps} laps` : `${result.laps} laps`],
                  ["Best lap", result.bestLap ? formatTime(result.bestLap) : "Not set"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-white/[0.06] py-2">
                    <span className="section-label !text-[0.48rem]">{label}</span>
                    <span className="mono text-[0.72rem] font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn btn-primary" onClick={onRestart}>
                  <RestartIcon size={14} /> Run it again
                </button>
                <button className="btn btn-outline" onClick={onGarage}>
                  Change car
                </button>
                <button className="btn btn-outline" onClick={onTracks}>
                  Choose circuit
                </button>
                <button className="btn btn-ghost" onClick={() => onNavigate("home")}>
                  <HomeIcon size={14} /> Home
                </button>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            {isRace && result.standings.length > 1 && (
              <div className="panel">
                <div className="panel-header">
                  <div className="flex items-center gap-2">
                    <TrophyIcon size={14} className="text-[var(--gold)]" />
                    <span className="section-label">Final classification</span>
                  </div>
                  <span className="mono text-[0.58rem] text-[var(--muted)]">{result.standings.length} cars</span>
                </div>
                <div>
                  {result.standings.map((standing) => {
                    const leader = result.standings[0];
                    const gap = standing.position === 1 || standing.isPlayer && result.position === 1 ? "" : `+${Math.max(0, standing.time - leader.time).toFixed(2)}`;
                    return (
                      <div key={`${standing.position}-${standing.name}`} className="result-row" data-player={standing.isPlayer}>
                        <span className={`mono text-center text-[0.8rem] font-bold ${standing.position === 1 ? "text-[var(--gold)]" : standing.isPlayer ? "text-white" : "text-[var(--muted)]"}`}>
                          {standing.position}
                        </span>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-2 w-2 shrink-0" style={{ background: standing.color }} />
                          <div className="min-w-0">
                            <p className={`truncate text-[0.72rem] ${standing.isPlayer ? "font-semibold text-white" : "text-white/75"}`}>
                              {standing.isPlayer ? "You" : standing.name}
                            </p>
                            <p className="truncate font-[var(--font-number)] text-[0.54rem] uppercase tracking-[0.08em] text-[var(--muted)]">{standing.car}</p>
                          </div>
                        </div>
                        <span className="mono text-right text-[0.64rem] text-white/70">
                          {standing.finished ? formatTime(standing.time) : gap || "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="panel p-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                <span className="section-label">Circuit</span>
                <span className="mono text-[0.58rem] text-[var(--muted)]">{track.lengthLabel}</span>
              </div>
              <div className="relative mx-auto mt-2 h-[170px] max-w-[260px]">
                <TrackMap track={track} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="border border-[var(--line)] px-2.5 py-2">
                  <p className="section-label !text-[0.42rem]">Category</p>
                  <p className="mono mt-0.5 text-[0.7rem] text-white">{car.category}</p>
                </div>
                <div className="border border-[var(--line)] px-2.5 py-2">
                  <p className="section-label !text-[0.42rem]">Power</p>
                  <p className="mono mt-0.5 text-[0.7rem] text-white">{car.power} hp</p>
                </div>
              </div>
            </div>

            <div className="panel p-4">
              <p className="section-label">Ready for another run?</p>
              <p className="mt-1 text-[0.68rem] leading-relaxed text-[var(--muted)]">
                Adjust the gearbox, assists or weather in Settings, or try a different machine in the garage.
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                <button className="btn btn-primary w-full !justify-between" onClick={onRestart}>
                  <span className="flex items-center gap-2">
                    <FlagIcon size={13} /> Race again
                  </span>
                  <ArrowRight size={14} />
                </button>
                <button className="btn btn-outline w-full" onClick={() => onNavigate("settings")}>
                  Change setup
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

const weatherLabel = (_result: RaceResult, track: TrackDef) =>
  `${track.weather === "rain" ? "Wet" : track.weather === "night" ? "Night" : track.weather === "sunset" ? "Golden hour" : "Dry"} · ${track.location}`;
