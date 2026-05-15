/* AskPaperGen — global JS */
document.addEventListener('DOMContentLoaded',()=>{
  // Toast auto-dismiss
  document.querySelectorAll('.toast').forEach(t=>{
    setTimeout(()=>{t.style.transition='opacity .3s';t.style.opacity='0'},3700);
    setTimeout(()=>t.remove(),4100);
  });
  // Dashboard/admin sidebar
  const ham=document.getElementById('ham'),sb=document.getElementById('sb'),ov=document.getElementById('sbov');
  ham?.addEventListener('click',()=>{sb?.classList.toggle('open');ov?.classList.toggle('open')});
  ov?.addEventListener('click',()=>{sb?.classList.remove('open');ov?.classList.remove('open')});
  // Landing mobile nav
  document.getElementById('lnav-toggle')?.addEventListener('click',()=>document.getElementById('mob-nav')?.classList.toggle('open'));
  // Auth password toggles
  document.querySelectorAll('.pw-eye').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const inp=btn.previousElementSibling;
      const isText=inp.type==='text';
      inp.type=isText?'password':'text';
      btn.querySelector('i').className='bi bi-eye'+(isText?'':'-slash');
    });
  });
});
function showToast(msg,type='info'){
  let area=document.getElementById('toast-area');
  if(!area){area=document.createElement('div');area.id='toast-area';area.style.cssText='position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none';document.body.appendChild(area);}
  const t=document.createElement('div');
  t.className=`toast ${type}`;t.style.pointerEvents='all';
  t.innerHTML=`<span class="tdot"></span><span>${escHtml(msg)}</span>`;
  area.appendChild(t);
  setTimeout(()=>{t.style.transition='opacity .3s';t.style.opacity='0'},3700);
  setTimeout(()=>t.remove(),4100);
}
function escHtml(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function getCsrf(){return document.querySelector('input[name="__RequestVerificationToken"]')?.value??''}
