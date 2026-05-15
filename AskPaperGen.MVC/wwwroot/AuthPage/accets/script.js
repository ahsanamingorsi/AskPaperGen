
/* ══════════════════════════════════════════
   AskPaperGen Auth — Full Logic
══════════════════════════════════════════ */
'use strict';

/* ── State ─────────────────────────────── */
let forgotEmail = '';
let verifiedCode = false;
const DEMO_CODE = '123456'; // demo OTP for testing

/* ── Page navigation ────────────────────── */
function showPage(name) {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) target.classList.add('active');
  clearAlerts();
  window.scrollTo(0, 0);
}

function clearAlerts() {
  document.querySelectorAll('.auth-alert').forEach(a => a.classList.remove('show'));
  document.querySelectorAll('.field-error').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('.auth-input').forEach(i => {
    i.classList.remove('error', 'success');
  });
}

function showAlert(id, msgId, message, type = 'error') {
  const box = document.getElementById(id);
  const msg = document.getElementById(msgId);
  if (box && msg) {
    box.className = 'auth-alert ' + type + ' show';
    msg.textContent = message;
  }
}

function showFieldError(errId, message) {
  const el = document.getElementById(errId);
  if (el) {
    el.querySelector('span').textContent = message;
    el.classList.add('show');
  }
}

/* ── Password visibility ─────────────────── */
function togglePass(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!input || !btn) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.querySelector('i').className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';
}

/* ── Password strength ────────────────────── */
function checkStrength(val, fillId = 'strength-fill', labelId = 'strength-label') {
  const fill = document.getElementById(fillId);
  const label = document.getElementById(labelId);
  if (!fill || !label) return;

  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  if (val.length >= 12) score++;

  const levels = [
    { pct: 0,   color: 'var(--line)',  text: 'Enter a password',   c: 'var(--ink4)' },
    { pct: 20,  color: '#ef4444',      text: 'Very weak',           c: '#ef4444' },
    { pct: 40,  color: '#f97316',      text: 'Weak',                c: '#f97316' },
    { pct: 60,  color: 'var(--amber)', text: 'Fair',                c: 'var(--amber)' },
    { pct: 80,  color: '#22c55e',      text: 'Strong',              c: '#22c55e' },
    { pct: 100, color: 'var(--green)', text: 'Very strong ✓',       c: 'var(--green)' }
  ];
  const lvl = val.length === 0 ? levels[0] : levels[Math.min(score, 5)];
  fill.style.width = lvl.pct + '%';
  fill.style.background = lvl.color;
  label.textContent = lvl.text;
  label.style.color = lvl.c;
}

/* ── Social login ────────────────────────── */
function socialLogin(provider) {
  const btns = document.querySelectorAll('.social-btn');
  btns.forEach(b => { b.style.opacity = '.5'; b.style.pointerEvents = 'none'; });
  setTimeout(() => {
    btns.forEach(b => { b.style.opacity = ''; b.style.pointerEvents = ''; });
    showAlert('signin-alert', 'signin-alert-msg',
      `${provider} OAuth is not configured yet. Connect it in your backend settings.`, 'info');
    document.getElementById('page-signup').querySelectorAll('.auth-alert')[0]?.classList.remove('show');
  }, 1200);
}

/* ── Loading state ───────────────────────── */
function setLoading(btnId, spinnerId, textId, loading) {
  const btn = document.getElementById(btnId);
  const spin = document.getElementById(spinnerId);
  const txt = document.getElementById(textId);
  if (!btn || !spin || !txt) return;
  btn.disabled = loading;
  spin.style.display = loading ? 'block' : 'none';
  txt.style.opacity = loading ? '0' : '1';
}

