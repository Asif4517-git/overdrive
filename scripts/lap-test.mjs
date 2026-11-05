import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 860 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2400);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(1600);
const laps = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  while (g.phase === 'countdown') g.debugStep(1 / 60);
  const toasts = [];
  const events = [];
  const keys = g.keys;
  let lastLap = g.player.lap;
  let wasCrossed = g.player.crossedLine;
  const original = g.updateLapProgress.bind(g);
  // Watch toast content without patching internals: sample after each step.
  for (let i = 0; i < 60 * 150; i += 1) {
    keys.clear(); keys.add('KeyW');
    const ahead = g.track.samples[(g.player.index + 14 + Math.round(g.player.vel.length() * 0.35)) % g.track.samples.length];
    const aim = ahead.pos;
    const desired = Math.atan2(aim.x - g.player.pos.x, aim.z - g.player.pos.z);
    let d = desired - g.player.heading;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    if (d > 0.04) keys.add('KeyA'); else if (d < -0.04) keys.add('KeyD');
    if (ahead.curvature > 0.016 && g.player.vel.length() > 25) { keys.clear(); keys.add('KeyS'); }
    g.debugStep(1 / 60);
    if (g.player.lap !== lastLap) { events.push({ lap: g.player.lap, t: +g.elapsed.toFixed(2), toast: g.checkpointText }); lastLap = g.player.lap; }
    if (g.player.crossedLine !== wasCrossed) { events.push({ crossedLine: g.player.crossedLine, t: +g.elapsed.toFixed(2), toast: g.checkpointText }); wasCrossed = g.player.crossedLine; }
    if (g.checkpointText && !toasts.includes(g.checkpointText)) toasts.push(g.checkpointText);
    if (g.phase === 'finished') break;
  }
  keys.clear();
  return {
    phase: g.phase,
    lap: g.player.lap,
    crossedLine: g.player.crossedLine,
    events,
    toasts,
    invalidToast: toasts.some((t) => /INVALID/i.test(t)),
    completedLaps: g.completedLaps.map((t) => +t.toFixed(2)),
    bestLap: g.player.bestLap ? +g.player.bestLap.toFixed(2) : null,
    totalTime: +g.elapsed.toFixed(2),
    hudLap: g.buildHud().lap,
  };
});
await sleep(1500);
await page.screenshot({ path: 'artifacts/lap-results.png' });

// Mobile HUD check
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /main menu/i.test(b.textContent || ''))?.click());
await sleep(900);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(3800);
await page.screenshot({ path: 'artifacts/mobile-hud-final.png' });
const mobile = await page.evaluate(() => {
  const overlaps = [];
  const visible = Array.from(document.querySelectorAll('.hud-layer .hud-panel')).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  const rects = visible.map((el) => ({ cls: el.className.slice(0, 40), ...(r => ({ x: r.x, y: r.y, w: r.width, h: r.height }))(el.getBoundingClientRect()) }));
  for (let i = 0; i < rects.length; i += 1) for (let j = i + 1; j < rects.length; j += 1) {
    const a = rects[i], b = rects[j];
    const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    if (ox * oy > 500) overlaps.push([a.cls, b.cls, Math.round(ox * oy)]);
  }
  return { overlaps, panels: rects.length, touch: getComputedStyle(document.querySelector('.touch-controls')).display, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
});
console.log(JSON.stringify({ laps, mobile, errors }, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
