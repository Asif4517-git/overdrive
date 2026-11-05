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
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });
await sleep(1800);
// choose Sprint mode
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.mode-tab')).find((x) => /Sprint/i.test(x.textContent || '')); b?.click(); });
await sleep(400);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /DRIVE NOW/i.test(b.textContent || ''))?.click());
for (let i = 0; i < 40; i += 1) { await sleep(300); if (await page.evaluate(() => window.__OVERDRIVE__?.phase) === 'racing') break; }
out.sprint = await page.evaluate(() => { const g = window.__OVERDRIVE__; return { laps: g.totalLaps, mode: g.config.mode, car: g.spec.model, track: g.track.def.name }; });
await page.keyboard.down('w'); await sleep(2500);
out.drive = await page.evaluate(() => { const g = window.__OVERDRIVE__; return { speed: Math.round(g.player.vel.length()*3.6), rpm: Math.round(g.player.rpm), gear: g.player.gear }; });
await page.keyboard.up('w');
const res = await page.evaluate(() => window.__OVERDRIVE__.debugFastForward(200));
out.result = { phase: res.phase, lap: res.state.lap, bestLap: res.hud.bestLap, events: res.events, position: res.hud.position };
await sleep(2400);
out.results = await page.evaluate(() => ({
  visible: !document.querySelector('.race-shell'),
  text: document.body.innerText.slice(0, 300),
  saved: JSON.parse(localStorage.getItem('overdrive-profile-v1') || '{}'),
}));
await page.screenshot({ path: 'screenshots/od-16-results.png' });
out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
