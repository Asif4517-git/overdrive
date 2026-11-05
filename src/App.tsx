import { useCallback, useEffect, useRef, useState } from "react";
import { Home } from "./overdrive/ui/Home";
import { Garage } from "./overdrive/ui/Garage";
import { Tracks } from "./overdrive/ui/Tracks";
import { SettingsPage } from "./overdrive/ui/SettingsPage";
import { About } from "./overdrive/ui/About";
import { RaceScreen } from "./overdrive/ui/RaceScreen";
import { Results } from "./overdrive/ui/Results";
import { ModelStudio } from "./overdrive/ui/ModelStudio";
import { CARS, getCar, getTrack } from "./overdrive/data";
import { getDriveAudio } from "./overdrive/audio";
import { DEFAULT_KEYS, DEFAULT_SETTINGS } from "./overdrive/types";
import type {
  CarId,
  RaceConfig,
  RaceMode,
  RaceResult,
  ScreenName,
  Settings,
  TrackId,
  Weather,
} from "./overdrive/types";

interface Profile {
  bestLaps: Record<string, number>;
  driftBest: Record<string, number>;
  wins: number;
  races: number;
}

const SETTINGS_KEY = "overdrive-settings-v1";
const PROFILE_KEY = "overdrive-profile-v1";

const EMPTY_PROFILE: Profile = { bestLaps: {}, driftBest: {}, wins: 0, races: 0 };

const loadSettings = (): Settings => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const validQuality = parsed.quality === "low" || parsed.quality === "medium" || parsed.quality === "high";
    const validTransmission = parsed.transmission === "auto" || parsed.transmission === "manual";
    const validCamera = ["chase", "far", "hood", "cockpit"].includes(parsed.camera ?? "");
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      quality: validQuality ? parsed.quality! : DEFAULT_SETTINGS.quality,
      transmission: validTransmission ? parsed.transmission! : DEFAULT_SETTINGS.transmission,
      camera: validCamera ? parsed.camera! : DEFAULT_SETTINGS.camera,
      keys: { ...DEFAULT_KEYS, ...(parsed.keys ?? {}) },
      master: typeof parsed.master === "number" ? parsed.master : DEFAULT_SETTINGS.master,
      music: typeof parsed.music === "number" ? parsed.music : DEFAULT_SETTINGS.music,
      sfx: typeof parsed.sfx === "number" ? parsed.sfx : DEFAULT_SETTINGS.sfx,
      steeringSensitivity:
        typeof parsed.steeringSensitivity === "number"
          ? Math.min(1.6, Math.max(0.5, parsed.steeringSensitivity))
          : DEFAULT_SETTINGS.steeringSensitivity,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const loadProfile = (): Profile => {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      bestLaps: parsed.bestLaps && typeof parsed.bestLaps === "object" ? parsed.bestLaps : {},
      driftBest: parsed.driftBest && typeof parsed.driftBest === "object" ? parsed.driftBest : {},
      wins: typeof parsed.wins === "number" ? parsed.wins : 0,
      races: typeof parsed.races === "number" ? parsed.races : 0,
    };
  } catch {
    return EMPTY_PROFILE;
  }
};

