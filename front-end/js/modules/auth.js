// ─── auth.js ────────────────────────────────────────────────────
// Authentication module: login, signup, logout, role‑selection,
// and page‑guard.
// ─────────────────────────────────────────────────────────────────

import { users } from '../data/mockData.js';
import { getUser, setUser, clearUser } from '../utils/storage.js';
import { validateLoginForm, validateSignupForm } from '../utils/validation.js';
import { generateId } from '../utils/helpers.js';

// ── Helpers ──────────────────────────────────────────────────────

/** Map role → dashboard or profile path (relative to /pages/) */
function dashboardPathForRole(role, isProfileComplete) {
  if (!isProfileComplete) {
    if (role === 'client') return './client/profile-completion-client.html';
    if (role === 'gig') return './gig/profile-completion-gig.html';
    // Manager has no specific profile completion, bypass to dashboard
    if (role === 'manager') return './manager/manager-dashboard.html';
  }

  const map = {
    client:  './client/client-dashboard.html',
    manager: './manager/manager-dashboard.html',
    gig:     './gig/gig-dashboard.html'
  };
  return map[role] || './login.html';
}

/** Resolve correct relative path to login based on current depth */
function loginPath() {
  const path = window.location.pathname;
  if (path.includes('/client/') || path.includes('/manager/') || path.includes('/gig/')) {
    return '../login.html';
  }
  return 'login.html';
}

// ── Guard ────────────────────────────────────────────────────────

/**
 * If the current user's role is not in `allowedRoles`, redirect
 * to the login page immediately.  Call at the top of every
 * protected page's init.
 *
 * Pass an empty array to allow any authenticated user.
 */
export function guardPage(allowedRoles = []) {
  const user = getUser();
  if (!user) {
    window.location.replace(loginPath());
    return false;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    window.location.replace(loginPath());
    return false;
  }
  return true;
}

// ── Logout ───────────────────────────────────────────────────────

export function logout() {
  clearUser();
  sessionStorage.removeItem('isFirstTimeJoin');
  window.location.href = loginPath();
}

// ── Init per page ────────────────────────────────────────────────

function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // Auto-select role if passed in URL
  const loginParams = new URLSearchParams(window.location.search);
  const roleParam = loginParams.get('role');
  if (roleParam) {
    const roleSelect = document.getElementById('role');
    if (roleSelect) roleSelect.value = roleParam;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const roleSelect = document.getElementById('role');
    const role = roleSelect ? roleSelect.value : null;

    const matched = users.find(
      u => u.email === email && u.password === password && (!role || u.role === role)
    );

    if (!matched) {
      let errEl = document.getElementById('auth-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'auth-error';
        errEl.style.cssText = 'color:var(--color-primary-blue);font-size:0.875rem;margin-bottom:var(--spacing-md);text-align:center;font-weight:600;';
        form.insertBefore(errEl, form.firstChild);
      }
      errEl.textContent = 'Invalid credentials for the selected role.';
      return;
    }

    // Store session
    setUser({ id: matched.id, name: matched.name, role: matched.role });

    if (!matched.isProfileComplete) {
      sessionStorage.setItem('isFirstTimeJoin', '1');
    } else {
      sessionStorage.removeItem('isFirstTimeJoin');
    }

    // Redirect based on role and profile completion
    const dest = dashboardPathForRole(matched.role, matched.isProfileComplete);
    window.location.href = dest;
  });
}

function initSignup() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  // Auto-select role if passed in URL
  const signupParams = new URLSearchParams(window.location.search);
  const roleParam = signupParams.get('role');
  if (roleParam) {
    const roleSelect = document.getElementById('role');
    if (roleSelect) roleSelect.value = roleParam;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    const name = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const roleSelect = document.getElementById('role');
    const role = roleSelect ? roleSelect.value : 'gig';

    // Check duplicate email
    if (users.find(u => u.email === email)) {
      let errEl = document.getElementById('auth-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'auth-error';
        errEl.style.cssText = 'color:var(--color-primary-blue);font-size:0.875rem;margin-bottom:var(--spacing-md);text-align:center;font-weight:600;';
        form.insertBefore(errEl, form.firstChild);
      }
      errEl.textContent = 'An account with this email already exists.';
      return;
    }

    // Create user stub
    const newUser = {
      id: generateId('u'),
      name,
      email,
      password,
      role: role,
      isFirstTimeUser: true,
      isProfileComplete: false,
      createdAt: new Date().toISOString()
    };

    // Add role-specific stats initialized to 0
    if (role === 'client') {
      newUser.tasksPosted = 0;
      newUser.activeProjects = 0;
      newUser.totalSpent = 0;
    } else if (role === 'manager') {
      newUser.tasksManaged = 0;
    } else if (role === 'gig') {
      newUser.completedTasks = 0;
      newUser.totalEarnings = 0;
      newUser.avgRating = 0;
      newUser.totalRatings = 0;
      newUser.profileViews = 0;
    }

    users.push(newUser);

    setUser({ id: newUser.id, name: newUser.name, role: newUser.role });
    sessionStorage.setItem('isFirstTimeJoin', '1');

    const dest = dashboardPathForRole(newUser.role, newUser.isProfileComplete);
    window.location.href = dest + '?firstTime=1';
  });
}

export function init() {
  const path = window.location.pathname;

  if (path.includes('login.html')) {
    initLogin();
  } else if (path.includes('signup.html')) {
    initSignup();
  }
}
