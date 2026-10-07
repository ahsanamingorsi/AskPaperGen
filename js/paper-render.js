/* Shared renderer used by local previews and authenticated server exports. */
(function(root){
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* ---------- render ---------- */
function render(p){const s=p.style,m=p.meta,pg=s.page==='Letter'?[215.9,279.4]:[210,297],[w,h]=s.orient==='landscape'?[pg[1],pg[0]]:pg;
let n=0;const lt=i=>String.fromCharCode(65+i%26);
const urduNum=value=>String(value).replace(/[0-9]/g,d=>String.fromCharCode(0x06f0+Number(d)));
const num=i=>s.rtl?'\u0633\u0648\u0627\u0644 '+urduNum(i+1)+'\u06d4':s.qstyle==='lettered'?lt(i)+'.':'Q'+(i+1)+'.';
const body=p.items.map(it=>{const sk=s.rtl?'':'';
if(it.type==='section')return`<div class="sec sec-${s.sstyle}"><span>${esc(it.title)}</span>${it.marks?`<span>(${esc(it.marks)})</span>`:''}</div>${it.instr?`<div class="si">${esc(it.instr)}</div>`:''}`;
if(it.type==='instr')return`<div class="ins">${esc(it.text)}</div>`;
if(it.type==='table')return`<table class="tb">${it.rows.map(r=>`<tr>${r.map(c=>`<td style="text-align:${it.align||'left'}">${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`;
if(it.type==='image')return it.src?`<img class="im" src="${esc(it.src)}">`:'';
const i=n++;let x=`<div class="qb"><div style="font-size:${s.qsize}px"><b>${num(i)}</b> <bdi>${esc(it.text)}</bdi></div>`;
if(it.type==='mcq')x+=`<div class="opts">${it.opts.map((o,k)=>`<div>(${lt(k).toLowerCase()}) <bdi>${esc(o)}</bdi></div>`).join('')}</div>`;
if(it.type==='long')x+=Array.from({length:+it.lines||0},()=>'<div class="ln"></div>').join('');
return`<div class="q">${x}</div>${it.marks?`<span class="qm">[${esc(it.marks)}]</span>`:''}</div>`.replace('</div></div>${','</div>${')}).join('');
const ttl=[`<div class="inst" style="font-size:${s.head+5}px">${esc(m.inst)}</div>`,`<div class="exam" style="font-size:${s.head}px">${esc(m.exam)}</div>`];if(s.order==='exam')ttl.reverse();
const labels=s.rtl?["مضمون","جماعت","وقت","کل نمبر","تاریخ","پرچہ کوڈ","استاد"]:['Subject','Class','Time','Total Marks','Date','Paper Code','Teacher'];
const mt=[m.subject,m.cls,m.time,m.marks,m.date,m.code,m.teacher].map((value,i)=>[labels[i],value]).filter(a=>a[1]).map(a=>`<div><b>${a[0]}:</b> <bdi>${esc(a[1])}</bdi></div>`).join('');
const lsz=s.logoSize||64,shp=s.logoShape||'circle',bc={none:'none',accent:`3px solid ${s.ac}`,primary:`3px solid ${s.pr}`,white:'3px solid #fff'}[s.logoBorder||'accent'],li=s.logo?`<img class="logo2" src="${esc(s.logo)}" alt="logo" style="width:${lsz}px;height:${lsz}px;object-fit:${shp==='original'?'contain':'cover'};border-radius:${shp==='circle'?'50%':shp==='rounded'?'14%':'0'};border:${shp==='original'?'none':bc};flex:none">`:'',side=li&&(s.logoPos==='left'||s.logoPos==='right'),first=(s.logoPos==='left')!==!!s.rtl;
return`<div class="pv qs-${s.qstyle==='boxed'?'box':s.qstyle==='under'?'under':s.qstyle==='minimal'?'min':'num'}" dir="${s.rtl?'rtl':'ltr'}" style="--pr:${s.pr};--ac:${s.ac};--tx:${s.tx};--bd:${s.bd};--hs:${s.head}px;width:${w}mm;min-height:${h}mm;padding:${s.margin}mm;font:${s.size}px/${s.line} ${esc(s.font)};text-align:${s.align}"><div class="hd ${s.hborder} hs-${s.hstyle}${side?' lgs':''}" style="text-align:${s.hdr};margin-bottom:${s.hgap}px">${side&&first?li:''}${!side&&li?li+'<br>':''}<div class="ht">${ttl.join('')}</div>${side&&!first?li:''}</div><div class="mt">${mt}</div>${body||'<div class="empty">No questions yet</div>'}</div>`}

root.APGRender=render;
})(globalThis);
