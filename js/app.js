/* App shell: navigation, footer, PWA install, landing page content */
const NAV=[['index.html','home','Home'],['generator.html','generator','Paper Generator'],['templates.html','templates','Templates'],['about.html','about','About'],['contact.html','contact','Contact']];
$('#nav').innerHTML=`<nav class="glass"><a href="index.html" class="logo"><img src="assets/icons/logo.svg" alt="" width="34" height="34">AskPaperGen</a><button class="btn" id="burger" aria-label="Menu">☰</button><div class="links">${NAV.map(n=>`<a class="l ${n[1]===PAGE?'on':''}" href="${n[0]}">${n[2]}</a>`).join('')}<button class="btn" data-install style="display:none">⬇ Install</button><a class="btn p" href="generator.html?new=1">Create Paper</a></div></nav>`;
$('#foot').innerHTML=`<img src="assets/icons/logo.svg" width="30" height="30" alt=""><p><b>AskPaperGen</b> — Create. Format. Print.</p><p>${NAV.slice(1).map(n=>`<a href="${n[0]}">${n[2]}</a>`).join(' · ')}</p><p>© AskPaperGen</p>`;
$('#burger').onclick=()=>$('nav .links').classList.toggle('open');
/* ---- landing ---- */
if(PAGE==='home'){
 const FE=['MCQs','Short Questions','Long Questions','Tables','Images','Urdu RTL Support','Custom Headers','Scan to Paper','Print Ready','PDF Export'],FD=['Unlimited options','Quick marks','With answer lines','Editable grids','From your device','Right-to-left layout','Logo & 7 header designs','Photo to question','A4 print CSS','Via browser dialog'];
 $('#feats').innerHTML=FE.map((f,i)=>`<div class="glass feat"><div class="ico">${i+1}</div><b>${f}</b><span>${FD[i]}</span></div>`).join('');
 $('#how').innerHTML=['Choose a template or start from scratch','Add, format or scan questions','Preview your paper','Print or save as PDF'].map((h,i)=>`<div class="glass feat"><div class="ico">${i+1}</div><b>${h}</b></div>`).join('');
 $('#mock').innerHTML=render(fromTpl(BUILTIN[1]));
 $('#hgal').innerHTML=HS.map(([v,n])=>`<div class="glass tc" style="cursor:pointer" data-h="${v}"><div class="th">${render({meta:{...DM,inst:'Horizon Academy',exam:'Annual Examination'},style:{...DS,hstyle:v,pr:'#1d4ed8',ac:'#06b6d4',bd:'#1d4ed8',font:'Inter,Arial,sans-serif'},items:[]})}</div><b>${n}</b></div>`).join('');
 $('#hgal').onclick=e=>{const c=e.target.closest('[data-h]');if(!c)return;const p=LS.get('apg_paper',null)||fromTpl(BUILTIN[0]);p.style={...DS,...p.style,hstyle:c.dataset.h};LS.set('apg_paper',p);location.href='generator.html'}}
/* ---- PWA ---- */
let dip=null;const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone,ios=/iphone|ipad|ipod/i.test(navigator.userAgent),muted=()=>LS.get('apg_inst',0)>Date.now();
function ibar(txt){if(standalone||muted()||$('#ibar'))return;const b=document.createElement('div');b.id='ibar';b.className='glass';b.innerHTML=`<img src="assets/icons/icon-192.png" alt=""><div><b>Install AskPaperGen</b>${txt}</div>${txt.includes('Share')?'':'<button class="btn p s" data-install>Install</button>'}<button class="btn s" id="inx">Not now</button>`;document.body.append(b);requestAnimationFrame(()=>b.classList.add('on'));$('#inx').onclick=()=>{LS.set('apg_inst',Date.now()+6048e5);b.classList.remove('on');setTimeout(()=>b.remove(),600)};$$('[data-install]',b).forEach(x=>x.onclick=installApp)}
async function installApp(){if(dip){dip.prompt();const r=await dip.userChoice;dip=null;$('#ibar')?.remove();r.outcome==='accepted'&&toast('AskPaperGen installed')}else toast(ios?'Tap Share, then “Add to Home Screen”':standalone?'AskPaperGen is already installed':'Open your browser menu and choose “Install app”')}
$$('[data-install]').forEach(b=>b.onclick=installApp);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;$$('nav [data-install]').forEach(b=>b.style.display='');setTimeout(()=>ibar('Works offline and opens in its own window.'),1500)});
addEventListener('appinstalled',()=>{$('#ibar')?.remove();toast('AskPaperGen installed')});
if(ios&&!standalone)setTimeout(()=>ibar('Tap Share, then “Add to Home Screen”.'),2500);
addEventListener('offline',()=>toast('You are offline — your papers are safe on this device'));addEventListener('online',()=>toast('Back online'));
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
