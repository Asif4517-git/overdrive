import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 700 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2200);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(1400);

const result = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  // Clear the countdown deterministically.
  while (g.debugPhase() === 'countdown') g.debugStep(1 / 60);
  const setup = (index, speed) => {
    const samples = g.track.samples;
    const i = index % samples.length;
    const s = samples[i];
    g.player.index = i;
    g.player.prevIndex = i;
    g.player.pos.copy(s.pos);
    g.player.heading = Math.atan2(s.tangent.x, s.tangent.z);
    g.player.vel.copy(s.tangent).multiplyScalar(speed);
    g.player.nitro = 80;
    g.player.boosting = false;
    g.player.drifting = false;
    g.player.driftScore = 0;
    g.keys.clear();
    g.phase = 'racing';
    return s;
  };
  const right = () => new g.player.vel.constructor(Math.cos(g.player.heading), 0, -Math.sin(g.player.heading));
  const forward = () => new g.player.vel.constructor(Math.sin(g.player.heading), 0, Math.cos(g.player.heading));

  // 1) Nitro boost
  setup(10, 42);
  g.keys.add('KeyW'); g.keys.add('ShiftLeft');
  const boostStart = { nitro: +g.player.nitro.toFixed(1), speed: +(g.player.vel.dot(forward())).toFixed(1) };
  for (let i = 0; i < 45; i += 1) g.debugStep(1 / 60);
  const boostEnd = { nitro: +g.player.nitro.toFixed(1), speed: +(g.player.vel.dot(forward())).toFixed(1), boosting: g.player.boosting, flameScale: +g.playerVisual.flameGroups[0].scale.x.toFixed(2), topSpeedKmh: Math.round(g.player.vel.length() * 3.6) };

  // 2) Handbrake drift
  setup(20, 34);
  g.keys.clear(); g.keys.add('KeyW'); g.keys.add('KeyA'); g.keys.add('Space');
  const driftStart = { speed: +g.player.vel.length().toFixed(1), lateral: +g.player.vel.dot(right()).toFixed(2) };
  let maxLateral = 0;
  let driftFrames = 0;
  for (let i = 0; i < 50; i += 1) {
    g.debugStep(1 / 60);
    maxLateral = Math.max(maxLateral, Math.abs(g.player.vel.dot(right())));
    if (g.player.drifting) driftFrames += 1;
  }
  const driftEnd = { drifting: g.player.drifting, driftFrames, maxLateral: +maxLateral.toFixed(2), score: Math.round(g.player.driftScore), nitro: +g.player.nitro.toFixed(1), steerWheel: +g.playerVisual.wheels.find((w) => w.front).steer.rotation.y.toFixed(2) };

  // 3) Braking from speed
  setup(30, 50);
  g.keys.clear(); g.keys.add('KeyS');
  const brakeStart = +g.player.vel.dot(forward()).toFixed(1);
  for (let i = 0; i < 60; i += 1) g.debugStep(1 / 60);
  const brakeEnd = +g.player.vel.dot(forward()).toFixed(1);

  // 4) Wall collision
  setup(40, 20);
  const s = g.track.samples[g.player.index];
  g.player.pos.addScaledVector(s.side, g.track.halfWidth + 2);
  g.player.vel.copy(s.side).multiplyScalar(25);
  g.shake = 0;
  let maxOffset = 0;
  for (let i = 0; i < 20; i += 1) {
    g.debugStep(1 / 60);
    maxOffset = Math.max(maxOffset, Math.abs(g.player.pos.clone().sub(g.track.samples[g.track.nearestIndex(g.player.pos, g.player.index)].pos).dot(g.track.samples[g.track.nearestIndex(g.player.pos, g.player.index)].side)));
  }
  const wall = { maxOffset: +maxOffset.toFixed(2), halfWidth: g.track.halfWidth, shake: +g.shake.toFixed(2), contained: maxOffset <= g.track.halfWidth + 0.4 };

  // 5) Far from track recovery
  setup(50, 0);
  g.player.pos.x += 120;
  g.player.pos.z += 120;
  g.keys.clear();
  g.resetPlayerToTrack();
  const recovered = { distance: +g.player.pos.distanceTo(g.track.samples[g.player.index].pos).toFixed(2), speed: +g.player.vel.length().toFixed(2) };

  g.keys.clear();
  return { boostStart, boostEnd, driftStart, driftEnd, brakeStart, brakeEnd, wall, recovered };
});
await page.screenshot({ path: 'artifacts/dynamics-final.png' });
console.log(JSON.stringify({ result, errors }, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
