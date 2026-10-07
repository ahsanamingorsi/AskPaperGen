/* Smart question parser: raw OCR / typed text -> {meta, items}. Pure functions (no DOM) so it can be unit-tested in Node.
   items: {type:'section'|'instr'|'mcq'|'short'|'long'|'tf'|'fill', text, sub, opts[4], marks, sure}
   Understands: numbering (5) 1- Q.1 Question No-1 سوال ۱), options (a) a) a- a, a or inline "a) x  b) y", section headings
   (Section A, Objective, Short Questions, حصہ), instructions, paper details (Paper English, Class 9th, Time, Marks), lost question numbers. */
const toEn=s=>s.replace(/[٠-٩]/g,d=>d.charCodeAt(0)-1632).replace(/[۰-۹]/g,d=>d.charCodeAt(0)-1776);
const DG='0-9٠-٩۰-۹',URD={'الف':0,'ب':1,'ج':2,'د':3},oi=k=>URD[k]!==undefined?URD[k]:k.toLowerCase().charCodeAt(0)-97;
const QP=/^(?:Q(?:uestion)?|سوال(?:\s*نمبر)?)\s*[.:#-]?\s*(?:No\.?\s*[.:#-]?\s*)?\(?([0-9٠-٩۰-۹]{1,3})\s*[.)\-:۔،]?(?![0-9٠-٩۰-۹])\s*(.*)$/i,QN=/^\(?([0-9٠-٩۰-۹]{1,3})\s*[.)\-:۔،](?![0-9٠-٩۰-۹])\s*(.*)$/,qmatch=l=>l.match(QP)||l.match(QN);
const OPL=/^\(?\s*([a-dA-D]|الف|ب|ج|د)\s*[).:\-,]\s*(.*)$/,OPLOOSE=/^\(?([a-dA-D])\)?\s+(?=[A-Z0-9"'“])(.*)$/;
const INSTR=/^(attempt|answer|read|fill|note|instructions?|time|all questions|do not|tick|encircle|circle|solve|choose the correct|ہدایات|نوٹ)/i;
const CUES=[['tf',/true\s*(?:or|\/|-)\s*false|\bT\s*\/\s*F\b|صحیح\s*یا\s*غلط|درست\s*یا\s*غلط/i],['fill',/_{2,}|\.{4,}|…|خالی\s*جگہ|fill in the blank/i]];
const LONGQ=/\b(explain|describe|discuss|elaborate|differentiate|compare|essay|passage|paragraph|letter|application|story|summar\w*|translate|comprehension)\b|تفصیل|مضمون|وضاحت|خط|درخواست|کہانی|خلاصہ/i;
const junk=l=>/^[^\p{L}\p{N}]*$/u.test(l)||/^(?:date|day)\s*[:\-]?[\s_.\-]*(?:(?:date|day)\s*[:\-]?[\s_.\-]*)?$/i.test(l);
function metaLine(l,m){let x,h=false;
 if(x=l.match(/^paper\s*[:\-]?\s*([^\d:]+?)(?:\s+(?:class|grade)\s*[:\-]?\s*(\S+))?\s*$/i)){m.subject=x[1].trim();if(x[2])m.cls=x[2];h=true}
 else if(x=l.match(/^(?:subject|مضمون)\s*[:\-]\s*(.+)$/i)){m.subject=x[1].trim();h=true}
 else if(x=l.match(/^(?:class|grade|جماعت)\s*[:\-]?\s*(\S{1,10})\s*$/i)){m.cls=x[1];h=true}
 else if(l.length<48&&(x=l.match(/\btime(?:\s*allowed)?\s*[:\-]\s*(.+?)(?=\s+(?:total\s*)?marks\b|$)/i))){m.time=x[1].trim();h=true;const y=l.match(/marks\s*[:\-]?\s*(\d+)/i);if(y)m.marks=y[1]}
 else if(x=l.match(/^(?:total\s*)?marks\s*[:\-]\s*(\d+)/i)){m.marks=x[1];h=true}
 else if(x=l.match(/^(?:teacher|name of teacher)\s*[:\-]\s*(.+)$/i)){m.teacher=x[1].trim();h=true}
 return h}
function heading(l){let x,m='';const mk=s=>{const y=s.match(/[\[(]\s*(\d+)\s*(?:marks?)?\s*[\])]/i);if(y){m=y[1];return s.replace(y[0],'').trim()}return s};
 if(x=l.match(/^(?:section|part|portion)\s*[-:]?\s*([A-Da-d]|[1-9]|iv|v|i{1,3})\b\s*[:.\-–—]*\s*(.*)$/i)){const s=mk(x[2]);return{t:'Section '+x[1].toUpperCase(),s,m}}
 if(x=l.match(/^(?:حصہ|سیکشن)\s*(\S+)\s*[:\-–]?\s*(.*)$/)){const s=mk(x[2]);return{t:'حصہ '+x[1],s,m}}
 if(x=l.match(/^(objective|subjective|mcqs?|multiple\s*choice(?:\s*questions?)?|short\s*(?:answer\s*)?questions?|long\s*(?:answer\s*)?questions?|essay\s*type|reading\s*comprehension|comprehension|grammar|vocabulary)\s*(?:type)?\s*[:.\-–—]*\s*(.*)$/i)){
  if(!/\?/.test(l)&&x[2].split(/\s+/).filter(Boolean).length<=6){const s=mk(x[2]),k=x[1].replace(/\s+/g,' ');return{t:/^mcq/i.test(k)?'MCQs':k.replace(/^./,c=>c.toUpperCase()),s,m}}}
 if(x=l.match(/^(معروضی|موضوعی|کثیر الانتخابی|مختصر سوالات|تفصیلی سوالات)\s*[:\-–]?\s*(.*)$/)){const s=mk(x[2]);return{t:x[1],s,m}}
 return null}
/* "a) x  b) y  c) z": split a line that holds 2+ ascending option markers */
function splitOpts(l){const re=/(?:^|\s)\(?([a-dA-D]|الف|ب|ج|د)\s*[).\-:,]\s+(?=\S)/g,h=[];let m,last=-1;while((m=re.exec(l))){const k=oi(m[1]);if(k>last){h.push({k,s:m.index+m[0].search(/\S/),e:m.index+m[0].length});last=k}}
 if(h.length<2)return null;return{pre:l.slice(0,h[0].s).trim(),o:h.map((x,i)=>({k:x.k,t:l.slice(x.e,i+1<h.length?h[i+1].s:undefined).trim()}))}}
function classify(b){let t=b.t.trim(),m='';const mm=t.match(/[\[(]\s*([0-9٠-٩۰-۹]{1,2})\s*(?:marks?|نمبر(?:ات)?)?\s*[\])]\s*$/i);if(mm){m=toEn(mm[1]);t=t.slice(0,mm.index).trim()}
 const o=(b.o||[]).map(x=>x.trim()),n=o.filter(Boolean).length;let ty='short',sure=false;
 if(n>=2){ty='mcq';sure=true}else{const c=CUES.find(c=>c[1].test(t));if(c){ty=c[0];sure=true}else if(t.length>180||LONGQ.test(t))ty='long'}
 return{type:ty,text:t,sub:'',opts:[...o,'','','',''].slice(0,4),marks:m,sure}}
function parseDoc(raw){const meta={},L=[];for(let l of raw.replace(/\r/g,'').split('\n')){l=l.replace(/[ \t\u00a0]+/g,' ').replace(/^[|¦\\/]+\s*/,'').trim();if(l&&!junk(l))L.push(l)}
 const items=[];let c=null,lastI=null,seenQ=false;const flush=()=>{if(c){items.push(classify(c));c=null}},oc=()=>c.o.filter(Boolean).length,put=(k,t)=>{if(k<0||k>3)return;c.o[k]=c.o[k]?c.o[k]+' '+t:t;c.last=k};
 for(let i=0;i<L.length;i++){const l=L[i],nx=L[i+1]||'';let m;
  if(!seenQ&&!c&&metaLine(l,meta))continue;
  if(m=heading(l)){flush();items.push({type:'section',text:m.t,sub:m.s,opts:['','','',''],marks:m.m,sure:true});lastI=null;continue}
  const q=qmatch(l);
  if(q&&!q[2].trim()&&c){c.t+=(c.t?' ':'')+l;continue}
  if(q){flush();seenQ=true;lastI=null;c={t:'',o:['','','',''],last:-1};const so=splitOpts(q[2]);if(so){c.t=so.pre;so.o.forEach(x=>put(x.k,x.t))}else c.t=q[2];continue}
  let l2=l;if(c){const lo=l.match(OPLOOSE);if(lo&&!OPL.test(l)&&(oc()||/[?:]$|\b(?:is|are)$/i.test(c.t)||OPL.test(nx)||splitOpts(nx)))l2=lo[1]+') '+lo[2]}
  const so=splitOpts(l2);
  if(so&&c){if(so.pre){c.last>=0?(c.o[c.last]+=' '+so.pre):(c.t+=(c.t?' ':'')+so.pre)}so.o.forEach(x=>put(x.k,x.t));continue}
  const om=c&&l2.match(OPL);if(om){put(oi(om[1]),om[2]);continue}
  if(c){if(oc())c.o[c.last]+=' '+l;else c.t+=(c.t?' ':'')+l;continue}
  if(!INSTR.test(l)&&(splitOpts(nx)||OPL.test(nx))){seenQ=true;c={t:l,o:['','','',''],last:-1};continue}   /* question whose number was lost */
  if(lastI&&lastI.type==='instr')lastI.text+=' '+l;else{lastI={type:'instr',text:l,sub:'',opts:['','','',''],marks:'',sure:true};items.push(lastI)}}
 flush();return{meta,items}}
const parseText=raw=>parseDoc(raw).items;
