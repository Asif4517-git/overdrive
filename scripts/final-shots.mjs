import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2600);
await page.screenshot({ path: 'artifacts/01-main-menu.png' });
// Garage
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /^garage$/i.test((b.textContent||'').trim()))?.click());
await sleep(900);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /SPECTRE X/.test(b.textContent || '') && b.className.includes('carousel-card'))?.click());
await sleep(700);
await page.screenshot({ path: 'artifacts/02-garage.png' });
// Circuits
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /^circuits$/i.test((b.textContent||'').trim()))?.click());
await sleep(900);
await page.screenshot({ path: 'artifacts/03-circuits.png' });
// Start Mirage race
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(3600);
await page.screenshot({ path: 'artifacts/04-countdown.png' });
// Mid-race boost via simulation + real render
await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  while (g.phase === 'countdown') g.debugStep(1/60);
  g.keys.clear(); g.keys.add('KeyW');
  for (let i = 0; i < 240; i += 1) {
    const ahead = g.track.samples[(g.player.index + 16) % g.track.samples.length];
    const desired = Math.atan2(ahead.pos.x - g.player.pos.x, ahead.pos.z - g.player.pos.z);
    let d = desired - g.player.heading; while (d > Math.PI) d -= Math.PI*2; while (d < -Math.PI) d += Math.PI*2;
    g.keys.delete('KeyA'); g.keys.delete('KeyD');
    if (d > 0.04) g.keys.add('KeyA'); else if (d < -0.04) g.keys.add('KeyD');
    g.debugStep(1/60);
  }
  g.keys.add('ShiftLeft');
});
await page.evaluate(() => { const g = window.__NEON_RUSH__; for (let i=0;i<20;i+=1) g.debugStep(1/60); });
await sleep(900);
await page.screenshot({ path: 'artifacts/05-race-boost.png' });
// Drift shot
await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  g.keys.clear(); g.keys.add('KeyW'); g.keys.add('KeyA'); g.keys.add('Space');
  for (let i = 0; i < 26; i += 1) g.debugStep(1/60);
});
await sleep(900);
await page.screenshot({ path: 'artifacts/06-race-drift.png' });
// Pause
await page.keyboard.press('Escape'); await sleep(900);
await page.screenshot({ path: 'artifacts/07-pause.png' });
// Finish + results
await page.evaluate(() => { const g = window.__NEON_RUSH__; g.resume(); g.debugFastForward(260, true); });
await sleep(2200);
await page.screenshot({ path: 'artifacts/08-results.png' });
// Mobile
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /main menu/i.test(b.textContent || ''))?.click());
await sleep(900);
await page.screenshot({ path: 'artifacts/09-mobile-menu.png' });
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(3600);
await page.screenshot({ path: 'artifacts/10-mobile-race.png' });
console.log(JSON.stringify({ errors, results: await page.evaluate(() => /victory|race complete|podium|classified/i.test(document.body.innerText)) }));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
