import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 860 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('http://127.0.0.1:8090/', { waitUntil: 'domcontentloaded' });
await sleep(2000);
await page.evaluate(() => localStorage.clear());
await page.goto('http://127.0.0.1:8090/', { waitUntil: 'domcontentloaded' });
await sleep(1800);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /DRIVE NOW/i.test(b.textContent || ''))?.click());
for (let i = 0; i < 40; i += 1) { await sleep(300); if (await page.evaluate(() => window.__OVERDRIVE__?.phase) === 'racing') break; }
const data = await page.evaluate(() => {
  const g = window.__OVERDRIVE__;
  const visual = g.playerVisual;
  const design = visual.design;
  const wheels = visual.wheels.map((w) => ({
    front: w.front,
    side: w.side,
    local: w.steer.position.toArray().map((v) => +v.toFixed(3)),
    radius: visual.wheelRadius,
    steerY: +w.steer.rotation.y.toFixed(4),
    spinX: +w.spin.rotation.x.toFixed(4),
    axle: (w.spin.children[0].geometry.attributes.position ? 'mesh' : 'none'),
    attached: w.steer.parent === visual.root,
  }));
  const bodyBox = new (window.THREE ? window.THREE.Box3 : Object)();
  void bodyBox;
  return {
    design: { length: design.length, width: design.width, wheelbase: design.wheelbase, track: design.track, wheelRadius: design.wheelRadius },
    wheels,
    rootChildren: visual.root.children.length,
    bodyVisible: visual.body.visible,
  };
});
// rolling test: hold throttle, verify spin changes and stays on X
await page.keyboard.down('w');
await sleep(1600);
const rollA = await page.evaluate(() => window.__OVERDRIVE__.playerVisual.wheels.map((w) => ({ x: +w.spin.rotation.x.toFixed(3), z: +w.spin.rotation.z.toFixed(3), y: +w.spin.rotation.y.toFixed(3) })));
await sleep(1200);
const rollB = await page.evaluate(() => window.__OVERDRIVE__.playerVisual.wheels.map((w) => ({ x: +w.spin.rotation.x.toFixed(3), z: +w.spin.rotation.z.toFixed(3), y: +w.spin.rotation.y.toFixed(3) })));
await page.keyboard.up('w');
const checks = {
  fourWheels: data.wheels.length === 4,
  allAttached: data.wheels.every((w) => w.attached),
  correctFrontRear: data.wheels.filter((w) => w.front).length === 2,
  localYEqualsRadius: data.wheels.every((w) => Math.abs(w.local[1] - w.radius) < 0.001),
  frontAxleAtWheelbase: data.wheels.filter((w) => w.front).every((w) => Math.abs(Math.abs(w.local[2]) - data.design.wheelbase / 2) < 0.001),
  rearAxleAtWheelbase: data.wheels.filter((w) => !w.front).every((w) => Math.abs(Math.abs(w.local[2]) - data.design.wheelbase / 2) < 0.001),
  trackWidthCorrect: (() => { const l = data.wheels.find((w) => w.side === -1); const r = data.wheels.find((w) => w.side === 1); return Math.abs((r.local[0] - l.local[0]) - data.design.track) < 0.01; })(),
  wheelsOutsideBody: data.wheels.every((w) => Math.abs(w.local[0]) > data.design.width / 2),
  rollsOnXOnly: rollA.every((v, i) => v.x !== rollB[i].x && rollB[i].z === 0 && rollB[i].y === 0),
  noZSpin: rollB.every((v) => v.z === 0),
};
console.log(JSON.stringify({ data, rollA, rollB, checks, allPass: Object.values(checks).every(Boolean), errors }, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