const resolveConditions = (weatherSetting: Settings["weather"], timeSetting: Settings["timeOfDay"], trackId: TrackId) => {
  const track = getTrack(trackId);
  const weather: Weather = weatherSetting === "track" ? track.weather : weatherSetting;
  let timeOfDay = timeSetting === "track" ? track.timeOfDay : timeSetting;
  if (weather === "night") timeOfDay = "night";
  else if (weather === "sunset") timeOfDay = "sunset";
  return { weather, timeOfDay };
};

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("home");
  const [carId, setCarId] = useState<CarId>("m3");
  const [trackId, setTrackId] = useState<TrackId>("ng-speedway");
  const [mode, setMode] = useState<RaceMode>("race");
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [raceConfig, setRaceConfig] = useState<RaceConfig | null>(null);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [hash, setHash] = useState<string>(() => (typeof window !== "undefined" ? window.location.hash : ""));
  const lastMaster = useRef(settings.master > 0 ? settings.master : 0.85);

  const car = getCar(carId);
  const track = getTrack(trackId);
  const muted = settings.master === 0;

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (screen === "race") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [screen]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* storage may be unavailable */
    }
  }, [settings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      /* storage may be unavailable */
    }
  }, [profile]);

  useEffect(() => {
    getDriveAudio().setSettings({ master: settings.master, music: settings.music, sfx: settings.sfx });
  }, [settings.master, settings.music, settings.sfx]);

  const primeAudio = useCallback(() => {
    const audio = getDriveAudio();
    audio.init();
    audio.setSettings({ master: settings.master, music: settings.music, sfx: settings.sfx });
    return audio;
  }, [settings.master, settings.music, settings.sfx]);

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch, keys: { ...current.keys, ...(patch.keys ?? {}) } };
      getDriveAudio().setSettings({ master: next.master, music: next.music, sfx: next.sfx });
      return next;
    });
  }, []);

  const navigate = useCallback(
    (next: ScreenName) => {
      const audio = primeAudio();
      audio.uiClick();
      if (next !== "race") audio.startMusic();
      setScreen(next);
    },
    [primeAudio]
  );

  const startRace = useCallback(
    (overrideMode?: RaceMode, overrideTrack?: TrackId, overrideCar?: CarId) => {
      const nextMode = overrideMode ?? mode;
      const nextTrackId = overrideTrack ?? trackId;
      const nextCarId = overrideCar ?? carId;
      const nextCar = getCar(nextCarId);
      const { weather, timeOfDay } = resolveConditions(settings.weather, settings.timeOfDay, nextTrackId);
      const audio = primeAudio();
      audio.uiConfirm();
      audio.startMusic();
      audio.setEngineMuted(false);
      setMode(nextMode);
      setTrackId(nextTrackId);
      setCarId(nextCarId);
      setResult(null);
      setRaceConfig({
        trackId: nextTrackId,
        carId: nextCar.id,
        mode: nextMode,
        weather,
        timeOfDay,
        quality: settings.quality,
        transmission: settings.transmission,
        camera: settings.camera,
        damage: settings.damage,
        assists: settings.assists,
        sensitivity: settings.steeringSensitivity,
        keys: { ...settings.keys },
      });
      setScreen("race");
    },
    [carId, mode, primeAudio, settings, trackId]
  );

  const handleFinish = useCallback(
    (rawResult: RaceResult) => {
      const isLapMode = rawResult.mode !== "drift";
      const previous = isLapMode
        ? profile.bestLaps[rawResult.trackId] ?? null
        : profile.driftBest[rawResult.trackId] ?? null;
      let newRecord = false;
      if (isLapMode && rawResult.bestLap) {
        newRecord = previous === null || rawResult.bestLap < previous;
      } else if (rawResult.mode === "drift") {
        newRecord = previous === null || rawResult.driftScore > previous;
      }
      setPreviousBest(previous);
      setProfile((current) => {
        const bestLaps = { ...current.bestLaps };
        const driftBest = { ...current.driftBest };
        if (isLapMode && rawResult.bestLap && newRecord) bestLaps[rawResult.trackId] = rawResult.bestLap;
        if (rawResult.mode === "drift" && newRecord) driftBest[rawResult.trackId] = rawResult.driftScore;
        return {
          bestLaps,
          driftBest,
          wins: current.wins + (rawResult.won && isLapMode ? 1 : 0),
          races: current.races + 1,
        };
      });
      setResult({ ...rawResult, newRecord });
      setScreen("results");
    },
    [profile.bestLaps, profile.driftBest]
  );

  const toggleSound = useCallback(() => {
    const audio = primeAudio();
    if (settings.master > 0) {
      lastMaster.current = settings.master;
      patchSettings({ master: 0 });
      audio.setSettings({ master: 0, music: settings.music, sfx: settings.sfx });
    } else {
      const restored = lastMaster.current || 0.85;
      patchSettings({ master: restored });
      audio.setSettings({ master: restored, music: settings.music, sfx: settings.sfx });
      audio.uiClick();
    }
  }, [patchSettings, primeAudio, settings]);

  const testSound = useCallback(() => {
    const audio = primeAudio();
    audio.uiConfirm();
    audio.startMusic();
  }, [primeAudio]);

  const resetData = useCallback(() => {
    setProfile({ ...EMPTY_PROFILE });
    try {
      window.localStorage.removeItem(PROFILE_KEY);
    } catch {
      /* ignore */
    }
    primeAudio().uiBack();
  }, [primeAudio]);

  const bestLap = profile.bestLaps[trackId] ?? null;

  const render = () => {
    switch (screen) {
      case "garage":
        return (
          <Garage
            cars={CARS}
            car={car}
            track={track}
            settings={settings}
            bestLap={bestLap}
            muted={muted}
            onSelect={(id) => {
              setCarId(id);
              primeAudio().uiClick();
            }}
            onNavigate={navigate}
            onSound={toggleSound}
            onStart={() => startRace()}
          />
        );
      case "tracks":
        return (
          <Tracks
            car={car}
            track={track}
            mode={mode}
            bestLaps={profile.bestLaps}
            muted={muted}
            onSelect={(id) => {
              setTrackId(id);
              primeAudio().uiClick();
            }}
            onNavigate={navigate}
            onSound={toggleSound}
            onStart={() => startRace()}
          />
        );
      case "settings":
        return (
          <SettingsPage
            settings={settings}
            muted={muted}
            bestLaps={profile.bestLaps}
            wins={profile.wins}
            races={profile.races}
            onChange={patchSettings}
            onReset={() => patchSettings(DEFAULT_SETTINGS)}
            onResetData={resetData}
            onToggleSound={toggleSound}
            onTestSound={testSound}
            onNavigate={navigate}
            onStart={() => startRace()}
          />
        );
      case "about":
        return <About muted={muted} onNavigate={navigate} onSound={toggleSound} onStart={() => startRace()} />;
      case "race":
        if (!raceConfig) return null;
        return (
          <RaceScreen
            key={`${raceConfig.trackId}-${raceConfig.carId}-${raceConfig.mode}-${raceConfig.weather}-${raceConfig.transmission}-${raceConfig.damage}-${raceConfig.assists}`}
            config={raceConfig}
            car={getCar(raceConfig.carId)}
            track={getTrack(raceConfig.trackId)}
            settings={settings}
            onSettingsChange={patchSettings}
            onFinish={handleFinish}
            onExit={() => {
              getDriveAudio().uiBack();
              navigate("home");
            }}
            muted={muted}
            onToggleSound={toggleSound}
          />
        );
      case "results":
        if (!result) return null;
        return (
          <Results
            result={result}
            car={getCar(result.carId)}
            track={getTrack(result.trackId)}
            previousBest={previousBest}
            muted={muted}
            onSound={toggleSound}
            onNavigate={navigate}
            onRestart={() => startRace(result.mode, result.trackId, result.carId)}
            onGarage={() => navigate("garage")}
            onTracks={() => navigate("tracks")}
          />
        );
      case "home":
      default:
        return (
          <Home
            car={car}
            track={track}
            mode={mode}
            settings={settings}
            bestLap={bestLap}
            muted={muted}
            onNavigate={navigate}
            onMode={setMode}
            onChange={patchSettings}
            onStart={() => startRace()}
            onSound={toggleSound}
          />
        );
    }
  };

  if (hash === "#models") return <ModelStudio />;
  return <div className="min-h-dvh bg-[var(--bg)] text-[var(--ink)]">{render()}</div>;
}
