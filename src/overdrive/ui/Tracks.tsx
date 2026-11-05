import { useMemo, useState } from "react";
import type { CarSpec, ScreenName, TrackDef, TrackId } from "../types";
import { formatTime } from "../types";
import { TRACKS, WEATHER_LABEL, getMode } from "../data";
import type { RaceMode } from "../types";
import { ArrowRight, CarIcon, FlagIcon, TrackIcon, TrophyIcon, WeatherIcon } from "../../components/Icons";
import { Footer, Header, SectionTitle, TrackMap, carImage } from "./common";

interface TracksProps {
  car: CarSpec;
  track: TrackDef;
  mode: RaceMode;
  bestLaps: Record<string, number>;
  muted: boolean;
  onSelect: (id: TrackId) => void;
  onNavigate: (screen: ScreenName) => void;
  onSound: () => void;
  onStart: () => void;
}

const FILTERS = [
  { id: "all", label: "All circuits" },
  { id: "circuit", label: "Circuits" },
  { id: "coast", label: "Coastal" },
  { id: "hill", label: "Hill roads" },
  { id: "city", label: "City" },
] as const;

const THEME_LABEL: Record<string, string> = {
  circuit: "Permanent circuit",
  coast: "Coastal road",
  hill: "Hill road",
  city: "Street circuit",
};

export const Tracks = ({ car, track, mode, bestLaps, muted, onSelect, onNavigate, onSound, onStart }: TracksProps) => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const visible = useMemo(() => (filter === "all" ? TRACKS : TRACKS.filter((t) => t.theme === filter)), [filter]);
  const modeInfo = getMode(mode);
  return (
    <div className="screen">
      <Header current="tracks" muted={muted} onNavigate={onNavigate} onSound={onSound} onRace={onStart} />
      <main className="page-container pb-14 pt-7">
        <SectionTitle
          index="02"
          eyebrow="World tour"
          title={
            <>
              Choose the <span className="text-[var(--accent)]">road</span>
            </>
          }
          description="Six hand-built environments inspired by real Indian and international driving locations. Permanent circuits, a coastal sprint, wet ghat roads and a night street run — each with its own grip level and surface character."
          right={
            <div className="flex items-center gap-2 border border-[var(--line)] px-3 py-2">
              <TrackIcon size={14} className="text-[var(--muted)]" />
              <span className="section-label">{TRACKS.length} locations</span>
            </div>
          }
        />

        <div className="mb-4 flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`border px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.08em] transition ${
                filter === item.id
                  ? "border-[var(--accent)] bg-[rgba(224,75,42,0.12)] text-white"
                  : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => {
            const selected = item.id === track.id;
            const best = bestLaps[item.id];
            return (
              <article key={item.id} className="track-card" data-active={selected}>
                <div className="track-map relative h-[180px] overflow-hidden border-b border-[var(--line)]">
                  <div className="absolute inset-0 p-4">
                    <TrackMap track={item} accent={selected ? "var(--accent)" : "#b9bdc0"} />
                  </div>
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <span className={`chip ${item.difficulty === "TECHNICAL" ? "chip-gold" : "chip-muted"}`}>{item.difficulty}</span>
                    {best && (
                      <span className="chip chip-green">
                        <TrophyIcon size={10} /> {formatTime(best)}
                      </span>
                    )}
                  </div>
                  <span className="absolute right-3 top-3 font-[var(--font-number)] text-[0.58rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                    {THEME_LABEL[item.theme]}
                  </span>
                  {selected && <span className="absolute bottom-3 left-3 chip chip-accent">Selected</span>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-[var(--font-number)] text-[0.56rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                    {item.location}
                  </p>
                  <h2 className="display mt-1 text-[1.35rem] leading-none text-white">{item.name}</h2>
                  <p className="mt-2 line-clamp-3 text-[0.7rem] leading-relaxed text-[var(--muted)]">{item.description}</p>

                  <div className="mt-3 grid grid-cols-3 gap-px border border-[var(--line)] bg-[var(--line)]">
                    {[
                      ["Length", item.lengthLabel],
                      ["Laps", String(item.laps).padStart(2, "0")],
                      ["Grip", `${Math.round(item.grip * 100)}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-[#111316] px-2 py-1.5">
                        <p className="section-label !text-[0.4rem]">{label}</p>
                        <p className="mono mt-0.5 text-[0.7rem] font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-[var(--line)] pt-2.5">
                    <span className="flex items-center gap-1.5 font-[var(--font-number)] text-[0.6rem] text-[var(--muted)]">
                      <WeatherIcon size={12} />
                      {WEATHER_LABEL[item.weather]} · {item.timeOfDay === "day" ? "Day" : item.timeOfDay === "sunset" ? "Sunset" : "Night"}
                    </span>
                    <button
                      className={selected ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
                      onClick={() => {
                        onSelect(item.id);
                        if (selected) onStart();
                      }}
                    >
                      {selected ? (
                        <>
                          <FlagIcon size={12} /> Drive
                        </>
                      ) : (
                        "Select"
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="panel mt-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-black">
              <img src={carImage(car)} alt={car.model} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#131518]" />
            </div>
            <div className="min-w-0">
              <p className="section-label !text-[0.46rem]">Current setup</p>
              <p className="mt-0.5 truncate text-[0.85rem] font-semibold text-white">
                {car.make} {car.model} <span className="mx-1.5 text-white/25">/</span> {track.name}
              </p>
              <p className="mt-0.5 font-[var(--font-number)] text-[0.62rem] text-[var(--muted)]">
                {modeInfo.name} · {mode === "sprint" ? 1 : track.laps} laps · {WEATHER_LABEL[track.weather]} ·{" "}
                {track.difficulty.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-outline" onClick={() => onNavigate("garage")}>
              <CarIcon size={13} /> Garage
            </button>
            <button className="btn btn-primary" onClick={onStart}>
              <FlagIcon size={13} /> Start event <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <p className="mt-4 text-[0.62rem] leading-relaxed text-[var(--muted)]">
          Circuit names and locations are used as references to real places. Road layouts and surroundings are original
          interpretations built for this game, not surveyed or officially licensed reproductions.
        </p>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
