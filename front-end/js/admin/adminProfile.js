// ─── adminProfile.js ────────────────────────────────────────────
// admin-profile.html — Profile form, password change.
// ─────────────────────────────────────────────────────────────────

import { adminUsers, saveAdmins, findById } from './adminData.js';
import { getAdminSession, setAdminSession, injectAdminIdentity } from './adminAuth.js';

export function init() {
  hydrateProfile();
  bindSaveProfile();
  bindChangePassword();
}

function hydrateProfile() {
  const session = getAdminSession();
  if (!session) return;
  const admin = findById(adminUsers, session.id);
  if (!admin) return;

  // Fill profile fields
  setVal('profile-name', admin.name);
  setVal('profile-email', admin.email);
  setVal('profile-role', admin.role === 'super_admin' ? 'Super Admin' : 'Admin');

  // Avatar
  const avatarEl = document.querySelector('.admin-profile-avatar, .profile-avatar');
  if (avatarEl && admin.avatar) {
    avatarEl.style.backgroundImage = `url('${admin.avatar}')`;
    avatarEl.style.backgroundSize = 'cover';
  }

  // Display name prominently
  const nameEl = document.querySelector('.profile-display-name, h1, h2');
  if (nameEl && nameEl.closest('.admin-main')) {
    nameEl.textContent = admin.name;
  }
}

function bindSaveProfile() {
  document.querySelectorAll('button').forEach(btn => {
    if (/save|update profile/i.test(btn.textContent)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const session = getAdminSession();
        if (!session) return;
        const admin = findById(adminUsers, session.id);
        if (!admin) return;

        const newName = getVal('profile-name');
        const newEmail = getVal('profile-email');

        if (newName) admin.name = newName;
        if (newEmail) admin.email = newEmail;

        saveAdmins();
        setAdminSession({ ...session, name: admin.name, email: admin.email });
        injectAdminIdentity();
        showToast('Profile updated successfully!');
      });
    }
  });
}

function bindChangePassword() {
  document.querySelectorAll('button').forEach(btn => {
    if (/change password|update password/i.test(btn.textContent)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const session = getAdminSession();
        if (!session) return;
        const admin = findById(adminUsers, session.id);
        if (!admin) return;

        const current = getVal('current-password') || getVal('old-password');
        const newPass = getVal('new-password');
        const confirm = getVal('confirm-password');

        if (!newPass) { alert('Please enter a new password.'); return; }
        if (newPass.length < 6) { alert('Password must be at least 6 characters.'); return; }
        if (newPass !== confirm) { alert('Passwords do not match.'); return; }
        if (current && current !== admin.password) { alert('Current password is incorrect.'); return; }

        admin.password = newPass;
        saveAdmins();
        showToast('Password changed successfully!');

        // Clear password fields
        ['current-password', 'old-password', 'new-password', 'confirm-password'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
      });
    }
  });
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = val || '';
    else el.textContent = val || '';
  }
}

function showToast(message) {
  const existing = document.getElementById('admin-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'admin-toast';
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--color-primary-dark);color:white;padding:12px 24px;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,0.15);';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
