export type ScreenName =
  | "menu"
  | "garage"
  | "circuits"
  | "settings"
  | "howto"
  | "about"
  | "race"
  | "results";

export type Quality = "low" | "medium" | "high";
export type CameraMode = "chase" | "far" | "bumper";

export type TrackId = "mirage" | "skyway" | "docks";
export type CarId = "vanta" | "spectre" | "ronin";

export interface TrackDef {
  id: TrackId;
  name: string;
  location: string;
  tagline: string;
  description: string;
  laps: number;
  difficulty: "STREET" | "PRO" | "EXPERT";
  accent: string;
  accent2: string;
  skyTop: string;
  skyHorizon: string;
  fogColor: string;
  rx: number;
  rz: number;
  harmonicA: number;
  harmonicB: number;
  elevation: number;
  width: number;
  turns: number;
  lengthLabel: string;
  grip: number;
}

export interface CarSpec {
  id: CarId;
  name: string;
  maker: string;
  klass: string;
  bodyColor: string;
  accentColor: string;
  rimColor: string;
  topSpeed: number;
  acceleration: number;
  handling: number;
  grip: number;
  nitroPower: number;
  weight: string;
  drivetrain: string;
  blurb: string;
  spoiler: number;
  roof: number;
  stats: { speed: number; accel: number; grip: number };
}

export interface Settings {
  quality: Quality;
  master: number;
  music: number;
  sfx: number;
  cameraShake: boolean;
  blips: boolean;
}

export interface RaceConfig {
  trackId: TrackId;
  carId: CarId;
  laps: number;
  quality: Quality;
  cameraShake: boolean;
  master: number;
  music: number;
  sfx: number;
}

export interface RacerSnapshot {
  id: string;
  name: string;
  color: string;
  position: number;
  lap: number;
  progress: number;
  x: number;
  y: number;
  isPlayer: boolean;
  finished: boolean;
  time: number;
}

export interface HudState {
  speed: number;
  gear: number;
  rpm: number;
  nitro: number;
  boosting: boolean;
  drifting: boolean;
  driftScore: number;
  position: number;
  totalRacers: number;
  lap: number;
  totalLaps: number;
  time: number;
  lapTime: number;
  bestLap: number | null;
  countdown: number | null;
  wrongWay: boolean;
  checkpoint: string | null;
  standings: RacerSnapshot[];
  topSpeed: number;
  minimap: { x: number; y: number }[];
  cameraMode: CameraMode;
  boostFlash: number;
  shake: number;
  sector: number;
}

export interface Standing {
  position: number;
  name: string;
  car: string;
  color: string;
  time: number;
  laps: number;
  isPlayer: boolean;
  retired?: boolean;
}

export interface RaceResult {
  position: number;
  totalTime: number;
  bestLap: number | null;
  laps: number;
  topSpeed: number;
  trackId: TrackId;
  carId: CarId;
  standings: Standing[];
  won: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  quality: "high",
  master: 0.8,
  music: 0.35,
  sfx: 0.8,
  cameraShake: true,
  blips: true,
};
