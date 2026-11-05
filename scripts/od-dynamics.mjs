import fs from 'fs';
fs.mkdirSync('screenshots', { recursive: true });
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const errors = [];

async function boot(settings) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:8090/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((s) => { localStorage.clear(); if (s) localStorage.setItem('overdrive-settings-v1', JSON.stringify(s)); }, settings);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(1800);
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /DRIVE NOW/i.test(x.textContent || '')); b?.click(); });
  // wait for countdown to clear using the real engine state
  for (let i = 0; i < 40; i += 1) {
    await sleep(300);
    const phase = await page.evaluate(() => window.__OVERDRIVE__?.phase);
    if (phase === 'racing') break;
  }
  return page;
}

// ---- Manual gearbox run ----
let page = await boot({ transmission: 'manual', camera: 'chase', master: 0.85, quality: 'medium' });
out.manual = await page.evaluate(() => {
  const g = window.__OVERDRIVE__;
  return { phase: g.phase, gear: g.player.gear, config: g.config.transmission, keyAccel: g.config.keys.accelerate };
});
await page.keyboard.down('w');
await sleep(2600);
out.accel = await page.evaluate(() => {
  const g = window.__OVERDRIVE__;
  return { speed: Math.round(g.player.vel.length() * 3.6), gear: g.player.gear, rpm: Math.round(g.player.rpm), throttle: +g.player.throttle.toFixed(2), shifting: +g.player.shifting.toFixed(2) };
});
await page.keyboard.press('e'); await sleep(500);
out.shiftUp = await page.evaluate(() => ({ gear: window.__OVERDRIVE__.player.gear, rpm: Math.round(window.__OVERDRIVE__.player.rpm) }));
await page.keyboard.down('a'); await sleep(900);
out.turn = await page.evaluate(() => {
  const g = window.__OVERDRIVE__;
  return { steering: +g.player.steering.toFixed(2), lateral: Math.round(Math.abs(g.player.traction)), drifting: g.player.drifting };
});
await page.keyboard.up('a');
await page.keyboard.down(' '); await sleep(600);
out.handbrake = await page.evaluate(() => ({ drifting: window.__OVERDRIVE__.player.drifting, slip: Math.round(Math.abs(window.__OVERDRIVE__.player.traction)) }));
await page.keyboard.up(' ');
await page.keyboard.up('w');
await sleep(400);
await page.screenshot({ path: 'screenshots/od-09-chase-driving.png' });
out.raceResult = await page.evaluate(() => {
  const g = window.__OVERDRIVE__;
  const res = g.debugFastForward(320);
  return { phase: res.phase, lap: res.state.lap, bestLap: res.hud.bestLap, speed: res.state.speed, position: res.hud.position, events: res.events, standings: res.standings.map((s) => ({ p: s.position, name: s.name, finished: s.finished })) };
});
await sleep(2000);
out.resultsScreen = await page.evaluate(() => ({
  url: location.href,
  visible: /Event summary|Final classification|Race won|Finished/i.test(document.body.innerText),
  body: document.body.innerText.slice(0, 260),
  saved: JSON.parse(localStorage.getItem('overdrive-profile-v1') || '{}'),
}));
await page.screenshot({ path: 'screenshots/od-10-results.png' });
await page.close();

// ---- Automatic run, cockpit camera, rain ----
page = await boot({ transmission: 'auto', camera: 'cockpit', master: 0.0, quality: 'low', weather: 'rain', timeOfDay: 'day' });
await page.keyboard.down('w');
await sleep(3000);
out.auto = await page.evaluate(() => {
  const g = window.__OVERDRIVE__;
  return { speed: Math.round(g.player.vel.length() * 3.6), gear: g.player.gear, rpm: Math.round(g.player.rpm), camera: g.cameraMode, interior: g.playerVisual.interior.visible, wet: g.track.def ? g.config.weather : null };
});
await page.screenshot({ path: 'screenshots/od-11-cockpit.png' });
await page.keyboard.up('w');
// test headlights + camera cycle + reset + pause
await page.keyboard.press('l'); await sleep(300);
out.headlights = await page.evaluate(() => window.__OVERDRIVE__.player.headlights);
await page.keyboard.press('c'); await sleep(300);
out.cameraAfter = await page.evaluate(() => window.__OVERDRIVE__.cameraMode);
await page.keyboard.press('Escape'); await sleep(700);
out.pause = await page.evaluate(() => ({ paused: window.__OVERDRIVE__.paused, overlay: !!document.querySelector('.overlay'), text: document.querySelector('.overlay')?.innerText.slice(0, 80) }));
await page.screenshot({ path: 'screenshots/od-12-pause.png' });
await page.close();

// ---- Mobile layout ----
const mp = await browser.newPage();
await mp.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await mp.goto('http://127.0.0.1:8090/', { waitUntil: 'domcontentloaded' });
await sleep(1800);
await mp.screenshot({ path: 'screenshots/od-13-mobile-home.png' });
out.mobile = await mp.evaluate(() => ({ overflowX: document.documentElement.scrollWidth > innerWidth + 1, nav: getComputedStyle(document.querySelector('header nav')).display, scrollable: document.documentElement.scrollHeight > innerHeight }));
await mp.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /DRIVE NOW/i.test(x.textContent || '')); b?.click(); });
await sleep(4200);
out.mobileRace = await mp.evaluate(() => ({ engine: !!window.__OVERDRIVE__, touch: getComputedStyle(document.querySelector('.touch-pad')).display, overflowX: document.documentElement.scrollWidth > innerWidth + 1, out: Array.from(document.querySelectorAll('.hud .hud-panel')).filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.bottom > innerHeight + 1); }).length }));
await mp.screenshot({ path: 'screenshots/od-14-mobile-race.png' });
await mp.close();

out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
