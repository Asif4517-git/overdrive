import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = {};
const EXPECTED = {
  portfolio: 'https://asif4517-git.github.io/',
  instagram: 'https://instagram.com/asif_xrk',
  email: 'mailto:asifsrk4517@gmail.com',
};
const inspectLinks = () => page.evaluate(() => Array.from(document.querySelectorAll('a')).map((a) => ({
  text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70),
  href: a.getAttribute('href'),
  target: a.getAttribute('target'),
  rel: a.getAttribute('rel'),
})).filter((l) => l.href && (/asif|instagram|mailto/i.test(l.href) || /asif/i.test(l.text))));

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await sleep(2500);
report.meta = await page.evaluate(() => ({
  title: document.title,
  author: document.querySelector('meta[name="author"]')?.content,
  creator: document.querySelector('meta[name="creator"]')?.content,
  developer: document.querySelector('meta[name="developer"]')?.content,
  description: document.querySelector('meta[name="description"]')?.content?.slice(0, 130),
  relAuthor: document.querySelector('link[rel="author"]')?.href,
}));
report.homeText = await page.evaluate(() => {
  const text = document.body.innerText;
  return {
    hasName: /\bAsif\b/.test(text),
    hasRole: /creator/i.test(text),
    hasPortfolio: text.includes('asif4517-git.github.io'),
    hasInstagram: text.includes('@asif_xrk'),
    hasEmail: text.includes('asifsrk4517@gmail.com'),
  };
});
report.homeLinks = await inspectLinks();
await page.screenshot({ path: 'screenshots/11-home-credit.png', fullPage: false });
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('button')).find((b) => /about the developer/i.test(b.textContent || ''));
  el?.scrollIntoView({ block: 'center' });
});
await sleep(400);
await page.screenshot({ path: 'screenshots/12-home-credit-close.png' });

// About page via home credit
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => /about the developer/i.test(b.textContent || ''))?.click());
await sleep(900);
report.aboutPage = await page.evaluate(() => ({
  heading: document.querySelector('main h1')?.innerText?.replace(/\s+/g, ' '),
  containsName: /\bAsif\b/.test(document.body.innerText),
  containsRole: /creator/i.test(document.body.innerText),
  containsPortfolio: document.body.innerText.includes('asif4517-git.github.io'),
  containsInstagram: document.body.innerText.includes('@asif_xrk'),
  containsEmail: document.body.innerText.includes('asifsrk4517@gmail.com'),
  aboutNavActive: Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.trim() === 'About'),
}));
report.aboutLinks = await inspectLinks();
await page.screenshot({ path: 'screenshots/13-about-page.png' });

// External URLs reachability
report.linkChecks = {};
for (const [key, url] of Object.entries(EXPECTED)) {
  if (key === 'email') { report.linkChecks.email = { url, valid: url === 'mailto:asifsrk4517@gmail.com' }; continue; }
  try {
    const res = await page.evaluate(async (u) => {
      const r = await fetch(u, { method: 'GET', mode: 'no-cors' });
      return { ok: true, status: r.status };
    }, url);
    report.linkChecks[key] = { url, ...res };
  } catch (e) {
    report.linkChecks[key] = { url, error: e.message };
  }
}

// Settings → About tab
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Settings')?.click());
await sleep(800);
await page.evaluate(() => {
  const tab = Array.from(document.querySelectorAll('button')).find((b) => /^About/.test((b.textContent || '').trim()) && b.className.includes('w-full'));
  tab?.click();
});
await sleep(700);
report.settingsAbout = await page.evaluate(() => ({
  panelHeading: Array.from(document.querySelectorAll('h2')).map((h) => h.textContent).find((t) => /about the developer/i.test(t || '')) || null,
  textHasName: /\bAsif\b/.test(document.body.innerText),
  textHasEmail: document.body.innerText.includes('asifsrk4517@gmail.com'),
  textHasInstagram: document.body.innerText.includes('@asif_xrk'),
  textHasPortfolio: document.body.innerText.includes('asif4517-git.github.io'),
}));
report.settingsLinks = await inspectLinks();
await page.screenshot({ path: 'screenshots/14-settings-about.png' });

// Ensure racing still works after the additions
await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toUpperCase() === 'RACE')?.click());
await sleep(3400);
report.race = await page.evaluate(() => ({ engine: !!window.__NEON_RUSH__, canvas: !!document.querySelector('canvas'), phase: window.__NEON_RUSH__?.phase, hud: !!document.querySelector('.hud-layer') }));

report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await page.close();

// Mobile page in a clean tab
const mobilePage = await browser.newPage();
await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await mobilePage.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 2400));
const mobileHome = await mobilePage.evaluate(() => ({
  creditName: /CREATED & DEVELOPED BY/i.test(document.body.innerText) && /Asif/.test(document.body.innerText),
  creditLinks: Array.from(document.querySelectorAll('a')).filter((a) => /asif|instagram|mailto/i.test(a.getAttribute('href') || '')).map((a) => a.getAttribute('href')),
}));
await mobilePage.evaluate(() => {
  const home = Array.from(document.querySelectorAll('header nav button')).find((b) => /about/i.test(b.textContent || ''));
  home?.click();
});
await new Promise((r) => setTimeout(r, 900));
const mobile = await mobilePage.evaluate(() => ({
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  aboutVisible: /Created and developed by Asif|Built by Asif|created & developed by/i.test(document.body.innerText),
  emailLink: Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === 'mailto:asifsrk4517@gmail.com'),
  portfolioLink: Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === 'https://asif4517-git.github.io/'),
  instagramLink: Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === 'https://instagram.com/asif_xrk'),
}));
await mobilePage.screenshot({ path: 'screenshots/15-mobile-about.png' });
console.log(JSON.stringify({ mobileHome, mobile }, null, 2));
await mobilePage.close();
await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
