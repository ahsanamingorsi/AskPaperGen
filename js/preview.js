/* ---------- render ---------- */
function render(p){const s=p.style,m=p.meta,pg=s.page==='Letter'?[215.9,279.4]:[210,297],[w,h]=s.orient==='landscape'?[pg[1],pg[0]]:pg;
let n=0;const lt=i=>String.fromCharCode(65+i%26);
const urduNum=value=>String(value).replace(/[0-9]/g,d=>String.fromCharCode(0x06f0+Number(d)));
const num=i=>s.rtl?'\u0633\u0648\u0627\u0644 '+urduNum(i+1)+'\u06d4':s.qstyle==='lettered'?lt(i)+'.':'Q'+(i+1)+'.';
const body=p.items.map(it=>{const sk=s.rtl?'':'';
if(it.type==='section')return`<div class="sec sec-${s.sstyle}"><span>${esc(it.title)}</span>${it.marks?`<span>(${esc(it.marks)})</span>`:''}</div>${it.instr?`<div class="si">${esc(it.instr)}</div>`:''}`;
if(it.type==='instr')return`<div class="ins">${esc(it.text)}</div>`;
if(it.type==='table')return`<table class="tb">${it.rows.map(r=>`<tr>${r.map(c=>`<td style="text-align:${it.align||'left'}">${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`;
if(it.type==='image')return it.src?`<img class="im" src="${it.src}">`:'';
const i=n++;let x=`<div class="qb"><div style="font-size:${s.qsize}px"><b>${num(i)}</b> <bdi>${esc(it.text)}</bdi></div>`;
if(it.type==='mcq')x+=`<div class="opts">${it.opts.map((o,k)=>`<div>(${lt(k).toLowerCase()}) <bdi>${esc(o)}</bdi></div>`).join('')}</div>`;
if(it.type==='long')x+=Array.from({length:+it.lines||0},()=>'<div class="ln"></div>').join('');
return`<div class="q">${x}</div>${it.marks?`<span class="qm">[${esc(it.marks)}]</span>`:''}</div>`.replace('</div></div>${','</div>${')}).join('');
const ttl=[`<div class="inst" style="font-size:${s.head+5}px">${esc(m.inst)}</div>`,`<div class="exam" style="font-size:${s.head}px">${esc(m.exam)}</div>`];if(s.order==='exam')ttl.reverse();
const labels=s.rtl?["مضمون","جماعت","وقت","کل نمبر","تاریخ","پرچہ کوڈ","استاد"]:['Subject','Class','Time','Total Marks','Date','Paper Code','Teacher'];
const mt=[m.subject,m.cls,m.time,m.marks,m.date,m.code,m.teacher].map((value,i)=>[labels[i],value]).filter(a=>a[1]).map(a=>`<div><b>${a[0]}:</b> <bdi>${esc(a[1])}</bdi></div>`).join('');
const lsz=s.logoSize||64,shp=s.logoShape||'circle',bc={none:'none',accent:`3px solid ${s.ac}`,primary:`3px solid ${s.pr}`,white:'3px solid #fff'}[s.logoBorder||'accent'],li=s.logo?`<img class="logo2" src="${s.logo}" alt="logo" style="width:${lsz}px;height:${lsz}px;object-fit:${shp==='original'?'contain':'cover'};border-radius:${shp==='circle'?'50%':shp==='rounded'?'14%':'0'};border:${shp==='original'?'none':bc};flex:none">`:'',side=li&&(s.logoPos==='left'||s.logoPos==='right'),first=(s.logoPos==='left')!==!!s.rtl;
return`<div class="pv qs-${s.qstyle==='boxed'?'box':s.qstyle==='under'?'under':s.qstyle==='minimal'?'min':'num'}" dir="${s.rtl?'rtl':'ltr'}" style="--pr:${s.pr};--ac:${s.ac};--tx:${s.tx};--bd:${s.bd};--hs:${s.head}px;width:${w}mm;min-height:${h}mm;padding:${s.margin}mm;font:${s.size}px/${s.line} ${s.font};text-align:${s.align}"><div class="hd ${s.hborder} hs-${s.hstyle}${side?' lgs':''}" style="text-align:${s.hdr};margin-bottom:${s.hgap}px">${side&&first?li:''}${!side&&li?li+'<br>':''}<div class="ht">${ttl.join('')}</div>${side&&!first?li:''}</div><div class="mt">${mt}</div>${body||'<div class="empty">No questions yet</div>'}</div>`}
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
