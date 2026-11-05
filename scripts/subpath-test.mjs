import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url() + ' ' + r.failure()?.errorText));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const URL = 'http://127.0.0.1:8099/neon-rush/';
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await sleep(3000);
const report = {};
report.load = await page.evaluate(() => ({
  title: document.title,
  menu: /OWN THE/i.test(document.body.innerText),
  credit: /\bAsif\b/i.test(document.body.innerText),
  canvasLater: true,
  linkHrefs: Array.from(document.querySelectorAll('a')).filter((a) => /asif4517|asif_xrk|asifsrk/i.test(a.getAttribute('href') || '')).map((a) => a.getAttribute('href')),
  failedImages: Array.from(document.images).filter((img) => !img.complete || img.naturalWidth === 0).length,
  base: document.baseURI,
}));
await page.screenshot({ path: 'screenshots/17-pages-subpath-menu.png' });
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(3600);
report.race = await page.evaluate(() => ({
  engine: !!window.__NEON_RUSH__,
  canvas: !!document.querySelector('canvas'),
  hud: !!document.querySelector('.hud-layer'),
  phase: window.__NEON_RUSH__?.phase,
  track: window.__NEON_RUSH__?.track?.def?.name,
}));
await page.screenshot({ path: 'screenshots/18-pages-subpath-race.png' });
await page.evaluate(() => { const g = window.__NEON_RUSH__; if (g) g.debugFastForward(260, true); });
await sleep(1800);
report.results = await page.evaluate(() => /victory|race complete|podium|classification/i.test(document.body.innerText));
report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
