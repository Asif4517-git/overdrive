export type ScreenName = "home" | "garage" | "tracks" | "settings" | "about" | "race" | "results";

export type Quality = "low" | "medium" | "high";
export type Weather = "clear" | "overcast" | "rain" | "sunset" | "night";
export type TimeOfDay = "day" | "sunset" | "night";
export type RaceMode = "race" | "time" | "sprint" | "drift";
export type Transmission = "auto" | "manual";
export type CameraMode = "chase" | "far" | "hood" | "cockpit";
export type BodyStyle = "hatch" | "sedan" | "suv" | "sports" | "super" | "offroad";
export type TrackTheme = "circuit" | "coast" | "hill" | "city";

export type CarId =
  | "swift"
  | "city"
  | "seltos"
  | "fortuner"
  | "thar"
  | "m3"
  | "m5"
  | "gt3"
  | "gtr"
  | "f296"
  | "wrx";

export type TrackId =
  | "ng-speedway"
  | "kari-circuit"
  | "ecr-coast"
  | "munnar-climb"
  | "lonavala-ghat"
  | "mumbai-street";

export interface CarSpec {
  id: CarId;
  make: string;
  model: string;
  year: number;
  category: "Indian" | "Performance" | "Supercar" | "Off-road" | "Rally";
  body: BodyStyle;
  color: string;
  accent: string;
  wheelColor: string;
  power: number;
  torque: number;
  mass: number;
  drivetrain: "FWD" | "RWD" | "AWD" | "4WD";
  topSpeed: number;
  zeroTo100: number;
  gears: number[];
  finalDrive: number;
  redline: number;
  idle: number;
  grip: number;
  handling: number;
  brakePower: number;
  blurb: string;
  highlights: string[];
}

export interface TrackDef {
  id: TrackId;
  name: string;
  location: string;
  theme: TrackTheme;
  description: string;
  rx: number;
  rz: number;
  harmonicA: number;
  harmonicB: number;
  elevation: number;
  width: number;
  laps: number;
  lengthLabel: string;
  difficulty: "ROAD" | "SPORT" | "TECHNICAL";
  weather: Weather;
  timeOfDay: TimeOfDay;
  grip: number;
  accent: string;
  skyTop: string;
  skyHorizon: string;
  fog: string;
  terrain: string;
}

export interface KeyBindings {
  accelerate: string;
  brake: string;
  left: string;
  right: string;
  handbrake: string;
  shiftUp: string;
  shiftDown: string;
  camera: string;
  headlights: string;
  reset: string;
  lookBack: string;
  pause: string;
}

export interface Settings {
  quality: Quality;
  master: number;
  music: number;
  sfx: number;
  transmission: Transmission;
  camera: CameraMode;
  weather: Weather | "track";
  timeOfDay: TimeOfDay | "track";
  damage: boolean;
  assists: boolean;
  hudMinimap: boolean;
  hudStandings: boolean;
  steeringSensitivity: number;
  units: "kmh" | "mph";
  showRacingLine: boolean;
  keys: KeyBindings;
}

export interface RaceConfig {
  trackId: TrackId;
  carId: CarId;
  mode: RaceMode;
  weather: Weather;
  timeOfDay: TimeOfDay;
  quality: Quality;
  transmission: Transmission;
  camera: CameraMode;
  damage: boolean;
  assists: boolean;
  sensitivity: number;
  keys: KeyBindings;
}

export interface RacerSnapshot {
  id: string;
  name: string;
  car: string;
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
  rpm: number;
  gear: string;
  gearNumber: number;
  redline: number;
  fuel: number;
  damage: number;
  position: number;
  totalRacers: number;
  lap: number;
  totalLaps: number;
  time: number;
  lapTime: number;
  bestLap: number | null;
  countdown: number | null;
  drifting: boolean;
  driftAngle: number;
  driftScore: number;
  mode: RaceMode;
  weather: Weather;
  timeOfDay: TimeOfDay;
  carName: string;
  trackName: string;
  wrongWay: boolean;
  checkpoint: string | null;
  standings: RacerSnapshot[];
  minimap: { x: number; y: number }[];
  camera: CameraMode;
  boosting: boolean;
  topSpeed: number;
  sector: number;
  traction: number;
  message: string | null;
}

