import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { createTrack } from "./track";
import type { TrackModel } from "./track";
import { createEnvironment } from "./environment";
import type { EnvironmentRig } from "./environment";
import { createCarVisual } from "./carModel";
import type { CarVisual } from "./carModel";
import { ParticlePool } from "./particles";
import { getAudio } from "./audio";
import { AI_PALETTE, CARS, getCar, getTrack } from "./data";
import type {
  CameraMode,
  CarSpec,
  HudState,
  Quality,
  RaceConfig,
  RaceResult,
  RacerSnapshot,
  Standing,
} from "./types";

interface PlayerState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  heading: number;
  index: number;
  progress: number;
  lap: number;
  sectors: number;
  lapStart: number;
  bestLap: number | null;
  topSpeed: number;
  finished: boolean;
  finishTime: number;
  spin: number;
  steering: number;
  drifting: boolean;
  driftScore: number;
  driftTime: number;
  nitro: number;
  boosting: boolean;
  wrongWay: boolean;
  crossedLine: boolean;
  wallCooldown: number;
  carCooldown: number;
  totalTime: number;
}

interface AiRacer {
  id: string;
  name: string;
  colorHex: string;
  visual: CarVisual;
  pos: THREE.Vector3;
  heading: number;
  speed: number;
  index: number;
  progress: number;
  lap: number;
  crossedStart: boolean;
  finished: boolean;
  finishTime: number;
  laneBase: number;
  lane: number;
  lanePhase: number;
  baseSpeed: number;
  accel: number;
  braking: boolean;
  spin: number;
  carName: string;
  prevIndex?: number;
}

interface Callbacks {
  onHud: (state: HudState) => void;
  onFinish: (result: RaceResult) => void;
  onPauseRequest: () => void;
  onReady: () => void;
}

type Phase = "countdown" | "racing" | "finished";

const GEAR_BANDS = [0, 44, 86, 128, 168, 208, 250];
const aiNames = AI_PALETTE;

const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

const wrapAngle = (angle: number) => {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
};

export class RaceGame {
  private container: HTMLDivElement;
  private config: RaceConfig;
  private callbacks: Callbacks;
  private spec: CarSpec;
  private track: TrackModel;
  private env: EnvironmentRig;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private quality: Quality;
  private resizeObserver: ResizeObserver | null = null;
  private frame = 0;
  private lastTime = 0;
  private accumulator = 0;
  private paused = false;
  private disposed = false;
  private phase: Phase = "countdown";
  private countdown = 3;
  private lastCountNumber = 3;
  private goTimer = 0;
  private elapsed = 0;
  private hudAccumulator = 0;
  private cameraMode: CameraMode = "chase";
  private shake = 0;
  private boostFlash = 0;
  private checkpointText: string | null = null;
  private checkpointTimer = 0;
  private cameraLook = new THREE.Vector3();
  private cameraPosition = new THREE.Vector3();
  private fov = 64;
  private lastGear = 1;
  private particles: { nitro: ParticlePool; smoke: ParticlePool; sparks: ParticlePool };
  private nitroAccumulator = 0;
  private smokeAccumulator = 0;
  private completedLaps: number[] = [];
  private playerVisual: CarVisual;
  private player: PlayerState;
  private opponents: AiRacer[] = [];
  private gridPositions: { index: number; lane: number }[] = [];
  private keys = new Set<string>();
  private audio = getAudio();
  private standings: Standing[] = [];
  private loserTimeout: number | null = null;

  constructor(container: HTMLDivElement, config: RaceConfig, callbacks: Callbacks) {
    this.container = container;
    this.config = config;
    this.callbacks = callbacks;
    this.spec = getCar(config.carId);
    this.quality = config.quality || "high";

    const trackDef = getTrack(config.trackId);
    this.track = createTrack(trackDef);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(trackDef.skyTop);
    this.camera = new THREE.PerspectiveCamera(
      64,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      2600
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality !== "low",
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === "high" ? 2 : this.quality === "medium" ? 1.5 : 1));
    this.renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.shadowMap.enabled = this.quality !== "low";
    this.renderer.shadowMap.type = this.quality === "high" ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.inset = "0";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.setAttribute("aria-label", "NEON RUSH race view");
    container.appendChild(this.renderer.domElement);

    this.scene.add(this.track.group);
    this.env = createEnvironment(this.track, this.scene, this.quality);
    this.scene.environment = this.createEnvironmentMap();
    this.scene.environmentIntensity = 0.62;

    this.particles = {
      nitro: new ParticlePool(320, true),
      smoke: new ParticlePool(220, false),
      sparks: new ParticlePool(220, true),
    };
    this.scene.add(this.particles.nitro.points, this.particles.smoke.points, this.particles.sparks.points);

    this.playerVisual = createCarVisual({
      bodyColor: this.spec.bodyColor,
      accentColor: this.spec.accentColor,
      rimColor: this.spec.rimColor,
      roof: this.spec.roof,
      spoiler: this.spec.spoiler,
      quality: this.quality,
      isPlayer: true,
    });
    this.scene.add(this.playerVisual.root);

    const visualVariants = [CARS[0], CARS[1], CARS[2], CARS[0], CARS[2]];
    aiNames.forEach((entry, i) => {
      const tint = new THREE.Color(entry.color);
      const visual = createCarVisual({
        bodyColor: tint.clone().multiplyScalar(0.28).getStyle(),
        accentColor: entry.color,
        rimColor: "#cfd8e8",
        roof: visualVariants[i].roof,
        spoiler: visualVariants[i].spoiler,
        quality: this.quality,
        isPlayer: false,
      });
      this.scene.add(visual.root);
      this.opponents.push({
        id: `ai-${i}`,
        name: entry.name,
        colorHex: entry.color,
        visual,
        pos: new THREE.Vector3(),
        heading: 0,
        speed: 0,
        index: 0,
        progress: 0,
        lap: 0,
        crossedStart: false,
        finished: false,
        finishTime: 0,
        laneBase: 0,
        lane: 0,
        lanePhase: i * 1.37,
        baseSpeed: 59 + i * 1.05,
        accel: 16 + i * 0.65,
        braking: false,
        spin: 0,
        carName: visualVariants[i].name,
      });
    });

    this.gridPositions = [
      { index: -6, lane: 2.35 },
      { index: -9, lane: -2.35 },
      { index: -13, lane: 2.35 },
      { index: -16, lane: -2.35 },
      { index: -21, lane: 2.35 },
      { index: -25, lane: -2.35 },
    ];
    this.player = this.makePlayerState();

    this.buildComposer();
    this.resetRace();
    this.setupEvents();

