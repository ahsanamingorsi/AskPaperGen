import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createService, hash, verifyGoogle } from '../service.mjs';

function setup(renderPdf = async () => new Uint8Array([37,80,68,70])) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_accounts.sql',import.meta.url),'utf8'));
  const wrap = (sql,args=[]) => ({
    bind: (...values) => wrap(sql,values),
    first: async () => sqlite.prepare(sql).get(...args) || null,
    all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
    run: async () => ({ meta: sqlite.prepare(sql).run(...args) })
  });
  const DB = { prepare: sql => wrap(sql), batch: async statements => { sqlite.exec('BEGIN'); try { const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results; }catch(error){sqlite.exec('ROLLBACK');throw error;} } };
  const files = new Map();
  const EXPORTS = { put: async(k,v)=>files.set(k,v), get:async k=>files.has(k)?{body:files.get(k)}:null };
  const env = { DB, EXPORTS, GOOGLE_CLIENT_ID:'client',ADMIN_GOOGLE_SUBS:'admin-sub',ALLOWED_ORIGINS:'https://site.example',JAZZCASH_ACCOUNT_NAME:'School',JAZZCASH_ACCOUNT_NUMBER:'03001234567',EASYPAISA_ACCOUNT_NAME:'School',EASYPAISA_ACCOUNT_NUMBER:'03001234567' };
  let claims;
  const service=createService({ verify:async()=>claims,renderPdf });
  async function request(path,{method='GET',body,token,origin='https://site.example'}={}) {
    return service.fetch(new Request('https://api.example'+path,{method,headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}),env);
  }
  async function login(sub='user-sub') {
    const challenge=await(await request('/auth/challenge',{method:'POST',body:{}})).json();
    claims={sub,email:'user@example.com',name:'Teacher',email_verified:true,nonce:challenge.nonce};
    const response=await request('/auth/google',{method:'POST',body:{credential:'verified-by-test',challengeId:challenge.id}});
    assert.equal(response.status,200);return { ...await response.json(),challenge };
  }
  return {sqlite,DB,request,login,service,env,files};
}
const paper={meta:{inst:'School',subject:'English'},style:{},items:[{id:'q1',type:'short',text:'Define gravity.',marks:2}]};
async function purchase(t,user,admin,reference='123456789') {
  const response=await t.request('/payments',{method:'POST',token:user.token,body:{method:'jazzcash',packageId:'starter',transactionReference:reference,senderName:'Teacher',points:999999,amountPkr:1}});
  assert.equal(response.status,201);const payment=await response.json();
  const approved=await t.request('/admin/payments/review',{method:'POST',token:admin.token,body:{id:payment.id,action:'approve',confirmed:true}});assert.equal(approved.status,200);return payment;
}
test('verified sign-in, one-time nonce, expired tokens and origin rejection',async()=>{
  const t=setup();const user=await t.login();assert.equal(user.user.points,0);assert.equal(user.user.isAdmin,false);
  const replay=await t.request('/auth/google',{method:'POST',body:{credential:'same',challengeId:user.challenge.id}});assert.equal(replay.status,401);
  assert.equal((await t.request('/me',{token:user.token,origin:'https://evil.example'})).status,403);
  assert.equal((await t.request('/me',{token:'not-a-session'})).status,401);
  await t.DB.prepare('UPDATE sessions SET expires_at=0 WHERE token_hash=?').bind(await hash(user.token)).run();assert.equal((await t.request('/me',{token:user.token})).status,401);
  await assert.rejects(verifyGoogle('invalid-google-token','client'));
});
test('manual payment cannot self-credit; approval adds server-priced points once',async()=>{
  const t=setup(),user=await t.login(),admin=await t.login('admin-sub');
  let response=await t.request('/payments',{method:'POST',token:user.token,body:{packageId:'starter',method:'easypaisa',transactionReference:'ABC12345',senderName:'Teacher',points:9999,amountPkr:1}});const payment=await response.json();assert.equal(response.status,201);
  const stored=await t.DB.prepare('SELECT * FROM payment_requests WHERE id=?').bind(payment.id).first();assert.equal(stored.points,10);assert.equal(stored.amount_pkr,200);
  assert.equal((await t.request('/me',{token:user.token})).status,200);assert.equal((await(await t.request('/me',{token:user.token})).json()).user.points,0);
  assert.equal((await t.request('/admin/payments/review',{method:'POST',token:user.token,body:{id:payment.id,action:'approve',confirmed:true}})).status,403);
  assert.equal((await t.request('/admin/payments/review',{method:'POST',token:admin.token,body:{id:payment.id,action:'approve'}})).status,400);
  for(let i=0;i<2;i++)assert.equal((await t.request('/admin/payments/review',{method:'POST',token:admin.token,body:{id:payment.id,action:'approve',confirmed:true}})).status,200);
  assert.equal((await(await t.request('/me',{token:user.token})).json()).user.points,10);
  assert.equal((await t.request('/payments',{method:'POST',token:user.token,body:{packageId:'starter',method:'easypaisa',transactionReference:'abc12345',senderName:'Teacher'}})).status,409);
});
test('export requires points, debits once, protects idempotent downloads and sanitizes content',async()=>{
  const t=setup(),user=await t.login(),admin=await t.login('admin-sub'),input={requestId:crypto.randomUUID(),kind:'json',paper};
  assert.equal((await t.request('/exports',{method:'POST',token:user.token,body:input})).status,402);
  assert.equal((await t.DB.prepare('SELECT count(*) AS count FROM exports').first()).count,0);
  await purchase(t,user,admin);
  for(let i=0;i<2;i++){const response=await t.request('/exports',{method:'POST',token:user.token,body:input});assert.equal(response.status,200);assert.equal(response.headers.get('X-Points-Balance'),'9');assert.equal((await response.json()).paper.items[0].text,'Define gravity.');}
  assert.equal((await t.request('/exports',{method:'POST',token:user.token,body:{...input,paper:{...paper,meta:{subject:'Changed'}}}})).status,409);
  assert.equal((await t.request('/exports',{method:'POST',token:user.token,body:{...input,requestId:crypto.randomUUID(),paper:{...paper,items:[{type:'image',src:'x" onerror="alert(1)'}]}}})).status,400);
  const readyId=(await t.DB.prepare('SELECT id FROM exports').first()).id;t.files.delete(readyId);assert.equal((await t.request('/exports',{method:'POST',token:user.token,body:input})).status,503);assert.equal((await t.DB.prepare('SELECT points FROM users WHERE id=?').bind(user.user.id).first()).points,9);
});
test('failed PDF is refunded once; scheduled recovery refunds abandoned reservations',async()=>{
  const t=setup(async()=>{throw Error('renderer offline')}),user=await t.login(),admin=await t.login('admin-sub');await purchase(t,user,admin);
  const input={requestId:crypto.randomUUID(),kind:'pdf',paper};
  assert.equal((await t.request('/exports',{method:'POST',token:user.token,body:input})).status,503);
  assert.equal((await t.request('/exports',{method:'POST',token:user.token,body:input})).status,409);
  assert.equal((await t.DB.prepare('SELECT points FROM users WHERE id=?').bind(user.user.id).first()).points,10);
  await t.DB.prepare('INSERT INTO exports(id,user_id,request_id,paper_hash,kind,cost,created_at) VALUES(?,?,?,?,?,?,?)').bind('stalled',user.user.id,crypto.randomUUID(),'hash','pdf',1,1).run();
  await t.service.scheduled({},t.env);await t.service.scheduled({},t.env);
  assert.equal((await t.DB.prepare('SELECT points FROM users WHERE id=?').bind(user.user.id).first()).points,10);
});
test('parallel exports cannot overspend a one-point wallet',async()=>{
  const t=setup(),user=await t.login();await t.DB.prepare('UPDATE users SET points=1 WHERE id=?').bind(user.user.id).run();
  const responses=await Promise.all([1,2].map(()=>t.request('/exports',{method:'POST',token:user.token,body:{requestId:crypto.randomUUID(),kind:'pdf',paper}})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,402]);assert.equal((await t.DB.prepare('SELECT points FROM users WHERE id=?').bind(user.user.id).first()).points,0);
});
