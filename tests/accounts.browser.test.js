// Mock external identity/payment API; exercise the actual mobile frontend.
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
const {chromium}=require(path.join(process.argv[2]||'.','playwright'));
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname);fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html'});res.end(e?'missing':b)})});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',acceptDownloads:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const user={id:'user1',name:'Test Teacher',email:'test@example.com',points:0,isAdmin:true};let payments=[],exportRequests=new Set();
 await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.pathname==='/js/account-config.js')return route.fulfill({contentType:'application/javascript',body:'window.APG_ACCOUNT_CONFIG={apiUrl:"https://api.test"}'});
 if(url.hostname==='accounts.google.com')return route.fulfill({contentType:'application/javascript',body:'window.google={accounts:{id:{initialize(o){window.testGoogle=o},renderButton(e){e.innerHTML="<button id=mock-google>Test Google</button>";e.firstChild.onclick=()=>testGoogle.callback({credential:"test-token"})},disableAutoSelect(){}}}}'});
 if(url.hostname!=='api.test')return url.hostname==='127.0.0.1'?route.continue():route.abort();
 const data=route.request().postDataJSON(),json=body=>route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
 if(url.pathname==='/config')return json({enabled:true,googleClientId:'test',packages:[{id:'p10',points:10,amountPkr:200},{id:'p50',points:50,amountPkr:900},{id:'p100',points:100,amountPkr:1600}],paymentMethods:[{id:'jazzcash',label:'JazzCash',accountName:'Test Recipient',accountNumber:'03000000000'}]});
 if(url.pathname==='/auth/challenge')return json({id:'challenge',nonce:'nonce'});
 if(url.pathname==='/auth/google')return json({token:'test-session',user});
 if(url.pathname==='/me')return json({user});if(url.pathname==='/wallet')return json({user,payments,ledger:[]});
 if(url.pathname==='/payments'){assert.equal(data.packageId,'p50');payments=[{id:'payment1',name:user.name,email:user.email,method:data.method,transaction_reference:data.transactionReference,sender_name:data.senderName,points:50,amount_pkr:900,status:'pending'}];return json({message:'Pending approval'});}
 if(url.pathname==='/admin/payments')return json({payments:payments.filter(p=>p.status==='pending')});
 if(url.pathname==='/admin/payments/review'){assert.equal(data.confirmed,true);payments[0].status='approved';user.points=50;return json({});}
 if(url.pathname==='/exports'){if(!exportRequests.has(data.requestId)){exportRequests.add(data.requestId);user.points--;}return route.fulfill({headers:{'Content-Type':'application/json','X-Points-Balance':String(user.points)},body:JSON.stringify(data.paper)});}
 return json({});
 });
 const base='http://127.0.0.1:'+server.address().port;await page.goto(base+'/account.html');await page.locator('#account-signin').click();await page.locator('#mock-google').click();await page.locator('.point-total').waitFor();assert.equal(await page.locator('.point-total').textContent(),'0');
 await page.locator('[data-package=p50]').click();assert.match(await page.locator('#payment-destination').textContent(),/Rs900/);await page.locator('#payment-sender').fill('Test Teacher');await page.locator('#payment-reference').fill('TX12345');await page.locator('#payment-form button').click();await page.getByText('Pending approval',{exact:true}).waitFor();assert.equal(user.points,0);
 await page.goto(base+'/admin.html');await page.locator('[data-review=approve]').click();assert.match(await page.locator('#account-message').textContent(),/Verify/);await page.locator('[data-confirm]').check();await page.locator('[data-review=approve]').click();await page.getByText('Payment reviewed.',{exact:true}).waitFor();assert.equal(user.points,50);
 await page.goto(base+'/generator.html');await page.waitForFunction(()=>document.querySelector('#account-link').textContent.includes('50 points'));await page.evaluate(()=>{document.querySelector('#boot')?.remove();document.querySelector('#intro')?.remove()});
 for(let i=0;i<2;i++){const download=page.waitForEvent('download');await page.evaluate(()=>APGAccount.exportPaper(paper,'json'));await download;}assert.equal(user.points,49);assert.equal(exportRequests.size,1);
 await context.setOffline(true);await page.evaluate(()=>APGAccount.exportPaper(paper,'json'));assert.match(await page.locator('#toast').textContent(),/internet connection/);assert.equal(user.points,49);await context.setOffline(false);
 const rendered=await page.evaluate(()=>BUILTIN.map(t=>APGRender(APGValidatePaper(fromTpl(t)))));assert.equal(rendered.length,8);assert(rendered.some(html=>html.includes('سوال')));
 const pdfPage=await context.newPage();await pdfPage.setContent('<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0}'+fs.readFileSync(path.join(root,'css/preview.css'),'utf8')+'</style>'+rendered.find(html=>html.includes('سوال')));const pdf=await pdfPage.pdf({format:'A4',printBackground:true});assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert(pdf.length>10000);await pdfPage.close();
 assert.deepEqual(errors,[]);console.log('PASS mobile Google flow, packages, pending payment, admin approval, export retry, offline guard, all templates and local Urdu PDF rendering');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
