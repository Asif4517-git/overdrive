import fs from 'fs';
fs.mkdirSync('screenshots', { recursive: true });
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const click = (re) => page.evaluate((src) => {
  const rx = new RegExp(src, 'i');
  const b = Array.from(document.querySelectorAll('button')).find((x) => rx.test((x.textContent || '').trim()));
  if (b) b.click();
  return !!b;
}, re.source ?? re);

await page.goto('http://127.0.0.1:8090/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await sleep(2500);
out.home = await page.evaluate(() => ({
  title: document.title,
  hasHero: /Real roads/i.test(document.body.innerText),
  hasAttribution: /Asif/.test(document.body.innerText),
  overflowX: document.documentElement.scrollWidth > innerWidth + 1,
  canScroll: document.documentElement.scrollHeight > innerHeight,
  buttons: document.querySelectorAll('button').length,
}));
await page.screenshot({ path: 'screenshots/od-01-home.png' });

// Garage
await click(/^Garage$/); await sleep(600);
out.garage = await page.evaluate(() => ({
  hasGarage: /The garage/i.test(document.body.innerText),
  cars: Array.from(document.querySelectorAll('.car-card')).length,
  hasSwift: /Swift/.test(document.body.innerText),
  hasFerrari: /296 GTB/.test(document.body.innerText),
}));
await page.screenshot({ path: 'screenshots/od-02-garage.png' });
// Select Fortuner then M3
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.car-card')).find((x) => /Fortuner/.test(x.textContent || '')); b?.click(); });
await sleep(400);
out.selectedFortuner = await page.evaluate(() => /FORTUNER/i.test(document.body.innerText));
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.car-card')).find((x) => /M3 Competition/.test(x.textContent || '')); b?.click(); });
await sleep(400);

// Tracks
await click(/^Circuits$/); await sleep(600);
out.tracks = await page.evaluate(() => ({
  hasTracks: /Choose the road/i.test(document.body.innerText),
  cards: document.querySelectorAll('.track-card').length,
  hasMunnar: /Munnar/.test(document.body.innerText),
  hasMonsoon: /Monsoon/.test(document.body.innerText),
}));
await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('.track-card'));
  const munnar = cards.find((c) => /Munnar Hillclimb/.test(c.textContent || ''));
  const btn = munnar ? Array.from(munnar.querySelectorAll('button')).find((b) => /Select/.test(b.textContent || '')) : null;
  btn?.click();
});
await sleep(400);
await page.screenshot({ path: 'screenshots/od-03-tracks.png' });

// Settings: manual gearbox + cockpit camera, key rebind
await click(/^Settings$/); await sleep(600);
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim() === 'manual'); b?.click(); });
await sleep(200);
await page.select('[aria-label="Default camera"]', 'cockpit');
await sleep(300);
await page.evaluate(() => { const tabs = Array.from(document.querySelectorAll('button')).filter((b) => /Controls/.test(b.textContent || '')); tabs[tabs.length - 1]?.click(); });
await sleep(500);
// rebind accelerate
await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('div')).filter((d) => /Accelerate/.test(d.textContent || '') && d.querySelector('.rebind-btn'));
  const row = rows[rows.length - 1];
  row?.querySelector('.rebind-btn')?.click();
});
await sleep(300);
await page.keyboard.press('ArrowUp');
await sleep(400);
out.rebind = await page.evaluate(() => {
  const stored = JSON.parse(localStorage.getItem('overdrive-settings-v1') || '{}');
  return { accelerate: stored.keys?.accelerate, transmission: stored.transmission, camera: stored.camera };
});
await page.select('[aria-label="Units"]', 'kmh').catch(() => null);
await page.screenshot({ path: 'screenshots/od-04-settings.png' });

// Start race
await click(/Save & drive/); await sleep(3800);
out.raceBoot = await page.evaluate(() => {
  const g = window.__OVERDRIVE__;
  return {
    engine: !!g,
    phase: g?.phase,
    hasCanvas: !!document.querySelector('.race-canvas canvas'),
    hud: !!document.querySelector('.hud'),
    car: g ? `${g.spec.make} ${g.spec.model}` : null,
    track: g?.track?.def?.name,
    weather: g?.config?.weather,
    transmission: g?.config?.transmission,
    camera: g?.cameraMode,
    gear: g?.player?.gear,
    rpm: Math.round(g?.player?.rpm ?? 0),
    interiorVisible: g?.playerVisual?.interior?.visible,
    exteriorVisible: g?.playerVisual?.body?.visible,
  };
});
await page.screenshot({ path: 'screenshots/od-05-countdown.png' });
// Wait for countdown, then accelerate + shift
await sleep(4200);
out.afterCountdown = await page.evaluate(() => ({ phase: window.__OVERDRIVE__?.phase }));
await page.keyboard.down('w');
await sleep(2200);
out.drive = await page.evaluate(() => {
  const g = window.__OVERDRIVE__;
  return { speed: Math.round(g.player.vel.length() * 3.6), gear: g.player.gear, rpm: Math.round(g.player.rpm), phase: g.phase, camera: g.cameraMode, traction: Math.round(g.player.traction) };
});
await page.keyboard.press('e');
await sleep(700);
out.shift = await page.evaluate(() => ({ gear: window.__OVERDRIVE__.player.gear, rpm: Math.round(window.__OVERDRIVE__.player.rpm), speed: Math.round(window.__OVERDRIVE__.player.vel.length() * 3.6) }));
await page.keyboard.down('Shift');
await sleep(400);
await page.keyboard.up('Shift');
await page.keyboard.down('a');
await sleep(700);
out.steering = await page.evaluate(() => ({ steering: +window.__OVERDRIVE__.player.steering.toFixed(2), heading: +window.__OVERDRIVE__.player.heading.toFixed(2) }));
await page.keyboard.up('a');
await page.screenshot({ path: 'screenshots/od-06-race-cockpit.png' });
await page.keyboard.up('w');
// camera cycle to chase
await page.keyboard.press('c');
await sleep(700);
out.cameraCycle = await page.evaluate(() => ({ camera: window.__OVERDRIVE__.cameraMode, interior: window.__OVERDRIVE__.playerVisual.interior.visible, exterior: window.__OVERDRIVE__.playerVisual.body.visible }));
await page.screenshot({ path: 'screenshots/od-07-race-chase.png' });
// Manual gearbox test via engine API
out.fullRace = await page.evaluate(() => {
  const g = window.__OVERDRIVE__;
  return g.debugFastForward(300);
});
await sleep(1800);
out.results = await page.evaluate(() => ({
  visible: /Event summary|Race complete|Final classification/i.test(document.body.innerText),
  hasBest: /Best lap/i.test(document.body.innerText),
  saved: JSON.parse(localStorage.getItem('overdrive-profile-v1') || '{}'),
}));
await page.screenshot({ path: 'screenshots/od-08-results.png' });
out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
