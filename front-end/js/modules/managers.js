// ─── managers.js ────────────────────────────────────────────────
// add-manager.html      → client creates manager account (single form)
// add-manager-flow.html → multi‑step version, step state in sessionStorage
// ─────────────────────────────────────────────────────────────────

import { users, saveUsers } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';
import { validateManagerInviteForm } from '../utils/validation.js';
import { generateId } from '../utils/helpers.js';

// ── Session keys for multi‑step flow ─────────────────────────────

const FLOW_STEP_KEY = 'gfg_manager_flow_step';
const FLOW_EMAIL_KEY = 'gfg_manager_flow_email';
const INVITES_STORAGE_KEY = 'gfg_manager_invites';

function loadManagerInvites() {
  try {
    const raw = localStorage.getItem(INVITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveManagerInvites(invites) {
  try {
    localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invites));
  } catch {}
}

function inviteSetupPath(inviteId) {
  return `/front-end/pages/manager/manager-invite-setup.html?invite=${encodeURIComponent(inviteId)}`;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function showFieldError(field, errorId, message) {
  if (!field) return;
  let errEl = document.getElementById(errorId);
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.id = errorId;
    errEl.style.cssText = 'color:var(--color-primary-blue);font-size:0.8rem;margin-top:4px;font-weight:500;';
    field.insertAdjacentElement('afterend', errEl);
  }
  errEl.textContent = message;
}

function createManagerInvite(clientUser, email) {
  const invites = loadManagerInvites();
  const normalizedEmail = normalizeEmail(email);

  const existingPending = invites.find(
    i => i.status === 'pending' && normalizeEmail(i.email) === normalizedEmail
  );

  if (existingPending) {
    if (existingPending.clientId !== clientUser.id) {
      return { invite: null, reused: false, conflict: true };
    }
    return { invite: existingPending, reused: true, conflict: false };
  }

  const invite = {
    id: generateId('inv'),
    email: normalizedEmail,
    clientId: clientUser.id,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  invites.push(invite);
  saveManagerInvites(invites);
  return { invite, reused: false, conflict: false };
}

function handleInviteCreation(currentUser, emailField, emailRaw) {
  const email = normalizeEmail(emailRaw);
  if (!email) return;

  const existingActiveUser = users.find(
    (u) => normalizeEmail(u.email) === email && !u.deleted
  );
  if (existingActiveUser) {
    showFieldError(emailField, `${emailField.id}-error`, 'A user with this email already exists.');
    return;
  }

  const deletedManager = users.find(
    (u) => normalizeEmail(u.email) === email && u.role === 'manager' && u.deleted
  );
  if (deletedManager && deletedManager.clientId !== currentUser.id) {
    showFieldError(emailField, `${emailField.id}-error`, 'This manager email is linked to another client account.');
    return;
  }

  const { invite, conflict } = createManagerInvite(currentUser, email);
  if (conflict) {
    showFieldError(emailField, `${emailField.id}-error`, 'This email already has a pending invite from another client.');
    return;
  }

  window.location.href = inviteSetupPath(invite.id);
}

// ── add-manager.html (single form) ──────────────────────────────

function initAddManager() {
  const user = getUser();
  if (!user || user.role !== 'client') return;

  const form = document.querySelector('.modal-card form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateManagerInviteForm()) return;

    const emailField = document.getElementById('manager-email');
    const email = emailField ? emailField.value.trim() : '';

    if (!email) return;

    handleInviteCreation(user, emailField, email);
  });
}

// ── add-manager-flow.html (multi‑step overlay) ───────────────────

function initAddManagerFlow() {
  const user = getUser();
  if (!user || user.role !== 'client') return;

  const form = document.querySelector('.invitation-modal form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateManagerInviteForm()) return;

    const emailField = document.getElementById('email');
    const email = emailField ? emailField.value.trim() : '';

    if (!email) return;

    handleInviteCreation(user, emailField, email);
  });

  // Cancel buttons — clean up flow state
  const cancelBtns = document.querySelectorAll('a[href="client-profile-selection.html"]');
  cancelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sessionStorage.removeItem(FLOW_STEP_KEY);
      sessionStorage.removeItem(FLOW_EMAIL_KEY);
    });
  });
}

function initManagerInviteSetup() {
  const form = document.getElementById('manager-password-setup-form');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const inviteId = params.get('invite');
  const infoEl = document.getElementById('invite-setup-info');
  const emailInput = document.getElementById('manager-email');

  if (!inviteId) {
    if (infoEl) infoEl.textContent = 'Invite link is invalid or missing.';
    form.style.display = 'none';
    return;
  }

  const invites = loadManagerInvites();
  const invite = invites.find(i => i.id === inviteId);

  if (!invite || invite.status !== 'pending') {
    if (infoEl) infoEl.textContent = 'This invite is no longer active. Please request a new invite from your client.';
    form.style.display = 'none';
    return;
  }

  if (emailInput) emailInput.value = invite.email;
  if (infoEl) infoEl.textContent = 'Set your password to activate your manager account.';

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('manager-name');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const statusEl = document.getElementById('invite-setup-status');

    if (!passwordInput || !confirmInput) return;

    const name = (nameInput?.value || '').trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (password.length < 8) {
      if (statusEl) statusEl.textContent = 'Password must be at least 8 characters.';
      return;
    }

    if (password !== confirm) {
      if (statusEl) statusEl.textContent = 'Passwords do not match.';
      return;
    }

    const existingUser = users.find(
      (u) => normalizeEmail(u.email) === normalizeEmail(invite.email) && !u.deleted
    );
    const deletedManager = users.find(
      (u) => normalizeEmail(u.email) === normalizeEmail(invite.email) && u.role === 'manager' && u.deleted
    );

    if (existingUser && (existingUser.role !== 'manager' || existingUser.clientId !== invite.clientId)) {
      if (statusEl) statusEl.textContent = 'This email is already used by another account.';
      return;
    }

    if (deletedManager && deletedManager.clientId !== invite.clientId) {
      if (statusEl) statusEl.textContent = 'This email is already linked to another client account.';
      return;
    }

    const managerAccount = existingUser || deletedManager;

    if (managerAccount) {
      managerAccount.password = password;
      managerAccount.name = name || managerAccount.name || invite.email.split('@')[0];
      managerAccount.isFirstTimeUser = true;
      managerAccount.isProfileComplete = false;
      managerAccount.tasksManaged = managerAccount.tasksManaged || 0;
      managerAccount.clientId = invite.clientId;
      managerAccount.deleted = false;
      delete managerAccount.deletedAt;
    } else {
      users.push({
        id: generateId('u'),
        name: name || invite.email.split('@')[0],
        email: invite.email,
        password,
        role: 'manager',
        isFirstTimeUser: true,
        isProfileComplete: false,
        clientId: invite.clientId,
        createdAt: new Date().toISOString(),
        tasksManaged: 0,
        deleted: false
      });
    }

    invite.status = 'accepted';
    invite.acceptedAt = new Date().toISOString();

    saveUsers();
    saveManagerInvites(invites);

    window.location.href = `/front-end/pages/login.html?role=manager&email=${encodeURIComponent(invite.email)}`;
  });
}

// ── Public entry point ───────────────────────────────────────────

export function init() {
  const path = window.location.pathname;

  if (path.includes('manager-invite-setup.html')) {
    initManagerInviteSetup();
  } else if (path.includes('add-manager-flow.html')) {
    initAddManagerFlow();
  } else if (path.includes('add-manager.html')) {
    initAddManager();
  }
}
