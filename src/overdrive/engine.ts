import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { createRoadTrack } from "./track";
import type { RoadTrack } from "./track";
import { createWorld } from "./environment";
import type { WorldRig } from "./environment";
import { createVehicleVisual } from "./carModel";
import type { VehicleVisual } from "./carModel";
import { ParticlePool } from "../game/particles";
import { AI_COLORS, AI_NAMES, getCar, getTrack } from "./data";
import { CAR_DESIGNS } from "./carDesigns";
import { getDriveAudio } from "./audio";
import type {
  CarSpec,
  KeyBindings,
  HudState,
  RaceConfig,
  RaceResult,
  RacerSnapshot,
  Standing,
} from "./types";

const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

const wrap = (angle: number) => {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

const WHEEL_RADIUS: Record<string, number> = {
  hatch: 0.3,
  sedan: 0.31,
  suv: 0.37,
  sports: 0.33,
  super: 0.33,
  offroad: 0.39,
};

const SURFACE_GRIP: Record<string, number> = {
  clear: 1,
  sunset: 0.98,
  overcast: 0.92,
  rain: 0.76,
  night: 0.9,
};

interface PlayerState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  heading: number;
  index: number;
  progress: number;
  lap: number;
  lapStart: number;
  bestLap: number | null;
  sector: number;
  crossedLine: boolean;
  finished: boolean;
  finishTime: number;
  spin: number;
  steering: number;
  gear: number;
  rpm: number;
  shifting: number;
  throttle: number;
  brake: number;
  handbrake: boolean;
  drifting: boolean;
  driftScore: number;
  driftTime: number;
  damage: number;
  fuel: number;
  topSpeed: number;
  wrongWay: boolean;
  wallCooldown: number;
  carCooldown: number;
  offRoad: boolean;
  headlights: boolean;
  traction: number;
}

interface Rival {
  name: string;
  carName: string;
  color: string;
  visual: VehicleVisual;
  spec: CarSpec;
  pos: THREE.Vector3;
  heading: number;
  speed: number;
  index: number;
  prevIndex: number;
  lap: number;
  progress: number;
  lane: number;
  phase: number;
  finished: boolean;
  finishTime: number;
  bestLap: number | null;
  lapStart: number;
  crossedStart: boolean;
  skill: number;
  braking: boolean;
  spin: number;
}

interface EngineCallbacks {
  onHud: (hud: HudState) => void;
  onFinish: (result: RaceResult) => void;
  onPause: () => void;
  onReady: () => void;
}

type Phase = "countdown" | "racing" | "finished";

export class OverdriveGame {
  readonly container: HTMLDivElement;
  private config: RaceConfig;
  private callbacks: EngineCallbacks;
  private spec: CarSpec;
  private track: RoadTrack;
  private world: WorldRig;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private playerVisual: VehicleVisual;
  private rivals: Rival[] = [];
  private player: PlayerState;
  private keys = new Set<string>();
  private audio = getDriveAudio();
  private particles: { smoke: ParticlePool; spray: ParticlePool; sparks: ParticlePool };
  private phase: Phase = "countdown";
  private countdown = 3.2;
  private countNumber = 3;
  private goTimer = 0;
  private elapsed = 0;
  private frame = 0;
  private lastTime = 0;
  private accumulator = 0;
  private paused = false;
  private disposed = false;
  private hudAccumulator = 0;
  private totalLaps: number;
  private cameraMode: RaceConfig["camera"];
  private cameraLook = new THREE.Vector3();
  private fov = 58;
  private shake = 0;
  private lookBack = false;
  private message: string | null = null;
  private messageTimer = 0;
  private countdownDone = false;
  private finishTimer: number | null = null;
  private lastGearForAudio = 1;
  private smokeAccum = 0;
  private sprayAccum = 0;
  private topSpeed = 0;
  private driftTotal = 0;

