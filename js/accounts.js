/* Google sign-in and the server-owned point wallet. No browser balance grants access. */
(function () {
  const apiUrl = String(window.APG_ACCOUNT_CONFIG?.apiUrl || '').replace(/\/$/, '');
  let token = sessionStorage.getItem('apg_account_token') || '', user = null, config = null, googleLoading = null, exportBusy = false;
  const status = message => { const el = $('#account-message'); if (el) el.textContent = message; else toast(message); };
  const money = value => 'Rs' + Number(value).toLocaleString('en-PK');
  const date = value => new Date(value * 1000).toLocaleString();
  async function api(route, options = {}) {
    if (!apiUrl) throw new Error('Account services are not available yet. Please try again later.');
    if (!navigator.onLine) throw new Error('Sign-in, purchases and exports need an internet connection.');
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(apiUrl + route, { ...options, cache: 'no-store', signal: controller.signal, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
      if (!response.ok) {
        if (response.status === 401) { token = ''; user = null; sessionStorage.removeItem('apg_account_token'); updateNav(); }
        const data = await response.json().catch(() => ({})); const error = new Error(data.error || 'The service could not complete this request.'); error.status = response.status; throw error;
      }
      return response;
    } catch (error) { if (error.name === 'AbortError') throw new Error('This request took too long. Retry to check the same export.'); throw error; }
    finally { clearTimeout(timer); }
  }
  const post = async (route, value) => (await api(route, { method: 'POST', body: JSON.stringify(value) })).json();
  function updateNav() {
    const link = $('#account-link'); if (!link) return;
    link.textContent = user ? user.points + ' points · Account' : 'Google Login';
    link.onclick = event => { if (!user) { event.preventDefault(); signIn(); } };
  }
  function googleLibrary() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (!googleLoading) googleLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
      script.onload = resolve; script.onerror = () => { googleLoading = null; script.remove(); reject(new Error('Google sign-in could not load. Check your connection.')); }; document.head.append(script);
    }); return googleLoading;
  }
  async function signIn() {
    if (!navigator.onLine) return status('Connect to the internet to sign in with Google.');
    if (!apiUrl || !config?.enabled) return status('Google sign-in is not available yet. Please try again later.');
    $('#account-login')?.remove();
    const modal = document.createElement('div'); modal.id = 'account-login'; modal.className = 'modal on'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Sign in to AskPaperGen');
    modal.innerHTML = '<div class="mb account-login-box"><h2>Welcome to AskPaperGen</h2><p>Sign in to buy points and export your finished papers.</p><p><a href="privacy.html">How we use your account and paper data</a></p><div id="google-button"></div><p id="login-message" role="status">Preparing Google sign-in...</p><button class="btn" id="login-close">Cancel</button></div>';
    document.body.append(modal); $('#login-close').onclick = () => modal.remove();
    try {
      const challenge = await post('/auth/challenge', {}); await googleLibrary(); if (!modal.isConnected) return;
      window.google.accounts.id.initialize({ client_id: config.googleClientId, nonce: challenge.nonce, auto_select: false, callback: async result => {
        const message = $('#login-message'); if (message) message.textContent = 'Signing in...';
        try { const data = await post('/auth/google', { credential: result.credential, challengeId: challenge.id }); token = data.token; user = data.user; sessionStorage.setItem('apg_account_token', token); updateNav(); modal.remove(); await renderPage(); toast('Signed in'); }
        catch (error) { const el = $('#login-message'); if (el) el.textContent = error.message; }
      } });
      window.google.accounts.id.renderButton($('#google-button'), { theme: 'outline', size: 'large', width: Math.min(320, innerWidth - 64), text: 'continue_with' }); $('#login-message').textContent = '';
    } catch (error) { const el = $('#login-message'); if (el) el.textContent = error.message; }
  }
  async function logout() {
    try { if (token) await post('/auth/logout', {}); } catch (error) { return status(error.message); }
    token = ''; user = null; sessionStorage.removeItem('apg_account_token'); window.google?.accounts?.id?.disableAutoSelect(); updateNav(); await renderPage();
  }
  async function refreshUser() { if (token) { const data = await (await api('/me')).json(); user = data.user; updateNav(); } }
  async function renderPage() {
    const host = $('#account-content'); if (!host) return;
    if (!config?.enabled) { host.innerHTML = '<div class="glass account-card"><h2>Accounts are coming soon</h2><p>Google sign-in and point purchases will be available once the account service is connected.</p></div>'; return; }
    if (!user) { host.innerHTML = '<div class="glass account-card"><h2>Sign in with Google</h2><p>Buy points, track payments and export papers. Each PDF or JSON export uses 1 point.</p><button class="btn p" id="account-signin">Continue with Google</button></div>'; $('#account-signin').onclick = signIn; return; }
    if (PAGE === 'admin') return renderAdmin(host);
    const wallet = await (await api('/wallet')).json(); user = wallet.user; updateNav();
    const methods = config.paymentMethods;
    host.innerHTML = '<div class="glass account-card account-summary"><div><h2>' + esc(user.name) + '</h2><p>' + esc(user.email) + '</p></div><div><strong class="point-total">' + user.points + '</strong> points</div><div class="acts"><button class="btn" id="account-refresh">Refresh Balance</button><button class="btn" id="account-logout">Sign Out</button>' + (user.isAdmin ? '<a class="btn" href="admin.html">Review Payments</a>' : '') + '</div></div>' +
      '<section><h2>Buy points</h2><p>1 point per PDF or JSON export. Editing and the Text Scanner remain free.</p><div class="point-packages">' + config.packages.map(p => '<button class="glass account-card point-package" data-package="' + esc(p.id) + '"><strong>' + p.points + ' points</strong><span>' + money(p.amountPkr) + '</span></button>').join('') + '</div></section>' +
      '<section class="glass account-card"><h2>Submit your payment</h2>' + (methods.length ? '<p>Select a package and payment method, send the exact amount, then enter the reference from your receipt. An admin verifies the payment before adding points.</p><form id="payment-form"><label class="f" for="payment-package">Point package</label><select id="payment-package">' + config.packages.map(p => '<option value="' + esc(p.id) + '">' + p.points + ' points — ' + money(p.amountPkr) + '</option>').join('') + '</select><label class="f" for="payment-method">Payment method</label><select id="payment-method">' + methods.map(m => '<option value="' + m.id + '">' + esc(m.label) + '</option>').join('') + '</select><div id="payment-destination" class="priv"></div><label class="f" for="payment-sender">Sender name on receipt</label><input id="payment-sender" required minlength="2" maxlength="100" autocomplete="name"><label class="f" for="payment-reference">Transaction reference</label><input id="payment-reference" required minlength="5" maxlength="64" pattern="[A-Za-z0-9 -]+" autocomplete="off"><p>Your request stays pending until the payment is confirmed.</p><button class="btn p" type="submit">Submit for Approval</button></form>' : '<p>Payment account details are being configured. Please check back before sending money.</p>') + '</section>' +
      '<section class="glass account-card"><h2>Payment requests</h2><div class="account-table-wrap"><table class="account-table"><thead><tr><th>Reference</th><th>Points</th><th>Amount</th><th>Status</th></tr></thead><tbody>' + wallet.payments.map(p => '<tr><td>' + esc(p.transaction_reference) + '</td><td>' + p.points + '</td><td>' + money(p.amount_pkr) + '</td><td>' + esc(p.status) + (p.review_note ? '<small>' + esc(p.review_note) + '</small>' : '') + '</td></tr>').join('') + '</tbody></table></div>' + (!wallet.payments.length ? '<p>No payment requests yet.</p>' : '') + '</section>' +
      '<section class="glass account-card"><h2>Point history</h2><ul class="point-history">' + wallet.ledger.map(row => '<li><span>' + esc(row.kind) + '<small>' + esc(date(row.created_at)) + '</small></span><b>' + (row.delta > 0 ? '+' : '') + row.delta + '</b></li>').join('') + '</ul>' + (!wallet.ledger.length ? '<p>Your purchases and exports will appear here.</p>' : '') + '</section>';
    $('#account-logout').onclick = logout; $('#account-refresh').onclick = () => renderPage().catch(e => status(e.message));
    $$('[data-package]').forEach(button => button.onclick = () => { if ($('#payment-package')) { $('#payment-package').value = button.dataset.package; updatePayment(); $('#payment-form').scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
    function updatePayment() { const method = methods.find(m => m.id === $('#payment-method').value), pack = config.packages.find(p => p.id === $('#payment-package').value); $('#payment-destination').innerHTML = '<b>Send ' + money(pack.amountPkr) + ' through ' + esc(method.label) + '</b><br>Account: ' + esc(method.accountNumber) + '<br>Name: ' + esc(method.accountName); }
    if (methods.length) {
      updatePayment(); $('#payment-method').onchange = updatePayment; $('#payment-package').onchange = updatePayment;
      $('#payment-form').onsubmit = async event => { event.preventDefault(); const button = $('button[type=submit]', event.target); button.disabled = true;
        try { const data = await post('/payments', { packageId: $('#payment-package').value, method: $('#payment-method').value, senderName: $('#payment-sender').value, transactionReference: $('#payment-reference').value }); await renderPage(); status(data.message); }
        catch (error) { status(error.message); } finally { if (button.isConnected) button.disabled = false; }
      };
    }
  }
  async function renderAdmin(host) {
    if (!user.isAdmin) { host.innerHTML = '<div class="glass account-card"><h2>Administrator access required</h2><p>This account cannot review payments.</p></div>'; return; }
    const data = await (await api('/admin/payments')).json();
    host.innerHTML = '<p>Check each payment in your JazzCash/Easypaisa account. A submitted reference alone does not prove payment.</p><button class="btn" id="admin-refresh">Refresh Requests</button><div class="admin-payments">' + data.payments.map(p => '<article class="glass account-card" data-payment="' + esc(p.id) + '"><h2>' + esc(p.name) + '</h2><p>' + esc(p.email) + '</p><dl><dt>Method</dt><dd>' + esc(p.method) + '</dd><dt>Reference</dt><dd>' + esc(p.transaction_reference) + '</dd><dt>Sender</dt><dd>' + esc(p.sender_name) + '</dd><dt>Amount / points</dt><dd>' + money(p.amount_pkr) + ' / ' + p.points + ' points</dd></dl><label class="k"><input type="checkbox" data-confirm> I verified the amount and reference in the receiving account.</label><label class="f">Review note (optional)</label><input data-note maxlength="300"><div class="acts"><button class="btn p" data-review="approve">Approve and Add Points</button><button class="btn d" data-review="reject">Reject</button></div></article>').join('') + '</div>' + (!data.payments.length ? '<p>No pending payment requests.</p>' : '');
    $('#admin-refresh').onclick = () => renderPage().catch(e => status(e.message));
    $$('[data-review]').forEach(button => button.onclick = async () => { const card = button.closest('[data-payment]'); const confirmed = $('[data-confirm]', card).checked;
      if (button.dataset.review === 'approve' && !confirmed) return status('Verify the payment in the receiving account before approving.');
      $$('button', card).forEach(b => b.disabled = true);
      try { await post('/admin/payments/review', { id: card.dataset.payment, action: button.dataset.review, confirmed, note: $('[data-note]', card).value }); await renderPage(); status('Payment reviewed.'); }
      catch (error) { status(error.message); $$('button', card).forEach(b => b.disabled = false); }
    });
  }
  async function exportPaper(value, kind = 'pdf') {
    if (exportBusy) return toast('Your export is already preparing.');
    if (!config?.enabled) return toast('Exports are not available until the account service is connected.');
    if (!user) { await signIn(); return; }
    let paper; try { paper = APGValidatePaper(value); } catch (error) { return toast(error.message); }
    if (!paper.items.length) return toast('Add questions before exporting.');
    exportBusy = true; let key, requests;
    try {
      key = user.id + ':' + kind + ':' + [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(paper))))].map(b => b.toString(16).padStart(2,'0')).join('');
      try { requests = JSON.parse(sessionStorage.getItem('apg_export_requests') || '{}'); } catch { requests = {}; }
      if (!requests[key]) { requests[key] = crypto.randomUUID(); const keys = Object.keys(requests); for (const stale of keys.slice(0,-50)) delete requests[stale]; sessionStorage.setItem('apg_export_requests', JSON.stringify(requests)); }
      toast('Preparing your export — 1 point.');
      const response = await api('/exports', { method: 'POST', body: JSON.stringify({ requestId: requests[key], kind, paper }) });
      const blob = await response.blob(); user.points = Number(response.headers.get('X-Points-Balance')); updateNav();
      const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = (paper.meta.subject || 'paper').replace(/[^a-zA-Z0-9\u0600-\u06ff-]/g,'-') + '.' + (kind === 'pdf' ? 'pdf' : 'askpapergen.json'); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url),60000); toast('Export downloaded. Re-downloading this version uses no extra points.');
    } catch (error) {
      if (key && requests && /refunded|export failed|changed paper/i.test(error.message)) { delete requests[key]; sessionStorage.setItem('apg_export_requests',JSON.stringify(requests)); }
      toast(error.message); if (error.status === 402) location.href = 'account.html';
    } finally { exportBusy = false; }
  }
  window.APGAccount = { signIn, logout, exportPaper, refreshUser };
  async function init() {
    const nav = $('nav .links'); if (nav) { const link = document.createElement('a'); link.id = 'account-link'; link.className = 'btn'; link.href = 'account.html'; nav.append(link); updateNav(); }
    if (apiUrl) { try { config = await (await api('/config')).json(); await refreshUser(); } catch (error) { status(error.message); } }
    await renderPage();
  }
  init().catch(error => status(error.message));
})();
