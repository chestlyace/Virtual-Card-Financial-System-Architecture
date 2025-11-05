// index page JS
(function () {
  const API_AUTH_URL = '/v1/api/auth';
  const API_USERS_URL = '/v1/api/users';

  function showAlert(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `alert alert-${type} show`;
    setTimeout(() => el.classList.remove('show'), 5000);
  }

  function showLoading(elementId, show = true) {
    const el = document.getElementById(elementId);
    el.classList.toggle('show', !!show);
  }

  function setAuthToken(token) { localStorage.setItem('accessToken', token); }
  function getAuthToken() { return localStorage.getItem('accessToken'); }

  function checkAuth() {
    const token = getAuthToken();
    if (token) window.location.href = 'dashboard.html';
  }

  function attachPasswordToggle() {
    document.querySelectorAll('.password-toggle .toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        btn.textContent = isPwd ? 'Hide' : 'Show';
      });
    });
  }

  function attachLoginHandler() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const btn = document.getElementById('loginBtn');
      btn.disabled = true;
      showLoading('loginLoading', true);
      try {
        const resp = await fetch(`${API_AUTH_URL}/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const ct = resp.headers.get('content-type');
        const data = ct && ct.includes('application/json') ? await resp.json() : { message: await resp.text() };
        if (resp.ok) {
          setAuthToken(data.data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
          showAlert('loginAlert', 'Login successful! Redirecting...', 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
        } else {
          showAlert('loginAlert', data.message || 'Login failed', 'error');
        }
      } catch (err) {
        console.error('Login error:', err);
        showAlert('loginAlert', err.message || 'Network error', 'error');
      } finally {
        btn.disabled = false;
        showLoading('loginLoading', false);
      }
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    attachPasswordToggle();
    attachLoginHandler();
  });
})();
