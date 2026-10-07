const fs=require('fs'),vm=require('vm'),assert=require('assert');
async function test(){
 const handlers={},deleted=[],cached=[],replies=[];
 const cache={addAll:async()=>{},match:async()=>({release:'old'}),put:async(...args)=>cached.push(args)};
 let network=0;
 const sw={self:{addEventListener:(k,f)=>handlers[k]=f,location:{origin:'https://example.com'},registration:{scope:'https://example.com/AskPaperGen/'},clients:{claim:async()=>{},matchAll:async()=>[]},skipWaiting:async()=>{replies.push('skip')}},caches:{open:async()=>cache,keys:async()=>['another-app','askpapergen-old', 'askpapergen-'+JSON.parse(fs.readFileSync('version.json')).build],delete:async k=>deleted.push(k)},fetch:async r=>{network++;assert.equal(r.cache,'no-store');return {fresh:true}},URL,Request,Response};
 vm.createContext(sw);vm.runInContext(fs.readFileSync('sw.js','utf8'),sw);
 let pending;handlers.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['askpapergen-old']);
 handlers.message({data:'SKIP_WAITING',waitUntil:p=>pending=p});await pending;assert(replies.includes('skip'));
 handlers.message({data:'GET_VERSION',source:{postMessage:m=>replies.push(m)}});assert.equal(replies.at(-1).build,JSON.parse(fs.readFileSync('version.json')).build);
 let response;handlers.fetch({request:new Request('https://example.com/AskPaperGen/js/app.js'),respondWith:p=>response=p});assert.deepEqual(await response,{release:'old'});assert.equal(network,0);assert.equal(cached.length,0);
 handlers.fetch({request:new Request('https://example.com/AskPaperGen/version.json'),respondWith:p=>response=p});assert.deepEqual(await response,{fresh:true});assert.equal(network,1);
 let handled=false;handlers.fetch({request:new Request('https://example.com/other-app/index.html'),respondWith:()=>handled=true});assert.equal(handled,false);
 const events={},docEvents={},toasts=[],elements={},timers=new Map();let timerId=0,updateCalls=0;
 const worker={state:'installing',listeners:new Set(),addEventListener:(k,f)=>worker.listeners.add(f),removeEventListener:(k,f)=>worker.listeners.delete(f)};
 const reg={waiting:null,installing:worker,update:async()=>{updateCalls++},addEventListener:(k,f)=>events[k]=f};
 const store=new Map();
 const ctx={navigator:{onLine:true,serviceWorker:{controller:{postMessage:()=>{}},register:async(u,o)=>{assert.equal(o.updateViaCache,'none');return reg},addEventListener:(k,f)=>events[k]=f}},location:{protocol:'https:',hostname:'example.com',reload:()=>{}},document:{readyState:'complete',hidden:false,addEventListener:(k,f)=>docEvents[k]=f,createElement:()=>({setAttribute:()=>{},classList:{add:()=>{}},remove:()=>{delete elements['#ubar']}}),body:{append:b=>{elements['#'+b.id]=b;elements['#upd']={};elements['#updx']={}}}},$:s=>elements[s],toast:m=>toasts.push(m),requestAnimationFrame:f=>f(),setTimeout:f=>{timers.set(++timerId,f);return timerId},clearTimeout:id=>timers.delete(id),setInterval:()=>{},addEventListener:(k,f)=>events[k]=f,sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},LS:{get:()=>true,set:()=>{}}};
 vm.createContext(ctx);const source=fs.readFileSync('js/app.js','utf8');vm.runInContext(source.slice(source.indexOf('let swReg=null')),ctx);
 for(let i=0;i<5;i++)await Promise.resolve();assert(updateCalls>0);assert(!toasts.some(t=>t.includes('latest version')));
 reg.waiting=worker;reg.installing=null;worker.state='installed';for(const listener of [...worker.listeners])listener();for(let i=0;i<5;i++)await Promise.resolve();assert(elements['#ubar'],'Prompt after delayed installation');
 delete elements['#ubar'];docEvents.visibilitychange();assert(elements['#ubar'],'Resume shows existing waiting update');
 worker.postMessage=m=>assert.equal(m,'SKIP_WAITING');elements['#upd'].onclick();assert.equal(store.get('apg_upd'),1);
 console.log('PASS delayed mobile update, resume prompt, update action, cache isolation, version freshness, and release cache consistency');
}
test().catch(e=>{console.error(e);process.exitCode=1});
