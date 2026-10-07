/* Accept only data that is safe to render in the browser or the paid PDF service. */
(function(root){
 const crest='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#0b1f4b"/><path d="M22 34l28-10 28 10v30l-28 10-28-10z" fill="#fff"/><path d="M50 24v50M26 38l24 9 24-9" stroke="#0b1f4b" stroke-width="3" fill="none"/><circle cx="50" cy="82" r="5" fill="#06b6d4"/></svg>');
 const fonts=['Georgia,serif','"Times New Roman",serif','Arial,sans-serif','Inter,Arial,sans-serif','"Noto Nastaliq Urdu","Jameel Noori Nastaleeq",serif','"Noto Nastaliq Urdu","Jameel Noori Nastaleeq","Noto Naskh Arabic","Segoe UI",serif','"Courier New",monospace'];
 const defaults={font:fonts[0],size:13,head:15,qsize:13,line:1.5,align:'left',page:'A4',orient:'portrait',margin:15,pr:'#000000',ac:'#000000',tx:'#000000',bd:'#000000',hstyle:'classic',logoShape:'circle',logoSize:64,logoPos:'top',logoBorder:'accent',hdr:'center',hborder:'bottom',hgap:8,order:'inst',qstyle:'numbered',sstyle:'simple',rtl:false,logo:''};
 const enums={font:fonts,align:['left','center','right','justify'],page:['A4','Letter'],orient:['portrait','landscape'],hstyle:['classic','banner','gradient','split','ribbon','modern','seal'],logoShape:['circle','rounded','square','original'],logoPos:['top','left','right'],logoBorder:['accent','primary','white','none'],hdr:['center','left','right'],hborder:['bottom','box','double','none'],order:['inst','exam'],qstyle:['numbered','lettered','boxed','under','minimal'],sstyle:['simple','box','color','under']};
 const numeric={size:[9,20],head:[12,26],qsize:[9,20],line:[1,2.4],margin:[5,30],logoSize:[30,140],hgap:[0,40]};
 const text=(v,max=5000)=>{if(v===null||v===undefined)return '';if(!['string','number'].includes(typeof v))throw Error('Invalid text');const t=String(v);if(t.length>max)throw Error('Text is too long');return t};
 function image(value){const v=text(value,1500000);if(!v||v===crest)return v;if(!/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(v))throw Error('Use an uploaded PNG, JPEG or WebP image');return v}
 root.APGValidatePaper=function(value){if(!value||!Array.isArray(value.items)||!value.meta||typeof value.meta!=='object'||value.items.length>200)throw Error('Invalid paper');if(JSON.stringify(value).length>4000000)throw Error('Paper is too large');
 const meta={};for(const key of ['inst','exam','subject','cls','marks','time','date','teacher','code'])meta[key]=text(value.meta[key],300);
 const style={...defaults},incoming=value.style||{};for(const [key,choices]of Object.entries(enums))if(incoming[key]!==undefined){if(!choices.includes(incoming[key]))throw Error('Invalid paper style');style[key]=incoming[key]}
 for(const [key,[min,max]]of Object.entries(numeric))if(incoming[key]!==undefined){const n=Number(incoming[key]);if(!Number.isFinite(n)||n<min||n>max)throw Error('Invalid paper size');style[key]=n}
 for(const key of ['pr','ac','tx','bd'])if(incoming[key]!==undefined){if(!/^#[0-9a-f]{6}$/i.test(incoming[key]))throw Error('Invalid color');style[key]=incoming[key]}
 style.rtl=!!incoming.rtl;style.logo=image(incoming.logo);
 const items=value.items.map((it,i)=>{if(!it||!['section','instr','table','image','mcq','short','long'].includes(it.type))throw Error('Invalid question type');const out={id:text(it.id||String(i),100),type:it.type};
 if(it.type==='section')Object.assign(out,{title:text(it.title),instr:text(it.instr),marks:text(it.marks,20)});
 else if(it.type==='image')out.src=image(it.src);
 else if(it.type==='table'){if(!Array.isArray(it.rows)||!it.rows.length||it.rows.length>50||it.rows.some(r=>!Array.isArray(r)||!r.length||r.length>12))throw Error('Invalid table');out.rows=it.rows.map(r=>r.map(c=>text(c,1000)));out.align=['left','right','center'].includes(it.align)?it.align:'left'}
 else{out.text=text(it.text);if(it.type!=='instr')out.marks=text(it.marks,20);if(it.type==='mcq'){if(!Array.isArray(it.opts)||it.opts.length>26)throw Error('Invalid options');out.opts=it.opts.map(o=>text(o,1000))}if(it.type==='long'){const lines=Number(it.lines||0);if(!Number.isInteger(lines)||lines<0||lines>30)throw Error('Invalid answer lines');out.lines=lines}}
 return out});return {meta,style,items};
 };
})(globalThis);
