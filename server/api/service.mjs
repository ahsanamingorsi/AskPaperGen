import { createRemoteJWKSet, jwtVerify } from 'jose';
import '../../js/paper-validation.js';
import '../../js/paper-render.js';

export const PACKAGES = Object.freeze([
  { id: 'starter', points: 10, amountPkr: 200 },
  { id: 'regular', points: 50, amountPkr: 900 },
  { id: 'school', points: 100, amountPkr: 1600 }
]);
export const EXPORT_COST = 1;
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const now = () => Math.floor(Date.now() / 1000);
const id = () => crypto.randomUUID();
export async function hash(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(b => b.toString(16).padStart(2, '0')).join('');
}
export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new ApiError(status, message); };
const isAdmin = (user, env) => String(env.ADMIN_GOOGLE_SUBS || '').split(',').map(s => s.trim()).includes(user.google_sub);
const publicUser = (user, env) => ({ id: user.id, name: user.name, email: user.email, points: user.points, isAdmin: isAdmin(user, env) });
async function body(request, max = 4096) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) fail(415, 'Send JSON');
  // Limit actual bytes as well as Content-Length; chunked requests are bounded too.
  if (Number(request.headers.get('Content-Length') || 0) > max) fail(413, 'Request is too large');
  const reader = request.body?.getReader(); if (!reader) fail(400, 'Missing request');
  const chunks = []; let size = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > max) { await reader.cancel(); fail(413, 'Request is too large'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { const parsed = JSON.parse(new TextDecoder().decode(bytes)); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); return parsed; } catch { fail(400, 'Invalid JSON'); }
}
export async function verifyGoogle(credential, clientId) {
  const { payload } = await jwtVerify(credential, googleKeys, {
    audience: clientId, issuer: ['accounts.google.com', 'https://accounts.google.com'], algorithms: ['RS256'], requiredClaims: ['sub', 'exp', 'iat', 'nonce']
  });
  if (payload.email_verified !== true || typeof payload.email !== 'string' || typeof payload.sub !== 'string') fail(401, 'Google account could not be verified');
  return payload;
}
export function createService({ verify = verifyGoogle, renderPdf } = {}) {
  return {
    async fetch(request, env) {
      const origin = request.headers.get('Origin');
      const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
      const headers = { 'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff', 'Access-Control-Expose-Headers': 'X-Points-Balance, X-Export-Id, Content-Disposition' };
      if (!origin || !allowed.includes(origin)) return Response.json({ error: 'Origin is not allowed' }, { status: 403, headers });
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
      const json = (value, status = 200) => Response.json(value, { status, headers });
      try {
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
        const route = new URL(request.url).pathname.replace(/\/$/, '');
        const configured = env.DB && env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_ID.startsWith('REPLACE');
        if (route === '/config' && request.method === 'GET') return json({ enabled: !!configured, googleClientId: configured ? env.GOOGLE_CLIENT_ID : '', exportCost: EXPORT_COST, packages: PACKAGES,
          paymentMethods: ['jazzcash', 'easypaisa'].map(method => ({ id: method, label: method === 'jazzcash' ? 'JazzCash' : 'Easypaisa', accountName: env[method.toUpperCase() + '_ACCOUNT_NAME'] || '', accountNumber: env[method.toUpperCase() + '_ACCOUNT_NUMBER'] || '' })).filter(m => m.accountName && m.accountNumber) });
        if (!configured) fail(503, 'Accounts are not available yet');
        const db = env.DB;
        if (route === '/auth/challenge' && request.method === 'POST') {
          const challenge = { id: id(), nonce: id() + id() };
          await db.prepare('INSERT INTO login_challenges(id,nonce,expires_at) VALUES(?,?,?)').bind(challenge.id, challenge.nonce, now() + 300).run();
          return json(challenge);
        }
        if (route === '/auth/google' && request.method === 'POST') {
          const input = await body(request, 20000);
          const challenge = await db.prepare('SELECT * FROM login_challenges WHERE id = ? AND expires_at > ?').bind(String(input.challengeId || ''), now()).first();
          if (!challenge || typeof input.credential !== 'string') fail(401, 'Sign-in expired. Try again');
          let claims; try { claims = await verify(input.credential, env.GOOGLE_CLIENT_ID); } catch { fail(401, 'Google sign-in could not be verified'); }
          if (claims.nonce !== challenge.nonce) fail(401, 'Invalid sign-in challenge');
          const consumed = await db.prepare('DELETE FROM login_challenges WHERE id = ? AND expires_at > ? RETURNING id').bind(challenge.id, now()).first();
          if (!consumed) fail(401, 'Sign-in has already been used');
          await db.prepare('INSERT INTO users(id,google_sub,name,email,created_at) VALUES(?,?,?,?,?) ON CONFLICT(google_sub) DO UPDATE SET name=excluded.name,email=excluded.email').bind(id(), claims.sub, String(claims.name || 'User').slice(0,200), claims.email, now()).run();
          const user = await db.prepare('SELECT * FROM users WHERE google_sub = ?').bind(claims.sub).first();
          const token = id() + id();
          await db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await hash(token), user.id, now() + 604800).run();
          return json({ token, user: publicUser(user, env) });
        }
        const token = request.headers.get('Authorization')?.match(/^Bearer ([a-zA-Z0-9-]{72})$/)?.[1];
        if (!token) fail(401, 'Please sign in with Google');
        const tokenHash = await hash(token);
        const user = await db.prepare('SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?').bind(tokenHash, now()).first();
        if (!user) fail(401, 'Your sign-in expired. Please sign in again');
        if (route === '/auth/logout' && request.method === 'POST') { await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(tokenHash).run(); return json({ ok: true }); }
        if (route === '/me' && request.method === 'GET') return json({ user: publicUser(user, env) });
        if (route === '/wallet' && request.method === 'GET') {
          const ledger = await db.prepare('SELECT delta,kind,created_at FROM point_ledger WHERE user_id=? ORDER BY id DESC LIMIT 100').bind(user.id).all();
          const payments = await db.prepare('SELECT id,method,transaction_reference,amount_pkr,points,status,created_at,review_note FROM payment_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 50').bind(user.id).all();
          return json({ user: publicUser(user, env), ledger: ledger.results, payments: payments.results });
        }
        if (route === '/payments' && request.method === 'POST') {
          const input = await body(request); const pack = PACKAGES.find(p => p.id === input.packageId);
          if (!pack || !['jazzcash','easypaisa'].includes(input.method)) fail(400, 'Select a valid point package and payment method');
          if (!env[input.method.toUpperCase() + '_ACCOUNT_NUMBER'] || !env[input.method.toUpperCase() + '_ACCOUNT_NAME']) fail(503, 'This payment method is not available yet');
          const reference = String(input.transactionReference || '').trim().toUpperCase().replace(/\s/g, '');
          const senderName = String(input.senderName || '').trim();
          if (!/^[A-Z0-9-]{5,64}$/.test(reference) || senderName.length < 2 || senderName.length > 100) fail(400, 'Enter the transaction reference and sender name from your payment');
          const pending = await db.prepare("SELECT count(*) AS total FROM payment_requests WHERE user_id=? AND status='pending'").bind(user.id).first();
          if (pending.total >= 5) fail(429, 'Wait for your pending payments to be reviewed');
          const paymentId = id();
          try { await db.prepare('INSERT INTO payment_requests(id,user_id,method,transaction_reference,sender_name,package_id,amount_pkr,points,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(paymentId,user.id,input.method,reference,senderName,pack.id,pack.amountPkr,pack.points,now()).run(); }
          catch (error) { if (/UNIQUE/i.test(error.message)) fail(409, 'This transaction reference has already been submitted'); throw error; }
          return json({ id: paymentId, status: 'pending', message: 'Payment submitted. Points are added after an admin verifies the payment.' }, 201);
        }
        if (route.startsWith('/admin/')) {
          if (!isAdmin(user, env)) fail(403, 'Administrator access is required');
          if (route === '/admin/payments' && request.method === 'GET') {
            const result = await db.prepare("SELECT p.*,u.name,u.email FROM payment_requests p JOIN users u ON p.user_id=u.id WHERE p.status='pending' ORDER BY p.created_at LIMIT 100").all();
            return json({ payments: result.results });
          }
          if (route === '/admin/payments/review' && request.method === 'POST') {
            const input = await body(request);
            if (!['approve','reject'].includes(input.action)) fail(400, 'Select approve or reject');
            if (input.action === 'approve' && input.confirmed !== true) fail(400, 'Verify the payment in your JazzCash/Easypaisa account before approving');
            const status = input.action === 'approve' ? 'approved' : 'rejected';
            const payment = await db.prepare("UPDATE payment_requests SET status=?,reviewed_at=?,reviewed_by=?,review_note=? WHERE id=? AND status='pending' RETURNING id,status").bind(status,now(),user.id,String(input.note || '').slice(0,300),String(input.id || '')).first();
            if (!payment) { const existing = await db.prepare('SELECT id,status FROM payment_requests WHERE id=?').bind(String(input.id || '')).first(); if (!existing) fail(404, 'Payment request not found'); return json(existing); }
            return json(payment);
          }
        }
        if (route === '/exports' && request.method === 'POST') {
          const input = await body(request, 5000000);
          if (!['pdf','json'].includes(input.kind) || !/^[a-zA-Z0-9-]{16,100}$/.test(input.requestId || '')) fail(400, 'Invalid export request');
          let paper; try { paper = globalThis.APGValidatePaper(input.paper); } catch (error) { fail(400, error.message); }
          if (!paper.items.length) fail(400, 'Add questions before exporting');
          if (!env.EXPORTS || (input.kind === 'pdf' && !env.BROWSER && !renderPdf)) fail(503, 'Exports are not available yet');
          const paperHash = await hash(JSON.stringify(paper));
          let record = await db.prepare('SELECT * FROM exports WHERE user_id=? AND request_id=?').bind(user.id,input.requestId).first();
          if (record && (record.paper_hash !== paperHash || record.kind !== input.kind)) fail(409, 'Use a new export request for a changed paper');
          if (!record) {
            const exportId = id();
            try { await db.prepare('INSERT INTO exports(id,user_id,request_id,paper_hash,kind,cost,created_at) VALUES(?,?,?,?,?,?,?)').bind(exportId,user.id,input.requestId,paperHash,input.kind,EXPORT_COST,now()).run(); }
            catch (error) { if (/CHECK/i.test(error.message)) fail(402, 'You need 1 point to export. Buy points first'); if (!/UNIQUE/i.test(error.message)) throw error; record = await db.prepare('SELECT * FROM exports WHERE user_id=? AND request_id=?').bind(user.id,input.requestId).first(); if (!record) throw error; }
            if (!record) {
              record = { id: exportId, status: 'processing', kind: input.kind };
              try {
                const bytes = input.kind === 'json' ? JSON.stringify({ app: 'askpapergen', v: 1, paper }, null, 2) : await renderPdf(paper, env);
                await env.EXPORTS.put(exportId, bytes, { httpMetadata: { contentType: input.kind === 'pdf' ? 'application/pdf' : 'application/json' } });
                const ready = await db.prepare("UPDATE exports SET status='ready' WHERE id=? AND status='processing' RETURNING id").bind(exportId).first();
                if (!ready) fail(503, 'Export timed out. Your point has been refunded');
                record.status = 'ready';
              } catch (error) {
                await db.prepare("UPDATE exports SET status='failed' WHERE id=? AND status='processing'").bind(exportId).run();
                throw new ApiError(503, 'Export could not finish. Your point has been refunded. Please try again');
              }
            }
          }
          if (record.paper_hash && (record.paper_hash !== paperHash || record.kind !== input.kind)) fail(409, 'Use a new export request for a changed paper');
          if (record.status === 'processing') fail(409, 'Your export is still preparing. Try again shortly');
          if (record.status === 'failed') fail(409, 'This export failed and was refunded. Start a new export');
          const file = await env.EXPORTS.get(record.id);
          if (!file) fail(503, 'Your export is temporarily unavailable. Retry this download');
          const balance = await db.prepare('SELECT points FROM users WHERE id=?').bind(user.id).first();
          return new Response(file.body, { headers: { ...headers, 'Content-Type': input.kind === 'pdf' ? 'application/pdf' : 'application/json', 'Content-Disposition': 'attachment; filename="AskPaperGen.' + (input.kind === 'pdf' ? 'pdf' : 'json') + '"', 'X-Points-Balance': String(balance.points), 'X-Export-Id': record.id } });
        }
        fail(404, 'Not found');
      } catch (error) {
        if (!(error instanceof ApiError)) console.error('Account service error', error);
        return json({ error: error instanceof ApiError ? error.message : 'The account service could not complete this request' }, error instanceof ApiError ? error.status : 500);
      }
    },
    async scheduled(_event, env) {
      await env.DB.batch([
        env.DB.prepare("UPDATE exports SET status='failed' WHERE status='processing' AND created_at<?").bind(now() - 600),
        env.DB.prepare('DELETE FROM login_challenges WHERE expires_at<?').bind(now()),
        env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now())
      ]);
    }
  };
}
