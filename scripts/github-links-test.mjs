import fs from 'fs';
fs.mkdirSync('screenshots', { recursive: true });
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'shell',
  args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 950 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};

const LIVE = 'https://asif4517-git.github.io/overdrive/';
const REPO = 'https://github.com/asif4517-git/overdrive';
const PORTFOLIO = 'https://asif4517-git.github.io/';
const INSTAGRAM = 'https://instagram.com/asif_xrk';
const EMAIL = 'mailto:asifsrk4517@gmail.com';

const inspectLinks = () => page.evaluate(() => Array.from(document.querySelectorAll('a')).map((a) => ({
  text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50),
  href: a.getAttribute('href'),
  target: a.getAttribute('target'),
  rel: a.getAttribute('rel'),
  visible: a.getBoundingClientRect().width > 0,
})).filter((l) => l.href));

await page.goto('http://127.0.0.1:8090/', { waitUntil: 'domcontentloaded' });
await sleep(2600);
out.meta = await page.evaluate(() => {
  const jsonld = document.querySelector('script[type="application/ld+json"]');
  let parsed = null;
  try { parsed = JSON.parse(jsonld.textContent); } catch (e) { parsed = { error: String(e) }; }
  return {
    title: document.title,
    author: document.querySelector('meta[name="author"]')?.content,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    ogUrl: document.querySelector('meta[property="og:url"]')?.content,
    ogTitle: document.querySelector('meta[property="og:title"]')?.content,
    jsonldName: parsed?.name,
    jsonldUrl: parsed?.url,
    jsonldAuthor: parsed?.author?.name,
    jsonldAuthorUrl: parsed?.author?.url,
    jsonldEmail: parsed?.author?.email,
    jsonldInstagram: parsed?.author?.sameAs?.[0],
  };
});
out.homeLinks = (await inspectLinks()).filter((l) => /asif4517|asif_xrk|mailto|github\.com/.test(l.href) || /play live|source|portfolio/i.test(l.text));
out.home = await page.evaluate(() => ({
  overflowX: document.documentElement.scrollWidth > innerWidth + 1,
  headerGitHub: !!document.querySelector('header a[href="https://github.com/asif4517-git/overdrive"]'),
  footerPlayLive: !!document.querySelector('footer a[href="https://asif4517-git.github.io/overdrive/"]'),
  headerGitHubRel: document.querySelector('header a[href="https://github.com/asif4517-git/overdrive"]')?.getAttribute('rel'),
  nameInFooter: /Asif/.test(document.querySelector('footer')?.innerText || ''),
}));
await page.screenshot({ path: 'screenshots/od-19-github-home.png' });

// About page
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('header nav button')).find((b) => (b.textContent || '').trim() === 'About' && b.offsetParent !== null);
  btn?.click();
});
await sleep(1100);
out.about = await page.evaluate((urls) => {
  const links = Array.from(document.querySelectorAll('a'));
  const has = (href) => links.some((a) => a.getAttribute('href') === href);
  return {
    heading: /Built by/i.test(document.body.innerText) && /Asif/.test(document.body.innerText),
    playLive: has(urls.live),
    source: has(urls.repo),
    portfolio: has(urls.portfolio),
    instagram: has(urls.instagram),
    email: has(urls.email),
    repoPanel: document.body.innerText.includes('asif4517-git/overdrive'),
    liveUrlText: document.body.innerText.includes('asif4517-git.github.io/overdrive'),
    unsafeExternal: links.filter((a) => /^https?:/.test(a.getAttribute('href') || '')).filter((a) => a.getAttribute('target') !== '_blank' || !(a.getAttribute('rel') || '').includes('noopener')).map((a) => a.getAttribute('href')),
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
  };
}, { live: LIVE, repo: REPO, portfolio: PORTFOLIO, instagram: INSTAGRAM, email: EMAIL });
out.aboutLinks = (await inspectLinks()).filter((l) => [LIVE, REPO, PORTFOLIO, INSTAGRAM, EMAIL].includes(l.href));
await page.screenshot({ path: 'screenshots/od-20-github-about.png' });

// Settings -> Data & about
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('header nav button')).find((b) => (b.textContent || '').trim() === 'Settings' && b.offsetParent !== null);
  btn?.click();
});
await sleep(900);
await page.evaluate(() => {
  const tab = Array.from(document.querySelectorAll('button')).find((b) => /Data & about/i.test(b.textContent || ''));
  tab?.click();
});
await sleep(700);
out.settings = await page.evaluate((urls) => ({
  attribution: /Created by Asif/i.test(document.body.innerText),
  hasPortfolio: Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === urls.portfolio),
  hasInstagram: Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === urls.instagram),
  hasEmail: Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === urls.email),
  aboutPageButton: Array.from(document.querySelectorAll('button')).some((b) => /Full developer profile/i.test(b.textContent || '')),
}), { portfolio: PORTFOLIO, instagram: INSTAGRAM, email: EMAIL });
await page.screenshot({ path: 'screenshots/od-21-github-settings.png' });

// Model studio
await page.goto('http://127.0.0.1:8090/#models', { waitUntil: 'domcontentloaded' });
await sleep(2600);
out.models = await page.evaluate(() => ({
  studio: /Model studio/i.test(document.body.innerText),
  canvas: !!document.querySelector('canvas'),
  carButtons: document.querySelectorAll('aside button').length,
  overflowX: document.documentElement.scrollWidth > innerWidth + 1,
}));

// Mobile
const mp = await browser.newPage();
await mp.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await mp.goto('http://127.0.0.1:8090/', { waitUntil: 'domcontentloaded' });
await sleep(2200);
out.mobile = await mp.evaluate(() => ({
  overflowX: document.documentElement.scrollWidth > innerWidth + 1,
  headerGitHub: !!document.querySelector('header a[href="https://github.com/asif4517-git/overdrive"]'),
  footerLinks: document.querySelectorAll('footer a').length,
  canScroll: document.documentElement.scrollHeight > innerHeight,
}));
await mp.screenshot({ path: 'screenshots/od-22-github-mobile.png' });
await mp.close();

// GitHub Pages style subpath: boot the real game from /overdrive/
const sp = await browser.newPage();
await sp.setViewport({ width: 1440, height: 860 });
const spErrors = [];
sp.on('pageerror', (e) => spErrors.push(e.message));
await sp.goto('http://127.0.0.1:8099/overdrive/', { waitUntil: 'domcontentloaded' });
await sleep(2500);
await sp.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find((x) => /DRIVE NOW/i.test(x.textContent || ''));
  b?.click();
});
await sleep(4500);
out.subpath = await sp.evaluate(() => ({
  title: document.title,
  engine: !!window.__OVERDRIVE__,
  canvas: !!document.querySelector('.race-canvas canvas'),
  hud: !!document.querySelector('.hud'),
  liveLinkPresent: !!document.querySelector('a[href="https://asif4517-git.github.io/overdrive/"]') || !!document.querySelector('footer'),
  overflowX: document.documentElement.scrollWidth > innerWidth + 1,
}));
await sp.screenshot({ path: 'screenshots/od-23-subpath-race.png' });
out.subpathErrors = spErrors;
await sp.close();

out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await page.close();
await Promise.race([browser.close(), sleep(3000)]);
process.exit(0);
