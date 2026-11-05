import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2400);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent||'').trim().toUpperCase() === 'RACE')?.click());
await sleep(2600);
await page.evaluate(() => window.__NEON_RUSH__?.debugFastForward(280, true));
await sleep(2200);
await page.screenshot({ path: 'artifacts/08-results.png' });
const layout = await page.evaluate(() => {
  const aside = document.querySelector('aside');
  const main = document.querySelector('main');
  return {
    aside: aside ? { w: aside.getBoundingClientRect().width, h: aside.getBoundingClientRect().height, text: aside.innerText.slice(0, 120) } : null,
    mainHeight: main?.getBoundingClientRect().height,
    body: document.body.innerText.slice(0, 260),
    classificationRows: document.querySelectorAll('aside .divide-y > div').length,
  };
});
console.log(JSON.stringify({ layout, errors }, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
