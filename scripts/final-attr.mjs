import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const HREFS = ['https://asif4517-git.github.io/', 'https://instagram.com/asif_xrk', 'mailto:asifsrk4517@gmail.com'];
const measure = async () => page.evaluate((hrefs) => {
  const links = Array.from(document.querySelectorAll('a')).filter((a) => /asif4517|asif_xrk|asifsrk/i.test(a.getAttribute('href') || ''));
  const chip = Array.from(document.querySelectorAll('button')).find((b) => /created by/i.test(b.textContent || '') && /asif/i.test(b.textContent || ''));
  const r = chip?.getBoundingClientRect();
  return {
    chipVisibleInViewport: !!r && r.width > 0 && r.top >= 0 && r.top < innerHeight,
    allLinks: hrefs.every((h) => links.some((a) => a.getAttribute('href') === h)),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    textHasName: /\bAsif\b/i.test(document.body.innerText),
    title: document.title,
  };
}, HREFS);
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:4174/', { waitUntil: 'domcontentloaded' });
await sleep(2500);
out.desktop1440 = await measure();
await page.screenshot({ path: 'screenshots/11-home-credit.png' });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(700);
out.mobile = await measure();
await page.screenshot({ path: 'screenshots/15-mobile-home-credit.png' });
await page.evaluate(() => Array.from(document.querySelectorAll('header nav button')).find((b) => /about/i.test(b.textContent || ''))?.click());
await sleep(900);
out.about = await page.evaluate((hrefs) => ({
  h1: document.querySelector('main h1')?.textContent,
  allLinks: hrefs.every((h) => Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === h)),
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  headingName: /\bAsif\b/.test(document.querySelector('main h1')?.textContent || ''),
}), HREFS);
await page.screenshot({ path: 'screenshots/16-mobile-about.png' });
out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
