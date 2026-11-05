import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 600 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2200);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(1400);
const trace = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  while (g.debugPhase() === 'countdown') g.debugStep(1 / 60);
  const samples = g.track.samples;
  const s = samples[20];
  g.player.index = 20; g.player.prevIndex = 20;
  g.player.pos.copy(s.pos);
  g.player.heading = Math.atan2(s.tangent.x, s.tangent.z);
  g.player.vel.copy(s.tangent).multiplyScalar(30);
  g.player.nitro = 50;
  g.keys.clear(); g.keys.add('KeyW'); g.keys.add('KeyA'); g.keys.add('Space');
  const fwd = () => new g.player.vel.constructor(Math.sin(g.player.heading), 0, Math.cos(g.player.heading));
  const right = () => new g.player.vel.constructor(Math.cos(g.player.heading), 0, -Math.sin(g.player.heading));
  const drifts = [];
  for (let i = 0; i < 20; i += 1) {
    g.debugStep(1 / 60);
    drifts.push({ i, f: +g.player.vel.dot(fwd()).toFixed(2), l: +g.player.vel.dot(right()).toFixed(2), head: +g.player.heading.toFixed(3), drifting: g.player.drifting, phase: g.phase, paused: g.paused, steer: +g.player.steering.toFixed(2), speed: +g.player.vel.length().toFixed(1) });
  }
  // wall trace
  const s2 = samples[40];
  g.player.index = 40; g.player.prevIndex = 40; g.player.pos.copy(s2.pos); g.player.heading = Math.atan2(s2.tangent.x, s2.tangent.z);
  g.player.pos.addScaledVector(s2.side, g.track.halfWidth + 2);
  g.player.vel.copy(s2.side).multiplyScalar(25);
  g.shake = 0; g.player.wallCooldown = 0;
  g.keys.clear();
  const walls = [];
  for (let i = 0; i < 10; i += 1) {
    g.debugStep(1 / 60);
    walls.push({ i, shake: +g.shake.toFixed(3), cooldown: +g.player.wallCooldown.toFixed(2), speed: +g.player.vel.length().toFixed(2), pos: [g.player.pos.x.toFixed(1), g.player.pos.z.toFixed(1)], index: g.player.index });
  }
  return { drifts, walls, halfWidth: g.track.halfWidth };
});
console.log(JSON.stringify(trace, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
