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
for (const width of [360, 390, 430, 768]) {
  await page.setViewport({ width, height: 760, deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 });
  await page.goto('http://127.0.0.1:4183/', { waitUntil: 'domcontentloaded' });
  await sleep(1300);
  out[String(width)] = await page.evaluate(() => {
    const nav = Array.from(document.querySelectorAll('header nav')).find((n) => n.querySelector('button') && getComputedStyle(n).display !== 'none');
    const btns = nav ? Array.from(nav.querySelectorAll('button')) : [];
    const rects = btns.map((b) => { const r = b.getBoundingClientRect(); return { t: (b.textContent || '').trim(), x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width) }; });
    const raceBtn = Array.from(document.querySelectorAll('header button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE');
    const raceRect = raceBtn?.getBoundingClientRect();
    return {
      navDisplay: nav ? getComputedStyle(nav).display : null,
      labels: rects,
      overlaps: rects.some((r, i) => i > 0 && r.x < rects[i - 1].right - 1),
      raceVisible: !!raceRect && raceRect.width > 0,
      pageOverflowX: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  if (width === 390) {
    await page.screenshot({ path: 'screenshots/final-mobile-menu.png' });
    await page.evaluate(() => Array.from(document.querySelectorAll('header nav button')).find((b) => /garage/i.test(b.textContent || ''))?.click());
    await sleep(600);
    await page.screenshot({ path: 'screenshots/final-mobile-garage.png' });
    out.mobileGarageScroll = await page.evaluate(async () => { window.scrollTo(0, 99999); await new Promise(r => setTimeout(r, 100)); const y = Math.round(window.scrollY); window.scrollTo(0, 0); return y; });
  }
}
await page.setViewport({ width: 1366, height: 640, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4183/', { waitUntil: 'domcontentloaded' });
await sleep(1300);
await page.evaluate(() => Array.from(document.querySelectorAll('header nav button')).find((b) => /garage/i.test(b.textContent || ''))?.click());
await sleep(600);
out.desktop = await page.evaluate(() => {
  const h = document.querySelector('header .page-container')?.getBoundingClientRect();
  const m = document.querySelector('main')?.getBoundingClientRect();
  const h1 = document.querySelector('main h1')?.getBoundingClientRect();
  return { headerLeft: h ? Math.round(h.left) : null, mainLeft: m ? Math.round(m.left) : null, headingLeft: h1 ? Math.round(h1.left) : null, headingVisible: h1 ? h1.top >= 0 && h1.top < innerHeight : false, scrollY: Math.round(window.scrollY), scrollable: document.documentElement.scrollHeight > innerHeight + 2, pageOverflowX: document.documentElement.scrollWidth > innerWidth + 1 };
});
await page.screenshot({ path: 'screenshots/final-1366-garage-top.png' });
out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
