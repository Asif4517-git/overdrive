import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (src) => page.evaluate((s) => {
  const re = new RegExp(s, 'i');
  const b = Array.from(document.querySelectorAll('button')).find((x) => re.test((x.textContent || '').trim()));
  b?.click(); return !!b;
}, src);
const report = {};

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2600);
await page.screenshot({ path: 'artifacts/final-menu.png' });

// Garage screenshots after canopy update
await click('^garage'); await sleep(800);
await page.screenshot({ path: 'artifacts/final-garage.png' });

// Select Ronin + Docks for a harder race
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /RONIN EVO/.test(b.textContent || '') && b.className.includes('carousel-card'))?.click());
await sleep(500);
await click('^circuits'); await sleep(700);
await page.evaluate(() => {
  const card = Array.from(document.querySelectorAll('article')).find((c) => /CHROME DOCKS/.test(c.textContent || ''));
  Array.from(card?.querySelectorAll('button') || []).find((b) => /select circuit/i.test(b.textContent || ''))?.click();
});
await sleep(500);
report.started = await click('start engine');
await sleep(3200);
await page.screenshot({ path: 'artifacts/final-countdown.png' });
report.boot = await page.evaluate(() => ({ phase: window.__NEON_RUSH__?.phase, car: window.__NEON_RUSH__?.spec?.name, track: window.__NEON_RUSH__?.track?.def?.id }));

// Mid-race action: fast-forward a few seconds with autopilot style input, then release.
report.midrace = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  while (g.phase === 'countdown') g.debugStep(1/60);
  g.keys.clear(); g.keys.add('KeyW');
  for (let i = 0; i < 150; i += 1) {
    const ahead = g.track.samples[(g.player.index + 20) % g.track.samples.length];
    const target = ahead.pos.clone().addScaledVector(ahead.side, 0);
    const desired = Math.atan2(target.x - g.player.pos.x, target.z - g.player.pos.z);
    let d = desired - g.player.heading; while (d > Math.PI) d -= Math.PI*2; while (d < -Math.PI) d += Math.PI*2;
    g.keys.delete('KeyA'); g.keys.delete('KeyD');
    if (d > 0.03) g.keys.add('KeyA'); else if (d < -0.03) g.keys.add('KeyD');
    g.debugStep(1/60);
  }
  g.keys.clear();
  return { speed: Math.round(g.player.vel.length()*3.6), lap: g.player.lap, position: g.buildHud().position, progress: +g.player.progress.toFixed(3) };
});
await sleep(700);
await page.screenshot({ path: 'artifacts/final-action.png' });

// Pause + quality switching
await page.keyboard.press('Escape'); await sleep(700);
await click('options'); await sleep(500);
await page.screenshot({ path: 'artifacts/final-pause.png' });
report.quality = [];
for (const quality of ['low', 'medium', 'high']) {
  await page.evaluate((q) => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().toLowerCase() === q);
    b?.click();
  }, quality);
  await sleep(900);
  report.quality.push(await page.evaluate(() => ({
    setting: JSON.parse(localStorage.getItem('neonrush-settings-v1') || '{}').quality,
    engineQuality: window.__NEON_RUSH__?.quality,
    bloom: !!window.__NEON_RUSH__?.bloom,
    shadows: window.__NEON_RUSH__?.renderer?.shadowMap?.enabled,
  })));
}
await page.screenshot({ path: 'artifacts/final-pause-low.png' });
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /resume race/i.test(b.textContent || ''))?.click());
await sleep(800);

// Complete the race
report.fullRace = await page.evaluate(() => window.__NEON_RUSH__?.debugFastForward(250, true));
await sleep(2000);
await page.screenshot({ path: 'artifacts/final-results.png' });
report.results = await page.evaluate(() => ({ visible: !!document.querySelector('.screen'), text: document.body.innerText.slice(0, 220), record: JSON.parse(localStorage.getItem('neonrush-profile-v1') || '{}') }));

// Menu + other screens
await click('main menu'); await sleep(900);
await page.screenshot({ path: 'artifacts/final-menu-after.png' });

// Mobile/race/touch
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(600);
await click('^race$'); await sleep(3600);
await page.screenshot({ path: 'artifacts/final-mobile-race.png' });
report.mobile = await page.evaluate(() => {
  const g = window.__NEON_RUSH__;
  const touch = document.querySelector('.touch-controls');
  const gas = Array.from(document.querySelectorAll('.touch-btn')).find((b) => (b.textContent || '').trim() === 'GAS');
  const rect = gas?.getBoundingClientRect();
  if (gas) {
    gas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: rect.x + 10, clientY: rect.y + 10 }));
  }
  const before = g?.keys?.size;
  const keys = g ? Array.from(g.keys) : [];
  return { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, touchDisplay: touch ? getComputedStyle(touch).display : 'missing', gasButton: !!gas, keysAfterTouch: keys, phase: g?.phase, canvas: !!document.querySelector('canvas'), before };
});
await sleep(500);
report.mobileTouchReleased = await page.evaluate(() => {
  const gas = Array.from(document.querySelectorAll('.touch-btn')).find((b) => (b.textContent || '').trim() === 'GAS');
  gas?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
  return window.__NEON_RUSH__ ? Array.from(window.__NEON_RUSH__.keys) : [];
});
report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
