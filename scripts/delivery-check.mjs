import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = {};
await page.setViewport({ width: 1600, height: 900 });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2500);
await page.screenshot({ path: 'screenshots/01-main-menu.png' });
report.desktop = await page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth > innerWidth + 1,
  headerLinks: Array.from(document.querySelectorAll('header nav button')).map((b) => (b.textContent || '').trim()),
  title: document.title,
}));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(900);
await page.screenshot({ path: 'screenshots/09-mobile-menu.png' });
report.mobile = await page.evaluate(() => {
  const nav = document.querySelector('header nav');
  const rect = nav?.getBoundingClientRect();
  return {
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    mobileNavVisible: !!nav && getComputedStyle(nav).display !== 'none',
    navBottom: rect ? Math.round(rect.bottom) : null,
    heroTopGap: Math.round((document.querySelector('.hero-screen h1')?.getBoundingClientRect().top || 0)),
    navLabels: Array.from(document.querySelectorAll('header nav button')).map((b) => (b.textContent || '').trim()),
  };
});
// Navigate via mobile nav to garage then race
await page.evaluate(() => Array.from(document.querySelectorAll('header nav button')).find((b) => /garage/i.test(b.textContent || ''))?.click());
await sleep(900);
report.garageReached = await page.evaluate(() => /THE GARAGE/i.test(document.body.innerText));
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /start race/i.test(b.textContent || '') || (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(3200);
report.race = await page.evaluate(() => ({ engine: !!window.__NEON_RUSH__, canvas: !!document.querySelector('canvas'), touch: getComputedStyle(document.querySelector('.touch-controls') || document.body).display, phase: window.__NEON_RUSH__?.phase }));
await page.screenshot({ path: 'screenshots/10-mobile-race.png' });
report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
