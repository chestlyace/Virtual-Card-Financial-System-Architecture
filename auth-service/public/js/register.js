// register page JS
(function () {
  const API_AUTH_URL = '/v1/api/auth';

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

  function redirectToDashboardIfAuthenticated() {
    if (getAuthToken()) window.location.href = 'dashboard.html';
  }

  function attachPasswordToggles() {
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

  function attachRegisterHandler() {
    const form = document.getElementById('registerForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const btn = document.getElementById('registerBtn');

      if (password !== confirmPassword) {
        showAlert('registerAlert', 'Passwords do not match', 'error');
        return;
      }

      btn.disabled = true;
      showLoading('registerLoading', true);

      try {
        const name = `${firstName} ${lastName}`.trim();
        const resp = await fetch(`${API_AUTH_URL}/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const ct = resp.headers.get('content-type');
        const data = ct && ct.includes('application/json') ? await resp.json() : { message: await resp.text() };
        if (resp.ok) {
          setAuthToken(data.data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
          showAlert('registerAlert', 'Registration successful! Redirecting...', 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
        } else {
          const errorMessage = data.message || data.error || 'Registration failed';
          showAlert('registerAlert', errorMessage, 'error');
        }
      } catch (err) {
        console.error('Registration error:', err);
        showAlert('registerAlert', err.message || 'Network error', 'error');
      } finally {
        btn.disabled = false;
        showLoading('registerLoading', false);
      }
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    redirectToDashboardIfAuthenticated();
    attachPasswordToggles();
    attachRegisterHandler();
  });
})();
