import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  headless: 'shell',
  args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage']
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
const logs = [];
page.on('console', msg => { if (['error','warning'].includes(msg.type())) logs.push(`[${msg.type()}] ${msg.text()}`); });
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}\n${err.stack}`));
page.on('requestfailed', req => logs.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText}`));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle2', timeout: 60000 }).catch(e => logs.push('goto: '+e.message));
await new Promise(r => setTimeout(r, 2200));
await page.screenshot({ path: 'artifacts/menu.png' });
const canvasInfo = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  return { canvas: !!c, width: c?.width, height: c?.height, buttons: document.querySelectorAll('button').length };
});
const clicked = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const target = buttons.find(b => /start race|ignition/i.test(b.textContent || ''));
  if (target) { target.click(); return target.textContent; }
  return null;
});
await new Promise(r => setTimeout(r, 1400));
await page.screenshot({ path: 'artifacts/countdown.png' });
await new Promise(r => setTimeout(r, 2600));
await page.screenshot({ path: 'artifacts/race-idle.png' });
await page.keyboard.down('w');
await new Promise(r => setTimeout(r, 2600));
await page.screenshot({ path: 'artifacts/race-driving.png' });
await page.keyboard.down('Shift');
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: 'artifacts/race-boost.png' });
await page.keyboard.up('Shift');
await page.keyboard.up('w');
const text = await page.evaluate(() => document.body.innerText.slice(0, 1200));
const perf = await page.evaluate(() => ({ mem: performance.memory?.usedJSHeapSize, canvases: document.querySelectorAll('canvas').length }));
await page.keyboard.press('Escape');
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: 'artifacts/pause.png' });
console.log(JSON.stringify({ clicked, canvasInfo, perf, text, logs }, null, 2));
await browser.close();
