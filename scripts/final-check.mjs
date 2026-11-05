import fs from 'fs';
fs.mkdirSync('screenshots', { recursive: true });
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = 'http://127.0.0.1:8099/';
const out = {};
await page.setViewport({ width: 1366, height: 640, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await sleep(1200);
out.logo = await page.evaluate(() => {
  const logoWrap = document.querySelector('header button[aria-label="NEON RUSH home"]');
  const svg = logoWrap?.querySelector('svg');
  const text = logoWrap?.querySelector('div');
  const s = svg?.getBoundingClientRect(); const t = text?.getBoundingClientRect();
  return { svg: s ? [Math.round(s.left), Math.round(s.right), Math.round(s.width)] : null, text: t ? [Math.round(t.left), Math.round(t.right), Math.round(t.width)] : null, overlaps: !!(s && t && s.right > t.left + 1), textOverflow: text ? text.scrollWidth > text.clientWidth + 1 : false };
});
await page.evaluate(() => Array.from(document.querySelectorAll('header button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(3400);
out.race = await page.evaluate(() => {
  const shell = document.querySelector('.race-shell')?.getBoundingClientRect();
  const canvas = document.querySelector('.race-canvas canvas')?.getBoundingClientRect();
  const panels = Array.from(document.querySelectorAll('.hud-layer .hud-panel')).map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0);
  return {
    viewport: [innerWidth, innerHeight],
    shell: shell ? [Math.round(shell.width), Math.round(shell.height)] : null,
    canvas: canvas ? [Math.round(canvas.width), Math.round(canvas.height)] : null,
    outOfBounds: panels.filter((r) => r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1).length,
    panels: panels.length,
    engine: !!window.__NEON_RUSH__,
    hudOverflowX: document.documentElement.scrollWidth > innerWidth + 1,
  };
});
await page.screenshot({ path: 'screenshots/final-race-1366x640.png' });
await page.setViewport({ width: 1366, height: 640, deviceScaleFactor: 1 });
await sleep(700);
out.raceResized = await page.evaluate(() => {
  const c = document.querySelector('.race-canvas canvas')?.getBoundingClientRect();
  return { viewport: [innerWidth, innerHeight], canvas: c ? [Math.round(c.width), Math.round(c.height)] : null };
});
out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