    this.audio.init();
    this.audio.startEngine();
    this.audio.setEngineMuted(false);
    this.audio.setMusicMode("race");
    this.audio.startMusic("race");

    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.loop);
    this.callbacks.onReady();
    if (typeof window !== "undefined") {
      (window as unknown as { __NEON_RUSH__: RaceGame }).__NEON_RUSH__ = this;
    }
  }

  private makePlayerState(): PlayerState {
    const slot = this.gridPositions[3];
    const count = this.track.samples.length;
    const index = (slot.index + count) % count;
    const sample = this.track.samples[index];
    const pos = sample.pos.clone().addScaledVector(sample.side, slot.lane);
    return {
      pos,
      vel: new THREE.Vector3(),
      heading: Math.atan2(sample.tangent.x, sample.tangent.z),
      index,
      progress: index / count,
      lap: 0,
      sectors: 0,
      lapStart: 0,
      bestLap: null,
      topSpeed: 0,
      finished: false,
      finishTime: 0,
      spin: 0,
      steering: 0,
      drifting: false,
      driftScore: 0,
      driftTime: 0,
      nitro: 78,
      boosting: false,
      wrongWay: false,
      crossedLine: false,
      wallCooldown: 0,
      carCooldown: 0,
      totalTime: 0,
    };
  }

  private createEnvironmentMap(): THREE.Texture {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    const background = new THREE.Mesh(
      new THREE.SphereGeometry(40, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x0a0618, side: THREE.BackSide })
    );
    envScene.add(background);
    const panels: [number, number, number, number, number, number, number][] = [
      [-14, 9, -12, 26, 12, 0x22e6ff, 5],
      [16, 6, -6, 14, 9, 0xff2ea6, 4],
      [0, 15, 0, 18, 5, 0xffffff, 3],
      [-8, 2, 12, 12, 4, 0x7b5cff, 3],
    ];
    panels.forEach(([x, y, z, w, h, color, intensity]) => {
      const material = new THREE.MeshBasicMaterial();
      material.color.set(color).multiplyScalar(intensity);
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
      panel.position.set(x, y, z);
      panel.lookAt(0, 0, 0);
      envScene.add(panel);
    });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshBasicMaterial({ color: 0x111322 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -12;
    envScene.add(floor);
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
    this.bloom = null;
    if (this.quality === "low") return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const composer = new EffectComposer(this.renderer);
    composer.setSize(width, height);
    composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      this.quality === "high" ? 0.42 : 0.28,
      0.38,
      0.86
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    this.bloom = bloom;
    this.composer = composer;
  }

  private resize = () => {
    if (!this.container) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === "high" ? 2 : this.quality === "medium" ? 1.5 : 1));
    this.renderer.setSize(width, height, false);
    this.composer?.setSize(width, height);
    this.bloom?.setSize(width, height);
  };

  private setupEvents() {
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

  private onBlur = () => {
    this.keys.clear();
  };

  private onKeyDown = (event: KeyboardEvent) => {
    const code = event.code;
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "ShiftLeft", "ShiftRight"].includes(code)
    ) {
      event.preventDefault();
    }
    if (this.keys.has(code)) return;
    this.keys.add(code);
    if (code === "Escape") {
      this.callbacks.onPauseRequest();
      return;
    }
    if (code === "KeyC") this.cycleCamera();
    if (code === "KeyR" && this.phase === "racing") this.resetPlayerToTrack();
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private isDown(...codes: string[]) {
    return codes.some((code) => this.keys.has(code));
  }

  private controlsActive() {
    return !this.paused && this.phase !== "countdown";
  }

  setVirtualInput(code: string, down: boolean) {
    const map: Record<string, string> = {
      arrowup: "KeyW",
      arrowdown: "KeyS",
      arrowsdown: "KeyS",
      arrowleft: "KeyA",
      arrowright: "KeyD",
      space: "Space",
      shiftleft: "ShiftLeft",
      shiftright: "ShiftRight",
    };
    const mapped = map[code.toLowerCase()] ?? code;
    if (down) this.keys.add(mapped);
    else this.keys.delete(mapped);
  }

  cycleCamera() {
    const order: CameraMode[] = ["chase", "far", "bumper"];
    const current = order.indexOf(this.cameraMode);
    this.cameraMode = order[(current + 1) % order.length];
  }

  private resetPlayerToTrack() {
    const sample = this.track.samples[this.player.index];
    this.player.pos.copy(sample.pos);
    this.player.vel.set(0, 0, 0);
    this.player.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
    this.checkpointText = "RECOVERED TO TRACK";
    this.checkpointTimer = 1.8;
  }

  resetRace() {
    this.phase = "countdown";
    this.countdown = 3;
    this.lastCountNumber = 3;
    this.goTimer = 0;
    this.elapsed = 0;
    this.completedLaps = [];
    this.shake = 0;
    this.boostFlash = 0;
    this.checkpointText = null;
    this.checkpointTimer = 0;
    this.nitroAccumulator = 0;
    this.smokeAccumulator = 0;
    this.standings = [];
    this.player = this.makePlayerState();
    this.particles.nitro.clear();
    this.particles.smoke.clear();
    this.particles.sparks.clear();

    const count = this.track.samples.length;
    this.opponents.forEach((ai, i) => {
      const grid = this.gridPositions[[0, 1, 2, 4, 5][i]];
      const index = (grid.index + count) % count;
      const sample = this.track.samples[index];
      ai.pos.copy(sample.pos).addScaledVector(sample.side, grid.lane);
      ai.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
      ai.speed = 0;
      ai.index = index;
      ai.prevIndex = index;
      ai.progress = index / count;
      ai.lap = 0;
      ai.crossedStart = false;
      ai.finished = false;
      ai.finishTime = 0;
      ai.laneBase = grid.lane;
      ai.lane = grid.lane;
      ai.braking = false;
      ai.spin = 0;
      ai.visual.setPosition(ai.pos, ai.heading);
    });

    this.playerVisual.setPosition(this.player.pos, this.player.heading);
    this.playerVisual.setBoost(0);
    this.playerVisual.setBrake(false);
    this.playerVisual.setSteer(0);
    this.cameraMode = "chase";
    this.updateCamera(0.016, true);
    this.audio.countdown(3);
    this.paused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  private loop = (time: number) => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    const rawDelta = (time - this.lastTime) / 1000;
    this.lastTime = time;
    const frameDelta = Math.min(0.5, Math.max(0, rawDelta));

    if (!this.paused) {
      // Fixed-step simulation: game clock stays real-time even when the
      // renderer is slow, and handling remains deterministic.
      this.accumulator = Math.min(0.5, this.accumulator + frameDelta);
      const step = 1 / 60;
      let steps = 0;
      while (this.accumulator >= step && steps < 30) {
        this.tick(step);
        this.accumulator -= step;
        steps += 1;
      }
      if (steps === 0) {
        this.updateCamera(Math.min(frameDelta, 0.05), false);
      }
    } else {
      this.updateCamera(Math.min(frameDelta, 0.05), false, true);
      this.env.update(time / 1000, Math.min(frameDelta, 0.05) * 0.35, this.player.pos);
    }
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  };

  private tick(dt: number) {
    this.env.update(this.elapsed, dt, this.player.pos);

    if (this.phase === "countdown") {
      this.countdown -= dt;
      const number = Math.ceil(this.countdown);
      if (number > 0 && number !== this.lastCountNumber) {
        this.lastCountNumber = number;
        this.audio.countdown(number);
      }
      if (this.countdown <= 0) {
        this.phase = "racing";
        this.goTimer = 0.9;
        this.elapsed = 0;
        this.player.lapStart = 0;
        this.audio.countdown(0);
      }
      const throttle = this.isDown("KeyW", "ArrowUp") ? 1 : 0;
      this.audio.updateEngine({
        speed: 0,
        maxSpeed: this.spec.topSpeed,
        throttle,
        braking: false,
        drifting: false,
        boosting: false,
      });
    } else if (this.phase === "racing") {
      this.elapsed += dt;
      this.goTimer = Math.max(0, this.goTimer - dt);
      this.updatePlayer(dt);
      this.updateOpponents(dt);
      this.resolveCarCollisions();
      this.updateAudio();
    } else {
      this.elapsed += dt;
      this.goTimer = Math.max(0, this.goTimer - dt);
      const forward = new THREE.Vector3(Math.sin(this.player.heading), 0, Math.cos(this.player.heading));
      this.player.vel.multiplyScalar(Math.exp(-1.6 * dt));
      this.player.pos.addScaledVector(this.player.vel, dt);
      this.player.spin += Math.max(0, this.player.vel.dot(forward)) * dt * 2.55;
      this.updateOpponents(dt * 0.35);
    }

    this.playerVisual.setPosition(this.player.pos, this.player.heading);
    this.playerVisual.setSpin(this.player.spin);
    this.playerVisual.body.rotation.z = damp(
      this.playerVisual.body.rotation.z,
      -this.player.steering * 0.055 - this.player.vel.dot(this.getRight()) * 0.0035,
      6,
      dt
    );
    this.playerVisual.body.rotation.x = damp(
      this.playerVisual.body.rotation.x,
      -this.track.samples[this.player.index].tangent.y * 1.25 - (this.player.boosting ? 0.012 : 0),
      5,
      dt
    );
    this.playerVisual.body.position.y = damp(
      this.playerVisual.body.position.y,
      this.player.boosting ? 0.01 : 0,
      8,
      dt
    );

    this.updateEffects(dt);
    this.updateCamera(dt, false);
    this.shake = Math.max(0, this.shake - dt * 1.5);
    this.hudAccumulator += dt;
    if (this.hudAccumulator > 0.05) {
      this.hudAccumulator = 0;
      this.callbacks.onHud(this.buildHud());
    }
  }

  private getRight() {
    return new THREE.Vector3(Math.cos(this.player.heading), 0, -Math.sin(this.player.heading));
  }

  private updatePlayer(dt: number) {
    const player = this.player;
    const active = this.controlsActive();
    const throttle = active && this.isDown("KeyW", "ArrowUp");
    const brake = active && this.isDown("KeyS", "ArrowDown");
    const left = active && this.isDown("KeyA", "ArrowLeft");
    const right = active && this.isDown("KeyD", "ArrowRight");
    const handbrake = active && this.isDown("Space");
    const nitroHeld = active && this.isDown("ShiftLeft", "ShiftRight");
    // With the chase camera looking along +Z, increasing heading turns screen-left.
    const steerTarget = (left ? 1 : 0) - (right ? 1 : 0);
    player.steering = damp(player.steering, steerTarget, handbrake ? 12 : 8, dt);

    const sample = this.track.samples[player.index];
    const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
    let rightVec = new THREE.Vector3(Math.cos(player.heading), 0, -Math.sin(player.heading));
    const forwardSpeed = player.vel.dot(forward);
    const lateralSpeed = player.vel.dot(rightVec);
    const maxSpeed = this.spec.topSpeed * (player.boosting ? 1.24 : 1) * this.track.def.grip;

    // --- Drivetrain --------------------------------------------------------
    const pushingNitro = nitroHeld && player.nitro > 0.5 && forwardSpeed > 4;
    if (pushingNitro && !player.boosting) {
      this.audio.nitro();
      this.shake = Math.max(this.shake, 0.2);
      this.burstNitro(16);
    }
    player.boosting = pushingNitro;
    if (pushingNitro) {
      player.nitro = Math.max(0, player.nitro - dt * 24);
    } else {
      const driftRecharge = player.drifting ? 9 : 0;
      player.nitro = Math.min(100, player.nitro + dt * (3.2 + driftRecharge));
    }

    let axial = forwardSpeed;
    if (throttle) {
      const powerCurve = 1 - THREE.MathUtils.clamp(axial / Math.max(1, maxSpeed), 0, 1) * 0.72;
      axial += this.spec.acceleration * powerCurve * dt;
    }
    if (brake) {
      axial -= (axial > 0.8 ? 24 : 9) * dt;
    }
    if (!throttle && !brake) axial *= Math.exp(-0.7 * dt);
    if (handbrake) axial -= axial * 0.3 * dt;
    axial *= Math.exp(-0.035 * dt);
    axial -= sample.tangent.y * 12 * dt;
    if (pushingNitro) axial += this.spec.acceleration * 1.05 * this.spec.nitroPower * dt;
    axial = THREE.MathUtils.clamp(axial, -15, maxSpeed);

    const grip = this.spec.grip * this.track.def.grip * (handbrake ? 0.17 : 1);
    let lateral = lateralSpeed * Math.exp(-grip * dt);

    const speedRatio = THREE.MathUtils.clamp(Math.abs(axial) / this.spec.topSpeed, 0, 1);
    const steerAuthority = THREE.MathUtils.clamp(Math.abs(axial) / 7, 0, 1);
    const yawRate =
      player.steering *
      1.5 *
      this.spec.handling *
      steerAuthority *
      (1 - speedRatio * 0.4) *
      (handbrake ? 1.5 : 1) *
      (axial < 0 ? -1 : 1);

    // Build the current world velocity, THEN rotate the chassis. The momentum
    // stays put, so the car slides while the nose rotates — actual drift.
    const worldX = forward.x * axial + rightVec.x * lateral;
    const worldZ = forward.z * axial + rightVec.z * lateral;
    player.heading += yawRate * dt;
    forward.set(Math.sin(player.heading), 0, Math.cos(player.heading));
    rightVec = new THREE.Vector3(Math.cos(player.heading), 0, -Math.sin(player.heading));
    let newForward = worldX * forward.x + worldZ * forward.z;
    let newLateral = worldX * rightVec.x + worldZ * rightVec.z;
    // Tyres scrub off sideways speed; handbrake keeps the rear loose.
    newLateral *= Math.exp(-grip * 0.85 * dt);

    // Counter-steer stability keeps big slides recoverable.
    if (player.steering !== 0 && Math.abs(newLateral) > 4) {
      player.heading += Math.sign(newLateral) * -0.16 * Math.abs(player.steering) * dt;
      forward.set(Math.sin(player.heading), 0, Math.cos(player.heading));
      rightVec = new THREE.Vector3(Math.cos(player.heading), 0, -Math.sin(player.heading));
      newForward = worldX * forward.x + worldZ * forward.z;
      newLateral = worldX * rightVec.x + worldZ * rightVec.z;
    }
    player.vel.copy(forward).multiplyScalar(newForward).addScaledVector(rightVec, newLateral);
    player.pos.addScaledVector(player.vel, dt);

    // --- Track bounds ------------------------------------------------------
    player.index = this.track.nearestIndex(player.pos, player.index);
    const center = this.track.samples[player.index];
    const sideOffset = new THREE.Vector3().subVectors(player.pos, center.pos).dot(center.side);
    const wallLimit = this.track.halfWidth - 1.03;
    if (Math.abs(sideOffset) > wallLimit) {
      const sign = Math.sign(sideOffset);
      const normal = center.side.clone().multiplyScalar(sign);
      player.pos.addScaledVector(normal, -(Math.abs(sideOffset) - wallLimit));
      const impact = player.vel.dot(normal);
      if (impact > 0) player.vel.addScaledVector(normal, -impact * 1.28);
      player.vel.multiplyScalar(0.84);
      if (player.wallCooldown <= 0 && Math.abs(impact) > 2.5) {
        player.wallCooldown = 0.4;
        this.shake = Math.min(1, 0.35 + Math.abs(impact) * 0.014);
        this.audio.crash(THREE.MathUtils.clamp(Math.abs(impact) / 30, 0.25, 1));
        const contact = center.pos.clone().addScaledVector(center.side, sign * wallLimit);
        contact.y += 0.5;
        this.burstSparks(contact, 16 + Math.floor(Math.abs(impact) * 0.4));
      }
    }
    player.wallCooldown = Math.max(0, player.wallCooldown - dt);
    player.carCooldown = Math.max(0, player.carCooldown - dt);

    player.pos.y = damp(player.pos.y, center.pos.y + 0.02, 16, dt);
    player.spin += newForward * dt * 2.55;
    player.topSpeed = Math.max(player.topSpeed, Math.abs(newForward) * 3.6);

    const slip = Math.abs(newLateral);
    const powerSlide = handbrake && Math.abs(axial) > 9 && Math.abs(player.steering) > 0.25;
    player.drifting = active && Math.abs(newForward) > 7 && (slip > 2.4 || powerSlide);
    if (player.drifting) {
      player.driftTime += dt;
      player.driftScore += (slip * 9 + Math.abs(newForward) * 0.8) * dt;
      if (player.driftTime > 0.7) player.nitro = Math.min(100, player.nitro + dt * 5);
    } else {
      player.driftScore = Math.max(0, player.driftScore - dt * 18);
      player.driftTime = 0;
    }

    const headingVsTrack = forward.dot(center.tangent);
    player.wrongWay = headingVsTrack < -0.35 && Math.abs(newForward) > 3;

    const prevProgress = player.progress;
    player.progress = player.index / this.track.samples.length;
    this.updateLapProgress(prevProgress, player.progress);

    this.playerVisual.setBrake(brake && newForward > 1);
    this.playerVisual.setSteer(player.steering * 0.42);
    this.playerVisual.setBoost(player.boosting ? 1 : 0);
  }

  /** Two sector gates plus the start line validate every lap. */
  private updateLapProgress(prev: number, current: number) {
    const player = this.player;
    if (prev < 0.34 && current >= 0.34) {
      player.sectors |= 1;
      this.checkpointText = "SECTOR 01 CLEAR";
      this.checkpointTimer = 2.2;
      this.audio.checkpoint();
    }
    if (prev < 0.67 && current >= 0.67) {
      player.sectors |= 2;
      this.checkpointText = "SECTOR 02 CLEAR";
      this.checkpointTimer = 2.2;
      this.audio.checkpoint();
    }
    if (prev > 0.76 && current < 0.24) {
      if (!player.crossedLine) {
        // The grid sits behind the line: rolling over it opens lap one.
        player.crossedLine = true;
        player.sectors = 0;
        player.lapStart = this.elapsed;
        this.checkpointText = `LAP 01 OF ${this.config.laps}`;
        this.checkpointTimer = 2.2;
      } else if ((player.sectors & 3) === 3) {
        const lapTime = this.elapsed - player.lapStart;
        player.lapStart = this.elapsed;
        this.completedLaps.push(lapTime);
        player.bestLap = player.bestLap === null ? lapTime : Math.min(player.bestLap, lapTime);
        player.lap += 1;
        player.sectors = 0;
        this.audio.lapComplete();
        this.shake = Math.max(this.shake, 0.22);
        if (player.lap >= this.config.laps) {
          this.finishRace();
        } else {
          this.checkpointText =
            player.lap === this.config.laps - 1
              ? "FINAL LAP — SEND IT"
              : `LAP ${player.lap + 1} OF ${this.config.laps}`;
          this.checkpointTimer = 3;
        }
      } else {
        player.sectors = 0;
        this.checkpointText = "LAP INVALID — CHECKPOINTS MISSED";
        this.checkpointTimer = 2.4;
      }
    }
    player.progress = current;
  }

  private updateOpponents(dt: number) {
    const count = this.track.samples.length;
    const playerScore = this.player.lap + this.player.progress;
    this.opponents.forEach((ai) => {
      const active = !this.paused && this.phase !== "countdown";
      if (!active) {
        ai.speed = 0;
        ai.visual.setPosition(ai.pos, ai.heading);
        return;
      }
      if (ai.finished) {
        ai.speed = damp(ai.speed, 12, 1.2, dt);
      }
      const sample = this.track.samples[ai.index];
      const aheadIndex = (ai.index + Math.floor((10 + ai.speed * 0.42) / 2.1) + count) % count;
      let curve = 0;
      for (let k = 0; k < 12; k += 1) {
        curve = Math.max(curve, this.track.samples[(aheadIndex + k) % count].curvature);
      }
      const aiScore = ai.lap + ai.progress;
      const rubberBand = 1 + THREE.MathUtils.clamp((playerScore - aiScore) * 0.08, -0.055, 0.1);
      const cornerLimit = ai.baseSpeed * (1 - THREE.MathUtils.clamp(curve * 230, 0, 0.36));
      const targetSpeed = ai.finished ? 12 : cornerLimit * rubberBand;
      if (ai.speed < targetSpeed) {
        ai.speed = Math.min(targetSpeed, ai.speed + ai.accel * dt * 1.6);
        ai.braking = false;
      } else {
        ai.speed = Math.max(targetSpeed, ai.speed - 24 * dt);
        ai.braking = ai.speed - targetSpeed > 2;
      }
      const laneTarget = ai.laneBase + Math.sin(this.elapsed * 0.34 + ai.lanePhase) * 0.85;
      ai.lane = damp(ai.lane, THREE.MathUtils.clamp(laneTarget, -this.track.halfWidth + 2.2, this.track.halfWidth - 2.2), 1.4, dt);

      const progressAhead = ai.progress + (7 + ai.speed * 0.2) / this.track.length;
      const targetSample = this.track.sampleAt(progressAhead);
      const target = targetSample.pos.clone().addScaledVector(targetSample.side, ai.lane);
      const desiredHeading = Math.atan2(target.x - ai.pos.x, target.z - ai.pos.z);
      const difference = wrapAngle(desiredHeading - ai.heading);
      const turn = THREE.MathUtils.clamp(difference, -1.9 * dt, 1.9 * dt);
      ai.heading += turn;
      const forward = new THREE.Vector3(Math.sin(ai.heading), 0, Math.cos(ai.heading));
      ai.pos.addScaledVector(forward, ai.speed * dt);
      ai.index = this.track.nearestIndex(ai.pos, ai.index);
      const currentSample = this.track.samples[ai.index];
      const lateral = new THREE.Vector3().subVectors(ai.pos, currentSample.pos).dot(currentSample.side);
      const limit = this.track.halfWidth - 1.15;
      if (Math.abs(lateral) > limit) {
        ai.pos.addScaledVector(currentSample.side, -(Math.abs(lateral) - limit) * Math.sign(lateral));
        ai.speed *= 0.9;
      }
      ai.pos.y = damp(ai.pos.y, currentSample.pos.y + 0.02, 15, dt);
      ai.progress = ai.index / count;
      ai.spin += ai.speed * dt * 2.5;

      // Wrap detection uses the hint index from the previous frame.
      if (ai.prevIndex !== undefined && ai.prevIndex > count * 0.8 && ai.index < count * 0.2) {
        if (!ai.crossedStart) {
          ai.crossedStart = true;
        } else if (!ai.finished) {
          ai.lap += 1;
          if (ai.lap >= this.config.laps) {
            ai.finished = true;
            ai.finishTime = this.elapsed;
          }
        }
      }
      ai.prevIndex = ai.index;

      ai.visual.setPosition(ai.pos, ai.heading);
      ai.visual.setSpin(ai.spin);
      ai.visual.setBrake(ai.braking);
      ai.visual.body.rotation.z = damp(ai.visual.body.rotation.z, -difference * 0.18, 5, dt);
      ai.visual.body.rotation.x = damp(ai.visual.body.rotation.x, -sample.tangent.y, 4, dt);
      void sample;
    });
  }

  private resolveCarCollisions() {
    if (this.phase !== "racing") return;
    const player = this.player;
    this.opponents.forEach((ai) => {
      const dx = player.pos.x - ai.pos.x;
      const dz = player.pos.z - ai.pos.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 2.35 && distance > 0.001) {
        const nx = dx / distance;
        const nz = dz / distance;
        const overlap = 2.35 - distance;
        player.pos.x += nx * overlap * 0.55;
        player.pos.z += nz * overlap * 0.55;
        ai.pos.x -= nx * overlap * 0.45;
        ai.pos.z -= nz * overlap * 0.45;
        const relative = player.vel.x * -nx + player.vel.z * -nz;
        if (relative > 0) {
          player.vel.x += nx * relative * 0.85;
          player.vel.z += nz * relative * 0.85;
          ai.speed = Math.max(0, ai.speed - relative * 0.4);
        }
        if (player.carCooldown <= 0) {
          player.carCooldown = 0.45;
          this.shake = Math.max(this.shake, 0.5);
          this.audio.crash(0.7);
          const contact = player.pos.clone().lerp(ai.pos, 0.5);
          contact.y += 0.45;
          this.burstSparks(contact, 14);
        }
      }
    });
    // Opponents gently separate from each other.
    for (let i = 0; i < this.opponents.length; i += 1) {
      for (let j = i + 1; j < this.opponents.length; j += 1) {
        const a = this.opponents[i];
        const b = this.opponents[j];
        const dx = a.pos.x - b.pos.x;
        const dz = a.pos.z - b.pos.z;
        const distance = Math.hypot(dx, dz);
        if (distance < 2.3 && distance > 0.01) {
          const push = (2.3 - distance) * 0.5;
          a.pos.x += (dx / distance) * push;
          a.pos.z += (dz / distance) * push;
          b.pos.x -= (dx / distance) * push;
          b.pos.z -= (dz / distance) * push;
          a.speed *= 0.985;
          b.speed *= 0.985;
        }
      }
    }
  }

  private burstNitro(amount: number) {
    const forward = new THREE.Vector3(Math.sin(this.player.heading), 0, Math.cos(this.player.heading));
    for (let i = 0; i < amount; i += 1) {
      const origin = this.localToWorld((i % 2 === 0 ? -0.47 : 0.47), 0.5, -2.35);
      const velocity = forward
        .clone()
        .multiplyScalar(-(4 + Math.random() * 5))
        .add(new THREE.Vector3((Math.random() - 0.5) * 1.3, Math.random() * 0.8, (Math.random() - 0.5) * 1.3));
      this.particles.nitro.spawn(origin, velocity, {
        color: i % 3 === 0 ? 0xffffff : this.spec.accentColor,
        size: 0.3 + Math.random() * 0.45,
        life: 0.3 + Math.random() * 0.35,
        drag: 0.92,
        gravity: -0.35,
      });
    }
  }

  private burstSparks(position: THREE.Vector3, amount: number) {
    for (let i = 0; i < amount; i += 1) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        2 + Math.random() * 7,
        (Math.random() - 0.5) * 12
      );
      this.particles.sparks.spawn(position, velocity, {
        color: Math.random() > 0.5 ? 0xffc45a : 0xff6a20,
        size: 0.16 + Math.random() * 0.22,
        life: 0.3 + Math.random() * 0.4,
        gravity: 14,
        drag: 0.95,
      });
    }
  }

  private localToWorld(x: number, y: number, z: number) {
    const cos = Math.cos(this.player.heading);
    const sin = Math.sin(this.player.heading);
    return new THREE.Vector3(
      this.player.pos.x + x * cos + z * sin,
      this.player.pos.y + y,
      this.player.pos.z - x * sin + z * cos
    );
  }

  private updateEffects(dt: number) {
    this.checkpointTimer = Math.max(0, this.checkpointTimer - dt);
    if (this.checkpointTimer <= 0) this.checkpointText = null;
    this.boostFlash = damp(this.boostFlash, this.player.boosting ? 1 : 0, this.player.boosting ? 8 : 3, dt);
    this.particles.nitro.update(dt);
    this.particles.smoke.update(dt);
    this.particles.sparks.update(dt);

    const forward = new THREE.Vector3(Math.sin(this.player.heading), 0, Math.cos(this.player.heading));
    if (this.player.boosting) {
      this.nitroAccumulator += dt;
      while (this.nitroAccumulator > 0.012) {
        this.nitroAccumulator -= 0.012;
        for (const x of [-0.47, 0.47]) {
          const origin = this.localToWorld(x, 0.5, -2.35);
          const velocity = forward
            .clone()
            .multiplyScalar(-(8 + Math.random() * 8))
            .add(new THREE.Vector3((Math.random() - 0.5) * 1.6, Math.random() * 0.55, (Math.random() - 0.5) * 1.6));
          this.particles.nitro.spawn(origin, velocity, {
            color: Math.random() > 0.38 ? this.spec.accentColor : 0xffffff,
            size: 0.22 + Math.random() * 0.5,
            life: 0.24 + Math.random() * 0.3,
            drag: 0.9,
            gravity: -0.4,
          });
        }
      }
      this.shake = Math.max(this.shake, 0.055);
    }
    if (this.player.drifting || this.player.drifting) {
      this.smokeAccumulator += dt;
      const rate = this.player.drifting ? 0.026 : 0.08;
      while (this.smokeAccumulator > rate) {
        this.smokeAccumulator -= rate;
        const x = Math.random() > 0.5 ? -0.98 : 0.98;
        const origin = this.localToWorld(x, 0.12, -1.4);
        const velocity = new THREE.Vector3(
          -forward.x * 1.8 + (Math.random() - 0.5) * 2,
          0.6 + Math.random() * 1.2,
          -forward.z * 1.8 + (Math.random() - 0.5) * 2
        );
        this.particles.smoke.spawn(origin, velocity, {
          color: this.spec.accentColor,
          size: 0.9 + Math.random() * 0.9,
          life: 0.55 + Math.random() * 0.5,
          gravity: -1.4,
          drag: 0.9,
        });
      }
    }
    // Ambient dust kicked up at speed.
    if (Math.abs(this.player.vel.length()) > 30 && Math.random() > 0.65) {
      const origin = this.localToWorld(this.player.vel.length() > 50 ? 0.9 : -0.9, 0.08, -1.9);
      this.particles.smoke.spawn(origin, new THREE.Vector3(0, 0.3 + Math.random(), 0), {
        color: 0x7d76a8,
        size: 0.35 + Math.random() * 0.4,
        life: 0.4,
        gravity: -0.5,
        drag: 0.9,
      });
    }
  }

  private updateAudio() {
    const forward = new THREE.Vector3(Math.sin(this.player.heading), 0, Math.cos(this.player.heading));
    const speed = this.player.vel.dot(forward);
    const kmh = Math.abs(speed) * 3.6;
    let gear = 1;
    for (let i = 1; i < GEAR_BANDS.length - 1; i += 1) {
      if (kmh >= GEAR_BANDS[i]) gear = i + 1;
    }
    if (gear !== this.lastGear && gear > this.lastGear && kmh > 20) {
      this.audio.gearShift();
      this.lastGear = gear;
    } else {
      this.lastGear = gear;
    }
    this.audio.updateEngine({
      speed,
      maxSpeed: this.spec.topSpeed,
      throttle: this.isDown("KeyW", "ArrowUp") ? 1 : 0,
      braking: this.isDown("KeyS", "ArrowDown"),
      drifting: this.player.drifting,
      boosting: this.player.boosting,
    });
  }

  private updateCamera(dt: number, immediate = false, pausedOrbit = false) {
    const player = this.player;
    const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
    const velocityDirection =
      player.vel.lengthSq() > 4 ? player.vel.clone().setY(0).normalize() : forward.clone();
    const speedRatio = THREE.MathUtils.clamp(player.vel.length() / this.spec.topSpeed, 0, 1);
    let desired: THREE.Vector3;
    let look: THREE.Vector3;

    if (this.phase === "countdown") {
      const progress = THREE.MathUtils.clamp((3 - this.countdown) / 3, 0, 1);
      const portraitBoost = this.camera.aspect < 1 ? 1.55 : this.camera.aspect < 1.4 ? 1.18 : 1;
      const angle = player.heading + Math.PI * (1 - progress) + 0.42;
      const radius = (15.5 - progress * 5.4) * portraitBoost;
      desired = player.pos
        .clone()
        .add(new THREE.Vector3(Math.sin(angle) * radius, 4.6 - progress * 1.2, Math.cos(angle) * radius));
      look = player.pos.clone().add(new THREE.Vector3(0, 0.85, 0));
    } else if (pausedOrbit) {
      const angle = performance.now() / 4500 + player.heading;
      desired = player.pos
        .clone()
        .add(new THREE.Vector3(Math.sin(angle) * 11, 3.2, Math.cos(angle) * 11));
      look = player.pos.clone().add(new THREE.Vector3(0, 0.8, 0));
    } else if (this.phase === "finished") {
      const angle = player.heading + Math.PI * 0.62 + Math.sin(performance.now() / 5000) * 0.35;
      desired = player.pos
        .clone()
        .add(new THREE.Vector3(Math.sin(angle) * 14.5, 4.4, Math.cos(angle) * 14.5));
      look = player.pos.clone().add(new THREE.Vector3(0, 0.9, 0));
    } else if (this.cameraMode === "bumper") {
      desired = player.pos
        .clone()
        .addScaledVector(forward, 0.75)
        .add(new THREE.Vector3(0, 0.82, 0));
      look = player.pos.clone().addScaledVector(forward, 22).add(new THREE.Vector3(0, 0.95, 0));
    } else {
      const portrait = this.camera.aspect < 1 ? 1.32 : 1;
      const distance = (this.cameraMode === "far" ? 12.5 : 8.4) * portrait;
      const height = (this.cameraMode === "far" ? 4.7 : 2.85) * (this.camera.aspect < 1 ? 1.18 : 1);
      const direction = forward.clone().lerp(velocityDirection, this.player.drifting ? 0.55 : 0.24).normalize();
      desired = player.pos.clone().addScaledVector(direction, -distance).add(new THREE.Vector3(0, height, 0));
      look = player.pos
        .clone()
        .addScaledVector(forward, 6.5 + speedRatio * 5)
        .add(new THREE.Vector3(0, 1.1, 0));
    }

    // Keep the camera out of the city and above the road surface.
    if (this.phase !== "countdown") {
      const cameraIndex = this.track.nearestIndex(desired, player.index);
      const sample = this.track.samples[cameraIndex];
      const side = new THREE.Vector3().subVectors(desired, sample.pos).dot(sample.side);
      const limit = this.track.halfWidth + 1.6;
      if (Math.abs(side) > limit) {
        desired.addScaledVector(sample.side, -(Math.abs(side) - limit) * Math.sign(side));
      }
      desired.y = Math.max(desired.y, sample.pos.y + 1.05);
    }

    const lambda = immediate ? 1000 : this.cameraMode === "bumper" ? 16 : 6.2;
    this.cameraPosition.copy(desired);
    if (immediate) {
      this.camera.position.copy(desired);
      this.cameraLook.copy(look);
    } else {
      this.camera.position.lerp(desired, 1 - Math.exp(-lambda * dt));
      this.cameraLook.lerp(look, 1 - Math.exp(-(lambda * 1.4) * dt));
    }
    const shakeAmount = this.shake * (this.config.cameraShake ? 1 : 0);
    if (shakeAmount > 0.002) {
      this.camera.position.x += (Math.random() - 0.5) * shakeAmount * 0.5;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmount * 0.32;
      this.camera.position.z += (Math.random() - 0.5) * shakeAmount * 0.5;
    }
    if (!this.cameraLook.equals(new THREE.Vector3())) {
      this.camera.lookAt(this.cameraLook);
    }
    const targetFov =
      62 + speedRatio * 9 + this.boostFlash * 6 + (this.cameraMode === "bumper" ? 6 : 0);
    this.fov = damp(this.fov, targetFov, 3, dt);
    if (Math.abs(this.camera.fov - this.fov) > 0.02) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  private buildStandings(): Standing[] {
    const competitors = [
      {
        name: "YOU",
        car: this.spec.name,
        color: this.spec.accentColor,
        lap: this.player.lap,
        progress: this.player.progress,
        finished: this.player.finished,
        finishTime: this.player.finishTime,
        isPlayer: true,
        score: this.player.lap + this.player.progress,
        speed: this.player.vel.length(),
      },
      ...this.opponents.map((ai) => ({
        name: ai.name,
        car: ai.carName,
        color: ai.colorHex,
        lap: ai.lap,
        progress: ai.progress,
        finished: ai.finished,
        finishTime: ai.finishTime,
        isPlayer: false,
        score: ai.lap + ai.progress,
        speed: ai.speed,
      })),
    ];
    competitors.sort((a, b) => {
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      return b.score - a.score;
    });
    return competitors.map((racer, index) => {
      const remaining = Math.max(
        0,
        (this.config.laps - racer.lap - racer.progress) * this.track.length
      );
      const projected = racer.finished
        ? racer.finishTime
        : this.elapsed + remaining / Math.max(14, racer.speed);
      return {
        position: index + 1,
        name: racer.name,
        car: racer.car,
        color: racer.color,
        time: projected,
        laps: Math.min(this.config.laps, racer.lap + (racer.finished ? 0 : 1)),
        isPlayer: racer.isPlayer,
      };
    });
  }

  private makeRacerSnapshots(): RacerSnapshot[] {
    const count = this.track.samples.length;
    const mapIndex = (index: number) => {
      const point = this.track.minimap[index % count];
      return point ?? { x: 0.5, y: 0.5 };
    };
    const list = [
      {
        id: "player",
        name: "YOU",
        color: this.spec.accentColor,
        position: 0,
        lap: this.player.lap,
        progress: this.player.progress,
        ...mapIndex(this.player.index),
        isPlayer: true,
        finished: this.player.finished,
        time: this.player.finished ? this.player.finishTime : this.elapsed,
        score: this.player.lap + this.player.progress,
      },
      ...this.opponents.map((ai) => {
        const point = mapIndex(ai.index);
        return {
          id: ai.id,
          name: ai.name,
          color: ai.colorHex,
          position: 0,
          lap: ai.lap,
          progress: ai.progress,
          x: point.x,
          y: point.y,
          isPlayer: false,
          finished: ai.finished,
          time: ai.finished ? ai.finishTime : this.elapsed,
          score: ai.lap + ai.progress,
        };
      }),
    ];
    list.sort((a, b) => {
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (a.finished && b.finished) return a.time - b.time;
      return b.score - a.score;
    });
    return list.map((entry, index) => ({
      id: entry.id,
      name: entry.name,
      color: entry.color,
      position: index + 1,
      lap: Math.min(this.config.laps, entry.lap + 1),
      progress: entry.progress,
      x: entry.x,
      y: entry.y,
      isPlayer: entry.isPlayer,
      finished: entry.finished,
      time: entry.time,
    }));
  }

  private buildHud(): HudState {
    const player = this.player;
    const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
    const signedSpeed = player.vel.dot(forward) * 3.6;
    const kmh = Math.abs(signedSpeed);
    let gear = 1;
    for (let i = 1; i < GEAR_BANDS.length - 1; i += 1) {
      if (kmh >= GEAR_BANDS[i]) gear = i + 1;
    }
    const lower = GEAR_BANDS[gear - 1];
    const upper = GEAR_BANDS[gear] ?? 280;
    const rpm = THREE.MathUtils.clamp(0.18 + ((kmh - lower) / Math.max(1, upper - lower)) * 0.82, 0.1, 1);
    const snapshots = this.makeRacerSnapshots();
    this.standings = this.buildStandings();
    const playerPosition = snapshots.find((racer) => racer.isPlayer)?.position ?? 1;
    return {
      speed: Math.round(kmh),
      gear: signedSpeed < -1 ? 0 : gear,
      rpm,
      nitro: player.nitro,
      boosting: player.boosting,
      drifting: player.drifting,
      driftScore: Math.round(player.driftScore),
      position: playerPosition,
      totalRacers: 6,
      lap: Math.min(this.config.laps, player.lap + 1),
      totalLaps: this.config.laps,
      time: this.elapsed,
      lapTime: this.elapsed - player.lapStart,
      bestLap: player.bestLap,
      countdown:
        this.phase === "countdown"
          ? Math.max(1, Math.ceil(this.countdown))
          : this.goTimer > 0
            ? 0
            : null,
      wrongWay: player.wrongWay,
      checkpoint: this.checkpointText,
      standings: snapshots,
      topSpeed: player.topSpeed,
      minimap: this.track.minimap,
      cameraMode: this.cameraMode,
      boostFlash: this.boostFlash,
      shake: this.shake,
      sector: player.sectors,
    };
  }

  private finishRace() {
    if (this.player.finished) return;
    this.player.finished = true;
    this.player.finishTime = this.elapsed;
    this.player.totalTime = this.elapsed;
    this.phase = "finished";
    this.shake = 0.35;
    this.standings = this.buildStandings();
    const position = this.standings.find((entry) => entry.isPlayer)?.position ?? 1;
    const won = position === 1;
    this.audio.finish(won);
    const result: RaceResult = {
      position,
      totalTime: this.player.finishTime,
      bestLap: this.player.bestLap,
      laps: this.completedLaps.length,
      topSpeed: Math.round(this.player.topSpeed),
      trackId: this.config.trackId,
      carId: this.config.carId,
      standings: this.standings,
      won,
    };
    this.loserTimeout = window.setTimeout(() => {
      if (!this.disposed) this.callbacks.onFinish(result);
    }, 900);
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
    this.resetRace();
    this.audio.setEngineMuted(false);
    this.audio.countdown(3);
  }

  setQuality(quality: Quality) {
    if (quality === this.quality) return;
    this.quality = quality;
    this.renderer.shadowMap.enabled = quality !== "low";
    this.renderer.shadowMap.type = quality === "high" ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.env.setQuality(quality);
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          material.needsUpdate = true;
        });
      }
    });
    this.buildComposer();
    this.resize();
  }

  getSnapshot(): HudState {
    return this.buildHud();
  }

  /** Test hook: advance simulation explicitly without waiting for the render loop. */
  debugStep(dt = 1 / 60) {
    this.tick(dt);
  }

  debugPhase(): string {
    return this.phase;
  }

  /**
   * Headless QA harness: advances the real simulation with a simple autopilot.
   * Used by scripts/race-test.mjs to verify laps, checkpoints, AI and the finish
   * state without waiting on a GPU.
   */
  debugFastForward(seconds = 90, autopilot = true) {
    const step = 1 / 30;
    const events: string[] = [];
    let lastLap = this.player.lap;
    let lastPhase = this.phase;
    for (let i = 0; i < seconds / step; i += 1) {
      if (this.phase === "countdown") {
        this.keys.add("KeyW");
      } else if (this.phase === "racing" && autopilot) {
        this.keys.add("KeyW");
        this.keys.delete("KeyS");
        this.keys.delete("Space");
        this.keys.delete("ShiftLeft");
        const lookAhead = 0.018 + Math.min(0.03, Math.abs(this.player.vel.length()) * 0.00055);
        const target = this.track.sampleAt(this.player.progress + lookAhead);
        const aim = target.pos.clone().addScaledVector(target.side, 0);
        const desired = Math.atan2(aim.x - this.player.pos.x, aim.z - this.player.pos.z);
        const difference = wrapAngle(desired - this.player.heading);
        const steer = THREE.MathUtils.clamp(difference * 4, -1, 1);
        if (steer > 0.06) {
          this.keys.add("KeyA");
          this.keys.delete("KeyD");
        } else if (steer < -0.06) {
          this.keys.add("KeyD");
          this.keys.delete("KeyA");
        } else {
          this.keys.delete("KeyA");
          this.keys.delete("KeyD");
        }
        const ahead = this.track.samples[
          (this.player.index + Math.round((12 + this.player.vel.length() * 0.5) / 2.1)) % this.track.samples.length
        ];
        if (ahead.curvature > 0.014 && this.player.vel.length() > 24) {
          this.keys.add("KeyS");
          this.keys.delete("KeyW");
        }
      }
      this.tick(step);
      if (this.player.lap !== lastLap) {
        events.push(`lap ${this.player.lap} @ ${this.elapsed.toFixed(2)}s (best ${this.player.bestLap?.toFixed(2)})`);
        lastLap = this.player.lap;
      }
      if (this.phase !== lastPhase) {
        events.push(`phase ${lastPhase} -> ${this.phase}`);
        lastPhase = this.phase;
      }
      if (this.phase === "finished") break;
    }
    this.keys.clear();
    const hud = this.buildHud();
    return {
      events,
      phase: this.phase,
      position: hud.position,
      lap: hud.lap,
      lapTime: hud.lapTime,
      time: hud.time,
      bestLap: hud.bestLap,
      topSpeed: hud.topSpeed,
      speed: hud.speed,
      sector: hud.sector,
      checkpointsPassed: this.player.lap > 0,
      standings: hud.standings.map((entry) => ({ name: entry.name, lap: entry.lap, finished: entry.finished })),
      completedLaps: [...this.completedLaps],
      aiLaps: this.opponents.map((ai) => ({ name: ai.name, lap: ai.lap, index: ai.index, progress: ai.progress })),
      playerProgress: this.player.progress,
      playerIndex: this.player.index,
      finished: this.player.finished,
    };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    if (this.loserTimeout !== null) window.clearTimeout(this.loserTimeout);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("orientationchange", this.resize);
    document.removeEventListener("fullscreenchange", this.resize);
    this.resizeObserver?.disconnect();
    this.paused = true;
    this.audio.setEngineMuted(true);
    const materials = new Set<THREE.Material>();
    const geometries = new Set<THREE.BufferGeometry>();
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        geometries.add(child.geometry);
        const list = Array.isArray(child.material) ? child.material : [child.material];
        list.forEach((material) => materials.add(material));
      }
    });
    materials.forEach((material) => material.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    this.particles.nitro.dispose();
    this.particles.smoke.dispose();
    this.particles.sparks.dispose();
    this.composer?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.scene.clear();
  }
}
