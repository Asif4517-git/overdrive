import fs from 'fs';
fs.mkdirSync('screenshots', { recursive: true });
fs.mkdirSync('artifacts', { recursive: true });
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = {};
const open = async (label) => page.evaluate((t) => {
  const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().toUpperCase() === t.toUpperCase());
  if (b) b.click();
  return !!b;
}, label);
const measure = () => page.evaluate(() => {
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  const container = document.querySelector('header .page-container');
  const inner = main ? (main.classList.contains('page-container') ? main : main.querySelector('.page-container')) : null;
  const logo = header?.querySelector('button');
  const h1 = main?.querySelector('h1');
  const last = document.querySelector('footer') || Array.from(document.querySelectorAll('main *')).filter((el) => el.getBoundingClientRect().height > 0).slice(-1)[0];
  return {
    headerLeft: container ? Math.round(container.getBoundingClientRect().left) : null,
    headerRight: container ? Math.round(container.getBoundingClientRect().right) : null,
    logoLeft: logo ? Math.round(logo.getBoundingClientRect().left) : null,
    mainLeft: inner ? Math.round(inner.getBoundingClientRect().left) : (main ? Math.round(main.getBoundingClientRect().left) : null),
    mainRight: inner ? Math.round(inner.getBoundingClientRect().right) : (main ? Math.round(main.getBoundingClientRect().right) : null),
    headingLeft: h1 ? Math.round(h1.getBoundingClientRect().left) : null,
    docScrollable: document.documentElement.scrollHeight > window.innerHeight + 2,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
    bodyOverflowY: getComputedStyle(document.body).overflowY,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    headerPosition: header ? getComputedStyle(header).position : null,
    lastBottom: last ? Math.round(last.getBoundingClientRect().bottom) : null,
  };
});
const scrollTest = async () => page.evaluate(async () => {
  window.scrollTo(0, document.documentElement.scrollHeight);
  await new Promise((r) => setTimeout(r, 120));
  const y = window.scrollY;
  window.scrollTo(0, 0);
  return y;
});

for (const [name, width, height] of [['fullHD-short', 1600, 800], ['desktop', 1920, 1080], ['laptop', 1366, 768], ['ultrawide', 2560, 1080]]) {
  await page.setViewport({ width, height });
  await page.goto('http://127.0.0.1:4180/', { waitUntil: 'domcontentloaded' });
  await sleep(1600);
  await open('Garage');
  await sleep(700);
  const garage = await measure();
  const scrolled = await scrollTest();
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(200);
  await page.screenshot({ path: `screenshots/layout-${name}-garage.png` });
  await open('Settings');
  await sleep(600);
  const settings = await measure();
  await open('About');
  await sleep(600);
  const about = await measure();
  results[name] = { garage, settings, about, scrolledTo: scrolled };
}

// Mobile
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto('http://127.0.0.1:4180/', { waitUntil: 'domcontentloaded' });
await sleep(1500);
await page.screenshot({ path: 'screenshots/layout-mobile-menu.png' });
const mobileMenu = await measure();
await page.evaluate(() => Array.from(document.querySelectorAll('header button')).find((b) => /garage/i.test(b.textContent || ''))?.click());
await sleep(700);
const mobileGarage = await measure();
const mobileScroll = await scrollTest();
await page.screenshot({ path: 'screenshots/layout-mobile-garage.png' });
results.mobile = { menu: mobileMenu, garage: mobileGarage, scrolledTo: mobileScroll };

// Race from garage, verify canvas and HUD fit
await open('Race');
await sleep(3600);
results.race = await page.evaluate(() => {
  const c = document.querySelector('.race-canvas canvas');
  const shell = document.querySelector('.race-shell');
  const hud = document.querySelector('.hud-layer');
  const panels = Array.from(document.querySelectorAll('.hud-panel')).map((el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), right: Math.round(r.right), bottom: Math.round(r.bottom) };
  });
  return {
    shell: shell ? [Math.round(shell.getBoundingClientRect().width), Math.round(shell.getBoundingClientRect().height)] : null,
    viewport: [window.innerWidth, window.innerHeight],
    canvas: c ? [Math.round(c.getBoundingClientRect().width), Math.round(c.getBoundingClientRect().height)] : null,
    hud: !!hud,
    outOfBounds: panels.filter((p) => p.x < 0 || p.y < 0 || p.right > window.innerWidth + 1 || p.bottom > window.innerHeight + 1),
  };
});
await page.screenshot({ path: 'screenshots/layout-mobile-race.png' });
results.errors = errors;
console.log(JSON.stringify(results, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
