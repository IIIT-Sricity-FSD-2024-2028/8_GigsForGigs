// ─── managers.js ────────────────────────────────────────────────
// add-manager.html      → client creates manager account (single form)
// add-manager-flow.html → multi‑step version, step state in sessionStorage
// ─────────────────────────────────────────────────────────────────

import { users } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';
import { validateManagerInviteForm } from '../utils/validation.js';
import { generateId } from '../utils/helpers.js';

// ── Session keys for multi‑step flow ─────────────────────────────

const FLOW_STEP_KEY = 'gfg_manager_flow_step';
const FLOW_EMAIL_KEY = 'gfg_manager_flow_email';

// ── add-manager.html (single form) ──────────────────────────────

function initAddManager() {
  const user = getUser();
  if (!user) return;

  const form = document.querySelector('.modal-card form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateManagerInviteForm()) return;

    const emailField = document.getElementById('manager-email');
    const email = emailField ? emailField.value.trim() : '';

    if (!email) return;

    // Check if email already exists
    if (users.find(u => u.email === email)) {
      let errEl = document.getElementById('manager-email-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'manager-email-error';
        errEl.style.cssText = 'color:var(--color-primary-blue);font-size:0.8rem;margin-top:4px;';
        emailField.insertAdjacentElement('afterend', errEl);
      }
      errEl.textContent = 'A user with this email already exists.';
      return;
    }

    // Create manager linked to the current client
    const newManager = {
      id: generateId('u'),
      name: email.split('@')[0],  // derive name from email for now
      email,
      password: 'manager123',     // default password for mock
      role: 'manager',
      clientId: user.id,
      createdAt: new Date().toISOString()
    };
    users.push(newManager);

    // Redirect back to profile selection
    window.location.href = 'client-profile-selection.html';
  });
}

// ── add-manager-flow.html (multi‑step overlay) ───────────────────

function initAddManagerFlow() {
  const user = getUser();
  if (!user) return;

  const form = document.querySelector('.invitation-modal form');
  if (!form) return;

  // Restore step state
  const currentStep = sessionStorage.getItem(FLOW_STEP_KEY) || '1';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateManagerInviteForm()) return;

    const emailField = document.getElementById('email');
    const email = emailField ? emailField.value.trim() : '';

    if (!email) return;

    if (currentStep === '1') {
      // Store email and advance to confirmation step
      sessionStorage.setItem(FLOW_EMAIL_KEY, email);
      sessionStorage.setItem(FLOW_STEP_KEY, '2');

      // Check if email already exists
      if (users.find(u => u.email === email)) {
        let errEl = document.getElementById('email-error');
        if (!errEl) {
          errEl = document.createElement('div');
          errEl.id = 'email-error';
          errEl.style.cssText = 'color:var(--color-primary-blue);font-size:0.8rem;margin-top:4px;';
          emailField.insertAdjacentElement('afterend', errEl);
        }
        errEl.textContent = 'A user with this email already exists.';
        sessionStorage.removeItem(FLOW_STEP_KEY);
        return;
      }

      // Create the manager
      const newManager = {
        id: generateId('u'),
        name: email.split('@')[0],
        email,
        password: 'manager123',
        role: 'manager',
        clientId: user.id,
        createdAt: new Date().toISOString()
      };
      users.push(newManager);

      // Clean up flow state
      sessionStorage.removeItem(FLOW_STEP_KEY);
      sessionStorage.removeItem(FLOW_EMAIL_KEY);

      window.location.href = 'client-profile-selection.html';
    }
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

// ── Public entry point ───────────────────────────────────────────

export function init() {
  const path = window.location.pathname;

  if (path.includes('add-manager-flow.html')) {
    initAddManagerFlow();
  } else if (path.includes('add-manager.html')) {
    initAddManager();
  }
}
