const midi = (note: number) => 440 * Math.pow(2, (note - 69) / 12);

const CHORDS: number[][] = [
  [45, 48, 52, 57], // A minor
  [41, 45, 48, 53], // F
  [36, 40, 43, 48], // C
  [43, 47, 50, 55], // G
];

export class RaceAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private engineBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private engineOsc: OscillatorNode[] = [];
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private driftGain: GainNode | null = null;
  private driftSource: AudioBufferSourceNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private nextNote = 0;
  private musicRunning = false;
  private musicMode: "menu" | "race" = "menu";
  private engineStarted = false;
  private settings = { master: 0.8, music: 0.35, sfx: 0.8 };
  private lastGearFrequency = 0;

  init(): boolean {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return true;
    }
    try {
      const Ctx = window.AudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.settings.master;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.settings.music * 0.55;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.settings.sfx;
      this.sfxBus.connect(this.master);

      this.engineBus = this.ctx.createGain();
      this.engineBus.gain.value = this.settings.sfx * 0.8;
      this.engineBus.connect(this.master);

      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
      return true;
    } catch (error) {
      console.warn("Audio unavailable", error);
      return false;
    }
  }

  setSettings(settings: { master: number; music: number; sfx: number }) {
    this.settings = settings;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.master?.gain.setTargetAtTime(settings.master, now, 0.05);
    this.musicBus?.gain.setTargetAtTime(settings.music * 0.55, now, 0.08);
    this.sfxBus?.gain.setTargetAtTime(settings.sfx, now, 0.05);
    this.engineBus?.gain.setTargetAtTime(settings.sfx * 0.8, now, 0.05);
  }

  startEngine() {
    if (!this.ctx || !this.engineBus || !this.noiseBuffer || this.engineStarted) return;
    const ctx = this.ctx;
    this.engineStarted = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 850;
    filter.Q.value = 3.4;
    this.engineFilter = filter;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.engineBus);
    filter.connect(gain);
    this.engineGain = gain;

    const makeOsc = (type: OscillatorType, frequency: number, detune: number, level: number) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency;
      osc.detune.value = detune;
      const oscGain = ctx.createGain();
      oscGain.gain.value = level;
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      this.engineOsc.push(osc);
      return osc;
    };
    makeOsc("sawtooth", 65, 0, 0.36);
    makeOsc("square", 98, 8, 0.12);
    makeOsc("sawtooth", 130, -6, 0.08);

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 38;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.2;
    sub.connect(subGain);
    subGain.connect(this.engineBus);
    sub.start();
    this.subOsc = sub;

    // Rolling tyre / road noise.
    const roadNoise = ctx.createBufferSource();
    roadNoise.buffer = this.noiseBuffer;
    roadNoise.loop = true;
    const roadFilter = ctx.createBiquadFilter();
    roadFilter.type = "bandpass";
    roadFilter.frequency.value = 320;
    roadFilter.Q.value = 0.8;
    const roadGain = ctx.createGain();
    roadGain.gain.value = 0.03;
    roadNoise.connect(roadFilter);
    roadFilter.connect(roadGain);
    roadGain.connect(this.engineBus);
    roadNoise.start();

    // Drift squeal, gated by gain.
    const drift = ctx.createBufferSource();
    drift.buffer = this.noiseBuffer;
    drift.loop = true;
    const driftFilter = ctx.createBiquadFilter();
    driftFilter.type = "bandpass";
    driftFilter.frequency.value = 1850;
    driftFilter.Q.value = 5;
    const driftGain = ctx.createGain();
    driftGain.gain.value = 0;
    drift.connect(driftFilter);
    driftFilter.connect(driftGain);
    driftGain.connect(this.sfxBus ?? this.engineBus);
    drift.start();
    this.driftGain = driftGain;
    this.driftSource = drift;

    gain.gain.setTargetAtTime(0.35, ctx.currentTime, 0.5);
  }

  updateEngine(params: {
    speed: number;
    maxSpeed: number;
    throttle: number;
    braking: boolean;
    drifting: boolean;
    boosting: boolean;
    grounded?: boolean;
  }) {
    if (!this.ctx || !this.engineStarted || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const ratio = Math.min(1.25, Math.abs(params.speed) / Math.max(1, params.maxSpeed));
    const rpm = 0.16 + ratio * 0.78 + (params.throttle > 0 ? 0.05 : 0) - (params.braking ? 0.05 : 0);
    const base = 52 + ratio * 122 + (params.boosting ? 16 : 0);
    this.engineOsc.forEach((osc, index) => {
      const harmonic = [1, 1.5, 2][index] ?? 1;
      osc.frequency.setTargetAtTime(base * harmonic, now, 0.06);
    });
    this.subOsc?.frequency.setTargetAtTime(30 + ratio * 34, now, 0.08);
    this.engineGain.gain.setTargetAtTime(0.2 + rpm * 0.3 + (params.throttle > 0 ? 0.08 : 0), now, 0.07);
    if (this.engineFilter) {
      this.engineFilter.frequency.setTargetAtTime(500 + ratio * 1800 + (params.boosting ? 900 : 0), now, 0.08);
    }
    if (this.driftGain) {
      this.driftGain.gain.setTargetAtTime(params.drifting && params.grounded ? 0.11 + ratio * 0.08 : 0, now, 0.06);
    }
    this.lastGearFrequency = base;
  }

  setEngineMuted(muted: boolean) {
    if (!this.ctx || !this.engineBus) return;
    this.engineBus.gain.setTargetAtTime(muted ? 0 : this.settings.sfx * 0.8, this.ctx.currentTime, 0.1);
  }

  private beep(frequency: number, duration: number, type: OscillatorType = "sine", level = 0.25, delay = 0) {
    if (!this.ctx || !this.sfxBus) return;
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  countdown(step: number) {
    if (step > 0) this.beep(430 + (3 - step) * 45, 0.22, "square", 0.2);
    else {
      this.beep(880, 0.4, "sawtooth", 0.18);
      this.beep(1320, 0.55, "sine", 0.14, 0.06);
    }
  }

  uiClick() {
    this.beep(720, 0.05, "triangle", 0.1);
  }

  uiConfirm() {
    this.beep(520, 0.1, "triangle", 0.15);
    this.beep(780, 0.16, "sine", 0.13, 0.08);
  }

  uiBack() {
    this.beep(420, 0.08, "triangle", 0.1);
    this.beep(320, 0.1, "triangle", 0.09, 0.06);
  }

  checkpoint() {
    this.beep(980, 0.14, "sine", 0.15);
    this.beep(1460, 0.22, "sine", 0.12, 0.09);
  }

  lapComplete() {
    [760, 1015, 1520].forEach((frequency, index) => {
      this.beep(frequency, 0.2, "triangle", 0.15, index * 0.08);
    });
  }

  nitro() {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + 0.45);
    filter.frequency.exponentialRampToValueAtTime(900, now + 1.1);
    filter.Q.value = 1.2;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    noise.start(now);
    noise.stop(now + 1.3);
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.5);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.09, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc.connect(oscGain);
    oscGain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  crash(intensity = 1) {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200 * intensity, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + 0.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.36 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    source.start(now);
    source.stop(now + 0.55);
    const thump = this.ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(120, now);
    thump.frequency.exponentialRampToValueAtTime(38, now + 0.22);
    const thumpGain = this.ctx.createGain();
    thumpGain.gain.setValueAtTime(0.35 * intensity, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    thump.connect(thumpGain);
    thumpGain.connect(this.sfxBus);
    thump.start(now);
    thump.stop(now + 0.35);
  }

  gearShift() {
    this.beep(240, 0.06, "square", 0.06);
  }

  driftMilestone() {
    this.beep(1180, 0.09, "sine", 0.1);
  }

  finish(won: boolean) {
    const notes = won ? [60, 64, 67, 72, 76, 79] : [60, 64, 67, 64];
    notes.forEach((note, index) => {
      this.beep(midi(note + 12), 0.4, "triangle", 0.14, index * 0.12);
    });
  }

  startMusic(mode: "menu" | "race" = "menu") {
    if (!this.ctx || !this.musicBus) return;
    this.musicMode = mode;
    if (this.musicRunning) return;
    this.musicRunning = true;
    this.nextNote = this.ctx.currentTime + 0.15;
    this.musicStep = 0;
    const tick = () => {
      this.scheduleMusic();
    };
    this.musicTimer = window.setInterval(tick, 90);
  }

  setMusicMode(mode: "menu" | "race") {
    this.musicMode = mode;
  }

  private scheduleMusic() {
    if (!this.ctx || !this.musicRunning || !this.musicBus) return;
    const tempo = this.musicMode === "race" ? 122 : 96;
    const stepDuration = 60 / tempo / 4;
    while (this.nextNote < this.ctx.currentTime + 0.25) {
      this.playStep(this.musicStep, this.nextNote, stepDuration);
      this.nextNote += stepDuration;
      this.musicStep = (this.musicStep + 1) % 64;
    }
  }

  private playStep(step: number, time: number, stepDuration: number) {
    if (!this.ctx || !this.musicBus) return;
    const bar = Math.floor(step / 16) % 4;
    const beat = step % 16;
    const chord = CHORDS[bar];
    const bus = this.musicBus;

    const tone = (
      frequency: number,
      type: OscillatorType,
      gainValue: number,
      duration: number,
      attack: number,
      filterFreq: number,
      detune = 0
    ) => {
      const ctx = this.ctx;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency;
      osc.detune.value = detune;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = filterFreq;
      filter.Q.value = 0.8;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainValue, time + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    };

    if (beat % 4 === 0) {
      const kick = this.ctx.createOscillator();
      kick.type = "sine";
      kick.frequency.setValueAtTime(140, time);
      kick.frequency.exponentialRampToValueAtTime(42, time + 0.16);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
      kick.connect(gain);
      gain.connect(bus);
      kick.start(time);
      kick.stop(time + 0.32);
    }
    if (beat % 2 === 0 && this.noiseBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 6800;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.055, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      source.start(time);
      source.stop(time + 0.06);
    }
    if (beat % 2 === 1 && this.noiseBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 4200;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.085, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      source.start(time);
      source.stop(time + 0.13);
    }
    if (beat % 2 === 0) {
      tone(midi(chord[0] - 12), "triangle", 0.18, 0.32, 0.01, 460);
      tone(midi(chord[0] - 24), "sine", 0.16, 0.28, 0.01, 260);
    }
    if (beat % 4 === 2) {
      tone(midi(chord[2] + 12), "square", 0.025, 0.28, 0.02, 1800);
    }
    if (beat === 0) {
      chord.forEach((note, index) => {
        tone(midi(note + 12), "sawtooth", 0.018, 3.2, 0.7, 760, index % 2 === 0 ? -7 : 7);
      });
    }
    if (beat % 8 === 4) {
      tone(midi(chord[3] + 12), "triangle", 0.03, 0.7, 0.02, 2400);
    }
    void stepDuration;
  }

  stopMusic() {
    this.musicRunning = false;
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  dispose() {
    this.stopMusic();
    this.engineOsc.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // Oscillator may already have stopped.
      }
    });
    try {
      this.subOsc?.stop();
      this.driftSource?.stop();
      void this.ctx?.close();
    } catch {
      // Context already closed.
    }
    this.ctx = null;
    this.engineStarted = false;
    this.engineOsc = [];
  }

  debugState() {
    return { running: !!this.ctx, engine: this.engineStarted, music: this.musicRunning, freq: this.lastGearFrequency };
  }
}

let singleton: RaceAudio | null = null;
export const getAudio = (): RaceAudio => {
  if (!singleton) singleton = new RaceAudio();
  return singleton;
};