/* ── SIGN IN ─────────────────────────────── */
function handleSignin(e) {
  e.preventDefault();
  const email = document.getElementById('si-email').value.trim();
  const pass = document.getElementById('si-pass').value;
  let valid = true;

  if (!email) {
    showFieldError('si-email-err', 'Email is required');
    document.getElementById('si-email').classList.add('error');
    valid = false;
  }
  if (!pass) {
    showFieldError('si-pass-err', 'Password is required');
    document.getElementById('si-pass').classList.add('error');
    valid = false;
  }
  if (!valid) return;

  setLoading('si-btn', 'si-spinner', 'si-btn-text', true);

  // Simulate API call
  setTimeout(() => {
    setLoading('si-btn', 'si-spinner', 'si-btn-text', false);

    // Demo: wrong pass simulation
    if (pass === 'wrong') {
      showAlert('signin-alert', 'signin-alert-msg', 'Incorrect email or password. Please try again.', 'error');
      document.getElementById('si-pass').classList.add('error');
      return;
    }

    // Success — normally redirect to dashboard
    const payload = { email, remember: document.getElementById('si-remember').checked };
    console.log('[SIGNIN] POST /auth/login', payload);
    showAlert('signin-alert', 'signin-alert-msg', 'Signed in successfully! Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
  }, 1500);
}

/* ── SIGN UP ─────────────────────────────── */
function handleSignup(e) {
  e.preventDefault();
  const fname = document.getElementById('su-fname').value.trim();
  const lname = document.getElementById('su-lname').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const pass = document.getElementById('su-pass').value;
  const pass2 = document.getElementById('su-pass2').value;
  const role = document.getElementById('su-role').value;
  const terms = document.getElementById('su-terms').checked;
  let valid = true;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    showFieldError('su-email-err', 'Enter a valid email address');
    document.getElementById('su-email').classList.add('error');
    valid = false;
  }
  if (pass.length < 8) {
    showFieldError('su-pass-err', 'Password must be at least 8 characters');
    document.getElementById('su-pass').classList.add('error');
    valid = false;
  }
  if (pass !== pass2) {
    showFieldError('su-pass2-err', 'Passwords do not match');
    document.getElementById('su-pass2').classList.add('error');
    valid = false;
  }
  if (!terms) {
    showAlert('signup-alert', 'signup-alert-msg', 'Please accept the Terms of Service to continue.', 'error');
    valid = false;
  }
  if (!valid) return;

  setLoading('su-btn', 'su-spinner', 'su-btn-text', true);

  setTimeout(() => {
    setLoading('su-btn', 'su-spinner', 'su-btn-text', false);

    const payload = {
      first_name: fname, last_name: lname,
      email, password: pass, password_confirmation: pass2,
      role: role || 'teacher'
    };
    console.log('[SIGNUP] POST /auth/register', payload);

    // Show success state
    document.getElementById('success-title').textContent = 'Account Created!';
    document.getElementById('success-msg').textContent =
      `Welcome aboard, ${fname}! Your free account is ready. Sign in to start creating papers.`;
    showPage('success');
  }, 1800);
}

/* ── FORGOT PASSWORD ─────────────────────── */
function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('fp-email').value.trim();

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    showFieldError('fp-email-err', 'Enter a valid email address');
    document.getElementById('fp-email').classList.add('error');
    return;
  }

  setLoading('fp-btn', 'fp-spinner', 'fp-btn-text', true);

  setTimeout(() => {
    setLoading('fp-btn', 'fp-spinner', 'fp-btn-text', false);

    forgotEmail = email;
    const payload = { email };
    console.log('[FORGOT] POST /auth/forgot-password', payload);

    // Navigate to verify page
    document.getElementById('verify-email-display').textContent = email;
    showPage('verify');
    startOtpTimer();
    document.getElementById('otp0').focus();
  }, 1400);
}

/* ── OTP INPUTS ──────────────────────────── */
const otpInputs = document.querySelectorAll('.otp-input');

otpInputs.forEach((input, idx) => {
  input.addEventListener('input', (e) => {
    const val = e.target.value.replace(/\D/g, '');
    input.value = val;
    input.classList.toggle('filled', val.length > 0);

    if (val && idx < otpInputs.length - 1) {
      otpInputs[idx + 1].focus();
    }
    // Auto verify when all filled
    if (getOtpValue().length === 6) {
      setTimeout(() => document.getElementById('vc-btn').click(), 200);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && idx > 0) {
      otpInputs[idx - 1].focus();
      otpInputs[idx - 1].value = '';
      otpInputs[idx - 1].classList.remove('filled');
    }
  });

  // Handle paste
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    [...text].forEach((char, i) => {
      if (otpInputs[i]) {
        otpInputs[i].value = char;
        otpInputs[i].classList.add('filled');
      }
    });
    if (text.length >= 6) {
      otpInputs[5].focus();
      setTimeout(() => document.getElementById('vc-btn').click(), 200);
    }
  });
});

function getOtpValue() {
  return [...otpInputs].map(i => i.value).join('');
}

function clearOtp() {
  otpInputs.forEach(i => {
    i.value = ''; i.classList.remove('filled', 'error');
  });
}

