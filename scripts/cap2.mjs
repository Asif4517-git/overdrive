import puppeteer from 'puppeteer';
const b = await puppeteer.launch({headless:'shell',args:['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio']});
const p = await b.newPage(); await p.setViewport({width:1320,height:900}); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const sl=(ms)=>new Promise(r=>setTimeout(r,ms)); await p.goto('http://127.0.0.1:8090/#models',{waitUntil:'domcontentloaded'}); await sl(3000);
for (const [id,label] of [['swift','Swift'],['fortuner','Fortuner'],['m3','M3 Competition'],['f296','296 GTB']]) { await p.evaluate((n)=>{Array.from(document.querySelectorAll('aside button')).find(x=>(x.textContent||'').includes(n))?.click()}, label); await sl(1300); await p.screenshot({path:'screenshots/models/'+id+'-v2.png',clip:{x:285,y:170,width:1000,height:560}}); }
console.log(JSON.stringify(errs)); await p.close(); await Promise.race([b.close(),sl(3000)]); process.exit(0);
