import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HREFS = ['https://asif4517-git.github.io/', 'https://instagram.com/asif_xrk', 'mailto:asifsrk4517@gmail.com'];
const report = {};
await page.setViewport({ width: 1600, height: 900 });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2500);
report.home = await page.evaluate((hrefs) => {
  const nameEl = Array.from(document.querySelectorAll('p')).find((p) => /^Asif$/i.test((p.textContent || '').trim()));
  const r = nameEl?.getBoundingClientRect();
  const links = Array.from(document.querySelectorAll('a')).filter((a) => /asif4517|asif_xrk|asifsrk/i.test(a.getAttribute('href') || ''));
  return {
    nameVisible: !!nameEl,
    nameInViewport: r ? r.top >= 0 && r.bottom <= innerHeight : false,
    allThreeLinks: hrefs.every((h) => links.some((a) => a.getAttribute('href') === h)),
    creditText: (document.body.innerText.match(/CREATED & DEVELOPED BY[\s\S]{0,60}/i) || [])[0],
  };
}, HREFS);
await page.screenshot({ path: 'screenshots/11-home-credit.png' });
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await sleep(500);
report.footer = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div')).find((d) => /All rights reserved/i.test(d.textContent || '') && d.getBoundingClientRect().height < 120);
  const r = el?.getBoundingClientRect();
  return { present: /All rights reserved/i.test(document.body.innerText), visible: !!r && r.top < innerHeight && r.bottom > 0 };
});
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.evaluate(() => Array.from(document.querySelectorAll('button, a')).find((b) => (b.textContent || '').trim() === 'About')?.click());
await sleep(1000);
await page.screenshot({ path: 'screenshots/13-about-page.png' });
report.about = await page.evaluate((hrefs) => ({
  h1: document.querySelector('main h1')?.textContent,
  allThreeLinks: hrefs.every((h) => Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === h)),
  externalLinksSafe: Array.from(document.querySelectorAll('a')).filter((a) => (a.getAttribute('href') || '').startsWith('http')).every((a) => a.getAttribute('target') === '_blank' && (a.getAttribute('rel') || '').includes('noopener')),
  overflow: document.documentElement.scrollWidth > innerWidth + 1,
  name: /\bAsif\b/.test(document.body.innerText),
  email: document.body.innerText.includes('asifsrk4517@gmail.com'),
  instagram: document.body.innerText.includes('@asif_xrk'),
  portfolio: document.body.innerText.includes('asif4517-git.github.io'),
}), HREFS);
// Settings -> About tab
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Settings')?.click());
await sleep(800);
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /^About/.test((b.textContent || '').trim()) && b.className.includes('w-full'))?.click());
await sleep(700);
await page.screenshot({ path: 'screenshots/14-settings-about.png' });
report.settings = await page.evaluate((hrefs) => ({
  panel: Array.from(document.querySelectorAll('h2')).some((h) => /about the developer/i.test(h.textContent || '')),
  allThreeLinks: hrefs.every((h) => Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === h)),
  aboutPageButton: Array.from(document.querySelectorAll('button')).some((b) => /about page/i.test(b.textContent || '')),
}), HREFS);
// race still works
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(3300);
report.race = await page.evaluate(() => ({ engine: !!window.__NEON_RUSH__, canvas: !!document.querySelector('canvas'), hud: !!document.querySelector('.hud-layer') }));
report.errors = errors;
await page.close();
// mobile in a clean page
const mp = await browser.newPage();
await mp.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await mp.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2400);
report.mobileHome = await mp.evaluate((hrefs) => {
  const links = Array.from(document.querySelectorAll('a')).filter((a) => /asif4517|asif_xrk|asifsrk/i.test(a.getAttribute('href') || ''));
  const credit = Array.from(document.querySelectorAll('p')).find((p) => /created & developed by/i.test(p.textContent || ''));
  const r = credit?.getBoundingClientRect();
  return { creditVisible: !!credit && !!r && r.top >= 0 && r.top < innerHeight, allThreeLinks: hrefs.every((h) => links.some((a) => a.getAttribute('href') === h)), overflow: document.documentElement.scrollWidth > innerWidth + 1, textHasName: /\bAsif\b/.test(document.body.innerText) };
}, HREFS);
await mp.screenshot({ path: 'screenshots/15-mobile-home-credit.png' });
await mp.evaluate(() => Array.from(document.querySelectorAll('header nav button')).find((b) => /about/i.test(b.textContent || ''))?.click());
await sleep(900);
await mp.screenshot({ path: 'screenshots/16-mobile-about.png' });
report.mobileAbout = await mp.evaluate((hrefs) => ({ h1: document.querySelector('main h1')?.textContent, overflow: document.documentElement.scrollWidth > innerWidth + 1, allThreeLinks: hrefs.every((h) => Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === h)) }), HREFS);
await mp.close();
console.log(JSON.stringify(report, null, 2));
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