function shakeOtp() {
  otpInputs.forEach(i => i.classList.add('error'));
  const wrap = document.getElementById('otp-wrap');
  wrap.style.animation = 'none';
  wrap.offsetHeight;
  wrap.style.animation = 'shake .4s ease';
  setTimeout(() => {
    wrap.style.animation = '';
  }, 400);
}

/* Shake animation */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`;
document.head.appendChild(shakeStyle);

/* ── OTP Timer ───────────────────────────── */
let timerInterval = null;
let timerSeconds = 120;

function startOtpTimer() {
  clearInterval(timerInterval);
  timerSeconds = 120;
  verifiedCode = false;
  document.getElementById('otp-timer').style.display = 'block';
  document.getElementById('otp-resend-btn').classList.remove('show');
  document.getElementById('new-pass-section').style.display = 'none';
  document.getElementById('verify-submit-btn-wrap').style.display = 'block';

  timerInterval = setInterval(() => {
    timerSeconds--;
    const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const s = String(timerSeconds % 60).padStart(2, '0');
    const el = document.getElementById('timer-count');
    if (el) el.textContent = `${m}:${s}`;

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      document.getElementById('otp-timer').style.display = 'none';
      document.getElementById('otp-resend-btn').classList.add('show');
    }
  }, 1000);
}

function resendCode() {
  clearOtp();
  clearAlerts();
  startOtpTimer();
  otpInputs[0].focus();

  const vcSuccess = document.getElementById('vc-success');
  vcSuccess.className = 'auth-alert success show';
  setTimeout(() => vcSuccess.classList.remove('show'), 3000);

  const payload = { email: forgotEmail };
  console.log('[RESEND] POST /auth/resend-code', payload);
}

/* ── VERIFY CODE ─────────────────────────── */
function handleVerify() {
  const code = getOtpValue();
  if (code.length < 6) {
    showAlert('vc-alert', 'vc-alert-msg', 'Please enter all 6 digits.', 'error');
    return;
  }

  setLoading('vc-btn', 'vc-spinner', 'vc-btn-text', true);

  setTimeout(() => {
    setLoading('vc-btn', 'vc-spinner', 'vc-btn-text', false);

    const payload = { email: forgotEmail, code };
    console.log('[VERIFY] POST /auth/verify-code', payload);

    // Demo: correct code is 123456
    if (code === DEMO_CODE) {
      verifiedCode = true;
      document.getElementById('vc-alert').classList.remove('show');
      document.getElementById('verify-submit-btn-wrap').style.display = 'none';
      document.getElementById('new-pass-section').style.display = 'block';
      clearInterval(timerInterval);
      document.getElementById('otp-timer').style.display = 'none';
      otpInputs.forEach(i => { i.classList.remove('error'); i.classList.add('success'); });
    } else {
      shakeOtp();
      showAlert('vc-alert', 'vc-alert-msg',
        `Incorrect code. Try again (demo code: ${DEMO_CODE}).`, 'error');
    }
  }, 1000);
}

/* ── RESET PASSWORD ──────────────────────── */
function handleResetPassword() {
  const pass = document.getElementById('np-pass').value;
  const pass2 = document.getElementById('np-pass2').value;

  if (pass.length < 8) {
    showFieldError('np-pass-err', 'Password must be at least 8 characters');
    return;
  }
  if (pass !== pass2) {
    showFieldError('np-pass-err', 'Passwords do not match');
    document.getElementById('np-pass2').classList.add('error');
    return;
  }

  setLoading('rp-btn', 'rp-spinner', 'rp-btn-text', true);

  setTimeout(() => {
    setLoading('rp-btn', 'rp-spinner', 'rp-btn-text', false);

    const payload = { email: forgotEmail, code: getOtpValue(), password: pass, password_confirmation: pass2 };
    console.log('[RESET] POST /auth/reset-password', payload);

    document.getElementById('success-title').textContent = 'Password Reset!';
    document.getElementById('success-msg').textContent =
      'Your password has been updated successfully. You can now sign in with your new password.';
    showPage('success');
    clearInterval(timerInterval);
  }, 1600);
}

/* ── Input real-time cleanup ─────────────── */
document.querySelectorAll('.auth-input').forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('error');
  });
  input.addEventListener('focus', () => {
    const wrap = input.closest('.field-group');
    if (wrap) wrap.querySelector('.field-error')?.classList.remove('show');
  });
});
