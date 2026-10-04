/* ---------- designer ---------- */
let dt=null,d0=null;
function openDesigner(t){const base=t||BUILTIN[1];dt={id:t?t.id:uid(),name:t?t.name:'My New Template',desc:t?t.desc:'',cat:t?t.cat:'School',style:{...DS,...base.style},meta:{...base.meta},items:typeof base.items==='function'?base.items():clone(base.items)};d0=clone(dt);
$('#dc').innerHTML=CATS.map(c=>`<option ${c===dt.cat?'selected':''}>${c}</option>`).join('');$('#dn').value=dt.name;$('#dd').value=dt.desc;drawDesigner();$('#designer').classList.add('on')}
function drawDesigner(){$('#dl').innerHTML='<h3>Typography & Paper</h3>'+SF.map(f=>ctl(f,dt.style[f[0]],'style')).join('')+'<h3>Header, Colors & Styles</h3>'+DF.map(f=>ctl(f,dt.style[f[0]],'style')).join('')+`<label class="k"><input type="checkbox" id="drtl" ${dt.style.rtl?'checked':''}> RTL layout</label>`;
$('#dp').innerHTML=render(dt);$('#drtl').onchange=e=>{dt.style.rtl=e.target.checked;prevD()}}
function prevD(){$('#dp').innerHTML=render(dt)}
function closeDesigner(){$('#designer').classList.remove('on')}
function resetTpl(){dt=clone(d0);$('#dn').value=dt.name;$('#dd').value=dt.desc;drawDesigner();toast('Template reset')}
function saveTpl(){dt.name=$('#dn').value.trim()||'Untitled';dt.desc=$('#dd').value;dt.cat=$('#dc').value;dt.mod=Date.now();const l=myT(),i=l.findIndex(x=>x.id===dt.id);i>=0?l[i]=clone(dt):l.push(clone(dt));LS.set('apg_tpl',l);closeDesigner();filt='My Templates';drawTpl();toast('Template saved to My Templates')}
bind($('#dl'),()=>dt,r=>r?drawDesigner():prevD());
