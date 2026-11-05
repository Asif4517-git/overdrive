import * as THREE from "three";

/** Small deterministic RNG so every generated city is stable between runs. */
export const makeRandom = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

export const makeCanvasTexture = (
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  options: { repeat?: [number, number]; wrap?: boolean } = {}
): THREE.CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (options.wrap !== false) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  if (options.repeat) texture.repeat.set(options.repeat[0], options.repeat[1]);
  texture.needsUpdate = true;
  return texture;
};

export const makeRoadTexture = () =>
  makeCanvasTexture(256, 512, (ctx) => {
    const rand = makeRandom(84);
    ctx.fillStyle = "#080a12";
    ctx.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 5200; i += 1) {
      const g = Math.floor(18 + rand() * 26);
      ctx.fillStyle = `rgba(${g},${g + 3},${g + 12},${0.16 + rand() * 0.24})`;
      const size = rand() * 2.4 + 0.4;
      ctx.fillRect(rand() * 256, rand() * 512, size, size);
    }
    // Faint tyre wear down the racing line.
    const wear = ctx.createLinearGradient(0, 0, 256, 0);
    wear.addColorStop(0, "rgba(0,0,0,0)");
    wear.addColorStop(0.3, "rgba(0,0,0,0.35)");
    wear.addColorStop(0.5, "rgba(0,0,0,0.05)");
    wear.addColorStop(0.7, "rgba(0,0,0,0.35)");
    wear.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wear;
    ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = "rgba(225,240,255,0.82)";
    ctx.fillRect(9, 0, 4, 512);
    ctx.fillRect(243, 0, 4, 512);
    ctx.fillStyle = "rgba(205,230,255,0.52)";
    ctx.fillRect(126, 34, 4, 168);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#c7e5ff";
    ctx.fillRect(84, 0, 2, 512);
    ctx.fillRect(170, 0, 2, 512);
    ctx.restore();
    const light = ctx.createLinearGradient(0, 0, 256, 0);
    light.addColorStop(0, "rgba(60,220,255,0.11)");
    light.addColorStop(0.5, "rgba(0,0,0,0)");
    light.addColorStop(1, "rgba(255,60,200,0.09)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 256, 512);
  });

export const makeCurbTexture = (accent: string) =>
  makeCanvasTexture(64, 64, (ctx) => {
    ctx.fillStyle = "#8d97a8";
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = "#c2ccd9";
    ctx.fillRect(0, 2, 64, 1.5);
    const tone = new THREE.Color(accent).multiplyScalar(0.62).getStyle();
    ctx.fillStyle = tone;
    ctx.fillRect(0, 32, 64, 32);
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(0, 30, 64, 3);
    ctx.fillRect(0, 58, 64, 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    for (let i = 0; i < 64; i += 10) ctx.fillRect(i, 0, 1, 62);
  });

export const makeCheckerTexture = () =>
  makeCanvasTexture(
    256,
    64,
    (ctx) => {
      const cell = 32;
      for (let y = 0; y < 64 / cell; y += 1) {
        for (let x = 0; x < 256 / cell; x += 1) {
          ctx.fillStyle = (x + y) % 2 === 0 ? "#f5f7ff" : "#0a0a14";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    },
    { repeat: [6, 1] }
  );

export const makeWindowTexture = (
  seed: number,
  warm: string,
  cool: string,
  columns = 8,
  rows = 18
) =>
  makeCanvasTexture(128, 256, (ctx) => {
    const rand = makeRandom(seed);
    ctx.fillStyle = "#05060d";
    ctx.fillRect(0, 0, 128, 256);
    const cw = 128 / columns;
    const ch = 256 / rows;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const lit = rand();
        if (lit > 0.58) {
          ctx.globalAlpha = 0.18 + rand() * 0.7;
          ctx.fillStyle = lit > 0.84 ? warm : cool;
          ctx.fillRect(x * cw + cw * 0.2, y * ch + ch * 0.22, cw * 0.56, ch * 0.42);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(3,4,10,0.55)";
    for (let y = 0; y < rows; y += 1) ctx.fillRect(0, y * ch, 128, 1.5);
    ctx.fillStyle = "rgba(160,220,255,0.08)";
    ctx.fillRect(0, 0, 2, 256);
  });

export const makeGlowTexture = () =>
  makeCanvasTexture(
    128,
    128,
    (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.25, "rgba(255,255,255,0.55)");
      g.addColorStop(0.55, "rgba(255,255,255,0.15)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    },
    { wrap: false }
  );

export const makeBillboardTexture = (
  title: string,
  subtitle: string,
  accent: string,
  secondary: string,
  seed = 1
) =>
  makeCanvasTexture(512, 256, (ctx) => {
    const rand = makeRandom(seed);
    const bg = ctx.createLinearGradient(0, 0, 512, 256);
    bg.addColorStop(0, "#06030f");
    bg.addColorStop(1, "#170a2c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, 492, 236);
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    for (let x = -256; x < 600; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, 256);
      ctx.lineTo(x + 256, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = secondary;
    ctx.fillRect(28, 30, 84, 8);
    ctx.font = '900 italic 70px "Arial Black", Arial, sans-serif';
    ctx.fillStyle = "#f4f7ff";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 22;
    ctx.fillText(title, 28, 128);
    ctx.shadowBlur = 0;
    ctx.font = '700 23px "Arial", sans-serif';
    ctx.fillStyle = accent;
    ctx.fillText(subtitle, 30, 174);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#cfe8ff";
    ctx.font = '500 15px "Arial", sans-serif';
    for (let i = 0; i < 14; i += 1) {
      const w = 8 + rand() * 30;
      ctx.fillRect(30 + i * 33, 210, w, 4);
    }
    ctx.globalAlpha = 1;
    for (let y = 0; y < 256; y += 4) {
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(0, y, 512, 1.4);
    }
  });

export const makeSkylineTexture = (accent: string) =>
  makeCanvasTexture(512, 128, (ctx) => {
    ctx.clearRect(0, 0, 512, 128);
    const rand = makeRandom(12);
    for (let i = 0; i < 70; i += 1) {
      const w = 8 + rand() * 26;
      const h = 16 + rand() * 104;
      const x = rand() * 512;
      ctx.fillStyle = `rgba(8,6,22,${0.65 + rand() * 0.35})`;
      ctx.fillRect(x, 128 - h, w, h);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.1 + rand() * 0.22;
      ctx.fillRect(x + 2, 128 - h + 4, w - 4, 2);
      ctx.globalAlpha = 1;
    }
  });
