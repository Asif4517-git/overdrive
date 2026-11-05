import fs from 'fs';
fs.mkdirSync('screenshots', { recursive: true });
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const URL = 'http://127.0.0.1:8099/';
for (const width of [320, 360, 390, 430, 768]) {
  await page.setViewport({ width, height: 760, deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await sleep(1100);
  out[String(width)] = await page.evaluate(() => {
    const nav = Array.from(document.querySelectorAll('header nav')).find((n) => n.querySelector('button') && getComputedStyle(n).display !== 'none');
    const btns = nav ? Array.from(nav.querySelectorAll('button')) : [];
    const items = btns.map((b) => { const span = b.querySelector('span'); const r = b.getBoundingClientRect(); return { t: (b.textContent || '').trim(), x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width), font: span ? getComputedStyle(span).fontSize : null, truncated: span ? span.scrollWidth > span.clientWidth + 1 : false }; });
    return { count: items.length, items, overlaps: items.some((it, i) => i > 0 && it.x < items[i - 1].right - 1), anyTruncated: items.some((it) => it.truncated), overflowX: document.documentElement.scrollWidth > innerWidth + 1, helpIcon: !!Array.from(document.querySelectorAll('header button')).find((b) => /how to play and controls/i.test(b.getAttribute('aria-label') || '')) };
  });
  if (width === 390) {
    await page.screenshot({ path: 'screenshots/final-mobile-menu-2.png' });
    await page.evaluate(() => Array.from(document.querySelectorAll('header button')).find((b) => /how to play and controls/i.test(b.getAttribute('aria-label') || ''))?.click());
    await sleep(450);
    out.helpWorks = await page.evaluate(() => /HOW TO HUNT AN APEX/i.test(document.body.innerText));
    await page.screenshot({ path: 'screenshots/final-mobile-controls.png' });
  }
}
await page.setViewport({ width: 1366, height: 640, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await sleep(1100);
await page.evaluate(() => Array.from(document.querySelectorAll('header nav button')).find((b) => /garage/i.test(b.textContent || ''))?.click());
await sleep(500);
out.desktop = await page.evaluate(() => { const h = document.querySelector('header .page-container')?.getBoundingClientRect(); const m = document.querySelector('main')?.getBoundingClientRect(); const h1 = document.querySelector('main h1')?.getBoundingClientRect(); return { headerLeft: h ? Math.round(h.left) : null, mainLeft: m ? Math.round(m.left) : null, headingLeft: h1 ? Math.round(h1.left) : null, headingTop: h1 ? Math.round(h1.top) : null, scrollY: Math.round(window.scrollY), scrollable: document.documentElement.scrollHeight > innerHeight + 2, overflowX: document.documentElement.scrollWidth > innerWidth + 1 }; });
await page.screenshot({ path: 'screenshots/final-desktop-top.png' });
out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
