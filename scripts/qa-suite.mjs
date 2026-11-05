import puppeteer from 'puppeteer';
const libs = process.env.LD_LIBRARY_PATH;
void libs;
const browser = await puppeteer.launch({
  headless: 'shell',
  args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = async (pattern) => page.evaluate((src) => {
  const re = new RegExp(src, 'i');
  const btn = Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()));
  btn?.click();
  return btn ? (btn.textContent || '').trim() : null;
}, pattern.source ?? pattern);
const shot = async (name) => page.screenshot({ path: `artifacts/${name}.png` });
const report = {};

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2600);
await shot('qa-menu');

// Garage / car selection
await clickText(/^garage/i); await sleep(700); await shot('qa-garage');
report.spectreSelected = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find((b) => /SPECTRE X/.test(b.textContent || '') && b.className.includes('carousel-card'));
  btn?.click();
  return !!btn;
});
await sleep(600);
await shot('qa-garage-spectre');

// Circuits / track selection
await clickText(/^circuits/i); await sleep(700); await shot('qa-circuits');
report.skywaySelected = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('article'));
  const skyway = cards.find((c) => /MIDNIGHT SKYWAY/.test(c.textContent || ''));
  const btn = skyway ? Array.from(skyway.querySelectorAll('button')).find((b) => /select circuit/i.test(b.textContent || '')) : null;
  btn?.click();
  return !!btn;
});
await sleep(500);
report.raceStarted = await clickText(/start engine/i);
await sleep(4200);
await shot('qa-race-skyway');
report.race1 = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  return { track: g?.track?.def?.id, car: g?.spec?.name, phase: g?.phase, objects: g?.scene?.children?.length };
});

// Physics assertions on the live simulation.
report.physics = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  if (!g) return null;
  // Skip the countdown.
  while (g.phase === 'countdown') g.tick(1 / 30);
  const keys = g.keys;
  keys.clear();
  keys.add('KeyW');
  for (let i = 0; i < 100; i += 1) g.tick(1 / 30);
  const speedAfterThrottle = Math.round(g.player.vel.length() * 3.6);
  const headingBefore = g.player.heading;
  keys.add('KeyA');
  for (let i = 0; i < 45; i += 1) g.tick(1 / 30);
  const headingDelta = +(g.player.heading - headingBefore).toFixed(3);
  keys.delete('KeyA');
  const lateralBefore = Math.abs(g.player.vel.dot(new g.player.vel.constructor(Math.cos(g.player.heading), 0, -Math.sin(g.player.heading))));
  keys.add('Space'); keys.add('KeyA');
  for (let i = 0; i < 40; i += 1) g.tick(1 / 30);
  const lateralDuring = Math.abs(g.player.vel.dot(new g.player.vel.constructor(Math.cos(g.player.heading), 0, -Math.sin(g.player.heading))));
  const drifting = g.player.drifting;
  keys.delete('Space'); keys.delete('KeyA');
  const nitroBefore = g.player.nitro;
  keys.add('ShiftLeft');
  for (let i = 0; i < 40; i += 1) g.tick(1 / 30);
  const nitroAfter = g.player.nitro;
  const boosting = g.player.boosting;
  keys.delete('ShiftLeft'); keys.clear();
  return {
    speedAfterThrottle,
    headingDelta,
    steeringWorks: Math.abs(headingDelta) > 0.2,
    lateralBefore: +lateralBefore.toFixed(2),
    lateralDuring: +lateralDuring.toFixed(2),
    driftEngaged: drifting,
    nitroUsed: +(nitroBefore - nitroAfter).toFixed(2),
    boosting,
    wallGuard: Math.abs(g.track.halfWidth - 1.03) > 0,
  };
});

report.skyway = await page.evaluate(() => window.__NEON_RUSH__?.debugFastForward(220, true));
await sleep(1800);
await shot('qa-results-skyway');
report.resultsVisible = await page.evaluate(() => /victory|race complete|podium|classified/i.test(document.body.innerText));
report.savedRecord = await page.evaluate(() => JSON.parse(localStorage.getItem('neonrush-profile-v1') || '{}'));

// Back to menu, test another circuit + quality.
await clickText(/main menu/i); await sleep(900);
await clickText(/^circuits/i); await sleep(700);
report.docksSelected = await page.evaluate(() => {
  const card = Array.from(document.querySelectorAll('article')).find((c) => /CHROME DOCKS/.test(c.textContent || ''));
  const btn = card ? Array.from(card.querySelectorAll('button')).find((b) => /select circuit/i.test(b.textContent || '')) : null;
  btn?.click();
  return !!btn;
});
await sleep(500);
await clickText(/start engine/i); await sleep(4200);
await shot('qa-race-docks');
report.docks = await page.evaluate(() => window.__NEON_RUSH__?.debugFastForward(220, true));
await sleep(1800);
await shot('qa-results-docks');

// Mobile viewport.
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await clickText(/main menu/i); await sleep(900);
await shot('qa-mobile-menu');
await clickText(/^race$/i); await sleep(4200);
await shot('qa-mobile-race');
report.mobile = await page.evaluate(() => ({
  overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
  canvas: !!document.querySelector('canvas'),
  touchControlsDisplay: getComputedStyle(document.querySelector('.touch-controls') || document.body).display,
}));

report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
