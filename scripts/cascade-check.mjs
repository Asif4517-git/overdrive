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
for (const width of [320, 360, 390, 430, 768, 1366]) {
  await page.setViewport({ width, height: 800, deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await sleep(1100);
  out[width] = await page.evaluate(() => {
    const nav = Array.from(document.querySelectorAll('header nav')).find((n) => n.querySelector('button') && getComputedStyle(n).display !== 'none');
    const items = nav ? Array.from(nav.querySelectorAll('button')).map((b) => { const sp = b.querySelector('span'); const r = b.getBoundingClientRect(); return { t: (b.textContent || '').trim(), w: Math.round(r.width), font: sp ? getComputedStyle(sp).fontSize : null, trunc: sp ? sp.scrollWidth > sp.clientWidth + 1 : false }; }) : [];
    const race = Array.from(document.querySelectorAll('header button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE');
    const rr = race?.getBoundingClientRect();
    const primary = document.querySelector('.btn-primary');
    return {
      navItems: items, overlaps: items.some((it, i) => i > 0), anyTrunc: items.some((i) => i.trunc),
      navCount: items.length, raceVisible: !!rr && rr.width > 0,
      primaryFont: primary ? getComputedStyle(primary).fontSize : null,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      helpIcon: !!Array.from(document.querySelectorAll('header button')).find((b) => /how to play and controls/i.test(b.getAttribute('aria-label') || '')),
    };
  });
  if (width === 390) await page.screenshot({ path: 'screenshots/cascade-mobile-menu.png' });
  if (width === 1366) {
    await page.evaluate(() => Array.from(document.querySelectorAll('header nav button')).find((b) => /garage/i.test(b.textContent || ''))?.click());
    await sleep(600);
    await page.screenshot({ path: 'screenshots/cascade-desktop-garage.png' });
    out.desktop = await page.evaluate(() => { const h = document.querySelector('header .page-container')?.getBoundingClientRect(); const m = document.querySelector('main')?.getBoundingClientRect(); const h1 = document.querySelector('main h1')?.getBoundingClientRect(); return { headerLeft: h ? Math.round(h.left) : null, mainLeft: m ? Math.round(m.left) : null, headingLeft: h1 ? Math.round(h1.left) : null, scrollY: Math.round(window.scrollY), scrollable: document.documentElement.scrollHeight > innerHeight + 2, overflowX: document.documentElement.scrollWidth > innerWidth + 1 }; });
  }
}
out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
