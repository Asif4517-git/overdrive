import fs from 'fs';
fs.mkdirSync('screenshots', { recursive: true });
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = {};

// Common laptop/fullscreen size from the user's report
await page.setViewport({ width: 1366, height: 640 });
await page.goto('http://127.0.0.1:4181/', { waitUntil: 'domcontentloaded' });
await sleep(2200);
await page.screenshot({ path: 'screenshots/alignment-1366x640-menu.png' });
const menu = await page.evaluate(() => {
  const c = document.querySelector('header .page-container')?.getBoundingClientRect();
  const h1 = document.querySelector('h1')?.getBoundingClientRect();
  return { header: c ? [Math.round(c.left), Math.round(c.right)] : null, headingLeft: h1 ? Math.round(h1.left) : null, scrollHeight: document.documentElement.scrollHeight, viewport: innerHeight, canScroll: document.documentElement.scrollHeight > innerHeight + 2, overflowX: document.documentElement.scrollWidth > innerWidth + 1 };
});
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /garage/i.test(b.textContent || '') && b.closest('header'))?.click());
await sleep(800);
const garage = await page.evaluate(() => {
  const h = document.querySelector('header .page-container')?.getBoundingClientRect();
  const m = document.querySelector('main.page-container')?.getBoundingClientRect();
  const h1 = document.querySelector('main h1')?.getBoundingClientRect();
  return { header: h ? [Math.round(h.left), Math.round(h.right)] : null, main: m ? [Math.round(m.left), Math.round(m.right)] : null, headingLeft: h1 ? Math.round(h1.left) : null, aligned: !!(h && m && Math.abs(h.left - m.left) < 2 && Math.abs(h.right - m.right) < 2), scrollable: document.documentElement.scrollHeight > innerHeight + 2, scrollHeight: document.documentElement.scrollHeight, viewport: innerHeight, overflowX: document.documentElement.scrollWidth > innerWidth + 1 };
});
const scrolled = await page.evaluate(async () => { window.scrollTo(0, 99999); await new Promise(r => setTimeout(r, 150)); const y = Math.round(window.scrollY); window.scrollTo(0, 0); return y; });
await page.screenshot({ path: 'screenshots/alignment-1366x640-garage.png' });
// Navigate, ensure scroll resets
await page.evaluate(() => window.scrollTo(0, 500));
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /settings/i.test(b.textContent || '') && b.closest('header'))?.click());
await sleep(500);
const reset = await page.evaluate(() => Math.round(window.scrollY));
results.desktopShort = { menu, garage, scrolled, scrollAfterNav: reset };

// Mobile nav wrap check
await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto('http://127.0.0.1:4181/', { waitUntil: 'domcontentloaded' });
await sleep(1600);
const mobile = await page.evaluate(() => {
  const nav = Array.from(document.querySelectorAll('header nav, header div')).find((el) => el.querySelector('button') && el.className.includes('grid-cols-5'));
  const labels = nav ? Array.from(nav.querySelectorAll('button')).map((b) => ({ text: b.textContent?.trim(), right: Math.round(b.getBoundingClientRect().right) })) : [];
  return { navFound: !!nav, labels, overflowX: document.documentElement.scrollWidth > innerWidth + 1, allInside: labels.every((l) => l.right <= innerWidth) };
});
await page.screenshot({ path: 'screenshots/alignment-mobile-nav.png' });
// Race check at this exact viewport
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().toUpperCase() === 'RACE'); b?.click(); });
await sleep(3600);
const race = await page.evaluate(() => {
  const shell = document.querySelector('.race-shell')?.getBoundingClientRect();
  const canvas = document.querySelector('.race-canvas canvas')?.getBoundingClientRect();
  const panels = Array.from(document.querySelectorAll('.hud-panel')).map((el) => el.getBoundingClientRect());
  return { shell: shell ? [Math.round(shell.width), Math.round(shell.height)] : null, canvas: canvas ? [Math.round(canvas.width), Math.round(canvas.height)] : null, viewport: [innerWidth, innerHeight], overflowX: document.documentElement.scrollWidth > innerWidth + 1, outOfBounds: panels.filter((r) => r.width > 0 && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1)).length, engine: !!window.__NEON_RUSH__ };
});
await page.screenshot({ path: 'screenshots/alignment-mobile-race.png' });
results.mobile = { ...mobile, race };
results.errors = errors;
console.log(JSON.stringify(results, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