export interface Standing {
  position: number;
  name: string;
  car: string;
  color: string;
  time: number;
  bestLap: number | null;
  isPlayer: boolean;
  finished: boolean;
}

export interface RaceResult {
  mode: RaceMode;
  position: number;
  totalTime: number;
  bestLap: number | null;
  laps: number;
  topSpeed: number;
  driftScore: number;
  trackId: TrackId;
  carId: CarId;
  standings: Standing[];
  won: boolean;
  newRecord: boolean;
}

export const DEFAULT_KEYS: KeyBindings = {
  accelerate: "KeyW",
  brake: "KeyS",
  left: "KeyA",
  right: "KeyD",
  handbrake: "Space",
  shiftUp: "KeyE",
  shiftDown: "KeyQ",
  camera: "KeyC",
  headlights: "KeyL",
  reset: "KeyR",
  lookBack: "KeyB",
  pause: "Escape",
};

export const DEFAULT_SETTINGS: Settings = {
  quality: "high",
  master: 0.85,
  music: 0.3,
  sfx: 0.85,
  transmission: "auto",
  camera: "chase",
  weather: "track",
  timeOfDay: "track",
  damage: true,
  assists: true,
  hudMinimap: true,
  hudStandings: true,
  steeringSensitivity: 1,
  units: "kmh",
  showRacingLine: false,
  keys: { ...DEFAULT_KEYS },
};

export const KEY_ACTIONS: { key: keyof KeyBindings; label: string; group: "Driving" | "Gearbox" | "View & vehicle" | "Session" }[] = [
  { key: "accelerate", label: "Accelerate", group: "Driving" },
  { key: "brake", label: "Brake / reverse", group: "Driving" },
  { key: "left", label: "Steer left", group: "Driving" },
  { key: "right", label: "Steer right", group: "Driving" },
  { key: "handbrake", label: "Handbrake", group: "Driving" },
  { key: "shiftUp", label: "Shift up", group: "Gearbox" },
  { key: "shiftDown", label: "Shift down", group: "Gearbox" },
  { key: "camera", label: "Change camera", group: "View & vehicle" },
  { key: "headlights", label: "Headlights", group: "View & vehicle" },
  { key: "lookBack", label: "Look back", group: "View & vehicle" },
  { key: "reset", label: "Reset to road", group: "Session" },
  { key: "pause", label: "Pause", group: "Session" },
];

export const formatKey = (code: string): string => {
  if (!code) return "—";
  const map: Record<string, string> = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Space: "SPACE",
    ShiftLeft: "L-SHIFT",
    ShiftRight: "R-SHIFT",
    ControlLeft: "L-CTRL",
    ControlRight: "R-CTRL",
    AltLeft: "L-ALT",
    AltRight: "R-ALT",
    Escape: "ESC",
    Enter: "ENTER",
    Backspace: "BACKSPACE",
    Tab: "TAB",
    CapsLock: "CAPS",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Backslash: "\\",
    BracketLeft: "[",
    BracketRight: "]",
    Minus: "-",
    Equal: "=",
    Backquote: "`",
  };
  if (map[code]) return map[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `NUM ${code.slice(6)}`;
  return code.toUpperCase();
};

export const formatTime = (seconds: number, showMs = true): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  const base = `${m}:${s.toString().padStart(2, "0")}`;
  return showMs ? `${base}.${ms.toString().padStart(3, "0")}` : base;
};

export const ordinal = (position: number): string => {
  if (position === 1) return "1ST";
  if (position === 2) return "2ND";
  if (position === 3) return "3RD";
  return `${position}TH`;
};
