import type { CarId, CarSpec, TrackDef, TrackId } from "./types";

export const TRACKS: TrackDef[] = [
  {
    id: "mirage",
    name: "NEON MIRAGE",
    location: "SECTOR 07 // DOWNTOWN",
    tagline: "Downtown never sleeps.",
    description:
      "A high-speed street circuit carved between colossal towers. Long sweepers flow into a technical harbor chicane with barely a metre to spare.",
    laps: 3,
    difficulty: "PRO",
    accent: "#31f4ff",
    accent2: "#ff2ea6",
    skyTop: "#050317",
    skyHorizon: "#31105e",
    fogColor: "#150b2c",
    rx: 176,
    rz: 136,
    harmonicA: 0.15,
    harmonicB: 0.065,
    elevation: 2.4,
    width: 15.5,
    turns: 14,
    lengthLabel: "1.12 KM",
    grip: 1,
  },
  {
    id: "skyway",
    name: "MIDNIGHT SKYWAY",
    location: "ELEVATED ARTERY // NORTH",
    tagline: "Flat out. Zero brakes.",
    description:
      "Elevated overpass racing with massive radius corners and a plunging elevation change. The fastest circuit in the NEON RUSH calendar.",
    laps: 2,
    difficulty: "STREET",
    accent: "#ff2ea6",
    accent2: "#7b5cff",
    skyTop: "#060219",
    skyHorizon: "#4a1046",
    fogColor: "#1c0a2d",
    rx: 258,
    rz: 118,
    harmonicA: 0.1,
    harmonicB: 0.035,
    elevation: 7.5,
    width: 18,
    turns: 9,
    lengthLabel: "1.48 KM",
    grip: 1.08,
  },
  {
    id: "docks",
    name: "CHROME DOCKS",
    location: "TERMINAL 09 // EAST",
    tagline: "Tight lines. Big consequences.",
    description:
      "A narrow technical loop threaded through shipping terminals and holographic cranes. RWD heaven, curb-hopping hell. Your drift inputs matter here.",
    laps: 3,
    difficulty: "EXPERT",
    accent: "#c9ff35",
    accent2: "#20d6ff",
    skyTop: "#020814",
    skyHorizon: "#0b3a52",
    fogColor: "#071c2a",
    rx: 152,
    rz: 168,
    harmonicA: 0.2,
    harmonicB: 0.095,
    elevation: 1.2,
    width: 13.5,
    turns: 17,
    lengthLabel: "0.96 KM",
    grip: 0.92,
  },
];

export const CARS: CarSpec[] = [
  {
    id: "vanta",
    name: "VANTA GT",
    maker: "AERO DYNAMICS",
    klass: "BALANCED // AWD",
    bodyColor: "#172c3b",
    accentColor: "#31f4ff",
    rimColor: "#a9c7d4",
    topSpeed: 68,
    acceleration: 21,
    handling: 1,
    grip: 7.2,
    nitroPower: 1,
    weight: "1,240 KG",
    drivetrain: "AWD",
    blurb:
      "The all-rounder. Linear power, telepathic front-end and enough grip to recover from your worst ideas.",
    spoiler: 1,
    roof: 0.52,
    stats: { speed: 78, accel: 82, grip: 85 },
  },
  {
    id: "spectre",
    name: "SPECTRE X",
    maker: "NIGHT DIVISION",
    klass: "HYPER // RWD",
    bodyColor: "#2c0f2b",
    accentColor: "#ff2ea6",
    rimColor: "#e2b7d9",
    topSpeed: 76,
    acceleration: 19,
    handling: 0.9,
    grip: 6.3,
    nitroPower: 1.18,
    weight: "1,180 KG",
    drivetrain: "RWD",
    blurb:
      "A missile with a licence. Devastating top end and a nitro system that rewrites the horizon.",
    spoiler: 0.8,
    roof: 0.47,
    stats: { speed: 96, accel: 79, grip: 67 },
  },
  {
    id: "ronin",
    name: "RONIN EVO",
    maker: "TORA MOTORWORKS",
    klass: "TIME ATTACK // AWD",
    bodyColor: "#1d2a12",
    accentColor: "#c9ff35",
    rimColor: "#c7d8a8",
    topSpeed: 64,
    acceleration: 25,
    handling: 1.14,
    grip: 8.1,
    nitroPower: 0.94,
    weight: "1,020 KG",
    drivetrain: "AWD",
    blurb:
      "Built for the apex. Explosive launch, savage rotation and the most forgiving drift balance of the grid.",
    spoiler: 1.25,
    roof: 0.56,
    stats: { speed: 68, accel: 95, grip: 96 },
  },
];

export const AI_PALETTE = [
  { name: "KAI 'ZERO' MORROW", color: "#ffb020" },
  { name: "LUNA VOSS", color: "#b56cff" },
  { name: "DEX KOWALSKI", color: "#2dffb0" },
  { name: "RHEA SAINT", color: "#ff5b5b" },
  { name: "ONYX", color: "#d5e0ff" },
];

export const getCar = (id: CarId): CarSpec =>
  CARS.find((car) => car.id === id) ?? CARS[0];

export const getTrack = (id: TrackId): TrackDef =>
  TRACKS.find((track) => track.id === id) ?? TRACKS[0];

export const formatTime = (seconds: number, includeMs = true): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--.---";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  const base = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return includeMs ? `${base}.${ms.toString().padStart(3, "0")}` : base;
};

export const formatGap = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return "---";
  const sign = seconds >= 0 ? "+" : "-";
  const abs = Math.abs(seconds);
  return `${sign}${abs.toFixed(2)}`;
};
