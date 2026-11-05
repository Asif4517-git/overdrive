import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 800 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2600);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(1500);

// Wait for the real countdown to elapse in browser time.
const countdown = await page.evaluate(async () => {
  const g = window.__NEON_RUSH__;
  const start = performance.now();
  const samples = [];
  while (performance.now() - start < 5200) {
    samples.push({ t: Math.round(performance.now() - start), phase: g.phase, cd: +g.countdown.toFixed(2), time: +g.elapsed.toFixed(2) });
    await new Promise((r) => setTimeout(r, 400));
  }
  return samples;
});

// Hold throttle using real keyboard events, sampling simulation values.
await page.keyboard.down('w');
const throttleSamples = [];
for (let i = 0; i < 12; i += 1) {
  await sleep(250);
  throttleSamples.push(await page.evaluate(() => {
    const g = window.__NEON_RUSH__;
    return { speed: Math.round(g.player.vel.length() * 3.6), engineSpeed: g.player.vel.length().toFixed(1), elapsed: +g.elapsed.toFixed(2), gear: g.lastGear, hz: g.audio.lastGearFrequency, phase: g.phase, paused: g.paused };
  }));
}
const beforeBoost = await page.evaluate(() => ({ nitro: window.__NEON_RUSH__.player.nitro, speed: Math.round(window.__NEON_RUSH__.player.vel.length() * 3.6) }));
await page.keyboard.down('Shift');
await sleep(1100);
const duringBoost = await page.evaluate(() => ({ nitro: window.__NEON_RUSH__.player.nitro, speed: Math.round(window.__NEON_RUSH__.player.vel.length() * 3.6), boosting: window.__NEON_RUSH__.player.boosting, flame: window.__NEON_RUSH__.playerVisual.flameGroups[0].scale.x, shake: window.__NEON_RUSH__.shake }));
await page.screenshot({ path: 'artifacts/qa-live-boost.png' });
await page.keyboard.up('Shift');
// Drift test
await page.keyboard.down('a');
await page.keyboard.down(' ');
await sleep(1200);
const drift = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  const right = new g.player.vel.constructor(Math.cos(g.player.heading), 0, -Math.sin(g.player.heading));
  return { driftEngaged: g.player.drifting, lateralSlip: +Math.abs(g.player.vel.dot(right)).toFixed(2), driftScore: Math.round(g.player.driftScore), nitro: +g.player.nitro.toFixed(1), visual: g.playerVisual.wheels.filter((w) => w.front).map((w) => +w.steer.rotation.y.toFixed(2)) };
});
await page.screenshot({ path: 'artifacts/qa-live-drift.png' });
await page.keyboard.up(' ');
await page.keyboard.up('a');
await page.keyboard.up('w');
// Collision: force car into the wall.
const collision = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  const sample = g.track.samples[g.player.index];
  g.player.pos.addScaledVector(sample.side, g.track.halfWidth + 4);
  g.player.vel.copy(sample.side).multiplyScalar(20);
  const shakeBefore = g.shake;
  for (let i = 0; i < 12; i += 1) g.tick(1 / 30);
  const offset = Math.abs(g.player.pos.clone().sub(g.track.samples[g.player.index].pos).dot(g.track.samples[g.player.index].side));
  return { shakeBefore: +shakeBefore.toFixed(2), shakeAfter: +g.shake.toFixed(2), finalOffset: +offset.toFixed(2), wallLimit: +(g.track.halfWidth - 1.03).toFixed(2), contained: offset <= g.track.halfWidth - 0.5 };
});
// Camera modes
const cameras = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  const modes = [];
  for (const mode of ['chase', 'far', 'bumper']) {
    g.cameraMode = mode;
    for (let i = 0; i < 20; i += 1) g.tick(1 / 30);
    modes.push({ mode: g.cameraMode, fov: +g.camera.fov.toFixed(1), y: +g.camera.position.y.toFixed(2), distance: +g.camera.position.distanceTo(g.player.pos).toFixed(2) });
  }
  return modes;
});
// Audio nodes after user gesture
const audio = await page.evaluate(() => {
  const a = window.__NEON_RUSH__.audio;
  return { running: !!a.ctx, state: a.ctx?.state, engine: a.engineStarted, music: a.musicRunning, oscillators: a.engineOsc.length, sampleRate: a.ctx?.sampleRate };
});
console.log(JSON.stringify({ countdown, throttleSamples, beforeBoost, duringBoost, drift, collision, cameras, audio, errors }, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
