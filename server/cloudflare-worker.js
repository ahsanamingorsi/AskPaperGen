// Optional handwriting / high-accuracy OCR endpoint for AskPaperGen (Cloudflare Worker, free tier is enough).
// Your API key stays on the server as a secret — never in the website.
//  1) wrangler init askpapergen-ocr  → paste this file as src/index.js
//  2) wrangler secret put ANTHROPIC_API_KEY      (optional vars: MODEL, ALLOWED_ORIGIN = https://askpapergen.ahsanamingorsi.com)
//  3) wrangler deploy  → paste the worker URL into Text Scanner → Extraction settings → Endpoint.
// Contract: POST multipart {image, langs, mode} → JSON {text, meta?, items:[{type,text,sub,options,marks}]}  (`questions` also accepted)
const PROMPT=(mode,langs)=>`Read this exam page (${mode==='handwriting'?'handwritten':'printed'}; languages: ${langs}) and transcribe it EXACTLY as written. Never correct, rewrite, translate, summarise or invent. Keep Urdu/Arabic-script text and numbers exactly. Structure it as an ordered list: section headings (type section), instructions or reading passages (type instr), and questions (mcq with 4 options, short, long, tf, fill). Do not include question numbers in text. Put marks if written. Also return paper details if present (subject, cls, time, marks, teacher). Reply with JSON only: {"text":"<full transcription>","meta":{"subject":"","cls":""},"items":[{"type":"section|instr|mcq|short|long|tf|fill","text":"","sub":"","options":[],"marks":""}]}`;
export default{async fetch(req,env){const o=req.headers.get('Origin')||'',al=env.ALLOWED_ORIGIN||'*',cors={'Access-Control-Allow-Origin':al==='*'||o===al?(al==='*'?'*':o):al,'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
 const out=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});if(req.method!=='POST')return out({error:'POST only'},405);
 try{const fd=await req.formData(),img=fd.get('image');if(!img||img.size>6e6)return out({error:'Missing or too large image'},400);
  const u=new Uint8Array(await img.arrayBuffer());let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:env.MODEL||'claude-sonnet-5-5',max_tokens:2000,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:'image/jpeg',data:btoa(s)}},{type:'text',text:PROMPT(fd.get('mode')||'printed',fd.get('langs')||'urd+eng')}]}]})});
  if(!r.ok)return out({error:'Vision service error '+r.status},502);const t=((await r.json()).content||[]).map(c=>c.text||'').join('').replace(/^```(?:json)?|```$/gm,'').trim();
  try{return out(JSON.parse(t))}catch{return out({text:t})}}catch(e){return out({error:'Bad request'},400)}}};
