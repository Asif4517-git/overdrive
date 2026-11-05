import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'shell',
  args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (msg) => { if (msg.type() === 'error' || msg.type() === 'warning') logs.push(`[${msg.type()}] ${msg.text()}`); });
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
page.on('requestfailed', (req) => logs.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText}`));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((resolve) => setTimeout(resolve, 3000));
await page.screenshot({ path: 'artifacts/shot-menu.png' });

const menuAudit = await page.evaluate(() => ({
  buttons: document.querySelectorAll('button').length,
  hasCanvas: !!document.querySelector('canvas'),
  horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  fonts: document.fonts.status,
}));

// Navigate to garage and circuits for screenshots.
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find((b) => /^garage/i.test((b.textContent || '').trim()));
  btn?.click();
});
await new Promise((resolve) => setTimeout(resolve, 900));
await page.screenshot({ path: 'artifacts/shot-garage.png' });
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find((b) => /^circuits/i.test((b.textContent || '').trim()));
  btn?.click();
});
await new Promise((resolve) => setTimeout(resolve, 900));
await page.screenshot({ path: 'artifacts/shot-circuits.png' });
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find((b) => /^settings/i.test((b.textContent || '').trim()));
  btn?.click();
});
await new Promise((resolve) => setTimeout(resolve, 900));
await page.screenshot({ path: 'artifacts/shot-settings.png' });

// Start a race from the header CTA.
const clicked = await page.evaluate(() => {
  const start = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE');
  start?.click();
  return !!start;
});
await new Promise((resolve) => setTimeout(resolve, 4000));
const raceBoot = await page.evaluate(() => {
  const game = window.__NEON_RUSH__;
  const canvas = document.querySelector('canvas');
  return {
    engine: !!game,
    phase: game?.phase,
    canvas: canvas ? { w: canvas.width, h: canvas.height } : null,
    hudVisible: !!document.querySelector('.hud-layer'),
    countdownEl: !!document.querySelector('.countdown'),
    sceneChildren: game?.scene?.children?.length,
    camera: game ? { x: game.camera.position.x, y: game.camera.position.y, z: game.camera.position.z } : null,
  };
});
await page.screenshot({ path: 'artifacts/shot-race-start.png' });

// Identify large transparent scene objects near the camera (artefact hunt).
const transparent = await page.evaluate(() => {
  const game = window.__NEON_RUSH__;
  if (!game) return [];
  const out = [];
  game.scene.traverse((obj) => {
    if (!(obj.isMesh || obj.isPoints)) return;
    const material = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (!material || (!material.transparent && material.blending === 0)) return;
    obj.updateWorldMatrix(true, false);
    const world = new obj.position.constructor();
    obj.getWorldPosition(world);
    const distance = world.distanceTo(game.camera.position);
    out.push({ type: obj.type, distance: Math.round(distance), opacity: material.opacity, additive: material.blending === 2, points: obj.isPoints || false, scale: obj.scale.toArray().map((v) => Math.round(v * 10) / 10), geometry: obj.geometry?.type });
  });
  return out.filter((o) => o.distance < 30).sort((a, b) => b.scale[0] - a.scale[0]).slice(0, 14);
});

// Pause menu before the automated race.
await page.keyboard.press('Escape');
await new Promise((resolve) => setTimeout(resolve, 900));
const pauseVisible = await page.evaluate(() => !!document.querySelector('.pause-scrim'));
await page.screenshot({ path: 'artifacts/shot-pause.png' });
const pausedState = await page.evaluate(() => window.__NEON_RUSH__?.paused);
await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const resume = buttons.find((b) => /resume race/i.test(b.textContent || ''));
  resume?.click();
});
await new Promise((resolve) => setTimeout(resolve, 1200));
const resumedState = await page.evaluate(() => window.__NEON_RUSH__?.paused);

// Simulate a whole race on CPU with the real physics/AI/lap logic.
const fastResult = await page.evaluate(() => {
  const game = window.__NEON_RUSH__;
  return game?.debugFastForward(200, true);
});
await new Promise((resolve) => setTimeout(resolve, 1800));
await page.screenshot({ path: 'artifacts/shot-race-after.png' });
const hudText = await page.evaluate(() => document.querySelector('.hud-layer')?.innerText?.slice(0, 500));
const resultsScreen = await page.evaluate(() => /victory|race complete|podium/i.test(document.body.innerText));
const resultText = await page.evaluate(() => document.body.innerText.slice(0, 800));
await page.screenshot({ path: 'artifacts/shot-results.png' });

console.log(JSON.stringify({ menuAudit, clicked, raceBoot, transparent, pauseVisible, pausedState, resumedState, fastResult, hudText, resultsScreen, resultText, logs }, null, 2));
await page.close();
await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 5000))]);
process.exit(0);
