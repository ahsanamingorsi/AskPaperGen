/* ════════════════════════════════════════════════════════════════
   AskPaperGen — Generator v5
   Template-driven, no server save, PDF export only
════════════════════════════════════════════════════════════════ */
'use strict';

const G = (() => {
  /* ── State ─────────────────────────────────────────────────── */
  let DOC = mkDoc();
  let _selTmplId = null;

  function mkDoc() {
    return {
      schemaVersion:'3.0',
      info:{ institute:'',affiliation:'',department:'',subject:'',subjectCode:'',
             examType:'',duration:'',totalMarks:0,date:'',academicYear:'',
             course:'',grade:'',instructorName:'',paperCode:'',language:'English',
             logoBase64:null,logoMimeType:null },
      design:{ primaryColor:'#1e3a8a',headerStyle:'band',sectionStyle:'sidebar',
               fontFamily:'times',fontSize:11,paperSize:'A4',rtl:false,
               showAnswerLines:true,showMarks:true,showPageNums:true },
      instructions:[ 'All questions are compulsory unless otherwise stated.',
                     'Write legibly in the space provided.',
                     'Use of mobile phones is strictly prohibited.' ],
      showInstructions:true,
      sections:[]
    };
  }

  /* ── Boot ───────────────────────────────────────────────────── */
  function boot() {
    const tmplJson = window._TMPL_JSON;
    if (tmplJson && typeof tmplJson === 'object' && Object.keys(tmplJson).length)
      applySettings(tmplJson);

    fillFields();
    renderInstrs();
    renderSections();
    renderNav();
    renderPreview();

    // Field listeners
    document.querySelectorAll('.ff').forEach(el => {
      el.addEventListener('input',  debounce(onFieldChange, 280));
      el.addEventListener('change', onFieldChange);
    });
    document.querySelectorAll('.toggle-ff').forEach(el =>
      el.addEventListener('change', onFieldChange));

    // Color swatches
    document.querySelectorAll('#swatches .swatch').forEach(sw =>
      sw.addEventListener('click', () => {
        document.querySelectorAll('#swatches .swatch').forEach(s => s.classList.remove('on'));
        sw.classList.add('on');
        setV('f_color', sw.dataset.c);
        onFieldChange();
      }));
    setV('f_color', DOC.design.primaryColor);
    document.getElementById('f_color')?.addEventListener('input', e => {
      document.querySelectorAll('#swatches .swatch').forEach(s =>
        s.classList.toggle('on', s.dataset.c.toLowerCase() === e.target.value.toLowerCase()));
      onFieldChange();
    });

    // Language change
    document.getElementById('f_lang')?.addEventListener('change', onLangChange);

    // Section preset clicks
    document.querySelectorAll('.spreset').forEach(el =>
      el.addEventListener('click', () => {
        document.querySelectorAll('.spreset').forEach(p => p.classList.remove('on'));
        el.classList.add('on');
        setV('secQType', el.dataset.t);
      }));

    // Enter key for instructions
    document.getElementById('instr-add')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); addInstr(); }
    });
    document.getElementById('instr-add-btn')?.addEventListener('click', addInstr);

    // Topbar buttons
    document.getElementById('btn-pdf')?.addEventListener('click', exportPdf);
    document.getElementById('btn-json')?.addEventListener('click', exportJson);
    document.getElementById('btn-tmpl')?.addEventListener('click', openTmplModal);
    document.getElementById('btn-print')?.addEventListener('click', () => window.print());

    // Preview nav toggle
    const prevToggle = document.getElementById('prev-toggle');
    const prevPanel  = document.getElementById('gen-preview');
    const prevClose  = document.getElementById('prev-close');
    prevToggle?.addEventListener('click', () => {
      prevPanel?.classList.toggle('open');
      prevClose?.classList.toggle('d-none', !prevPanel?.classList.contains('open'));
    });
    prevClose?.addEventListener('click', () => {
      prevPanel?.classList.remove('open');
      prevClose.classList.add('d-none');
    });

    // Nav sidebar toggle (mobile)
    const navToggle  = document.getElementById('nav-toggle');
    const navPanel   = document.getElementById('gen-nav');
    navToggle?.addEventListener('click', () => navPanel?.classList.toggle('open'));

    // Template modal tabs
    document.querySelectorAll('.tmpl-tab').forEach(tab =>
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tmpl-tab,.tmpl-pane').forEach(x => x.classList.remove('on'));
        tab.classList.add('on');
        document.getElementById('tp_' + tab.dataset.p)?.classList.add('on');
        document.getElementById('tmpl-action-btn').textContent =
          tab.dataset.p === 'save' ? 'Save Template' : 'Apply Template';
      }));

    // Close modals on overlay click or Escape
    document.querySelectorAll('.modal-ov').forEach(ov =>
      ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape')
        document.querySelectorAll('.modal-ov.open').forEach(m => closeModal(m.id));
    });

    // Logo file
    document.getElementById('logo-input')?.addEventListener('change', handleLogo);
    // Q image file
    document.getElementById('q-img-input')?.addEventListener('change', handleQImg);

    handleResize();
    window.addEventListener('resize', handleResize);
  }

  function handleResize() {
    const w = window.innerWidth;
    document.getElementById('nav-toggle')?.classList.toggle('d-none', w > 820);
    document.getElementById('prev-toggle')?.classList.toggle('d-none', w > 1100);
  }

  /* ── Field sync ─────────────────────────────────────────────── */
  const INFO_IDS = {
    f_institute:['info','institute'], f_affil:['info','affiliation'],
    f_dept:['info','department'],     f_course:['info','course'],
    f_instr:['info','instructorName'],f_code:['info','paperCode'],
    f_subject:['info','subject'],     f_subcode:['info','subjectCode'],
    f_examtype:['info','examType'],   f_marks:['info','totalMarks'],
    f_dur:['info','duration'],        f_date:['info','date'],
    f_year:['info','academicYear'],   f_grade:['info','grade'],
  };
  const DESIGN_IDS = {
    f_color:['design','primaryColor'],  f_hstyle:['design','headerStyle'],
    f_sstyle:['design','sectionStyle'], f_font:['design','fontFamily'],
    f_fsize:['design','fontSize'],      f_psize:['design','paperSize'],
  };
  const TOGGLE_IDS = {
    d_anslines:['design','showAnswerLines'],
    d_marks:['design','showMarks'],
    d_pagenums:['design','showPageNums'],
    d_showinstr:['showInstructions'],
  };

  function fillFields() {
    Object.entries(INFO_IDS).forEach(([id,[obj,key]]) => {
      const el = document.getElementById(id);
      if (el) el.value = (DOC[obj][key] ?? '');
    });
    Object.entries(DESIGN_IDS).forEach(([id,[obj,key]]) => {
      const el = document.getElementById(id);
      if (el) el.value = (DOC[obj][key] ?? '');
    });
    Object.entries(TOGGLE_IDS).forEach(([id, path]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.checked = path.length===1 ? !!DOC[path[0]] : !!DOC[path[0]][path[1]];
    });
    // swatches
    const pc = DOC.design.primaryColor;
    document.querySelectorAll('#swatches .swatch').forEach(s =>
      s.classList.toggle('on', s.dataset.c?.toLowerCase() === pc?.toLowerCase()));
    // logo
    if (DOC.info.logoBase64) showLogoPreview(DOC.info.logoBase64, DOC.info.logoMimeType??'');
    // urdu field
    const uf = document.getElementById('urdu-field');
    if (uf) uf.style.display = DOC.info.language==='Urdu' ? '' : 'none';
    setV('f_lang', DOC.info.language ?? 'English');
  }

  function syncFromFields() {
    Object.entries(INFO_IDS).forEach(([id,[obj,key]]) => {
      const v = gV(id);
      DOC[obj][key] = key==='totalMarks' ? (parseInt(v)||0) : v;
    });
    Object.entries(DESIGN_IDS).forEach(([id,[obj,key]]) => {
      const v = gV(id);
      DOC[obj][key] = key==='fontSize' ? (parseFloat(v)||11) : v;
    });
    Object.entries(TOGGLE_IDS).forEach(([id, path]) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (path.length===1) DOC[path[0]] = el.checked;
      else DOC[path[0]][path[1]] = el.checked;
    });
    DOC.info.language = gV('f_lang') || 'English';
    DOC.design.rtl    = DOC.info.language === 'Urdu';
  }

  function onFieldChange() { syncFromFields(); renderPreview(); renderNav(); }

  function onLangChange() {
    const isUrdu = gV('f_lang') === 'Urdu';
    const uf = document.getElementById('urdu-field');
    if (uf) uf.style.display = isUrdu ? '' : 'none';
    if (isUrdu) { setV('f_font','urdu'); DOC.design.fontFamily='urdu'; }
    onFieldChange();
  }

  /* ── Logo ───────────────────────────────────────────────────── */
  function handleLogo(e) {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = r => {
      const [meta,b64] = r.target.result.split(',');
      DOC.info.logoBase64   = b64;
      DOC.info.logoMimeType = meta.match(/:(.*?);/)?.[1]??'';
      showLogoPreview(b64, DOC.info.logoMimeType);
      renderPreview();
    };
    reader.readAsDataURL(f);
  }
  function showLogoPreview(b64,mime) {
    const img = document.getElementById('logo-prev'); const ph = document.getElementById('logo-ph'); const rm = document.getElementById('logo-rm');
    if (img) { img.src=`data:${mime};base64,${b64}`; img.style.display=''; }
    if (ph) ph.style.display='none'; if (rm) rm.style.display='';
  }
  function removeLogo(e) {
    e.stopPropagation();
    DOC.info.logoBase64=null; DOC.info.logoMimeType=null;
    const img=document.getElementById('logo-prev'); if(img){img.src='';img.style.display='none';}
    const ph=document.getElementById('logo-ph'); if(ph) ph.style.display='';
    const rm=document.getElementById('logo-rm'); if(rm) rm.style.display='none';
    const fi=document.getElementById('logo-input'); if(fi) fi.value='';
    renderPreview();
  }

  /* ── Collapsible cards ──────────────────────────────────────── */
  function toggleCard(hd) { hd.closest('.gc')?.classList.toggle('closed'); }

  /* ── Instructions ───────────────────────────────────────────── */
  function renderInstrs() {
    const el = document.getElementById('instr-list'); if(!el) return;
    const lines = DOC.instructions;
    if (!lines.length) { el.innerHTML='<div style="font-size:.8rem;color:var(--ink4)">No instructions yet.</div>'; return; }
    el.innerHTML = lines.map((ln,i) => `
      <div class="instr-row">
        <div class="instr-badge">${i+1}</div>
        <input type="text" class="input" style="flex:1;padding:6px 10px;font-size:.82rem" value="${esc(ln)}"
               oninput="G._updInstr(${i},this.value)" onchange="G._updInstr(${i},this.value)"/>
        <button class="btn-icon danger" onclick="G._delInstr(${i})"><i class="bi bi-trash"></i></button>
      </div>`).join('');
  }
  function addInstr() {
    const inp=document.getElementById('instr-add'); const v=inp?.value?.trim(); if(!v) return;
    DOC.instructions.push(v); inp.value=''; renderInstrs(); renderPreview();
  }
  function _updInstr(i,v) { DOC.instructions[i]=v; renderPreview(); }
  function _delInstr(i)   { DOC.instructions.splice(i,1); renderInstrs(); renderPreview(); }

  /* ── Sections ───────────────────────────────────────────────── */
  function openAddSection() {
    setV('edit-sec-id',''); document.getElementById('sec-modal-title').textContent='Add Section';
    ['secTitle','secInstr','secAttempt'].forEach(id=>setV(id,''));
    setV('secMarks','1'); setV('secQType','mixed');
    document.querySelectorAll('.spreset').forEach(p=>p.classList.toggle('on',p.dataset.t==='mixed'));
    openModal('sec-modal'); setTimeout(()=>document.getElementById('secTitle')?.focus(),100);
  }
  function editSection(id) {
    const sec=DOC.sections.find(s=>s.id===id); if(!sec) return;
    setV('edit-sec-id',id); document.getElementById('sec-modal-title').textContent='Edit Section';
    setV('secTitle',sec.title); setV('secInstr',sec.instructions??'');
    setV('secAttempt',sec.attemptRule??''); setV('secMarks',sec.defaultMarks??1);
    setV('secQType',sec.questionType??'mixed');
    document.querySelectorAll('.spreset').forEach(p=>p.classList.toggle('on',p.dataset.t===(sec.questionType||'mixed')));
    openModal('sec-modal'); setTimeout(()=>document.getElementById('secTitle')?.focus(),100);
  }
  function saveSection() {
    const title=gV('secTitle').trim(); if(!title){alert('Section title required.');return;}
    const editId=gV('edit-sec-id');
    const data={ title, instructions:gV('secInstr'), attemptRule:gV('secAttempt'),
                 defaultMarks:parseInt(gV('secMarks'))||1, questionType:gV('secQType')||'mixed' };
    if (editId) { const s=DOC.sections.find(s=>s.id===editId); if(s) Object.assign(s,data); }
    else DOC.sections.push({id:uid(),order:DOC.sections.length+1,questions:[],...data});
    closeModal('sec-modal'); renderSections(); renderNav(); renderPreview();
  }
  function delSection(id) {
    if(!confirm('Delete section and all its questions?')) return;
    DOC.sections=DOC.sections.filter(s=>s.id!==id); renderSections(); renderNav(); renderPreview();
  }
  function moveSecUp(id) {
    const i=DOC.sections.findIndex(s=>s.id===id); if(i<=0) return;
    [DOC.sections[i-1],DOC.sections[i]]=[DOC.sections[i],DOC.sections[i-1]];
    renderSections(); renderNav(); renderPreview();
  }
  function moveSecDn(id) {
    const i=DOC.sections.findIndex(s=>s.id===id); if(i<0||i>=DOC.sections.length-1) return;
    [DOC.sections[i],DOC.sections[i+1]]=[DOC.sections[i+1],DOC.sections[i]];
    renderSections(); renderNav(); renderPreview();
  }

  function renderSections() {
    const wrap=document.getElementById('secs-wrap');
    const msg =document.getElementById('no-secs');
    const badge=document.getElementById('sec-count');
    if(!wrap) return;
    const n=DOC.sections.length;
    if(msg)   msg.style.display=n?'none':'';
    if(badge) badge.textContent=`${n} section${n!==1?'s':''}`;
    wrap.innerHTML=DOC.sections.map((sec,i)=>buildSecCard(sec,i)).join('');
  }

  function buildSecCard(sec,idx) {
    const qn=sec.questions?.length||0;
    const qs=(sec.questions||[]).map((q,qi)=>buildQChip(q,qi,sec.id)).join('');
    return `<div class="sc" id="sc_${sec.id}">
      <div class="sc-hd">
        <div class="sc-num">${idx+1}</div>
        <span class="sc-name" title="${esc(sec.title)}">${esc(sec.title)}</span>
        <span class="sc-pill">${qn}Q · ${sec.defaultMarks||1}m</span>
        <div style="display:flex;gap:3px;margin-left:auto;flex-shrink:0">
          <button class="btn btn-success btn-xs" onclick="G.openAddQuestion('${sec.id}')"><i class="bi bi-plus-lg"></i> Q</button>
          <button class="btn-icon" onclick="G.editSection('${sec.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn-icon" onclick="G.moveSecUp('${sec.id}')" ${idx===0?'style="opacity:.3;pointer-events:none"':''}><i class="bi bi-chevron-up"></i></button>
          <button class="btn-icon" onclick="G.moveSecDn('${sec.id}')" ${idx===DOC.sections.length-1?'style="opacity:.3;pointer-events:none"':''}><i class="bi bi-chevron-down"></i></button>
          <button class="btn-icon danger" onclick="G.delSection('${sec.id}')"><i class="bi bi-trash"></i></button>
        </div>
      </div>
      <div class="sc-body">
        ${sec.instructions?`<div style="font-size:.78rem;font-style:italic;color:var(--ink3);margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid var(--border)">${esc(sec.instructions)}</div>`:''}
        ${qs||'<div style="font-size:.8rem;color:var(--ink4);padding:4px 0">No questions — click <strong>+ Q</strong> to add.</div>'}
      </div>
    </div>`;
  }

  function buildQChip(q,idx,secId) {
    const tm={1:['Short','qt-s'],2:['Long','qt-l'],3:['MCQ','qt-m'],5:['Fill','qt-f'],6:['T/F','qt-t']};
    const[lbl,cls]=tm[q.type]||['Q','qt-s'];
    const m=q.marks>0?`[${q.marks}m]`:'';
    const txt=(q.text||'').substring(0,62)+((q.text||'').length>62?'…':'');
    return `<div class="qchip" id="qc_${q.id}">
      <span class="qchip-n">${idx+1}</span>
      <span class="qt ${cls}">${lbl}</span>
      <span class="qchip-txt" title="${esc(q.text)}">${esc(txt||'(empty)')}</span>
      <span class="qchip-m">${m}</span>
      <button class="btn-icon" style="width:26px;height:26px;font-size:.75rem;flex-shrink:0" onclick="G.editQuestion('${secId}','${q.id}')"><i class="bi bi-pencil"></i></button>
      <button class="btn-icon" style="width:26px;height:26px;font-size:.75rem;flex-shrink:0" onclick="G.moveQUp('${secId}','${q.id}')" ${idx===0?'style="opacity:.3;pointer-events:none"':''}><i class="bi bi-chevron-up"></i></button>
      <button class="btn-icon" style="width:26px;height:26px;font-size:.75rem;flex-shrink:0" onclick="G.moveQDn('${secId}','${q.id}')"><i class="bi bi-chevron-down"></i></button>
      <button class="btn-icon danger" style="width:26px;height:26px;font-size:.75rem;flex-shrink:0" onclick="G.delQuestion('${secId}','${q.id}')"><i class="bi bi-trash"></i></button>
    </div>`;
  }

  /* ── Questions ──────────────────────────────────────────────── */
  function openAddQuestion(secId) {
    setV('edit-q-id',''); setV('edit-q-secid',secId);
    document.getElementById('q-modal-title').textContent='Add Question';
    setV('qType','1'); setV('qText',''); setV('qMarks','0'); setV('qLines',''); setV('qUrdu','');
    ['A','B','C','D'].forEach(l=>setV('opt'+l,''));
    document.querySelectorAll('input[name="correct"]').forEach(r=>r.checked=false);
    clearQImg(); toggleQFields();
    openModal('q-modal'); setTimeout(()=>document.getElementById('qText')?.focus(),100);
  }
  function editQuestion(secId,qId) {
    const sec=DOC.sections.find(s=>s.id===secId);
    const q=sec?.questions?.find(q=>q.id===qId); if(!q) return;
    setV('edit-q-id',qId); setV('edit-q-secid',secId);
    document.getElementById('q-modal-title').textContent='Edit Question';
    setV('qType',String(q.type)); setV('qText',q.text??'');
    setV('qMarks',q.marks??0); setV('qLines',q.answerLines??''); setV('qUrdu',q.urduText??'');
    if(q.options){setV('optA',q.options.a??'');setV('optB',q.options.b??'');setV('optC',q.options.c??'');setV('optD',q.options.d??'');
      const r=document.getElementById('rad'+(q.options.correctAnswer??'').toUpperCase()); if(r) r.checked=true;}
    else { ['A','B','C','D'].forEach(l=>setV('opt'+l,'')); document.querySelectorAll('input[name="correct"]').forEach(r=>r.checked=false); }
    if(q.imageBase64){setV('q-img-b64',q.imageBase64);setV('q-img-mime',q.imageMimeType??'');
      const img=document.getElementById('q-img-prev'); if(img) img.src=`data:${q.imageMimeType};base64,${q.imageBase64}`;
      show('q-img-prevwrap'); hide('q-img-ph');}
    else clearQImg();
    toggleQFields(); openModal('q-modal');
    setTimeout(()=>document.getElementById('qText')?.focus(),100);
  }
  function saveQuestion() {
    const txt=gV('qText').trim(); if(!txt){alert('Question text required.');return;}
    const secId=gV('edit-q-secid');
    const sec=DOC.sections.find(s=>s.id===secId); if(!sec){alert('Section not found.');return;}
    const type=parseInt(gV('qType'))||1;
    const qd={ id:gV('edit-q-id')||uid(), type, text:txt, marks:parseInt(gV('qMarks'))||0,
                answerLines:parseInt(gV('qLines'))||null, urduText:gV('qUrdu')||null,
                imageBase64:gV('q-img-b64')||null, imageMimeType:gV('q-img-mime')||null };
    if(type===3) qd.options={ a:gV('optA'),b:gV('optB'),c:gV('optC'),d:gV('optD'),
                              correctAnswer:document.querySelector('input[name="correct"]:checked')?.value||null };
    sec.questions=sec.questions||[];
    const editId=gV('edit-q-id');
    if(editId){ const i=sec.questions.findIndex(q=>q.id===editId);
      if(i>=0) sec.questions[i]={...sec.questions[i],...qd}; else sec.questions.push(qd);
    } else { qd.order=sec.questions.length+1; sec.questions.push(qd); }
    closeModal('q-modal'); renderSections(); renderNav(); renderPreview();
    setTimeout(()=>{ const c=document.getElementById('qc_'+qd.id);
      if(c){c.classList.add('hl');setTimeout(()=>c.classList.remove('hl'),1500);c.scrollIntoView({behavior:'smooth',block:'nearest'});}},80);
  }
  function delQuestion(secId,qId) {
    if(!confirm('Delete this question?')) return;
    const sec=DOC.sections.find(s=>s.id===secId);
    if(sec) sec.questions=sec.questions.filter(q=>q.id!==qId);
    renderSections(); renderNav(); renderPreview();
  }
  function moveQUp(secId,qId) {
    const sec=DOC.sections.find(s=>s.id===secId); if(!sec) return;
    const i=sec.questions.findIndex(q=>q.id===qId); if(i<=0) return;
    [sec.questions[i-1],sec.questions[i]]=[sec.questions[i],sec.questions[i-1]];
    renderSections(); renderPreview();
  }
  function moveQDn(secId,qId) {
    const sec=DOC.sections.find(s=>s.id===secId); if(!sec) return;
    const i=sec.questions.findIndex(q=>q.id===qId); if(i<0||i>=sec.questions.length-1) return;
    [sec.questions[i],sec.questions[i+1]]=[sec.questions[i+1],sec.questions[i]];
    renderSections(); renderPreview();
  }
  function toggleQFields() {
    const t=gV('qType');
    document.getElementById('mcq-fields')?.style?.setProperty('display',t==='3'?'':'none');
    const uf=document.getElementById('urdu-q-field');
    if(uf) uf.style.display=DOC.info.language==='Urdu'?'':'none';
  }
  function handleQImg(e) {
    const f=e.target.files[0]; if(!f) return;
    if(f.size>2*1024*1024){alert('Image must be under 2MB.');return;}
    const r=new FileReader();
    r.onload=ev=>{ const[meta,b64]=ev.target.result.split(',');
      setV('q-img-b64',b64); setV('q-img-mime',meta.match(/:(.*?);/)?.[1]??'');
      const img=document.getElementById('q-img-prev'); if(img) img.src=ev.target.result;
      show('q-img-prevwrap'); hide('q-img-ph');};
    r.readAsDataURL(f);
  }
  function clearQImg() {
    setV('q-img-b64',''); setV('q-img-mime','');
    const img=document.getElementById('q-img-prev'); if(img) img.src='';
    const fi=document.getElementById('q-img-input'); if(fi) fi.value='';
    hide('q-img-prevwrap'); show('q-img-ph');
  }

  /* ── Nav outline ─────────────────────────────────────────────── */
  function renderNav() {
    const el=document.getElementById('nav-outline'); if(!el) return;
    if(!DOC.sections.length){ el.innerHTML='<div style="color:var(--ink4);font-size:.8rem;text-align:center;padding:20px 8px"><i class="bi bi-layout-text-sidebar" style="font-size:1.5rem;display:block;margin-bottom:6px;opacity:.4"></i>No sections yet</div>'; return; }
    el.innerHTML=DOC.sections.map((sec,i)=>{
      const tm={1:'S',2:'L',3:'M',5:'F',6:'T'};
      const qs=(sec.questions||[]).map((q,qi)=>`<div class="nav-q-item" onclick="G.scrollTo('qc_${q.id}')"><span style="font-size:.65rem;background:var(--blue-l);color:var(--blue);padding:1px 4px;border-radius:4px;flex-shrink:0">${tm[q.type]||'Q'}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${qi+1}. ${esc((q.text||'').substring(0,40))}</span></div>`).join('');
      return `<div style="margin-bottom:2px"><button class="nav-sec-btn" onclick="G.scrollTo('sc_${sec.id}')"><span class="nav-sec-num">${i+1}</span><span class="nav-sec-lbl">${esc(sec.title)}</span><span style="font-size:.65rem;background:var(--bg);border:1px solid var(--border);color:var(--ink4);padding:1px 5px;border-radius:8px;flex-shrink:0">${sec.questions?.length||0}</span></button>${qs?`<div class="nav-q-list">${qs}</div>`:''}</div>`;
    }).join('');
  }
  function scrollTo(id) {
    const el=document.getElementById(id); if(!el) return;
    el.scrollIntoView({behavior:'smooth',block:'nearest'});
    el.classList.add('hl'); setTimeout(()=>el.classList.remove('hl'),1500);
  }

  /* ── Preview renderer ────────────────────────────────────────── */
  function renderPreview() {
    syncFromFields();
    const pv=document.getElementById('paper-preview'); if(!pv) return;
    const {info:i,design:d}=DOC;
    const pc=d.primaryColor||'#1e3a8a';
    const ff={ times:"'Times New Roman',Times,serif", arial:"Arial,Helvetica,sans-serif",
               calibri:"Calibri,Candara,sans-serif", urdu:"'Noto Nastaliq Urdu','Traditional Arabic',serif" };
    pv.style.fontFamily=ff[d.fontFamily||'times']||ff.times;
    pv.style.fontSize=(d.fontSize||11)+'pt';
    pv.className='paper-sheet'+(d.rtl?' rtl':'');

    let h='';

    /* -- Logo -- */
    if(i.logoBase64) h+=`<div class="pp-logo"><img src="data:${i.logoMimeType};base64,${i.logoBase64}" alt="Logo"/></div>`;

    /* -- Header -- */
    const hs=d.headerStyle||'band';
    if(hs==='band'){
      if(i.institute) h+=`<div class="pp-inst" style="color:${pc}">${esc(i.institute)}</div>`;
      if(i.affiliation) h+=`<div class="pp-affil">${esc(i.affiliation)}</div>`;
      if(i.department)  h+=`<div class="pp-dept">${esc(i.department)}</div>`;
      if(i.examType)    h+=`<div class="pp-band" style="background:${pc}">${esc(i.examType).toUpperCase()} EXAMINATION</div>`;
    } else if(hs==='line'){
      h+=`<div style="text-align:center;border-top:2px solid ${pc};border-bottom:2px solid ${pc};padding:7px 0;margin-bottom:10px">`;
      if(i.institute)   h+=`<div class="pp-inst" style="color:${pc}">${esc(i.institute)}</div>`;
      if(i.department)  h+=`<div class="pp-dept">${esc(i.department)}</div>`;
      if(i.examType)    h+=`<div style="font-weight:700;font-size:10.5pt">${esc(i.examType).toUpperCase()} EXAMINATION</div>`;
      h+=`</div>`;
    } else if(hs==='minimal'){
      if(i.institute)   h+=`<div class="pp-inst" style="color:${pc}">${esc(i.institute)}</div>`;
      if(i.department)  h+=`<div class="pp-dept">${esc(i.department)}</div>`;
      if(i.examType)    h+=`<div style="text-align:center;font-size:10pt;font-weight:600;margin:5px 0">${esc(i.examType)} Examination</div>`;
    } else {
      h+=`<div style="text-align:center;border:2px solid ${pc};border-radius:3px;padding:10px;margin-bottom:10px">`;
      if(i.institute)   h+=`<div class="pp-inst" style="color:${pc}">${esc(i.institute)}</div>`;
      if(i.department)  h+=`<div class="pp-dept">${esc(i.department)}</div>`;
      if(i.examType)    h+=`<div style="font-weight:700;font-size:10pt;margin-top:4px">${esc(i.examType).toUpperCase()} EXAMINATION</div>`;
      h+=`</div>`;
    }

    /* -- Subject -- */
    if(i.subject) h+=`<div class="pp-subj">Subject: ${esc(i.subject)}${i.subjectCode?` (${esc(i.subjectCode)})`:''}</div>`;

    /* -- Meta grid -- */
    const metas=[['Total Marks',i.totalMarks||''],['Duration',i.duration],['Date',i.date],['Academic Year',i.academicYear],['Course',i.course],['Grade',i.grade]].filter(([,v])=>v);
    if(metas.length){ h+=`<div class="pp-meta">${metas.map(([k,v])=>`<div><span class="pp-mkey">${esc(k)}:</span> ${esc(String(v))}</div>`).join('')}</div>`; }

    h+=`<hr class="pp-divider"/>`;
    h+=`<div class="pp-namebar"><span>Name: ___________________________</span><span>Roll No: ___________</span><span>Marks: _______</span></div>`;

    /* -- Instructions -- */
    if(DOC.showInstructions && DOC.instructions.length){
      h+=`<div class="pp-instrs" style="border-left-color:${pc}"><b>General Instructions:</b><ol>${DOC.instructions.map(l=>`<li>${esc(l)}</li>`).join('')}</ol></div>`;
    }

    /* -- Sections -- */
    let qN=1;
    (DOC.sections||[]).forEach(sec=>{
      h+=buildSecPreview(sec,d,pc);
      (sec.questions||[]).forEach(q=>{ h+=buildQPreview(q,qN++,sec.defaultMarks||1,d,pc); });
    });

    if(!DOC.sections.length) h+=`<div style="text-align:center;color:#bbb;padding:50px 0;font-size:10pt"><i class="bi bi-file-earmark-text" style="font-size:3rem;display:block;margin-bottom:10px;opacity:.25"></i>Add sections and questions to see your paper</div>`;

    /* -- Footer -- */
    if(d.showPageNums) h+=`<div class="pp-footer"><span>${esc(i.institute||'')}${i.examType?' · '+esc(i.examType):''}</span><span>Page 1 of 1 | AskPaperGen</span></div>`;

    pv.innerHTML=h;
  }

  function buildSecPreview(sec,d,pc) {
    const ss=d.sectionStyle||'sidebar';
    let h='';
    if(ss==='band')      h+=`<div class="pp-sec-band" style="background:${pc}">${esc(sec.title)}</div>`;
    else if(ss==='underline') h+=`<div class="pp-sec-underline" style="border-color:${pc};color:${pc}">${esc(sec.title)}</div>`;
    else if(ss==='box')  h+=`<div class="pp-sec-box" style="border-color:${pc};color:${pc}">${esc(sec.title)}</div>`;
    else                 h+=`<div class="pp-sec-sidebar" style="border-left-color:${pc};background:${pc}18">${esc(sec.title)}</div>`;
    if(sec.attemptRule)  h+=`<div class="pp-sec-attempt">${esc(sec.attemptRule)}</div>`;
    if(sec.instructions) h+=`<div class="pp-sec-instr">${esc(sec.instructions)}</div>`;
    return h;
  }

  function buildQPreview(q,num,defM,d,pc) {
    const m=(q.marks||0)>0?q.marks:defM;
    const ms=d.showMarks?`<span class="pp-qmarks" style="color:${pc}">[${m}]</span>`:'';
    let h=`<div class="pp-q"><span class="pp-qnum">Q${num}.</span><div class="pp-qbody"><span>${esc(q.text)}</span>${ms}`;
    if(q.urduText) h+=`<div style="direction:rtl;font-family:'Noto Nastaliq Urdu',serif;margin-top:3px;font-size:12pt">${esc(q.urduText)}</div>`;
    if(q.imageBase64) h+=`<img class="pp-img" src="data:${q.imageMimeType};base64,${q.imageBase64}" alt=""/>`;
    if(q.type===3&&q.options){ h+=`<div class="pp-mcq">`; ['a','b','c','d'].forEach(k=>{ if(q.options[k]) h+=`<span>(${k.toUpperCase()}) ${esc(q.options[k])}</span>`; }); h+=`</div>`; }
    else if(q.type===5) h+=`<div class="pp-fill"></div>`;
    else if(q.type===6) h+=`<div class="pp-tf"><span>☐ True</span><span>☐ False</span></div>`;
    else if(d.showAnswerLines){ const n=q.answerLines||(q.type===2?7:3); for(let l=0;l<n;l++) h+=`<div class="pp-ansline"></div>`; }
    h+=`</div></div>`;
    return h;
  }

  /* ── Export ──────────────────────────────────────────────────── */
  async function exportPdf() {
    syncFromFields();
    const ovl=document.getElementById('gen-loading'); if(ovl) ovl.classList.add('show');
    try {
      const res=await fetch('/Paper/ExportPdf',{
        method:'POST',
        headers:{'Content-Type':'application/json','RequestVerificationToken':getCsrf()},
        body:JSON.stringify({paperJson:JSON.stringify(DOC)})
      });
      if(!res.ok) throw new Error('PDF generation failed');
      const blob=await res.blob();
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=`${DOC.info.subject?.replace(/\s+/g,'_')||'Paper'}_${Date.now()}.pdf`;
      a.click();
    } catch(e) { showToast(e.message,'err'); }
    finally { if(ovl) ovl.classList.remove('show'); }
  }

  function exportJson() {
    syncFromFields();
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(DOC,null,2)],{type:'application/json'}));
    a.download=`paper_${Date.now()}.json`; a.click();
  }

  /* ── Template modal ──────────────────────────────────────────── */
  async function openTmplModal() {
    openModal('tmpl-modal');
    // Reset to browse tab
    document.querySelectorAll('.tmpl-tab,.tmpl-pane').forEach(x=>x.classList.remove('on'));
    document.querySelector('.tmpl-tab[data-p="browse"]')?.classList.add('on');
    document.getElementById('tp_browse')?.classList.add('on');
    document.getElementById('tmpl-action-btn').textContent='Apply Template';

    const gallery=document.getElementById('tmpl-gallery');
    gallery.innerHTML='<div style="color:var(--ink4);padding:24px;text-align:center"><i class="bi bi-arrow-clockwise" style="animation:spin .8s linear infinite;display:inline-block"></i> Loading…</div>';
    try {
      const res=await fetch('/api/templates',{headers:{'RequestVerificationToken':getCsrf()}});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const list=await res.json();
      if(!list.length){ gallery.innerHTML='<div style="color:var(--ink4);padding:24px;text-align:center">No templates found.</div>'; return; }
      const icons={English:'📄',Urdu:'📜',Science:'🔬',Math:'📐',Custom:'⚙️'};
      gallery.innerHTML=list.map(t=>`
        <div class="tmpl-card" data-id="${t.id}" onclick="G._selTmpl(this,${t.id})">
          <div class="tmpl-ck"><i class="bi bi-check2"></i></div>
          <div class="tmpl-thumb ${t.thumbnailClass||'tmpl-custom'}">
            <span>${icons[t.category]||'📋'}</span>
            <span class="tmpl-lang">${t.language||'EN'}</span>
          </div>
          <div class="tmpl-info">
            <div class="tmpl-name">${esc(t.name)}</div>
            <div class="tmpl-desc">${esc(t.description||'')}</div>
            <div class="tmpl-tags">${t.category?`<span class="tmpl-tag">${esc(t.category)}</span>`:''}</div>
          </div>
        </div>`).join('');
    } catch(e) { gallery.innerHTML=`<div style="color:var(--red);padding:24px;text-align:center">Failed: ${e.message}</div>`; }
  }

  function _selTmpl(el,id) {
    document.querySelectorAll('#tmpl-gallery .tmpl-card').forEach(c=>c.classList.remove('sel'));
    el.classList.add('sel'); _selTmplId=id;
  }

  async function tmplAction() {
    const activePane=document.querySelector('.tmpl-tab.on')?.dataset.p;
    if(activePane==='save') { await saveAsTemplate(); return; }
    if(!_selTmplId){ showToast('Select a template first.','err'); return; }
    try {
      const res=await fetch(`/api/templates/${_selTmplId}`,{headers:{'RequestVerificationToken':getCsrf()}});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      let s={}; try { s=typeof data.settings==='string'?JSON.parse(data.settings):(data.settings||{}); } catch{}
      applySettings(s); closeModal('tmpl-modal'); showToast('Template applied!','ok');
    } catch(e) { showToast('Failed: '+e.message,'err'); }
  }

  function applySettings(s) {
    if(!s) return;
    if(s.primaryColor)    DOC.design.primaryColor  =s.primaryColor;
    if(s.headerStyle)     DOC.design.headerStyle   =s.headerStyle;
    if(s.sectionStyle)    DOC.design.sectionStyle  =s.sectionStyle;
    if(s.fontFamily)      DOC.design.fontFamily    =s.fontFamily;
    if(s.fontSize)        DOC.design.fontSize      =s.fontSize;
    if(s.rtl!==undefined) { DOC.design.rtl=s.rtl; DOC.info.language=s.rtl?'Urdu':'English'; }
    if(s.showAnswerLines!==undefined) DOC.design.showAnswerLines=s.showAnswerLines;
    if(s.showMarks!==undefined)       DOC.design.showMarks=s.showMarks;
    if(s.showInstructions!==undefined) DOC.showInstructions=s.showInstructions;
    if(s.defaultInstructions?.length) DOC.instructions=[...s.defaultInstructions];
    if(s.sectionPresets?.length && !DOC.sections.length)
      DOC.sections=s.sectionPresets.map((p,i)=>({id:uid(),order:i+1,questions:[],title:p.title||'',instructions:p.instructions||'',attemptRule:p.attemptRule||'',defaultMarks:p.defaultMarks||1,questionType:p.questionType||'mixed'}));
    fillFields(); renderInstrs(); renderSections(); renderNav(); renderPreview();
  }

  async function saveAsTemplate() {
    syncFromFields();
    const name=gV('st-name').trim(); if(!name){ showToast('Template name required.','err'); return; }
    const s={...DOC.design,defaultInstructions:DOC.instructions,
              sectionPresets:DOC.sections.map(x=>({title:x.title,instructions:x.instructions,attemptRule:x.attemptRule,defaultMarks:x.defaultMarks,questionType:x.questionType}))};
    try {
      const res=await fetch('/Paper/SaveAsTemplate',{
        method:'POST',
        headers:{'Content-Type':'application/json','RequestVerificationToken':getCsrf()},
        body:JSON.stringify({id:0,name,description:gV('st-desc'),category:gV('st-cat'),subject:gV('st-subject'),language:gV('st-lang'),isPublic:document.getElementById('st-public')?.checked||false,settingsJson:JSON.stringify(s)})
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      closeModal('tmpl-modal'); showToast('Template saved!','ok');
    } catch(e) { showToast('Failed: '+e.message,'err'); }
  }

  /* ── Modal helpers ───────────────────────────────────────────── */
  function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
  function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

  /* ── Utilities ───────────────────────────────────────────────── */
  function gV(id) { return document.getElementById(id)?.value??''; }
  function setV(id,v){ const el=document.getElementById(id); if(el&&v!=null) el.value=String(v); }
  function show(id){ const el=document.getElementById(id); if(el) el.style.display=''; }
  function hide(id){ const el=document.getElementById(id); if(el) el.style.display='none'; }
  function esc(s){ return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function uid(){ return typeof crypto.randomUUID==='function'?crypto.randomUUID():'id_'+Math.random().toString(36).slice(2); }
  function getCsrf(){ return document.querySelector('input[name="__RequestVerificationToken"]')?.value??''; }
  function debounce(fn,ms){ let t; return(...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }
  function showToast(msg,type='info'){ if(typeof window.showToast==='function') window.showToast(msg,type); }

  return { boot, toggleCard, openAddSection, editSection, saveSection, delSection, moveSecUp, moveSecDn,
           openAddQuestion, editQuestion, saveQuestion, delQuestion, moveQUp, moveQDn,
           addInstr, _updInstr, _delInstr, toggleQFields, clearQImg, removeLogo,
           openModal, closeModal, scrollTo, openTmplModal, tmplAction, _selTmpl };
})();

document.addEventListener('DOMContentLoaded', G.boot);
