// ─── adminAuth.js ───────────────────────────────────────────────
// Admin session management & page guard.
// Completely separate from the main app auth system.
// ─────────────────────────────────────────────────────────────────

import { adminUsers, saveAdmins, adminId } from './adminData.js';

const SESSION_KEY = 'gfg_admin_user';

// ── Session ──────────────────────────────────────────────────────

export function getAdminSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setAdminSession(admin) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(admin)); } catch {}
}

export function clearAdminSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

// ── Guard ────────────────────────────────────────────────────────

export function guardAdminPage() {
  const session = getAdminSession();
  if (!session) {
    // Redirect to the main login page
    window.location.replace('../../pages/login.html');
    return null;
  }
  // Verify session user still exists
  const exists = adminUsers.find(u => u.id === session.id && u.status !== 'suspended');
  if (!exists) {
    clearAdminSession();
    window.location.replace('../../pages/login.html');
    return null;
  }
  return session;
}

// ── Login (called from the main login page via admin.js) ─────────

export function attemptAdminLogin(email, password) {
  const normalEmail = String(email || '').trim().toLowerCase();
  const match = adminUsers.find(
    u => String(u.email || '').toLowerCase() === normalEmail && u.password === password
  );
  if (!match) return null;
  if (match.status === 'suspended') return null;
  const session = { id: match.id, name: match.name, email: match.email, role: match.role };
  setAdminSession(session);
  return session;
}

// ── Sidebar identity injection ───────────────────────────────────

export function injectAdminIdentity() {
  const session = getAdminSession();
  if (!session) return;

  const admin = adminUsers.find(u => u.id === session.id) || session;

  // Footer name
  document.querySelectorAll('.admin-footer-name').forEach(el => {
    el.textContent = admin.name || 'Admin';
  });

  // Footer avatar (text initials OR background image)
  document.querySelectorAll('.admin-footer-avatar').forEach(el => {
    if (admin.avatar) {
      el.style.backgroundImage = `url('${admin.avatar}')`;
      el.style.backgroundSize = 'cover';
      el.textContent = '';
    } else {
      const parts = String(admin.name || 'A').split(/\s+/);
      el.textContent = `${parts[0][0]}${(parts[1] || '')[0] || ''}`.toUpperCase();
    }
  });

  // Footer role
  document.querySelectorAll('.admin-footer-role').forEach(el => {
    el.textContent = admin.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN';
  });
}

// ── Logout ───────────────────────────────────────────────────────

export function bindAdminLogout() {
  // Dashboard logout button
  const logoutBtn = document.getElementById('dash-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearAdminSession();
      window.location.replace('../../pages/login.html');
    });
  }
}

// ── Create new admin user ────────────────────────────────────────

export function createAdmin({ name, email, password, role = 'admin' }) {
  const dup = adminUsers.find(u => String(u.email || '').toLowerCase() === email.toLowerCase());
  if (dup) return { ok: false, error: 'Email already in use.' };
  const admin = {
    id: adminId('sa'),
    name, email, password,
    role,
    status: 'active',
    avatar: `https://i.pravatar.cc/150?u=${email.split('@')[0]}`,
    createdAt: new Date().toISOString()
  };
  adminUsers.push(admin);
  saveAdmins();
  return { ok: true, admin };
}
