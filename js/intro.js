/* Quick animated product demo: shown once after the welcome screen, and any time via "Watch demo". */
(function(){
const ST=[['Pick a template','Start from one of eight ready-made designs.'],['Add your questions','MCQs, short and long questions with live numbering.'],['Text Scanner','Snap a photo, extract the text, review and add it.'],['Style it your way','Header designs, colours, your logo and Urdu RTL.'],['Print or save as PDF','Pixel-perfect A4, ready in seconds.']];
let el=null,tm=[],ty;
const cls=(...c)=>c.forEach(x=>el&&el.classList.add('r-'+x)),unc=(...c)=>c.forEach(x=>el&&el.classList.remove('r-'+x)),at=(ms,f)=>tm.push(setTimeout(()=>el&&f(),ms));
function step(i){$('.ik',el).textContent='STEP '+(i+1)+' / 5';const h=$('h2',el),p=$('p',el);h.textContent=ST[i][0];p.textContent=ST[i][1];[h,p].forEach(e=>{e.style.animation='none';e.offsetHeight;e.style.animation=''});$$('.idots i',el).forEach((d,k)=>d.classList.toggle('on',k===i))}
function type(t,s){clearInterval(ty);let i=0;t.textContent='';t.classList.remove('done');ty=setInterval(()=>{t.textContent=s.slice(0,++i);if(i>=s.length){clearInterval(ty);t.classList.add('done')}},26)}
const esc=e=>e.key==='Escape'&&close();
function close(){tm.forEach(clearTimeout);clearInterval(ty);if(!el)return;const e=el;el=null;e.classList.remove('on');setTimeout(()=>e.remove(),500);document.removeEventListener('keydown',esc);document.body.style.overflow=''}
function play(){if(el)close();LS.set('apg_intro',1);tm=[];el=document.createElement('div');el.id='intro';el.setAttribute('role','dialog');el.setAttribute('aria-label','AskPaperGen quick demo');
 const tp=(i,n,bg)=>`<div class="itp${i===1?' mid':''}" style="--i:${i}"><i style="background:${bg}"></i><u></u><u></u><u></u><label>${n}</label></div>`;
 el.innerHTML=`<div class="ipg"><i></i></div><button class="isk">Skip ›</button><div class="ist"><div class="icap"><span class="ik"></span><h2></h2><p></p><div class="idots"><i></i><i></i><i></i><i></i><i></i></div></div>
<div class="isc"><div class="itpls">${tp(0,'Classic','#0b1f4b')+tp(1,'Modern Academic','linear-gradient(135deg,#1d4ed8,#06b6d4)')+tp(2,'Final Exam','#7f1d1d')}</div>
<div class="sheet isheet"><div class="sh-head" data-r="h"><span class="sh-logo"></span><div><b>HORIZON ACADEMY</b><small>Annual Examination 2026</small></div></div><div class="sh-meta" data-r="m"><span><b>Subject</b>Science</span><span><b>Class</b>Grade 9</span><span><b>Time</b>2 Hours</span><span><b>Marks</b>50</span></div><div class="sh-sec" data-r="s">SECTION A <em>(10)</em></div>
<div class="sh-q iq1" data-r="q1"><b>Q1.</b> <span class="ty"></span><div class="sh-o"><span>(a) Nucleus</span><span>(b) Ribosome</span><span>(c) Vacuole</span><span>(d) Membrane</span></div></div><div class="sh-q" data-r="q2"><b>Q2.</b> The chemical symbol for water is:<div class="sh-o"><span>(a) H₂O</span><span>(b) CO₂</span><span>(c) O₂</span><span>(d) NaCl</span></div></div><div class="sh-q iq3" data-r="q3"><b>Q3.</b> Define photosynthesis and write its equation. <em>scanned</em></div><div class="istamp">✓ READY TO PRINT</div></div>
<div class="iph"><i></i><i></i><i style="width:65%"></i><i></i><span class="sl"></span></div><span class="ichip c-rtl">Urdu RTL</span><span class="ichip c-pdf">⇩ Save as PDF</span></div></div>
<div class="ifin"><a class="btn p" href="generator.html?new=1">Create a Paper</a><a class="btn" href="templates.html">Explore Templates</a><button class="btn" data-replay>↻ Replay</button></div>`;
 document.body.append(el);document.body.style.overflow='hidden';document.addEventListener('keydown',esc);
 $('.isk',el).onclick=close;$('[data-replay]',el).onclick=play;$$('.ifin a',el).forEach(a=>a.onclick=()=>{document.body.style.overflow=''});
 requestAnimationFrame(()=>requestAnimationFrame(()=>el&&el.classList.add('on')));step(0);
 at(900,()=>cls('sel'));at(1700,()=>cls('sheet'));at(2000,()=>{step(1);cls('h','m')});at(2500,()=>{cls('s','q1');type($('.ty',el),'Which part of the cell contains genetic material?')});at(3900,()=>cls('o'));at(4600,()=>cls('q2'));
 at(5400,()=>{step(2);cls('ph')});at(6900,()=>{unc('ph');cls('q3')});at(7800,()=>{step(3);cls('st','rtl')});at(9000,()=>{step(4);cls('stamp','pdf')});at(10300,()=>cls('fin'))}
window.playIntro=play;$$('[data-demo]').forEach(b=>b.onclick=play);
document.addEventListener('apg-boot-done',()=>{if(PAGE==='home'&&!LS.get('apg_intro',0)&&!matchMedia('(prefers-reduced-motion: reduce)').matches)setTimeout(play,350)});
})();
