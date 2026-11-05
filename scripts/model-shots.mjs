import fs from 'fs';
fs.mkdirSync('screenshots/models', { recursive: true });
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 980, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:8090/#models', { waitUntil: 'domcontentloaded' });
await sleep(3200);
const out = { errors };
out.studio = await page.evaluate(() => ({ heading: !!document.querySelector('h1') || /Model studio/i.test(document.body.innerText), canvas: !!document.querySelector('canvas'), cars: document.querySelectorAll('aside button').length }));
const cars = [
  ['swift', 'Swift'],
  ['city', 'City'],
  ['fortuner', 'Fortuner'],
  ['m3', 'M3 Competition'],
  ['f296', '296 GTB'],
];
for (const [id, label] of cars) {
  await page.evaluate((name) => {
    const buttons = Array.from(document.querySelectorAll('aside button'));
    const b = buttons.find((x) => (x.textContent || '').includes(name));
    b?.click();
  }, label);
  await sleep(1400);
  for (const angle of ['front', 'side', 'rear', 'threequarter']) {
    await page.evaluate((a) => {
      const labelMap = { front: 'FRONT', side: 'SIDE', rear: 'REAR', threequarter: '3/4' };
      const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim() === labelMap[a]);
      b?.click();
    }, angle);
    await sleep(1200);
    const shot = `screenshots/models/${id}-${angle}.png`;
    await page.screenshot({ path: shot, clip: { x: 290, y: 150, width: 1090, height: 640 } });
  }
}
console.log(JSON.stringify(out));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
