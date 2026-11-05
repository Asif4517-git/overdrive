import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio','--disable-background-timer-throttling','--disable-renderer-backgrounding'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2500);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(1200);

// How far the game clock advances per real second (no restart between samples).
const clock = [];
const start = Date.now();
for (let i = 0; i < 8; i += 1) {
  await sleep(500);
  clock.push(await page.evaluate(() => {
    const g = window.__NEON_RUSH__;
    return { phase: g.phase, countdown: +g.countdown.toFixed(2), elapsed: +g.elapsed.toFixed(2), hud: document.querySelector('.hud-layer')?.innerText.split('\n').slice(0, 4).join(' | ') };
  }));
}
await page.screenshot({ path: 'artifacts/live-after-countdown.png' });

// Live throttle via real key events, sampling HUD and physics.
await page.keyboard.down('w');
const throttle = [];
for (let i = 0; i < 16; i += 1) {
  await sleep(300);
  throttle.push(await page.evaluate(() => {
    const g = window.__NEON_RUSH__;
    const hudText = document.querySelector('.hud-layer')?.innerText || '';
    const speedMatch = hudText.match(/(\d{3})\s*KM\/H/);
    return { simSpeed: Math.round(g.player.vel.length() * 3.6), hudSpeed: speedMatch ? +speedMatch[1] : null, phase: g.phase, elapsed: +g.elapsed.toFixed(2) };
  }));
}
const boostBefore = await page.evaluate(() => ({ nitro: +window.__NEON_RUSH__.player.nitro.toFixed(1), speed: Math.round(window.__NEON_RUSH__.player.vel.length() * 3.6) }));
await page.keyboard.down('Shift');
await sleep(1300);
const boostDuring = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  return { nitro: +g.player.nitro.toFixed(1), speed: Math.round(g.player.vel.length() * 3.6), boosting: g.player.boosting, flameScale: +g.playerVisual.flameGroups[0].scale.x.toFixed(2), gameSpeed: +g.elapsed.toFixed(2) };
});
await page.screenshot({ path: 'artifacts/live-boost.png' });
await page.keyboard.up('Shift');
await page.keyboard.down('a');
await page.keyboard.down(' ');
await sleep(1300);
const drift = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  const right = new g.player.vel.constructor(Math.cos(g.player.heading), 0, -Math.sin(g.player.heading));
  return { engaged: g.player.drifting, lateral: +Math.abs(g.player.vel.dot(right)).toFixed(2), score: Math.round(g.player.driftScore), nitro: +g.player.nitro.toFixed(1), wheelSteer: +g.playerVisual.wheels.find((w) => w.front).steer.rotation.y.toFixed(2), speed: Math.round(g.player.vel.length() * 3.6) };
});
await page.screenshot({ path: 'artifacts/live-drift.png' });
await page.keyboard.up(' ');
await page.keyboard.up('a');
await page.keyboard.up('w');

// Deterministic collision + drift checks using debug stepping.
const collision = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  const sample = g.track.samples[g.player.index];
  g.player.pos.addScaledVector(sample.side, g.track.halfWidth + 3);
  g.player.vel.copy(sample.side).multiplyScalar(30);
  g.shake = 0;
  for (let i = 0; i < 8; i += 1) g.debugStep(1 / 60);
  const index = g.track.nearestIndex(g.player.pos, g.player.index);
  const s = g.track.samples[index];
  const offset = Math.abs(g.player.pos.clone().sub(s.pos).dot(s.side));
  return { offset: +offset.toFixed(2), limit: +(g.track.halfWidth - 1.03).toFixed(2), contained: offset <= g.track.halfWidth, shake: +g.shake.toFixed(2) };
});
const driftSim = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  g.player.pos.copy(g.track.samples[0].pos);
  g.player.heading = g.track.startHeading;
  g.player.vel.copy(g.track.samples[0].tangent).multiplyScalar(30);
  g.keys.clear(); g.keys.add('KeyW'); g.keys.add('KeyA'); g.keys.add('Space');
  const right = new g.player.vel.constructor(Math.cos(g.player.heading), 0, -Math.sin(g.player.heading));
  for (let i = 0; i < 30; i += 1) g.debugStep(1 / 60);
  const lateral = Math.abs(g.player.vel.dot(new g.player.vel.constructor(Math.cos(g.player.heading), 0, -Math.sin(g.player.heading))));
  const out = { drifting: g.player.drifting, lateral: +lateral.toFixed(2), score: Math.round(g.player.driftScore), initialLateral: +Math.abs(g.player.vel.dot(right)).toFixed(2) };
  g.keys.clear();
  return out;
});
const audio = await page.evaluate(() => {
  const a = window.__NEON_RUSH__.audio;
  return { ctx: a.ctx?.state, engine: a.engineStarted, music: a.musicRunning, oscillators: a.engineOsc.length };
});
console.log(JSON.stringify({ clock: { wallSeconds: ((Date.now() - start) / 1000).toFixed(1), samples: clock }, throttle, boostBefore, boostDuring, drift, collision, driftSim, audio, errors }, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
