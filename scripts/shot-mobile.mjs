import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2600);
await page.screenshot({ path: 'artifacts/01-main-menu.png' });
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(3400);
await page.screenshot({ path: 'artifacts/04-countdown.png' });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(1600);
await page.screenshot({ path: 'artifacts/10-mobile-race.png' });
await page.setViewport({ width: 1600, height: 900 });
await sleep(1000);
await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  while (g.phase === 'countdown') g.debugStep(1/60);
  g.keys.clear(); g.keys.add('KeyW'); g.keys.add('ShiftLeft');
  for (let i = 0; i < 90; i += 1) {
    const ahead = g.track.samples[(g.player.index + 18) % g.track.samples.length];
    const d0 = Math.atan2(ahead.pos.x - g.player.pos.x, ahead.pos.z - g.player.pos.z) - g.player.heading;
    let d = d0; while (d > Math.PI) d -= Math.PI*2; while (d < -Math.PI) d += Math.PI*2;
    g.keys.delete('KeyA'); g.keys.delete('KeyD');
    if (d > 0.04) g.keys.add('KeyA'); else if (d < -0.04) g.keys.add('KeyD');
    g.debugStep(1/60);
  }
});
await sleep(900);
await page.screenshot({ path: 'artifacts/05-race-boost.png' });
console.log(JSON.stringify({ errors }));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
