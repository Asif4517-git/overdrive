import fs from 'fs';
fs.mkdirSync('screenshots', { recursive: true });
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
await page.goto('http://127.0.0.1:8090/', { waitUntil: 'domcontentloaded' });
await sleep(2200);
// fresh defaults, reload so transmission is auto + chase
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });
await sleep(1800);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /DRIVE NOW/i.test(b.textContent || ''))?.click());
for (let i = 0; i < 40; i += 1) { await sleep(300); if (await page.evaluate(() => window.__OVERDRIVE__?.phase) === 'racing') break; }
out.boot = await page.evaluate(() => { const g = window.__OVERDRIVE__; return { phase: g.phase, track: g.track.def.name, car: `${g.spec.make} ${g.spec.model}`, transmission: g.config.transmission }; });
const result = await page.evaluate(() => { const g = window.__OVERDRIVE__; const r = g.debugFastForward(360); return { phase: r.phase, events: r.events, lap: r.state.lap, bestLap: r.hud.bestLap, position: r.hud.position, drift: r.hud.driftScore, standings: r.standings.map((s) => ({ p: s.position, n: s.name, fin: s.finished, t: +s.time.toFixed(2) })) }; });
out.race = result;
await sleep(2400);
out.results = await page.evaluate(() => ({
  visible: /Event summary|Final classification|Race won|Finished/i.test(document.body.innerText),
  heading: document.querySelector('h1')?.innerText,
  hasAttribution: /Asif/.test(document.body.innerText),
  saved: JSON.parse(localStorage.getItem('overdrive-profile-v1') || '{}'),
}));
await page.screenshot({ path: 'screenshots/od-15-results.png' });
out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
