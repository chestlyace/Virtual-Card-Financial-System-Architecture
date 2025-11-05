// dashboard page JS
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

  function getAuthToken() { return localStorage.getItem('accessToken'); }
  function clearAuthToken() { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); }

  function guard() {
    const token = getAuthToken();
    if (!token) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  async function loadDashboard() {
    if (!guard()) return;
    showLoading('dashboardLoading', true);
    const token = getAuthToken();
    try {
      const resp = await fetch(`${API_USERS_URL}/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const ct = resp.headers.get('content-type');
      const data = ct && ct.includes('application/json') ? await resp.json() : { message: await resp.text() };
      if (resp.ok) {
        const user = data.data.user;
        document.getElementById('userName').textContent = user.name || 'User';
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userId').textContent = user.id;
        document.getElementById('accountStatus').textContent = user.accountStatus;
        document.getElementById('kycStatus').textContent = 'N/A';
        document.getElementById('phoneDisplay').textContent = 'N/A';
        const createdDate = new Date(user.createdAt);
        document.getElementById('memberSince').textContent = createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } else {
        showAlert('dashboardAlert', data.message || 'Session expired. Please login again.', 'error');
        setTimeout(() => logout(true), 1000);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      showAlert('dashboardAlert', err.message || 'Failed to load dashboard data.', 'error');
    } finally {
      showLoading('dashboardLoading', false);
    }
  }

  async function logout(skipServer = false) {
    const token = getAuthToken();
    try {
      if (!skipServer && token) {
        await fetch(`${API_AUTH_URL}/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthToken();
      window.location.href = 'index.html';
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => logout(false));
    loadDashboard();
  });
})();
