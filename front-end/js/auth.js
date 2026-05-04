// ─── auth.js ─ Login & Signup ────────────────────────────────────
import { getDashboardPath, setSession } from './api.js';

const API_BASE = 'http://localhost:3000';

// Role mapping: form dropdown value → x-role header value (Role enum on backend)
const ROLE_MAP = {
  'client': 'CLIENT',
  'gig': 'GIG_PROFESSIONAL',
  'manager': 'MANAGER',
};

// Database UserRole → RBAC Role header value
const DB_ROLE_TO_HEADER = {
  'CLIENT': 'CLIENT',
  'GIG': 'GIG_PROFESSIONAL',
  'MANAGER': 'MANAGER',
};

/**
 * Auth requests need special handling because the user isn't logged in yet.
 * We manually set the x-role header from the form dropdown selection.
 */
async function authRequest(url, body, xRole) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-role': xRole,
      'x-user-id': '',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const err = await res.json(); msg = err.message || msg; } catch (_) {}
    alert(msg);
    throw new Error(msg);
  }

  return res.json();
}

function getPage() {
  return window.location.pathname.split('/').pop();
}

document.addEventListener('DOMContentLoaded', () => {
  const page = getPage();
  if (page === 'login.html') initLogin();
  if (page === 'signup.html') initSignup();
});

// ── Login ────────────────────────────────────────────────────────
function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const roleSelect = document.getElementById('role').value;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Super admin bypass is handled by inline script in login.html
    if (email.toLowerCase() === 'admin123@gmail.com') return;

    if (!roleSelect) {
      alert('Please select a role');
      return;
    }

    const xRole = ROLE_MAP[roleSelect] || 'CLIENT';

    try {
      let data;
      if (roleSelect === 'manager') {
        data = await authRequest('/api/auth/manager/login', { email, password }, xRole);
      } else {
        data = await authRequest('/api/auth/login', { email, password }, xRole);
      }

      // Backend returns user object directly (login) or { user, client } (signup)
      const user = data.user || data;
      const userId = user.user_id || user.userId;
      const dbRole = user.role; // e.g. 'GIG', 'CLIENT', 'MANAGER'
      const headerRole = DB_ROLE_TO_HEADER[dbRole] || dbRole; // → 'GIG_PROFESSIONAL'

      setSession({
        userId,
        role: headerRole,
        name: user.name || '',
        appliedTaskIds: [],
      });

      // Also map for dashboard redirect
      window.location.href = getDashboardPath(headerRole);
    } catch (err) {
      console.error('Login failed:', err);
    }
  });
}

// ── Signup ───────────────────────────────────────────────────────
function initSignup() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const roleSelect = document.getElementById('role').value;
    const name = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!roleSelect) { alert('Please select a role'); return; }
    if (password !== confirmPassword) { alert('Passwords do not match'); return; }

    const xRole = ROLE_MAP[roleSelect] || 'CLIENT';

    try {
      const data = await authRequest('/api/auth/signup', { name, email, password, role: roleSelect }, xRole);

      const user = data.user || data;
      const userId = user.user_id || user.userId;
      const dbRole = user.role;
      const headerRole = DB_ROLE_TO_HEADER[dbRole] || dbRole;

      setSession({
        userId,
        role: headerRole,
        name: user.name || name,
        appliedTaskIds: [],
      });

      window.location.href = getDashboardPath(headerRole);
    } catch (err) {
      console.error('Signup failed:', err);
    }
  });
}
