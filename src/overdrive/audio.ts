const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export interface EngineAudioParams {
  rpm: number;
  redline: number;
  throttle: number;
  speed: number;
  gear: number;
  shifting: boolean;
  drifting: number;
  rain: boolean;
  surfaceGrip: number;
  engineLoad: number;
}

export class DriveAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private engineBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private engineOsc: OscillatorNode[] = [];
  private engineGains: GainNode[] = [];
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private squealGain: GainNode | null = null;
  private squealFilter: BiquadFilterNode | null = null;
  private started = false;
  private settings = { master: 0.85, music: 0.3, sfx: 0.85 };
  private musicTimer: number | null = null;
  private musicStep = 0;
  private nextNote = 0;
  private musicRunning = false;
  private lastGear = 1;
  private lastRpmBand = 0;

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
      this.musicBus.gain.value = this.settings.music * 0.5;
      this.musicBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.settings.sfx;
      this.sfxBus.connect(this.master);
      this.engineBus = this.ctx.createGain();
      this.engineBus.gain.value = this.settings.sfx * 0.85;
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

  setSettings(next: { master: number; music: number; sfx: number }) {
    this.settings = next;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.master?.gain.setTargetAtTime(next.master, now, 0.05);
    this.musicBus?.gain.setTargetAtTime(next.music * 0.5, now, 0.08);
    this.sfxBus?.gain.setTargetAtTime(next.sfx, now, 0.05);
    this.engineBus?.gain.setTargetAtTime(next.sfx * 0.85, now, 0.05);
  }

  startEngine() {
    if (!this.ctx || !this.engineBus || !this.noiseBuffer || this.started) return;
    const ctx = this.ctx;
    this.started = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    filter.Q.value = 1.6;
    this.engineFilter = filter;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    filter.connect(gain);
    gain.connect(this.engineBus);
    this.engineGain = gain;

    const make = (type: OscillatorType, freq: number, detune: number, level: number) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.engineOsc.push(osc);
      this.engineGains.push(g);
    };
    make("sawtooth", 60, 0, 0.3);
    make("triangle", 90, 6, 0.16);
    make("square", 120, -5, 0.07);

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 36;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.16;
    sub.connect(subGain);
    subGain.connect(this.engineBus);
    sub.start();
    this.subOsc = sub;
    this.subGain = subGain;

    const startNoise = ctx.createBufferSource();
    startNoise.buffer = this.noiseBuffer;
    const startFilter = ctx.createBiquadFilter();
    startFilter.type = "bandpass";
    startFilter.frequency.value = 1800;
    const startGain = ctx.createGain();
    startGain.gain.value = 0.06;
    startNoise.connect(startFilter);
    startFilter.connect(startGain);
    startGain.connect(this.sfxBus ?? this.engineBus);
    startNoise.start();
    startNoise.stop(ctx.currentTime + 0.5);

    // Wind layer
    const wind = ctx.createBufferSource();
    wind.buffer = this.noiseBuffer;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 500;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.0001;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.engineBus);
    wind.start();
    this.windGain = windGain;
    this.windFilter = windFilter;

    // Rain bed
    const rain = ctx.createBufferSource();
    rain.buffer = this.noiseBuffer;
    rain.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = "highpass";
    rainFilter.frequency.value = 900;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.0001;
    rain.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.sfxBus ?? this.engineBus);
    rain.start();
    this.rainGain = rainGain;

    // Tyre squeal bed
    const squeal = ctx.createBufferSource();
    squeal.buffer = this.noiseBuffer;
    squeal.loop = true;
    const squealFilter = ctx.createBiquadFilter();
    squealFilter.type = "bandpass";
    squealFilter.frequency.value = 1600;
    squealFilter.Q.value = 8;
    const squealGain = ctx.createGain();
    squealGain.gain.value = 0.0001;
    squeal.connect(squealFilter);
    squealFilter.connect(squealGain);
    squealGain.connect(this.sfxBus ?? this.engineBus);
    squeal.start();
    this.squealGain = squealGain;
    this.squealFilter = squealFilter;

    gain.gain.setTargetAtTime(0.32, ctx.currentTime, 0.6);
    this.starterMotor();
  }

  private starterMotor() {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(28, now);
    osc.frequency.linearRampToValueAtTime(64, now + 0.45);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  updateEngine(params: EngineAudioParams) {
    if (!this.ctx || !this.started || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const norm = Math.max(0, Math.min(1.1, params.rpm / Math.max(1, params.redline)));
    const gearOffset = 1 + (6 - Math.min(6, params.gear)) * 0.02;
    const base = 48 + norm * 150 * gearOffset;
    this.engineOsc.forEach((osc, index) => {
      const harmonic = [1, 1.5, 2.02][index] ?? 1;
      osc.frequency.setTargetAtTime(base * harmonic, now, 0.04);
    });
    this.subOsc?.frequency.setTargetAtTime(28 + norm * 40, now, 0.06);
    this.subGain?.gain.setTargetAtTime(0.1 + norm * 0.16, now, 0.08);
    const load = Math.max(0, Math.min(1, params.engineLoad));
    this.engineGain.gain.setTargetAtTime(
      (0.16 + norm * 0.3 + params.throttle * 0.09) * (params.shifting ? 0.3 : 1),
      now,
      0.06
    );
    if (this.engineFilter) {
      this.engineFilter.frequency.setTargetAtTime(500 + norm * 2400 + load * 700 + params.throttle * 500, now, 0.06);
    }
    if (this.windGain) this.windGain.gain.setTargetAtTime(Math.min(0.09, params.speed * 0.0016), now, 0.2);
    if (this.windFilter) this.windFilter.frequency.setTargetAtTime(400 + params.speed * 8, now, 0.2);
    if (this.rainGain) this.rainGain.gain.setTargetAtTime(params.rain ? 0.055 : 0.0001, now, 0.3);
    if (this.squealGain) this.squealGain.gain.setTargetAtTime(Math.min(0.13, params.drifting * 0.018), now, 0.06);
    if (this.squealFilter) this.squealFilter.frequency.setTargetAtTime(1100 + params.drifting * 120, now, 0.08);

    if (params.gear > this.lastGear && params.gear <= 8) {
      this.shiftPop();
    }
    this.lastGear = params.gear;
    if (norm > 0.96 && this.lastRpmBand < 0.96) this.limiterBounce();
    this.lastRpmBand = norm;
  }

  private shiftPop() {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1500;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    noise.start(now);
    noise.stop(now + 0.2);
    const thump = this.ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(92, now);
    thump.frequency.exponentialRampToValueAtTime(42, now + 0.16);
    const tg = this.ctx.createGain();
    tg.gain.setValueAtTime(0.11, now);
    tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    thump.connect(tg);
    tg.connect(this.sfxBus);
    thump.start(now);
    thump.stop(now + 0.22);
  }

  private limiterBounce() {
    this.beep(140, 0.05, "square", 0.02);
  }

  setEngineMuted(muted: boolean) {
    if (!this.ctx || !this.engineBus) return;
    this.engineBus.gain.setTargetAtTime(muted ? 0 : this.settings.sfx * 0.85, this.ctx.currentTime, 0.1);
  }

  private beep(freq: number, duration: number, type: OscillatorType = "sine", level = 0.2, delay = 0) {
    if (!this.ctx || !this.sfxBus) return;
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  countdown(step: number) {
    if (step > 0) this.beep(480 + (3 - step) * 40, 0.2, "square", 0.18);
    else {
      this.beep(880, 0.4, "sawtooth", 0.16);
      this.beep(1320, 0.5, "sine", 0.12, 0.06);
    }
  }

  uiClick() {
    this.beep(640, 0.05, "triangle", 0.08);
  }
  uiConfirm() {
    this.beep(520, 0.1, "triangle", 0.12);
    this.beep(780, 0.14, "sine", 0.1, 0.07);
  }
  uiBack() {
    this.beep(380, 0.08, "triangle", 0.09);
  }
  checkpoint() {
    this.beep(940, 0.12, "sine", 0.1);
  }
  lap() {
    [620, 830, 1240].forEach((f, i) => this.beep(f, 0.18, "triangle", 0.1, i * 0.07));
  }
  shiftIndicator(direction: "up" | "down") {
    this.beep(direction === "up" ? 880 : 640, 0.04, "square", 0.03);
  }
  crash(intensity: number) {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200 * intensity, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    source.start(now);
    source.stop(now + 0.5);
    const thump = this.ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(110, now);
    thump.frequency.exponentialRampToValueAtTime(38, now + 0.22);
    const tg = this.ctx.createGain();
    tg.gain.setValueAtTime(0.3 * intensity, now);
    tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    thump.connect(tg);
    tg.connect(this.sfxBus);
    thump.start(now);
    thump.stop(now + 0.3);
  }
  finish(won: boolean) {
    (won ? [60, 64, 67, 72] : [60, 62, 67, 62]).forEach((note, i) =>
      this.beep(midi(note + 12), 0.38, "triangle", 0.11, i * 0.12)
    );
  }

  startMusic() {
    if (!this.ctx || !this.musicBus || this.musicRunning) return;
    this.musicRunning = true;
    this.nextNote = this.ctx.currentTime + 0.2;
    this.musicStep = 0;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 100);
  }
  setMusicMode(_mode: "menu" | "race") {
    void _mode;
  }
  private scheduleMusic() {
    if (!this.ctx || !this.musicRunning || !this.musicBus) return;
    const stepDuration = 60 / 84 / 4;
    while (this.nextNote < this.ctx.currentTime + 0.3) {
      const step = this.musicStep;
      const bar = Math.floor(step / 16) % 4;
      const chords = [
        [48, 55, 60, 64],
        [45, 52, 57, 60],
        [41, 48, 53, 57],
        [43, 50, 55, 59],
      ];
      const chord = chords[bar];
      const bus = this.musicBus;
      if (step % 16 === 0) {
        chord.forEach((note, i) => {
          const osc = this.ctx!.createOscillator();
          osc.type = "sine";
          osc.frequency.value = midi(note);
          const g = this.ctx!.createGain();
          g.gain.setValueAtTime(0.0001, this.nextNote);
          g.gain.linearRampToValueAtTime(0.028, this.nextNote + 1.4);
          g.gain.exponentialRampToValueAtTime(0.0001, this.nextNote + 4.2);
          osc.connect(g);
          g.connect(bus);
          osc.start(this.nextNote + i * 0.03);
          osc.stop(this.nextNote + 4.4);
        });
      }
      if (step % 16 === 0 || step % 16 === 6 || step % 16 === 10) {
        const osc = this.ctx!.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = midi(chord[0] - 12);
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.0001, this.nextNote);
        g.gain.linearRampToValueAtTime(0.05, this.nextNote + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, this.nextNote + 0.5);
        osc.connect(g);
        g.connect(bus);
        osc.start(this.nextNote);
        osc.stop(this.nextNote + 0.55);
      }
      this.nextNote += stepDuration;
      this.musicStep = (this.musicStep + 1) % 64;
    }
  }
  stopMusic() {
    this.musicRunning = false;
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  dispose() {
    this.stopMusic();
    this.engineOsc.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
    });
    try {
      this.subOsc?.stop();
      void this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this.started = false;
    this.engineOsc = [];
  }
}

let singleton: DriveAudio | null = null;
export const getDriveAudio = (): DriveAudio => {
  if (!singleton) singleton = new DriveAudio();
  return singleton;
};
