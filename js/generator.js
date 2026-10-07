/* ---------- generator ---------- */
let paper=LS.get('apg_paper',null)||fromTpl(BUILTIN[0]);paper.style={...DS,...paper.style};
function save(){LS.set('apg_paper',paper);const s=$('#saved');s.textContent='● Saved locally';}
function refresh(){$('#gp').innerHTML=render(paper);$('#rtl').checked=!!paper.style.rtl;save();fit()}
function fit(){const c=$('#gen .center'),pv=$('#gp .pv');if(!pv||!c.clientWidth||!pv.offsetWidth)return;const cs=getComputedStyle(c),gp=$('#gp'),gs=getComputedStyle(gp),av=Math.max(1,c.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-parseFloat(gs.marginLeft)-parseFloat(gs.marginRight)),sc=Math.min(1,av/pv.offsetWidth);pv.style.transform=sc<1?`scale(${sc})`:'';pv.style.transformOrigin='top left';gp.style.height=pv.offsetHeight*sc+'px';gp.style.width=pv.offsetWidth*sc+'px'}
const TYPES=[['mcq','Add MCQ'],['short','Add Short Question'],['long','Add Long Question'],['section','Add Section'],['table','Add Table'],['image','Add Image'],['instr','Add Instructions']];
function newItem(t){return({mcq:()=>mcq('',"","","",""),short:()=>sh(''),long:()=>lg('',5,4),section:()=>sec('Section','',''),table:()=>({id:uid(),type:'table',rows:[['Heading','Heading'],['','']],align:'left'}),image:()=>({id:uid(),type:'image',src:''}),instr:()=>ins('')})[t]()}
function listHTML(){let n=0;const f=(k,v,ph,ta)=>ta?`<textarea dir="auto" data-k="${k}" placeholder="${ph}">${esc(v)}</textarea>`:`<input dir="auto" data-k="${k}" value="${esc(v)}" placeholder="${ph}">`;
if(!paper.items.length)return'<div class="empty">No content yet.<br>Use the tools above to add questions.</div>';
return paper.items.map(it=>{const q=['mcq','short','long'].includes(it.type);if(q)n++;let b='';const mk=`<label class="f">Marks</label><input type="number" data-k="marks" value="${esc(it.marks)}">`;
if(it.type==='mcq')b=f('text',it.text,'Question text',1)+it.opts.map((o,i)=>`<input dir="auto" data-o="${i}" value="${esc(o)}" placeholder="Option ${'ABCD'[i]}" style="margin-top:4px">`).join('')+mk;
if(it.type==='short')b=f('text',it.text,'Question text',1)+mk;
if(it.type==='long')b=f('text',it.text,'Question text',1)+`<div class="row2"><div>${mk}</div><div><label class="f">Answer lines</label><input type="number" data-k="lines" value="${it.lines||0}"></div></div>`;
if(it.type==='section')b=f('title',it.title,'Section title')+f('instr',it.instr,'Instructions')+`<label class="f">Marks (optional)</label><input data-k="marks" value="${esc(it.marks)}">`;
if(it.type==='instr')b=f('text',it.text,'General instructions',1);
if(it.type==='table')b=`<table class="te">${it.rows.map((r,ri)=>`<tr>${r.map((c,ci)=>`<td><input data-r="${ri}" data-c="${ci}" value="${esc(c)}"></td>`).join('')}</tr>`).join('')}</table><div class="acts"><button class="btn s" data-a="ar">+Row</button><button class="btn s" data-a="dr">−Row</button><button class="btn s" data-a="ac">+Col</button><button class="btn s" data-a="dc">−Col</button><select data-k="align" style="width:auto"><option ${it.align=='left'?'selected':''}>left</option><option ${it.align=='center'?'selected':''}>center</option><option ${it.align=='right'?'selected':''}>right</option></select></div>`;
if(it.type==='image')b=`<input type="file" accept="image/*" data-img="1">${it.src?'<img src="'+it.src+'" style="max-width:100%;max-height:80px;margin-top:6px">':''}`;
const lbl={mcq:'MCQ',short:'Short',long:'Long',section:'Section',instr:'Instructions',table:'Table',image:'Image'}[it.type];
return`<div class="item" draggable="false" data-id="${it.id}"><div class="ih"><span class="h" title="Drag to reorder">⠿</span>${q?'Q'+n+' · ':''}${lbl}<span class="sp"><button class="btn s" data-a="up" title="Move up">↑</button><button class="btn s" data-a="dup" title="Duplicate">⎘</button><button class="btn s d" data-a="del" title="Delete">✕</button></span></div>${b}</div>`}).join('')}
function drawList(){$('#list').innerHTML=listHTML();$('#cnt').textContent='('+paper.items.length+')'}
function drawSettings(){$('#meta').innerHTML=MF.map(f=>ctl([f[0],f[1],f[2]||'text'],paper.meta[f[0]],'meta')).join('');$('#sty').innerHTML='<h3>Layout</h3>'+SF.map(f=>ctl(f,paper.style[f[0]],'style')).join('')}
function initGen(){$('#tools').innerHTML=TYPES.map(t=>`<button class="btn" data-add="${t[0]}">＋ ${t[1].replace('Add ','')}</button>`).join('');
$('#tools').onclick=e=>{const t=e.target.dataset.add;if(t){paper.items.push(newItem(t));drawList();refresh();$('#list').lastElementChild?.scrollIntoView({behavior:'smooth'})}};
const L=$('#list'),find=e=>{const c=e.target.closest('[data-id]');return c&&paper.items.find(i=>i.id===c.dataset.id)};
L.oninput=e=>{const it=find(e),t=e.target;if(!it)return;if(t.dataset.o!=null)it.opts[t.dataset.o]=t.value;else if(t.dataset.r!=null)it.rows[t.dataset.r][t.dataset.c]=t.value;else if(t.dataset.k)it[t.dataset.k]=t.value;refresh()};
L.onchange=e=>{const t=e.target,it=find(e);if(t.dataset.img&&t.files[0]){const r=new FileReader();r.onload=()=>{it.src=r.result;drawList();refresh()};r.readAsDataURL(t.files[0])}};
L.onclick=e=>{const a=e.target.dataset.a,it=find(e);if(!a||!it)return;const i=paper.items.indexOf(it);
if(a==='del')paper.items.splice(i,1);if(a==='dup')paper.items.splice(i+1,0,{...clone(it),id:uid()});if(a==='up'&&i>0)[paper.items[i-1],paper.items[i]]=[paper.items[i],paper.items[i-1]];
if(a==='ar')it.rows.push(it.rows[0].map(()=>''));if(a==='dr'&&it.rows.length>1)it.rows.pop();if(a==='ac')it.rows.forEach(r=>r.push(''));if(a==='dc'&&it.rows[0].length>1)it.rows.forEach(r=>r.pop());drawList();refresh()};
let drag=null;L.addEventListener('mousedown',e=>{const c=e.target.closest('.item');if(c)c.draggable=!!e.target.closest('.h')});
L.addEventListener('dragstart',e=>{drag=e.target.closest('.item')?.dataset.id;e.dataTransfer.effectAllowed='move'});
L.addEventListener('dragover',e=>{e.preventDefault();$$('.over',L).forEach(x=>x.classList.remove('over'));e.target.closest('.item')?.classList.add('over')});
L.addEventListener('drop',e=>{e.preventDefault();const to=e.target.closest('.item')?.dataset.id;if(!drag||!to||drag===to)return;const a=paper.items.findIndex(i=>i.id===drag),[x]=paper.items.splice(a,1);paper.items.splice(paper.items.findIndex(i=>i.id===to),0,x);drawList();refresh()});
L.addEventListener('dragend',()=>$$('.item').forEach(x=>{x.classList.remove('over');x.draggable=false}));
const P=$('.rp');bind(P,()=>paper,r=>{if(r)drawSettings();refresh()});$('#rtl').onchange=e=>{paper.style.rtl=e.target.checked;if(paper.style.rtl&&!/Nastaliq|Naskh/.test(paper.style.font))paper.style.font=SF.find(f=>f[0]==='font')[3].find(o=>o[1]==='Urdu Nastaliq')[0];drawSettings();refresh()};
$('#togR').onclick=()=>{if(innerWidth<=900)$('.tabs button[data-t=settings]').click();else if(innerWidth<=1200)P.classList.toggle('open');else $('#gen').classList.toggle('hide-r');setTimeout(fit,80)};
$$('.tabs button').forEach(b=>b.onclick=()=>{$('#gen').dataset.t=b.dataset.t;$$('.tabs button').forEach(x=>x.classList.toggle('on',x===b));requestAnimationFrame(fit)});
addEventListener('resize',fit);if('ResizeObserver' in window)new ResizeObserver(()=>requestAnimationFrame(fit)).observe($('#gen .center'));document.fonts?.ready.then(fit);const close=document.createElement('button');close.className='btn drawer-close';close.textContent='Close Settings';close.onclick=()=>P.classList.remove('open');P.prepend(close);drawList();drawSettings();refresh()}
function loadPaper(p){paper=p;drawList();drawSettings();refresh()}
function newPaper(){loadPaper({meta:{...DM},style:{...DS},items:[]})}
function clearPaper(){if(confirm('Clear the whole paper?'))newPaper()}
function saveDraft(){const d=LS.get('apg_drafts',[]);d.unshift({t:new Date().toLocaleString(),p:clone(paper)});LS.set('apg_drafts',d.slice(0,10));toast('Draft saved locally')}
function loadDraft(){const d=LS.get('apg_drafts',[]);if(!d.length)return toast('No drafts yet');loadPaper(clone(d[0].p));toast('Loaded draft from '+d[0].t)}

initGen();
{const q=new URLSearchParams(location.search),m=sessionStorage.getItem('apg_msg');
if(q.has('new'))newPaper();if(m){sessionStorage.removeItem('apg_msg');toast(m)}if(q.has('scan'))openScan();if(q.size)history.replaceState(null,'','generator.html')}

function exportJson(){const b=new Blob([JSON.stringify({app:'askpapergen',v:1,paper},null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(paper.meta.subject||'paper').replace(/\W+/g,'-')+'.askpapergen.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Paper exported')}
$('#imp').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const j=JSON.parse(t),p=j.paper||j;if(!p.items||!p.meta)throw 0;p.style={...DS,...p.style};p.items.forEach(i=>i.id=uid());loadPaper(p);toast('Paper imported')}catch{toast('That file is not a valid AskPaperGen paper')}});e.target.value=''};
