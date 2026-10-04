/* Storage, DOM helpers, toast */

const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{toast('Storage full — try a smaller image')}}};
const uid=()=>Math.random().toString(36).slice(2,9),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),clone=o=>JSON.parse(JSON.stringify(o));
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$('#toast').append(t);setTimeout(()=>t.remove(),2200)}
const CONTACT_EMAIL='ahsanamingorsi@gmail.com';function mail(){location.href=`mailto:${CONTACT_EMAIL}?subject=AskPaperGen%20message&body=${encodeURIComponent($('#cm').value+'\n\n'+$('#cn').value)}`}
const PAGE=document.body.dataset.page;
