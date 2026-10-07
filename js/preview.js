/* Preview and controls; rendering is shared with the export service. */
function render(p){return APGRender(p)}
/* ---------- controls ---------- */
const HS=[['classic', 'Classic'], ['banner', 'Solid Banner'], ['gradient', 'Gradient Glass'], ['split', 'Split Bar'], ['ribbon', 'Ribbon'], ['modern', 'Accent Edge'], ['seal', 'Ornament']];
const SF=[['hstyle','Header design','sel',HS],['logo','School logo','img'],['logoShape','Logo shape','sel',[['circle','Circle'],['rounded','Rounded'],['square','Square'],['original','Original (no crop)']]],['logoSize','Logo size','rng',30,140],['logoPos','Logo position','sel',[['top','Above title'],['left','Left of title'],['right','Right of title']]],['logoBorder','Logo border','sel',[['accent','Accent'],['primary','Primary'],['white','White'],['none','None']]],['font','Font family','sel',[['Georgia,serif','Georgia'],['"Times New Roman",serif','Times New Roman'],['Arial,sans-serif','Arial'],['Inter,Arial,sans-serif','Modern Sans'],['"Noto Nastaliq Urdu","Jameel Noori Nastaleeq",serif','Urdu Nastaliq'],['"Courier New",monospace','Mono']]],['size','Font size','rng',9,20],['head','Heading size','rng',12,26],['qsize','Question size','rng',9,20],['line','Line spacing','rng',1,2.4,.05],['align','Text alignment','sel',['left','center','right','justify']],['page','Page size','sel',['A4','Letter']],['orient','Orientation','sel',['portrait','landscape']],['margin','Margins (mm)','rng',5,30]];
const DF=[['order','Title position','sel',[['inst','Institution first'],['exam','Exam title first']]],['hdr','Header alignment','sel',['center','left','right']],['hgap','Header spacing','rng',0,40],['hborder','Border style','sel',['bottom','box','double','none']],['pr','Primary color','col'],['ac','Accent color','col'],['tx','Text color','col'],['bd','Border color','col'],['qstyle','Question style','sel',[['numbered','Numbered'],['lettered','Lettered'],['boxed','Boxed'],['under','Underlined'],['minimal','Minimal']]],['sstyle','Section style','sel',[['simple','Simple heading'],['box','Box heading'],['color','Colored heading'],['under','Underlined heading']]]];
const MF=[['inst','Institution Name'],['exam','Exam Name'],['subject','Subject'],['cls','Class'],['marks','Total Marks'],['time','Time Allowed'],['date','Date','date'],['teacher','Teacher Name'],['code','Paper Code']];
function ctl(f,val,grp){const[k,l,t,a,b,st]=f,d=`data-g="${grp}" data-k="${k}"`;let c;
if(t==='sel')c=`<select ${d}>${a.map(o=>{const[v,n]=Array.isArray(o)?o:[o,o];return`<option value="${esc(v)}" ${v==val?'selected':''}>${n}</option>`}).join('')}</select>`;
else if(t==='rng')c=`<input type="range" ${d} min="${a}" max="${b}" step="${st||1}" value="${val}">`;
else if(t==='col')c=`<input type="color" ${d} value="${val}">`;
else if(t==='img')c=`<input type="file" accept="image/*" ${d}>${val?`<button class="btn s" data-clr="${k}" type="button">Remove logo</button>`:''}`;
else c=`<input ${d} type="${t||'text'}" value="${esc(val)}">`;return`<label class="f">${l}</label>${c}`}
function bind(root,get,fn){root.oninput=e=>{const t=e.target,g=t.dataset.g;if(!g||t.type==='file')return;get()[g][t.dataset.k]=t.type==='range'?+t.value:t.value;fn(false)};
root.onchange=e=>{const t=e.target;if(t.type==='file'&&t.files[0]){const r=new FileReader();r.onload=()=>{get()[t.dataset.g][t.dataset.k]=r.result;fn(true)};r.readAsDataURL(t.files[0])}};
root.onclick=e=>{const k=e.target.dataset.clr;if(k){get().style[k]='';fn(true)}}}
let pt=null;
function openPrev(p,t){pt=t;$('#pb').innerHTML=render(p.meta?p:fromTpl(p));$('#pu').style.display=t?'':'none';$('#pm').classList.add('on')}
if($('#pm')){$('#pu').onclick=()=>pt&&useTemplate(pt);$('#pm').onclick=e=>{if(e.target.id==='pm')e.target.classList.remove('on')};
}

/* Scale an A4 .pv to fit its container (used by the template designer and preview modal). */
function fitBox(el,av){const pv=el&&el.querySelector('.pv');if(!pv||!pv.offsetWidth||!el.parentElement.clientWidth)return;const parent=getComputedStyle(el.parentElement),own=getComputedStyle(el);av=av||el.parentElement.clientWidth-parseFloat(parent.paddingLeft)-parseFloat(parent.paddingRight)-parseFloat(own.marginLeft)-parseFloat(own.marginRight);const sc=Math.min(1,Math.max(1,av)/pv.offsetWidth);pv.style.transform=sc<1?`scale(${sc})`:'';pv.style.transformOrigin='top left';el.style.width=pv.offsetWidth*sc+'px';el.style.height=pv.offsetHeight*sc+'px'}
{const _op=openPrev;openPrev=function(...a){_op(...a);fitBox($('#pb'),Math.min(innerWidth*.94,900)-34)}}
addEventListener('resize',()=>$('#pm')?.classList.contains('on')&&fitBox($('#pb'),Math.min(innerWidth*.94,900)-34));
