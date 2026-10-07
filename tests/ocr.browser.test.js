// Run: node tests/ocr.browser.test.js <directory containing playwright>
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
const {chromium}=require(process.argv[2]?path.join(process.argv[2],'playwright'):'playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.gz':'application/gzip','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file===root)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(error?'Not found':data)})});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({serviceWorkers:'allow',viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>console.error('Browser error:',e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/generator.html',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('PWA cache installation timed out')),30000))]));await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);
 const results=await page.evaluate(async()=>{
 const run=async(langs,lines)=>{const canvas=mkCv(1600,550),x=canvas.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,canvas.width,canvas.height);x.fillStyle='#000';x.font='48px Arial';lines.forEach((text,i)=>{x.direction=/[\u0600-\u06ff]/.test(text)?'rtl':'ltr';x.textAlign=x.direction==='rtl'?'right':'left';x.fillText(text,x.direction==='rtl'?1520:80,120+i*110)});const r=await Extraction.providers.local(canvas,{langs,mode:'printed',enh:false});canvas.width=canvas.height=0;return r};
 const english=await run('eng',['1. What is the capital of Pakistan?','2. Explain the water cycle.']);
 const urdu=await run('urd',['\u067e\u0627\u06a9\u0633\u062a\u0627\u0646 \u06a9\u0627 \u062f\u0627\u0631\u0627\u0644\u062d\u06a9\u0648\u0645\u062a \u0627\u0633\u0644\u0627\u0645 \u0622\u0628\u0627\u062f \u06c1\u06d2']);
 const mixed=await run('urd+eng',['Read the following questions.','\u067e\u0627\u06a9\u0633\u062a\u0627\u0646 \u06a9\u0627 \u062f\u0627\u0631\u0627\u0644\u062d\u06a9\u0648\u0645\u062a \u0627\u0633\u0644\u0627\u0645 \u0622\u0628\u0627\u062f \u06c1\u06d2','Explain the water cycle.']);
 SC.raw=mixed.text;SC.qs=parseDoc(mixed.text).items;SC.qs.forEach(q=>q.on=true);SC.meta={};vReview();return {english,urdu,mixed};
 });
 console.log(JSON.stringify(results,null,2));
 assert.match(results.english.text,/capital of Pakistan/i);assert.match(results.english.text,/water cycle/i);
 assert.match(results.urdu.text,/\u067e\u0627\u06a9\u0633\u062a\u0627\u0646/);
 assert.match(results.mixed.text,/water cycle/i);assert.match(results.mixed.text,/\u067e\u0627\u06a9\u0633\u062a\u0627\u0646/);
 await page.evaluate(()=>$('#sm').classList.add('on'));
 await page.locator('[data-act=selecttext]').click();const selection=await page.locator('#raw').evaluate(e=>({start:e.selectionStart,end:e.selectionEnd,length:e.value.length}));assert.equal(selection.start,0);assert.equal(selection.end,selection.length);
 const original=await page.locator('#raw').inputValue();await page.locator('[data-act=addtext]').click();assert.equal(await page.evaluate(()=>paper.items.at(-1).text),original.trim());
 console.log('PASS offline mobile English, Urdu, mixed-language OCR, Select All and Add All Text');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
