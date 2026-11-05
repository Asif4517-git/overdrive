import fs from 'fs';
fs.mkdirSync('screenshots', { recursive: true });
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 860 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
await page.goto('http://127.0.0.1:8090/#models', { waitUntil: 'domcontentloaded' });
await sleep(2600);
await page.evaluate(() => localStorage.clear());
await page.goto('http://127.0.0.1:8090/', { waitUntil: 'domcontentloaded' });
await sleep(2200);
out.home = await page.evaluate(() => ({ hasCanvas: !!document.querySelector('canvas'), title: document.title }));
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /DRIVE NOW/i.test(b.textContent || ''))?.click());
for (let i = 0; i < 40; i += 1) { await sleep(300); if (await page.evaluate(() => window.__OVERDRIVE__?.phase) === 'racing') break; }

out.rest = await page.evaluate(() => window.__OVERDRIVE__.debugWheels());
await page.keyboard.down('w');
await sleep(2600);
const moving = await page.evaluate(() => ({ wheels: window.__OVERDRIVE__.debugWheels(), speed: Math.round(window.__OVERDRIVE__.player.vel.length() * 3.6), spinAngle: +window.__OVERDRIVE__.player.spin.toFixed(3), radius: window.__OVERDRIVE__.playerVisual.wheelRadius }));
await page.screenshot({ path: 'screenshots/od-17-game-car.png' });
await page.keyboard.down('a');
await sleep(900);
const steering = await page.evaluate(() => window.__OVERDRIVE__.debugWheels());
await page.screenshot({ path: 'screenshots/od-18-game-steering.png' });
await page.keyboard.up('a');
await page.keyboard.up('w');
await page.waitForTimeout ? null : null;
out.moving = {
  speedKmh: moving.speed,
  spinAngleRad: moving.spinAngle,
  wheelRadius: moving.radius,
  wheels: moving.wheels,
};
out.rest = out.rest;
out.steering = steering;
// Assertions
const w = moving.wheels;
const state = {
  fourWheels: w.length === 4,
  frontCount: w.filter((x) => x.front).length,
  rearCount: w.filter((x) => !x.front).length,
  axlesOnGround: w.every((x) => Math.abs(x.contactY) < 0.02),
  spinIsX: w.every((x) => Math.abs(x.spinX) > 0.001),
  rotatingWithSpeed: w.every((x) => Math.abs(x.spinX) > 0.02),
  wheelsAttached: w.every((x) => Number.isFinite(x.position[0]) && Number.isFinite(x.position[2])),
  frontSteers: steering.filter((x) => x.front).every((x) => x.steerY > 0.01),
  rearDoesNotSteer: steering.filter((x) => !x.front).every((x) => Math.abs(x.steerY) < 0.0001),
  leftRightSymmetry: (() => {
    const left = w.find((x) => x.front && x.side === -1);
    const right = w.find((x) => x.front && x.side === 1);
    return !!left && !!right && Math.abs(Math.abs(left.position[0]) - Math.abs(right.position[0])) < 0.01;
  })(),
};
out.assertions = state;
out.allPass = Object.values(state).every(Boolean);
out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
