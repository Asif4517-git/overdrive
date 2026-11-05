import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 500 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2200);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(1400);
const result = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  while (g.debugPhase() === 'countdown') g.debugStep(1 / 60);
  const samples = g.track.samples;
  // pick a low-curvature section for the trace
  let best = 0; let lowest = 1e9;
  for (let i = 0; i < samples.length; i += 3) {
    let c = 0; for (let k = 0; k < 30; k += 1) c += samples[(i + k) % samples.length].curvature;
    if (c < lowest) { lowest = c; best = i; }
  }
  const s = samples[best];
  g.player.index = best; g.player.prevIndex = best;
  g.player.pos.copy(s.pos);
  g.player.heading = Math.atan2(s.tangent.x, s.tangent.z);
  g.player.vel.copy(s.tangent).multiplyScalar(26);
  g.player.nitro = 40; g.player.driftScore = 0;
  g.keys.clear(); g.keys.add('KeyW'); g.keys.add('KeyA'); g.keys.add('Space');
  const fwd = () => new g.player.vel.constructor(Math.sin(g.player.heading), 0, Math.cos(g.player.heading));
  const right = () => new g.player.vel.constructor(Math.cos(g.player.heading), 0, -Math.sin(g.player.heading));
  const frames = [];
  for (let i = 0; i < 14; i += 1) {
    g.debugStep(1 / 60);
    frames.push({ i, fwd: +g.player.vel.dot(fwd()).toFixed(2), lat: +g.player.vel.dot(right()).toFixed(2), drifting: g.player.drifting, steering: +g.player.steering.toFixed(2), speed: +g.player.vel.length().toFixed(1), keys: Array.from(g.keys), phase: g.phase, paused: g.paused });
  }
  return { best, lowest: +lowest.toFixed(4), frames, halfWidth: g.track.halfWidth };
});
console.log(JSON.stringify(result, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
