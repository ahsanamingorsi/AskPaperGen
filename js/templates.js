/* ---------- templates ---------- */
let filt='All',q='';const CATS=['School','College','University','Quiz','MCQ','Mid Term','Final','Urdu'];
const myT=()=>LS.get('apg_tpl',[]),allT=()=>[...BUILTIN,...myT().map(t=>({...t,mine:true}))];
function drawTpl(){setTimeout(fitThumbs,0);$('#chips').innerHTML=['All',...CATS,'My Templates'].map(c=>`<span class="chip ${c===filt?'on':''}" data-c="${c}">${c}</span>`).join('');
const list=allT().filter(t=>(filt==='All'||(filt==='My Templates'?t.mine:t.cat===filt))&&(t.name+t.desc+t.cat).toLowerCase().includes(q.toLowerCase()));
$('#tgrid').innerHTML=list.map(t=>`<div class="glass tc" data-id="${t.id}"><div class="th">${render(fromTpl(t))}</div><b>${esc(t.name)}</b><br><small>${t.cat} · ${t.mine?'Modified '+new Date(t.mod).toLocaleDateString():'Built-in'}</small><div class="acts"><button class="btn s p" data-a="use">Use Template</button><button class="btn s" data-a="pv">Preview</button>${t.mine?'<button class="btn s" data-a="ed">Edit</button>':''}<button class="btn s" data-a="dup">Duplicate</button>${t.mine?'<button class="btn s d" data-a="del">Delete</button>':''}</div></div>`).join('')||(filt==='My Templates'?'<div class="empty" style="grid-column:1/-1">You have no custom templates yet.<br><br><button class="btn p" onclick="openDesigner()">+ Create New Template</button></div>':'<div class="empty" style="grid-column:1/-1">No templates match.</div>')}
/* Scale each A4 template thumbnail to its card width so it never leaves a gap or overflows (any screen size). */
function fitThumbs(){$$('#tgrid .th').forEach(th=>{const pv=th.firstElementChild;if(!pv||!pv.classList.contains('pv'))return;pv.style.transform='';const sc=th.clientWidth/pv.offsetWidth;pv.style.transform=`scale(${sc})`;pv.style.transformOrigin='0 0';th.style.height=Math.round(Math.min(pv.offsetHeight,620)*sc)+'px'})}
addEventListener('resize',fitThumbs);document.fonts&&document.fonts.ready.then(fitThumbs);
function initTpl(){$('#chips').onclick=e=>{if(e.target.dataset.c){filt=e.target.dataset.c;drawTpl()}};$('#tq').oninput=e=>{q=e.target.value;drawTpl()};
$('#tgrid').onclick=e=>{const a=e.target.dataset.a,c=e.target.closest('.tc');if(!a)return;const t=allT().find(x=>x.id===c.dataset.id);
if(a==='use')useTemplate(t);if(a==='pv')openPrev(fromTpl(t),t);if(a==='ed')openDesigner(t);
if(a==='dup'){const l=myT();l.push({...clone({...t,items:typeof t.items==='function'?t.items():t.items}),id:uid(),name:t.name+' (Copy)',builtin:false,mine:undefined,mod:Date.now()});LS.set('apg_tpl',l);drawTpl();toast('Duplicated to My Templates')}
if(a==='del'&&confirm('Delete template “'+t.name+'”? This cannot be undone.')){LS.set('apg_tpl',myT().filter(x=>x.id!==t.id));drawTpl();toast('Template deleted')}};drawTpl()}

function useTemplate(t){LS.set('apg_paper',fromTpl(t));sessionStorage.setItem('apg_msg','Template “'+t.name+'” loaded');location.href='generator.html'}
initTpl();