  constructor(container: HTMLDivElement, config: RaceConfig, callbacks: EngineCallbacks) {
    this.container = container;
    this.config = config;
    this.callbacks = callbacks;
    this.spec = getCar(config.carId);
    const def = getTrack(config.trackId);
    this.track = createRoadTrack(def);
    this.totalLaps = config.mode === "sprint" ? 1 : config.mode === "drift" ? 3 : def.laps;
    this.cameraMode = config.camera;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight), 0.12, 3200);
    this.renderer = new THREE.WebGLRenderer({
      antialias: config.quality !== "low",
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.quality === "high" ? 2 : config.quality === "medium" ? 1.5 : 1));
    this.renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = config.quality !== "low";
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.inset = "0";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.setAttribute("aria-label", "OVERDRIVE race view");
    container.appendChild(this.renderer.domElement);

    this.scene.add(this.track.group);
    this.world = createWorld(this.track, def, this.scene, config.quality, config.weather, config.timeOfDay);
    this.scene.environment = this.createEnvironmentMap();
    this.scene.environmentIntensity = 0.5;
    this.track.setWet(config.weather === "rain");

    this.particles = {
      smoke: new ParticlePool(220, false),
      spray: new ParticlePool(320, false),
      sparks: new ParticlePool(160, true),
    };
    this.scene.add(this.particles.smoke.points, this.particles.spray.points, this.particles.sparks.points);

    this.playerVisual = createVehicleVisual(this.spec, { quality: config.quality, isPlayer: true });
    this.playerVisual.setLights(config.timeOfDay === "night" || config.weather === "night");
    this.scene.add(this.playerVisual.root);
    this.player = this.createPlayer();

    const aiCount = config.mode === "race" || config.mode === "sprint" ? 5 : 0;
    const aiCars = ["m3", "city", "gt3", "swift", "m5"] as const;
    for (let i = 0; i < aiCount; i += 1) {
      const aiSpec = getCar(aiCars[i % aiCars.length]);
      const visual = createVehicleVisual(
        { ...aiSpec, color: AI_COLORS[i], accent: "#d9d7cf" },
        { quality: config.quality, isPlayer: false }
      );
      visual.setLights(config.timeOfDay === "night" || config.weather === "night");
      this.scene.add(visual.root);
      const index = (this.track.samples.length - 12 - i * 6 + this.track.samples.length * 2) % this.track.samples.length;
      const sample = this.track.samples[index];
      const lane = i % 2 === 0 ? 2.4 : -2.4;
      this.rivals.push({
        name: AI_NAMES[i],
        carName: `${aiSpec.make} ${aiSpec.model}`,
        color: AI_COLORS[i],
        visual,
        spec: aiSpec,
        pos: sample.pos.clone().addScaledVector(sample.side, lane),
        heading: Math.atan2(sample.tangent.x, sample.tangent.z),
        speed: 0,
        index,
        prevIndex: index,
        lap: 0,
        progress: index / this.track.samples.length,
        lane,
        phase: i * 1.7,
        finished: false,
        finishTime: 0,
        bestLap: null,
        lapStart: 0,
        crossedStart: false,
        skill: 0.93 + i * 0.015,
        braking: false,
        spin: 0,
      });
      visual.setPosition(this.rivals[i].pos, this.rivals[i].heading);
    }

    this.buildComposer();
    this.resize();
    this.attachEvents();
    this.audio.init();
    this.audio.setEngineMuted(false);
    this.audio.startEngine();
    this.audio.startMusic();
    this.audio.countdown(3);
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.loop);
    this.callbacks.onReady();
    if (typeof window !== "undefined") {
      (window as unknown as { __OVERDRIVE__: OverdriveGame }).__OVERDRIVE__ = this;
    }
  }

  private createPlayer(): PlayerState {
    const samples = this.track.samples;
    const index = (samples.length - 6) % samples.length;
    const sample = samples[index];
    return {
      pos: sample.pos.clone(),
      vel: new THREE.Vector3(),
      heading: Math.atan2(sample.tangent.x, sample.tangent.z),
      index,
      progress: index / samples.length,
      lap: 0,
      lapStart: 0,
      bestLap: null,
      sector: 0,
      crossedLine: false,
      finished: false,
      finishTime: 0,
      spin: 0,
      steering: 0,
      gear: 1,
      rpm: this.spec.idle,
      shifting: 0,
      throttle: 0,
      brake: 0,
      handbrake: false,
      drifting: false,
      driftScore: 0,
      driftTime: 0,
      damage: 0,
      fuel: 82,
      topSpeed: 0,
      wrongWay: false,
      wallCooldown: 0,
      carCooldown: 0,
      offRoad: false,
      headlights: this.config.timeOfDay === "night" || this.config.weather === "night",
      traction: 1,
    };
  }

  private wheelRadius() {
    return this.playerVisual?.wheelRadius ?? CAR_DESIGNS[this.spec.id].wheelRadius ?? WHEEL_RADIUS[this.spec.body] ?? 0.33;
  }

  private createEnvironmentMap() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(50, 16, 12),
      new THREE.MeshBasicMaterial({ color: getTrack(this.config.trackId).skyTop, side: THREE.BackSide })
    );
    envScene.add(sky);
    const panels: [number, number, number, number, number, number][] = [
      [-16, 12, -12, 30, 14, 0xfff2dd],
      [18, 9, -6, 20, 10, 0xcfe0ea],
      [0, 20, 2, 22, 8, 0xffffff],
      [-10, 3, 16, 18, 6, 0x6f7a5c],
    ];
    panels.forEach(([x, y, z, w, h, color]) => {
      const mat = new THREE.MeshBasicMaterial({ color });
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      panel.position.set(x, y, z);
      panel.lookAt(0, 0, 0);
      envScene.add(panel);
    });
    const texture = pmrem.fromScene(envScene, 0.05).texture;
    pmrem.dispose();
    envScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    return texture;
  }

  private buildComposer() {
    this.composer?.dispose();
    this.composer = null;
    if (this.config.quality === "low" || this.config.quality === "medium") return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const composer = new EffectComposer(this.renderer);
    composer.setSize(width, height);
    composer.addPass(new RenderPass(this.scene, this.camera));
    const night = this.config.timeOfDay === "night";
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), night ? 0.32 : 0.14, 0.4, 0.9));
    composer.addPass(new OutputPass());
    this.composer = composer;
  }

  private attachEvents() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("resize", this.resize);
    window.addEventListener("orientationchange", this.resize);
    document.addEventListener("fullscreenchange", this.resize);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.resize);
      this.resizeObserver.observe(this.container);
    }
  }

  private onBlur = () => this.keys.clear();

  private onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
    const k = this.config.keys;
    const action = (Object.keys(k) as (keyof typeof k)[]).find((key) => k[key] === event.code);
    if (action) event.preventDefault();
    if (event.code === "Escape" || action === "pause") {
      if (!event.repeat) this.callbacks.onPause();
      return;
    }
    if (this.keys.has(event.code)) return;
    this.keys.add(event.code);
    if (event.repeat) return;
    if (event.code === k.camera) this.cycleCamera();
    if (event.code === k.reset && this.phase === "racing") this.resetToTrack();
    if (event.code === k.shiftUp && this.config.transmission === "manual") this.shift(1);
    if (event.code === k.shiftDown && this.config.transmission === "manual") this.shift(-1);
    if (event.code === k.headlights) {
      this.player.headlights = !this.player.headlights;
      this.playerVisual.setLights(this.player.headlights);
      this.showMessage(this.player.headlights ? "HEADLIGHTS ON" : "HEADLIGHTS OFF", 1.4);
    }
    if (event.code === k.lookBack) this.lookBack = true;
  };

  setVirtualInput(action: keyof KeyBindings, down: boolean) {
    const code = this.config.keys[action];
    if (!code) return;
    if (down) this.keys.add(code);
    else this.keys.delete(code);
    if (!down) return;
    if (action === "camera") this.cycleCamera();
    if (action === "headlights") {
      this.player.headlights = !this.player.headlights;
      this.playerVisual.setLights(this.player.headlights);
    }
    if (action === "shiftUp" && this.config.transmission === "manual") this.shift(1);
    if (action === "shiftDown" && this.config.transmission === "manual") this.shift(-1);
  }

  getHudForDebug() {
    return this.buildHud();
  }

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
    if (event.code === this.config.keys.lookBack) this.lookBack = false;
  };

  private down(code: string) {
    return this.keys.has(code);
  }

  cycleCamera() {
    const order: RaceConfig["camera"][] = ["chase", "far", "hood", "cockpit"];
    const idx = order.indexOf(this.cameraMode);
    this.cameraMode = order[(idx + 1) % order.length];
    this.playerVisual.showInterior(this.cameraMode === "cockpit");
  }

  private resetToTrack() {
    const sample = this.track.samples[this.player.index];
    this.player.pos.copy(sample.pos);
    this.player.vel.set(0, 0, 0);
    this.player.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
    this.player.gear = 1;
    this.player.rpm = this.spec.idle;
    this.showMessage("REJOINED TRACK", 1.8);
  }

  private showMessage(text: string, duration = 2.2) {
    this.message = text;
    this.messageTimer = duration;
  }

  private resize = () => {
    if (!this.container) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.config.quality === "high" ? 2 : this.config.quality === "medium" ? 1.5 : 1));
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
  };

  private shift(direction: number) {
    const p = this.player;
    if (p.shifting > 0 || p.gear < 1) return;
    const max = this.spec.gears.length;
    const next = THREE.MathUtils.clamp(p.gear + direction, 1, max);
    if (next === p.gear) return;
    const wheelSpeed = Math.abs(p.vel.dot(this.forwardVec()));
    const rpmInNext = this.rpmForGear(next, wheelSpeed);
    if (direction > 0 && rpmInNext < this.spec.idle + 200 && wheelSpeed < 8) {
      this.showMessage("TOO SLOW FOR THAT GEAR", 1.1);
      return;
    }
    p.gear = next;
    p.shifting = 0.2;
    p.rpm = THREE.MathUtils.clamp(rpmInNext, this.spec.idle, this.spec.redline);
    this.audio.shiftIndicator(direction > 0 ? "up" : "down");
  }

  private rpmForGear(gear: number, speed: number) {
    if (gear < 1) return this.spec.idle;
    const ratio = this.spec.gears[Math.min(this.spec.gears.length, Math.max(1, gear)) - 1];
    const wheelRps = speed / (Math.PI * 2 * this.wheelRadius());
    return wheelRps * 60 * this.spec.finalDrive * ratio;
  }

  private forwardVec() {
    return new THREE.Vector3(Math.sin(this.player.heading), 0, Math.cos(this.player.heading));
  }

  pause() {
    this.paused = true;
    this.keys.clear();
    this.audio.setEngineMuted(true);
    this.lastTime = performance.now();
  }
  resume() {
    this.paused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.audio.setEngineMuted(false);
  }
  restart() {
    this.phase = "countdown";
    this.countdown = 3.2;
    this.countNumber = 3;
    this.goTimer = 0;
    this.elapsed = 0;
    this.driftTotal = 0;
    this.topSpeed = 0;
    this.message = null;
    this.countdownDone = false;
    this.player = this.createPlayer();
    this.playerVisual.setPosition(this.player.pos, this.player.heading);
    this.playerVisual.setLights(this.player.headlights);
    this.rivals.forEach((r) => {
      r.lap = 0;
      r.finished = false;
      r.finishTime = 0;
      r.speed = 0;
      r.bestLap = null;
      r.lapStart = 0;
      r.crossedStart = false;
      r.pos.copy(this.track.samples[r.index].pos).addScaledVector(this.track.samples[r.index].side, r.lane);
      r.visual.setPosition(r.pos, r.heading);
    });
    this.paused = false;
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.audio.setEngineMuted(false);
    this.audio.countdown(3);
  }

  private loop = (time: number) => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    const raw = (time - this.lastTime) / 1000;
    this.lastTime = time;
    if (this.paused) {
      this.updateCamera(Math.min(raw, 0.05), true);
      this.render();
      return;
    }
    this.accumulator = Math.min(0.5, this.accumulator + Math.max(0, raw));
    const step = 1 / 60;
    let steps = 0;
    while (this.accumulator >= step && steps < 24) {
      this.tick(step);
      this.accumulator -= step;
      steps += 1;
    }
    if (steps === 0) this.updateCamera(Math.min(raw, 0.05));
    this.render();
  };

  private render() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  private tick(dt: number) {
    this.world.update(this.player.pos, this.elapsed, dt);
    this.phase === "racing" ? (this.elapsed += dt) : null;
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    if (this.messageTimer <= 0) this.message = null;

    if (this.phase === "countdown") {
      this.countdown -= dt;
      const n = Math.ceil(this.countdown);
      if (n > 0 && n !== this.countNumber && n <= 3) {
        this.countNumber = n;
        this.audio.countdown(n);
      }
      if (this.countdown <= 0 && !this.countdownDone) {
        this.countdownDone = true;
        this.phase = "racing";
        this.goTimer = 1;
        this.elapsed = 0;
        this.player.lapStart = 0;
        this.rivals.forEach((r) => {
          r.lapStart = 0;
        });
        this.audio.countdown(0);
      }
      this.player.throttle = this.down(this.config.keys.accelerate) ? 1 : 0;
      this.player.rpm = damp(this.player.rpm, this.spec.idle + this.player.throttle * 2300, 4, dt);
      this.audio.updateEngine({
        rpm: this.player.rpm,
        redline: this.spec.redline,
        throttle: this.player.throttle,
        speed: 0,
        gear: this.player.gear,
        shifting: false,
        drifting: 0,
        rain: this.config.weather === "rain",
        surfaceGrip: 1,
        engineLoad: this.player.throttle,
      });
    } else if (this.phase === "racing") {
      this.goTimer = Math.max(0, this.goTimer - dt);
      this.updatePlayer(dt);
      this.updateRivals(dt);
      this.resolveCollisions();
      this.audio.updateEngine({
        rpm: this.player.rpm,
        redline: this.spec.redline,
        throttle: this.player.throttle,
        speed: Math.abs(this.player.vel.dot(this.forwardVec())),
        gear: Math.max(1, this.player.gear),
        shifting: this.player.shifting > 0,
        drifting: this.player.drifting ? Math.abs(this.player.traction) : 0,
        rain: this.config.weather === "rain",
        surfaceGrip: this.surfaceGrip(),
        engineLoad: this.player.throttle,
      });
      void this.lastGearForAudio;
    } else {
      this.player.throttle = 0;
      this.player.vel.multiplyScalar(Math.exp(-1.6 * dt));
      this.updateCamera(dt);
    }

    const forward = this.forwardVec();
    const right = new THREE.Vector3(Math.cos(this.player.heading), 0, -Math.sin(this.player.heading));
    const speed = this.player.vel.dot(forward);
    this.playerVisual.setPosition(this.player.pos, this.player.heading);
    this.playerVisual.setSpin(this.player.spin);
    this.playerVisual.setSteer(this.player.steering * 0.42);
    this.playerVisual.body.rotation.z = damp(this.playerVisual.body.rotation.z, -this.player.steering * 0.045 - this.player.vel.dot(right) * 0.003, 6, dt);
    this.playerVisual.body.rotation.x = damp(this.playerVisual.body.rotation.x, -this.track.samples[this.player.index].tangent.y * 0.9, 5, dt);
    this.playerVisual.body.position.y = damp(this.playerVisual.body.position.y, Math.min(0.03, Math.abs(speed) * 0.0002), 6, dt);

    this.updateParticles(dt, speed, right);
    this.updateCamera(dt);
    this.particles.smoke.update(dt);
    this.particles.spray.update(dt);
    this.particles.sparks.update(dt);
    this.shake = Math.max(0, this.shake - dt * 1.6);

    this.hudAccumulator += dt;
    if (this.hudAccumulator > 0.05) {
      this.hudAccumulator = 0;
      this.callbacks.onHud(this.buildHud());
    }
  }

  private surfaceGrip() {
    const base = SURFACE_GRIP[this.config.weather] ?? 1;
    return base * this.track.def.grip;
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    const k = this.config.keys;
    const active = this.phase === "racing";
    const accelerate = active && this.down(k.accelerate);
    const brake = active && this.down(k.brake);
    const left = active && this.down(k.left);
    const right = active && this.down(k.right);
    p.handbrake = active && this.down(k.handbrake);
    p.throttle = damp(p.throttle, accelerate ? 1 : 0, 9, dt);
    p.brake = damp(p.brake, brake ? 1 : 0, 12, dt);
    const steerInput = ((left ? 1 : 0) - (right ? 1 : 0)) * Math.min(1.25, this.config.sensitivity);
    p.steering = damp(p.steering, steerInput, p.handbrake ? 11 : 7.5, dt);

    const sample = this.track.samples[p.index];
    let forward = this.forwardVec();
    let rightVec = new THREE.Vector3(Math.cos(p.heading), 0, -Math.sin(p.heading));
    let forwardSpeed = p.vel.dot(forward);
    let lateralSpeed = p.vel.dot(rightVec);
    const gripBase = this.spec.grip * this.surfaceGrip();
    const onRoad = !p.offRoad;
    const surfaceMul = onRoad ? 1 : 0.58;
    const grip = gripBase * surfaceMul * (p.handbrake ? 0.16 : 1) * (this.config.assists ? 1.06 : 1);

    // Enter reverse from standstill with the brake held.
    if (p.gear >= 1 && Math.abs(forwardSpeed) < 1 && p.brake > 0.2 && p.throttle < 0.05) {
      p.gear = 0;
    }
    // Reverse handling.
    if (p.gear < 1) {
      if (forwardSpeed > 1.5) {
        p.gear = 1;
      } else {
        p.gear = 0;
        if (p.brake > 0.05 && forwardSpeed > -12) {
          p.vel.addScaledVector(forward, -3.2 * p.brake * dt);
        }
        if (p.throttle > 0.05 && forwardSpeed > -1) {
          p.gear = 1;
        }
      }
    }

    // Automatic gear selection.
    if (this.config.transmission === "auto" && p.gear >= 1) {
      const speed = Math.abs(forwardSpeed);
      const rpm = this.rpmForGear(p.gear, speed);
      if (rpm > this.spec.redline * 0.95 && p.gear < this.spec.gears.length && p.throttle > 0.15 && p.shifting <= 0) {
        p.gear += 1;
        p.shifting = 0.18;
      } else if (rpm < this.spec.idle + 500 && p.gear > 1 && p.shifting <= 0) {
        p.gear -= 1;
        p.shifting = 0.16;
      }
      if (Math.abs(forwardSpeed) < 0.8 && p.brake > 0.15 && !p.throttle) {
        p.gear = 0;
      }
    }

    p.shifting = Math.max(0, p.shifting - dt);

    let rpm = p.gear >= 1 ? this.rpmForGear(p.gear, Math.abs(forwardSpeed)) : this.spec.idle;
    if (p.gear >= 1 && Math.abs(forwardSpeed) < 6) {
      rpm = this.spec.idle + p.throttle * (this.spec.redline - this.spec.idle) * 0.4;
    }
    if (p.shifting > 0) rpm = this.spec.idle + (this.spec.redline - this.spec.idle) * 0.35;
    p.rpm = damp(p.rpm, THREE.MathUtils.clamp(rpm, this.spec.idle, this.spec.redline), 9, dt);
    const rpmNorm = THREE.MathUtils.clamp((p.rpm - this.spec.idle) / (this.spec.redline - this.spec.idle), 0, 1);
    const torqueCurve = 0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, rpmNorm * 0.9 + 0.08));
    const gearRatio = p.gear >= 1 ? this.spec.gears[Math.min(p.gear, this.spec.gears.length) - 1] : 3.2;
    const driveForce =
      (this.spec.torque * torqueCurve * gearRatio * this.spec.finalDrive * 0.78) / this.wheelRadius();
    const engineFactor = p.fuel > 0.5 ? 1 : 0;
    const damageFactor = this.config.damage ? 1 - Math.min(0.35, p.damage * 0.0035) : 1;
    let axial = forwardSpeed;
    if (p.gear >= 1) {
      axial += ((driveForce / this.spec.mass) * p.throttle * engineFactor * damageFactor - this.player.brake * this.spec.brakePower * 10.5) * dt;
    } else {
      axial -= this.player.brake * 2.2 * dt;
    }
    if (!accelerate && !brake) axial *= Math.exp(-0.55 * dt);
    if (p.gear < 1) axial = Math.max(axial, -12);
    if (p.handbrake) axial *= Math.exp(-0.45 * dt);
    // Rolling and aerodynamic resistance, tuned so the car approaches its rated top speed.
    const topMs = this.spec.topSpeed / 3.6;
    const dragK = driveForce * 0.82 / (this.spec.mass * topMs * topMs);
    axial -= dragK * axial * Math.abs(axial) * dt;
    axial -= (0.18 + (onRoad ? 0 : 1.8)) * Math.sign(axial) * dt;
    axial -= sample.tangent.y * 9.81 * 0.42 * dt;
    if (p.gear < 0) axial = Math.max(axial, -12);
    axial = Math.min(axial, topMs * (this.player.drifting ? 1 : 1));

    let lateral = lateralSpeed;
    const speedRatio = THREE.MathUtils.clamp(Math.abs(axial) / topMs, 0, 1);
    const steerAuthority = THREE.MathUtils.clamp(Math.abs(axial) / 5.5, 0, 1);
    let yaw =
      p.steering *
      1.32 *
      this.spec.handling *
      steerAuthority *
      (1 - speedRatio * 0.46) *
      (p.handbrake ? 1.38 : 1) *
      (p.gear < 1 ? -1 : 1) *
      (this.config.assists ? 0.94 : 1.02);

    const worldX = forward.x * axial + rightVec.x * lateral;
    const worldZ = forward.z * axial + rightVec.z * lateral;
    p.heading += yaw * dt;
    forward = this.forwardVec();
    rightVec = new THREE.Vector3(Math.cos(p.heading), 0, -Math.sin(p.heading));
    let newForward = worldX * forward.x + worldZ * forward.z;
    let newLateral = worldX * rightVec.x + worldZ * rightVec.z;
    newLateral *= Math.exp(-grip * 0.82 * dt);
    // Counter-steer stability makes slides catchable.
    if (p.steering !== 0 && Math.abs(newLateral) > 3.5) {
      p.heading += Math.sign(newLateral) * -0.14 * Math.abs(p.steering) * dt;
      forward = this.forwardVec();
      rightVec = new THREE.Vector3(Math.cos(p.heading), 0, -Math.sin(p.heading));
      newForward = worldX * forward.x + worldZ * forward.z;
      newLateral = worldX * rightVec.x + worldZ * rightVec.z;
    }
    if (this.config.assists && Math.abs(newLateral) > 3.5 && p.throttle > 0.2) {
      newLateral *= 0.9;
    }
    p.traction = (newLateral / Math.max(1, Math.abs(newForward))) * 100;
    p.vel.copy(forward).multiplyScalar(newForward).addScaledVector(rightVec, newLateral);
    p.pos.addScaledVector(p.vel, dt);

    p.index = this.track.nearestIndex(p.pos, p.index);
    const center = this.track.samples[p.index];
    const offset = new THREE.Vector3().subVectors(p.pos, center.pos).dot(center.side);
    p.offRoad = Math.abs(offset) > this.track.halfWidth - 1.0;
    const wallLimit = this.track.halfWidth + 1.25;
    if (Math.abs(offset) > wallLimit) {
      const sign = Math.sign(offset);
      const normal = center.side.clone().multiplyScalar(sign);
      p.pos.addScaledVector(normal, -(Math.abs(offset) - wallLimit));
      const impact = p.vel.dot(normal);
      if (impact > 0) p.vel.addScaledVector(normal, -impact * 1.22);
      p.vel.multiplyScalar(0.78);
      if (p.wallCooldown <= 0 && Math.abs(impact) > 2.2) {
        p.wallCooldown = 0.45;
        this.shake = Math.min(1, 0.28 + Math.abs(impact) * 0.012);
        this.audio.crash(THREE.MathUtils.clamp(Math.abs(impact) / 28, 0.2, 1));
        const contact = center.pos.clone().addScaledVector(center.side, sign * wallLimit);
        contact.y += 0.5;
        this.burstSparks(contact, 8 + Math.floor(Math.abs(impact) * 0.5));
        if (this.config.damage) {
          p.damage = Math.min(100, p.damage + Math.abs(impact) * 0.9);
          if (p.damage > 75) this.showMessage("SEVERE DAMAGE — ENGINE DOWN ON POWER", 2.6);
          else if (p.damage > 45) this.showMessage("DAMAGE WARNING", 2);
        }
      }
    }
    p.wallCooldown = Math.max(0, p.wallCooldown - dt);
    p.carCooldown = Math.max(0, p.carCooldown - dt);
    p.pos.y = damp(p.pos.y, center.pos.y + 0.02, 16, dt);
    p.spin += (newForward / Math.max(0.18, this.playerVisual.wheelRadius)) * dt;
    const speedKmh = Math.abs(newForward) * 3.6;
    this.topSpeed = Math.max(this.topSpeed, speedKmh);
    p.topSpeed = this.topSpeed;
    p.fuel = Math.max(0, p.fuel - dt * (0.006 + p.throttle * 0.05 + rpmNorm * 0.03));
    if (p.fuel < 12 && p.fuel > 0) this.showMessage("LOW FUEL", 1.6);

    const slip = Math.abs(newLateral);
    p.drifting = active && Math.abs(newForward) > 9 && (slip > 2.3 || (p.handbrake && Math.abs(newForward) > 12));
    if (p.drifting) {
      p.driftTime += dt;
      p.driftScore += (slip * 12 + Math.abs(newForward) * 0.9) * dt;
      if (p.driftTime > 0.6) p.fuel = Math.min(100, p.fuel + dt * 0.02);
    } else {
      p.driftScore = Math.max(0, p.driftScore - dt * 14);
      p.driftTime = 0;
    }
    this.driftTotal = Math.max(this.driftTotal, Math.round(p.driftScore));

    const trackDot = forward.dot(center.tangent);
    p.wrongWay = trackDot < -0.4 && Math.abs(newForward) > 4;

    const prev = p.progress;
    p.progress = p.index / this.track.samples.length;
    this.updateLap(prev, p.progress);
    this.playerVisual.setBrake(brake || p.brake > 0.2);
    this.playerVisual.setSteer(p.steering * 0.42);
    this.playerVisual.setLights(p.headlights || this.config.timeOfDay === "night");
  }

  private updateLap(prev: number, current: number) {
    const p = this.player;
    if (prev < 0.34 && current >= 0.34) {
      p.sector |= 1;
      this.showMessage("SECTOR 1 · CLEAR", 1.4);
      this.audio.checkpoint();
    }
    if (prev < 0.67 && current >= 0.67) {
      p.sector |= 2;
      this.showMessage("SECTOR 2 · CLEAR", 1.4);
      this.audio.checkpoint();
    }
    if (prev > 0.78 && current < 0.22) {
      if (!p.crossedLine) {
        p.crossedLine = true;
        p.sector = 0;
        p.lapStart = this.elapsed;
        this.showMessage(`${this.config.mode === "sprint" ? "SPRINT" : "LAP 1"} · GO`, 1.6);
      } else if ((p.sector & 3) === 3) {
        const lapTime = this.elapsed - p.lapStart;
        p.lapStart = this.elapsed;
        p.bestLap = p.bestLap === null ? lapTime : Math.min(p.bestLap, lapTime);
        p.lap += 1;
        p.sector = 0;
        this.audio.lap();
        if (p.lap >= this.totalLaps) {
          this.finishRace();
        } else {
          this.showMessage(p.lap === this.totalLaps - 1 ? "FINAL LAP" : `LAP ${p.lap + 1} OF ${this.totalLaps}`, 2.2);
        }
      } else {
        p.sector = 0;
        this.showMessage("LAP NOT COUNTED — CHECKPOINT MISSED", 2.2);
      }
    }
    p.progress = current;
  }

  private updateRivals(dt: number) {
    const count = this.track.samples.length;
    const playerScore = this.player.lap + this.player.progress;
    this.rivals.forEach((r) => {
      if (r.finished) {
        r.speed = damp(r.speed, 10, 1.5, dt);
      }
      const sample = this.track.samples[r.index];
      const lookSteps = Math.round((12 + r.speed * 0.55) / 2.4);
      let curve = 0;
      for (let i = 0; i < 16; i += 1) curve = Math.max(curve, this.track.samples[(r.index + lookSteps + i) % count].curvature);
      const cornerLimit = r.spec.topSpeed / 3.6 * (1 - THREE.MathUtils.clamp(curve * 290, 0, 0.52)) * this.surfaceGrip();
      const target = cornerLimit * r.skill * (r.finished ? 0.25 : 1);
      const rubber = 1 + THREE.MathUtils.clamp((playerScore - (r.lap + r.progress)) * 0.09, -0.05, 0.09);
      const desired = target * rubber;
      if (r.speed < desired) r.speed = Math.min(desired, r.speed + (r.spec.torque / r.spec.mass) * 2.4 * dt);
      else {
        r.speed = Math.max(desired, r.speed - 14 * dt);
        r.braking = r.speed - desired > 2.5;
      }
      const laneTarget = r.lane + Math.sin(this.elapsed * 0.35 + r.phase) * 0.55;
      const ahead = this.track.sampleAt(r.progress + (9 + r.speed * 0.32) / this.track.length);
      const aim = ahead.pos.clone().addScaledVector(ahead.side, THREE.MathUtils.clamp(laneTarget, -this.track.halfWidth + 2, this.track.halfWidth - 2));
      const difference = wrap(Math.atan2(aim.x - r.pos.x, aim.z - r.pos.z) - r.heading);
      r.heading += THREE.MathUtils.clamp(difference, -1.6 * dt, 1.6 * dt);
      const forward = new THREE.Vector3(Math.sin(r.heading), 0, Math.cos(r.heading));
      r.pos.addScaledVector(forward, r.speed * dt);
      const prevIndex = r.index;
      r.index = this.track.nearestIndex(r.pos, r.index);
      const center = this.track.samples[r.index];
      const lateral = new THREE.Vector3().subVectors(r.pos, center.pos).dot(center.side);
      const limit = this.track.halfWidth - 1.1;
      if (Math.abs(lateral) > limit) {
        r.pos.addScaledVector(center.side, -(Math.abs(lateral) - limit) * Math.sign(lateral));
        r.speed *= 0.92;
      }
      r.pos.y = damp(r.pos.y, center.pos.y + 0.02, 14, dt);
      r.progress = r.index / count;
      r.spin += (r.speed / Math.max(0.18, r.visual.wheelRadius)) * dt;
      if (prevIndex > count * 0.8 && r.index < count * 0.2) {
        if (!r.crossedStart) {
          r.crossedStart = true;
          r.lapStart = this.elapsed;
        } else {
          const lapTime = this.elapsed - r.lapStart;
          r.lapStart = this.elapsed;
          r.bestLap = r.bestLap === null ? lapTime : Math.min(r.bestLap, lapTime);
          r.lap += 1;
          if (r.lap >= this.totalLaps && !r.finished) {
            r.finished = true;
            r.finishTime = this.elapsed;
          }
        }
      }
      r.prevIndex = r.index;
      r.visual.setPosition(r.pos, r.heading);
      r.visual.setSpin(r.spin);
      r.visual.setBrake(r.braking);
      r.visual.body.rotation.z = damp(r.visual.body.rotation.z, -difference * 0.16, 5, dt);
      void sample;
    });
  }

  private resolveCollisions() {
    const p = this.player;
    if (this.config.mode === "time" || this.config.mode === "drift") return;
    this.rivals.forEach((r) => {
      const dx = p.pos.x - r.pos.x;
      const dz = p.pos.z - r.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 2.4 && dist > 0.001) {
        const nx = dx / dist;
        const nz = dz / dist;
        const overlap = 2.4 - dist;
        p.pos.x += nx * overlap * 0.55;
        p.pos.z += nz * overlap * 0.55;
        r.pos.x -= nx * overlap * 0.45;
        r.pos.z -= nz * overlap * 0.45;
        const rel = p.vel.x * -nx + p.vel.z * -nz;
        if (rel > 0) {
          p.vel.x += nx * rel * 0.7;
          p.vel.z += nz * rel * 0.7;
          r.speed = Math.max(0, r.speed - rel * 0.3);
        }
        if (p.carCooldown <= 0) {
          p.carCooldown = 0.5;
          this.shake = Math.max(this.shake, 0.45);
          this.audio.crash(0.6);
          if (this.config.damage) p.damage = Math.min(100, p.damage + 2.5);
        }
      }
    });
    for (let i = 0; i < this.rivals.length; i += 1) {
      for (let j = i + 1; j < this.rivals.length; j += 1) {
        const a = this.rivals[i];
        const b = this.rivals[j];
        const dx = a.pos.x - b.pos.x;
        const dz = a.pos.z - b.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 2.3 && d > 0.01) {
          const push = (2.3 - d) * 0.5;
          a.pos.x += (dx / d) * push;
          a.pos.z += (dz / d) * push;
          b.pos.x -= (dx / d) * push;
          b.pos.z -= (dz / d) * push;
          a.speed *= 0.985;
          b.speed *= 0.985;
        }
      }
    }
  }

  private updateParticles(dt: number, speed: number, right: THREE.Vector3) {
    const p = this.player;
    const forward = this.forwardVec();
    if (p.drifting || (p.handbrake && Math.abs(speed) > 6)) {
      this.smokeAccum += dt;
      while (this.smokeAccum > 0.035) {
        this.smokeAccum -= 0.035;
        const origin = this.localPoint(Math.random() > 0.5 ? -0.95 : 0.95, 0.2, -1.35);
        this.particles.smoke.spawn(
          origin,
          new THREE.Vector3(-forward.x * 2 + (Math.random() - 0.5) * 2, 0.7 + Math.random(), -forward.z * 2 + (Math.random() - 0.5) * 2),
          { color: 0xb9b6ad, size: 0.9 + Math.random(), life: 0.7, drag: 0.9, gravity: -0.2 }
        );
      }
    }
    const wet = this.config.weather === "rain";
    if (wet && Math.abs(speed) > 8 && p.offRoad === false) {
      this.sprayAccum += dt;
      while (this.sprayAccum > 0.02) {
        this.sprayAccum -= 0.02;
        const origin = this.localPoint(Math.random() > 0.5 ? -0.9 : 0.9, 0.15, -1.5);
        this.particles.spray.spawn(
          origin,
          new THREE.Vector3(-forward.x * 3 + (Math.random() - 0.5) * 2.4, 0.8 + Math.random() * 1.5, -forward.z * 3 + (Math.random() - 0.5) * 2.4),
          { color: 0xb6c3c8, size: 0.32 + Math.random() * 0.4, life: 0.4, drag: 0.93, gravity: 3 }
        );
      }
    }
    if (p.offRoad && Math.abs(speed) > 5) {
      this.smokeAccum += dt;
      while (this.smokeAccum > 0.09) {
        this.smokeAccum -= 0.09;
        const origin = this.localPoint(Math.random() > 0.5 ? -0.9 : 0.9, 0.1, -1.1);
        this.particles.smoke.spawn(origin, new THREE.Vector3((Math.random() - 0.5) * 2, 0.6 + Math.random(), (Math.random() - 0.5) * 2), {
          color: 0x9c8f76,
          size: 0.6,
          life: 0.55,
          drag: 0.9,
          gravity: -0.2,
        });
      }
    }
    void right;
  }

  private localPoint(x: number, y: number, z: number) {
    const c = Math.cos(this.player.heading);
    const s = Math.sin(this.player.heading);
    return new THREE.Vector3(this.player.pos.x + x * c + z * s, this.player.pos.y + y, this.player.pos.z - x * s + z * c);
  }

  private burstSparks(position: THREE.Vector3, amount: number) {
    for (let i = 0; i < amount; i += 1) {
      this.particles.sparks.spawn(
        position,
        new THREE.Vector3((Math.random() - 0.5) * 9, 1.5 + Math.random() * 5, (Math.random() - 0.5) * 9),
        { color: Math.random() > 0.5 ? 0xffc45a : 0xff7a30, size: 0.14 + Math.random() * 0.18, life: 0.3, gravity: 12, drag: 0.95 }
      );
    }
  }

  private updateCamera(dt: number, paused = false) {
    const p = this.player;
    const forward = this.forwardVec();
    const speed = Math.abs(p.vel.length());
    const speedRatio = THREE.MathUtils.clamp(speed / (this.spec.topSpeed / 3.6), 0, 1);
    let desired: THREE.Vector3;
    let look: THREE.Vector3;
    const back = this.lookBack ? -1 : 1;

    if (this.phase === "countdown") {
      const t = THREE.MathUtils.clamp((3.2 - this.countdown) / 3.2, 0, 1);
      const angle = p.heading + Math.PI * (1 - t) + 0.35;
      const radius = (13 - t * 4.5) * (this.camera.aspect < 1 ? 1.4 : 1);
      desired = p.pos.clone().add(new THREE.Vector3(Math.sin(angle) * radius, 3.6 - t * 0.9, Math.cos(angle) * radius));
      look = p.pos.clone().add(new THREE.Vector3(0, 0.75, 0));
    } else if (paused) {
      const angle = performance.now() / 5500 + p.heading;
      desired = p.pos.clone().add(new THREE.Vector3(Math.sin(angle) * 9, 2.8, Math.cos(angle) * 9));
      look = p.pos.clone().add(new THREE.Vector3(0, 0.7, 0));
    } else if (this.cameraMode === "cockpit") {
      const eyeOffset = this.playerVisual.cockpit;
      const eye = this.localPoint(eyeOffset.x, eyeOffset.y, eyeOffset.z);
      desired = eye;
      look = eye.clone().addScaledVector(forward, 22 * back).add(new THREE.Vector3(0, -0.1, 0));
    } else if (this.cameraMode === "hood") {
      desired = p.pos.clone().addScaledVector(forward, 0.9).add(new THREE.Vector3(0, 1.15, 0));
      look = p.pos.clone().addScaledVector(forward, 24 * back).add(new THREE.Vector3(0, 1.0, 0));
    } else {
      const distance = this.cameraMode === "far" ? 12 : (this.camera.aspect < 1 ? 9.6 : 7.4);
      const height = this.cameraMode === "far" ? 3.4 : 2.25;
      desired = p.pos
        .clone()
        .addScaledVector(forward, -distance * back)
        .add(new THREE.Vector3(0, height + Math.sin(performance.now() / 6000) * 0.04, 0));
      look = p.pos.clone().addScaledVector(forward, 7.5 * back).add(new THREE.Vector3(0, 1.05, 0));
    }

    if (this.phase !== "countdown" && this.cameraMode !== "cockpit") {
      const idx = this.track.nearestIndex(desired, p.index);
      const sample = this.track.samples[idx];
      const side = new THREE.Vector3().subVectors(desired, sample.pos).dot(sample.side);
      const limit = this.track.halfWidth + 2.2;
      if (Math.abs(side) > limit) desired.addScaledVector(sample.side, -(Math.abs(side) - limit) * Math.sign(side));
      desired.y = Math.max(desired.y, sample.pos.y + 0.9);
    }

    if (this.cameraMode === "cockpit" || this.phase === "countdown") {
      this.camera.position.copy(desired);
      this.cameraLook.copy(look);
      this.camera.lookAt(look);
    } else {
      const lambda = paused ? 2.5 : 6;
      this.camera.position.lerp(desired, 1 - Math.exp(-lambda * dt));
      this.cameraLook.lerp(look, 1 - Math.exp(-lambda * 1.3 * dt));
      if (this.cameraLook.lengthSq() < 1) this.cameraLook.copy(look);
      this.camera.lookAt(this.cameraLook);
    }
    if (this.shake > 0.002) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.22;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.14;
      this.camera.position.z += (Math.random() - 0.5) * this.shake * 0.22;
    }
    const targetFov = 58 + speedRatio * 8 + (p.drifting ? 2 : 0);
    this.fov = damp(this.fov, targetFov, 3, dt);
    if (Math.abs(this.camera.fov - this.fov) > 0.02) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
    this.playerVisual.showInterior(this.cameraMode === "cockpit");
  }

  private buildStandings(): Standing[] {
    const racers = [
      {
        name: "You",
        car: `${this.spec.make} ${this.spec.model}`,
        color: this.spec.color,
        score: this.player.lap + this.player.progress,
        finished: this.player.finished,
        time: this.player.finishTime || this.elapsed,
        bestLap: this.player.bestLap,
        isPlayer: true,
      },
      ...this.rivals.map((r) => ({
        name: r.name,
        car: r.carName,
        color: r.color,
        score: r.lap + r.progress,
        finished: r.finished,
        time: r.finishTime || this.elapsed,
        bestLap: r.bestLap,
        isPlayer: false,
      })),
    ];
    racers.sort((a, b) => {
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (a.finished && b.finished) return a.time - b.time;
      return b.score - a.score;
    });
    return racers.map((racer, index) => ({
      position: index + 1,
      name: racer.name,
      car: racer.car,
      color: racer.color,
      time: racer.finished ? racer.time : this.elapsed,
      bestLap: racer.bestLap,
      isPlayer: racer.isPlayer,
      finished: racer.finished,
    }));
  }

  private snapshots(): RacerSnapshot[] {
    const count = this.track.samples.length;
    const mapPoint = (index: number) => this.track.minimap[index % count] ?? { x: 0.5, y: 0.5 };
    const list = [
      {
        id: "player",
        name: "You",
        car: this.spec.model,
        color: this.spec.color,
        lap: this.player.lap,
        progress: this.player.progress,
        point: mapPoint(this.player.index),
        isPlayer: true,
        finished: this.player.finished,
        time: this.player.finishTime || this.elapsed,
        score: this.player.lap + this.player.progress,
      },
      ...this.rivals.map((r) => ({
        id: r.name,
        name: r.name,
        car: r.spec.model,
        color: r.color,
        lap: r.lap,
        progress: r.progress,
        point: mapPoint(r.index),
        isPlayer: false,
        finished: r.finished,
        time: r.finishTime || this.elapsed,
        score: r.lap + r.progress,
      })),
    ];
    list.sort((a, b) => {
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (a.finished && b.finished) return a.time - b.time;
      return b.score - a.score;
    });
    return list.map((entry, index) => ({
      id: entry.id,
      name: entry.name,
      car: entry.car,
      color: entry.color,
      position: index + 1,
      lap: Math.min(this.totalLaps, entry.lap + 1),
      progress: entry.progress,
      x: entry.point.x,
      y: entry.point.y,
      isPlayer: entry.isPlayer,
      finished: entry.finished,
      time: entry.time,
    }));
  }

  private buildHud(): HudState {
    const p = this.player;
    const racers = this.snapshots();
    const position = racers.find((r) => r.isPlayer)?.position ?? 1;
    return {
      speed: Math.round(Math.abs(p.vel.dot(this.forwardVec())) * 3.6),
      rpm: THREE.MathUtils.clamp((p.rpm - this.spec.idle) / (this.spec.redline - this.spec.idle), 0, 1),
      gear: p.gear < 1 ? "R" : String(p.gear),
      gearNumber: Math.max(0, p.gear),
      redline: this.spec.redline,
      fuel: p.fuel,
      damage: this.config.damage ? p.damage : 0,
      position,
      totalRacers: racers.length,
      lap: Math.min(this.totalLaps, p.lap + 1),
      totalLaps: this.totalLaps,
      time: this.elapsed,
      lapTime: Math.max(0, this.elapsed - p.lapStart),
      bestLap: p.bestLap,
      countdown:
        this.phase === "countdown" ? Math.max(1, Math.ceil(this.countdown)) : this.goTimer > 0 ? 0 : null,
      drifting: p.drifting,
      driftAngle: Math.min(75, Math.abs(p.traction) * 1.3),
      driftScore: Math.round(p.driftScore),
      mode: this.config.mode,
      weather: this.config.weather,
      timeOfDay: this.config.timeOfDay,
      carName: `${this.spec.make} ${this.spec.model}`,
      trackName: this.track.def.name,
      wrongWay: p.wrongWay,
      checkpoint: this.message,
      standings: racers,
      minimap: this.track.minimap,
      camera: this.cameraMode,
      boosting: false,
      topSpeed: Math.round(this.topSpeed),
      sector: p.sector,
      traction: Math.round(p.traction),
      message: this.message,
    };
  }

  private finishRace() {
    if (this.player.finished) return;
    this.player.finished = true;
    this.player.finishTime = this.elapsed;
    this.phase = "finished";
    const standings = this.buildStandings();
    const position = standings.find((s) => s.isPlayer)?.position ?? 1;
    this.audio.finish(position === 1);
    this.showMessage(position === 1 ? "RACE WON" : "FINISH", 3);
    const result: RaceResult = {
      mode: this.config.mode,
      position,
      totalTime: this.elapsed,
      bestLap: this.player.bestLap,
      laps: this.player.lap,
      topSpeed: Math.round(this.topSpeed),
      driftScore: Math.round(this.driftTotal),
      trackId: this.config.trackId,
      carId: this.config.carId,
      standings,
      won: position === 1,
      newRecord: false,
    };
    if (this.finishTimer) window.clearTimeout(this.finishTimer);
    this.finishTimer = window.setTimeout(() => {
      if (!this.disposed) this.callbacks.onFinish(result);
    }, 1200);
  }

  setQuality(quality: RaceConfig["quality"]) {
    if (quality === this.config.quality) return;
    this.config.quality = quality;
    this.renderer.shadowMap.enabled = quality !== "low";
    this.buildComposer();
    this.resize();
  }

  debugPhase() {
    return this.phase;
  }

  debugStep(dt = 1 / 60) {
    if (this.phase === "countdown") {
      this.tick(dt);
      return;
    }
    this.tick(dt);
  }

  debugWheels() {
    return this.playerVisual.wheelState();
  }

  debugState() {
    return {
      phase: this.phase,
      pos: this.player.pos.toArray(),
      speed: this.player.vel.length() * 3.6,
      gear: this.player.gear,
      rpm: this.player.rpm,
      slip: this.player.traction,
      damage: this.player.damage,
      fuel: this.player.fuel,
      lap: this.player.lap,
      progress: this.player.progress,
      drifting: this.player.drifting,
      driftScore: this.player.driftScore,
      rivals: this.rivals.length,
    };
  }

  /** Test harness: autopilot through a complete event using the real physics. */
  debugFastForward(seconds = 300) {
    const events: string[] = [];
    let lastLap = this.player.lap;
    let stuckTime = 0;
    const steps = Math.round(seconds * 60);
    for (let i = 0; i < steps; i += 1) {
      if (this.phase === "finished") break;
      this.keys.clear();
      if (this.phase === "racing") {
        const speed = this.player.vel.length();
        this.keys.add(this.config.keys.accelerate);
        // Look ahead for the worst curvature within braking distance.
        const lookSamples = Math.max(8, Math.round((14 + speed * 0.9) / 2.4));
        let worst = 0;
        for (let k = 0; k < lookSamples; k += 1) {
          worst = Math.max(worst, this.track.samples[(this.player.index + k) % this.track.samples.length].curvature);
        }
        const safeSpeed = Math.max(8, (this.spec.topSpeed / 3.6) * (1 - THREE.MathUtils.clamp(worst * 520, 0, 0.68)));
        if (speed > safeSpeed + 1.5) {
          this.keys.delete(this.config.keys.accelerate);
          this.keys.add(this.config.keys.brake);
        }
        const aim = this.track.sampleAt(this.player.progress + 0.014 + Math.min(0.03, speed * 0.0007));
        const desired = Math.atan2(aim.pos.x - this.player.pos.x, aim.pos.z - this.player.pos.z);
        const diff = wrap(desired - this.player.heading);
        if (diff > 0.035) this.keys.add(this.config.keys.left);
        else if (diff < -0.035) this.keys.add(this.config.keys.right);
        if (this.player.offRoad && speed < 14) {
          this.keys.delete(this.config.keys.accelerate);
          this.keys.add(this.config.keys.brake);
        }
        if (this.config.transmission === "manual") {
          if (this.player.rpm > this.spec.redline * 0.94 && this.player.shifting <= 0) this.shift(1);
          else if (this.player.rpm < this.spec.idle + 1300 && this.player.gear > 1 && this.player.shifting <= 0) this.shift(-1);
        }
        stuckTime = speed < 2.2 ? stuckTime + 1 / 60 : 0;
        if (stuckTime > 2.5) {
          this.resetToTrack();
          stuckTime = 0;
        }
      }
      this.tick(1 / 60);
      if (this.player.lap !== lastLap) {
        events.push(`lap ${this.player.lap} @ ${this.elapsed.toFixed(1)}s`);
        lastLap = this.player.lap;
        stuckTime = 0;
      }
    }
    this.keys.clear();
    const hud = this.buildHud();
    return {
      events,
      phase: this.phase,
      hud,
      state: this.debugState(),
      rivals: this.rivals.map((r) => ({ name: r.name, lap: r.lap, bestLap: r.bestLap, finished: r.finished })),
      standings: this.buildStandings(),
    };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    if (this.finishTimer) window.clearTimeout(this.finishTimer);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("orientationchange", this.resize);
    document.removeEventListener("fullscreenchange", this.resize);
    this.resizeObserver?.disconnect();
    this.paused = true;
    this.audio.setEngineMuted(true);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        geometries.add(child.geometry);
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => materials.add(m));
      }
    });
    materials.forEach((m) => m.dispose());
    geometries.forEach((g) => g.dispose());
    this.playerVisual.dispose();
    this.rivals.forEach((r) => r.visual.dispose());
    this.particles.smoke.dispose();
    this.particles.spray.dispose();
    this.particles.sparks.dispose();
    this.composer?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    if (this.renderer.domElement.parentElement === this.container) this.container.removeChild(this.renderer.domElement);
    this.scene.clear();
  }
}
