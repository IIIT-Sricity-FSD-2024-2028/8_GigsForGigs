// ─── auth.js ────────────────────────────────────────────────────
// Authentication module: login, signup, logout, role‑selection,
// and page‑guard.
// ─────────────────────────────────────────────────────────────────

import { users, saveUsers } from '../data/mockData.js';
import { getUser, setUser, clearUser, clearAppState } from '../utils/storage.js';
import { validateLoginForm, validateSignupForm } from '../utils/validation.js';
import { generateId } from '../utils/helpers.js';

// ── Helpers ──────────────────────────────────────────────────────

const PENDING_USER_KEY = 'gfg_pending_user';
const ONBOARDING_ROLE_KEY = 'gfg_onboarding_role';
const WINDOW_SESSION_PREFIX = 'gfg_window_user:';

/**
 * Build an app page URL from a path relative to /pages/.
 * This avoids hard-coded absolute paths that break when the app
 * is served from a subfolder or opened via file://.
 */
function resolvePagePath(pathFromPagesRoot) {
  const normalized = String(pathFromPagesRoot || '').replace(/^\/+/, '');
  const currentPath = window.location.pathname;
  const pagesMarker = '/pages/';
  const pagesIndex = currentPath.indexOf(pagesMarker);

  if (pagesIndex !== -1) {
    const base = currentPath.slice(0, pagesIndex + pagesMarker.length);
    return `${base}${normalized}`;
  }

  // Fallback for unexpected routes.
  return `/front-end/pages/${normalized}`;
}

/** Map role → dashboard or profile path (relative to /pages/) */
function dashboardPathForRole(role, isProfileComplete) {
  if (!isProfileComplete) {
    if (role === 'client') return resolvePagePath('client/profile-completion-client.html');
    if (role === 'gig') return resolvePagePath('gig/profile-completion-gig.html');
    // Manager has no specific profile completion, bypass to dashboard
    if (role === 'manager') return resolvePagePath('manager/manager-dashboard.html');
  }

  const map = {
    client:  resolvePagePath('client/client-dashboard.html'),
    manager: resolvePagePath('manager/manager-dashboard.html'),
    gig:     resolvePagePath('gig/gig-dashboard.html')
  };
  return map[role] || resolvePagePath('login.html');
}

/** Resolve correct absolute path to login */
function loginPath() {
  return resolvePagePath('login.html');
}

/** Resolve absolute path to landing page index.html */
function landingPath() {
  const currentPath = window.location.pathname;
  const pagesMarker = '/pages/';
  const pagesIndex = currentPath.indexOf(pagesMarker);

  if (pagesIndex !== -1) {
    const appBase = currentPath.slice(0, pagesIndex);
    return `${appBase}/index.html`;
  }

  const appMarker = '/front-end/';
  const appIndex = currentPath.indexOf(appMarker);
  if (appIndex !== -1) {
    const appBase = currentPath.slice(0, appIndex + appMarker.length);
    return `${appBase}index.html`;
  }

  return '/front-end/index.html';
}

function setPendingUser(user) {
  try {
    sessionStorage.setItem(PENDING_USER_KEY, JSON.stringify(user));
  } catch {}
}

function getPendingUser() {
  try {
    const raw = sessionStorage.getItem(PENDING_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearPendingUser() {
  try {
    sessionStorage.removeItem(PENDING_USER_KEY);
  } catch {}
}

function setOnboardingRole(role) {
  if (!role) return;
  try {
    sessionStorage.setItem(ONBOARDING_ROLE_KEY, role);
  } catch {}
}

function getOnboardingRole() {
  try {
    return sessionStorage.getItem(ONBOARDING_ROLE_KEY);
  } catch {
    return null;
  }
}

function clearOnboardingRole() {
  try {
    sessionStorage.removeItem(ONBOARDING_ROLE_KEY);
  } catch {}
}

function setWindowUser(user) {
  try {
    window.name = `${WINDOW_SESSION_PREFIX}${JSON.stringify(user)}`;
  } catch {}
}

function getWindowUser() {
  try {
    if (!window.name || !window.name.startsWith(WINDOW_SESSION_PREFIX)) return null;
    const payload = window.name.slice(WINDOW_SESSION_PREFIX.length);
    const parsed = JSON.parse(payload);
    return parsed && parsed.id && parsed.role ? parsed : null;
  } catch {
    return null;
  }
}

function clearWindowUser() {
  try {
    if (window.name && window.name.startsWith(WINDOW_SESSION_PREFIX)) {
      window.name = '';
    }
  } catch {}
}

function managerNameFromEmail(email, fallbackName = 'Manager') {
  const prefix = String(email || '').trim().split('@')[0];
  return prefix || String(fallbackName || '').trim() || 'Manager';
}

/**
 * Optional hard reset: /pages/signup.html?reset=1 or /pages/login.html?reset=1
 */
function maybeResetFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('reset') !== '1') return;

  clearAppState();
  clearWindowUser();
  clearPendingUser();
  clearOnboardingRole();
  params.delete('reset');

  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash || ''}`;
  window.history.replaceState({}, '', nextUrl);
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
  let user = getUser();

  // Recover auth from pending session handoff if needed.
  if (!user) {
    const pendingUser = getPendingUser();
    if (pendingUser && pendingUser.id && pendingUser.role) {
      setUser(pendingUser);
      user = pendingUser;
    }
  }

  // Final fallback: carry session via window.name across redirects.
  if (!user) {
    const windowUser = getWindowUser();
    if (windowUser) {
      setUser(windowUser);
      setPendingUser(windowUser);
      user = windowUser;
    }
  }

  if (!user) {
    const path = window.location.pathname;
    const isOnboardingPage =
      path.includes('profile-completion-client.html') ||
      path.includes('profile-completion-gig.html');
    const hasOnboardingState = sessionStorage.getItem('isFirstTimeJoin') === '1';

    if (isOnboardingPage && hasOnboardingState) {
      return true;
    }

    window.location.replace(loginPath());
    return false;
  }

  const userExists = users.some(
    (account) => account.id === user.id && account.role === user.role && !account.deleted
  );
  if (!userExists) {
    clearUser();
    clearPendingUser();
    clearOnboardingRole();
    clearWindowUser();
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
  clearPendingUser();
  clearOnboardingRole();
  clearWindowUser();
  sessionStorage.removeItem('isFirstTimeJoin');
  window.location.href = landingPath();
}

// ── Init per page ────────────────────────────────────────────────

function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // Rescue first-time flow if the app lands back on login.
  const hasOnboardingState = sessionStorage.getItem('isFirstTimeJoin') === '1';
  const existingUser = getUser() || getPendingUser() || getWindowUser();
  const onboardingRole = existingUser?.role || getOnboardingRole();

  if (hasOnboardingState && onboardingRole) {
    const dest = dashboardPathForRole(onboardingRole, false);
    window.location.replace(dest);
    return;
  }

  // Auto-select role if passed in URL
  const loginParams = new URLSearchParams(window.location.search);
  const roleParam = loginParams.get('role');
  const emailParam = loginParams.get('email');
  if (roleParam) {
    const roleSelect = document.getElementById('role');
    if (roleSelect) roleSelect.value = roleParam;
  }
  if (emailParam) {
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.value = emailParam;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    const roleSelect = document.getElementById('role');
    const role = roleSelect ? roleSelect.value : null;

    const matchedWithSelectedRole = users.find(
      (u) => String(u.email || '').toLowerCase() === email
        && String(u.password || '') === password
        && !u.deleted
        && (!role || u.role === role)
    );

    // Fallback: allow login by valid credentials even if wrong role is selected.
    const matchedByCredentials = matchedWithSelectedRole || users.find(
      (u) => String(u.email || '').toLowerCase() === email
        && String(u.password || '') === password
        && !u.deleted
    );

    const matched = matchedByCredentials;

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

    if (roleSelect && roleSelect.value !== matched.role) {
      roleSelect.value = matched.role;
    }

    let sessionName = matched.name;
    if (matched.role === 'manager') {
      const derivedManagerName = managerNameFromEmail(matched.email, matched.name);
      sessionName = derivedManagerName;
      if (matched.name !== derivedManagerName) {
        matched.name = derivedManagerName;
        saveUsers();
      }
    }

    // Store session
    const sessionUser = {
      id: matched.id,
      name: sessionName,
      role: matched.role,
      email: matched.email
    };
    setUser(sessionUser);
    setPendingUser(sessionUser);
    setWindowUser(sessionUser);

    if (!matched.isProfileComplete) {
      sessionStorage.setItem('isFirstTimeJoin', '1');
      setOnboardingRole(matched.role);
    } else {
      sessionStorage.removeItem('isFirstTimeJoin');
      clearPendingUser();
      clearOnboardingRole();
    }

    // Redirect based on role and profile completion
    const dest = dashboardPathForRole(matched.role, matched.isProfileComplete);
    window.location.href = dest;
  });
}

function initSignup() {
  const form = document.getElementById('signup-form');
  if (!form) {
    console.error('❌ Signup form not found!');
    return;
  }

  console.log('✅ Signup form initialized');

  // Auto-select role if passed in URL
  const signupParams = new URLSearchParams(window.location.search);
  const roleParam = signupParams.get('role');
  if (roleParam) {
    const roleSelect = document.getElementById('role');
    if (roleSelect) roleSelect.value = roleParam;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('🔍 Signup form submitted');

    const roleSelect = document.getElementById('role');
    const fullname = document.getElementById('fullname');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirm = document.getElementById('confirm-password');

    // Log all field values for debugging
    console.log('📋 Form values:', {
      role: roleSelect?.value || 'NOT SELECTED',
      fullname: fullname?.value || 'EMPTY',
      email: email?.value || 'EMPTY',
      password: password?.value || 'EMPTY',
      confirm: confirm?.value || 'EMPTY'
    });

    if (!validateSignupForm()) {
      console.log('❌ Validation failed - check error messages on form');
      // Scroll to first error
      const firstError = document.querySelector('[id$="-error"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const name = fullname.value.trim();
    const emailVal = email.value.trim();
    const passwordVal = password.value;
    const role = roleSelect?.value || 'gig';
    const managerDerivedName = managerNameFromEmail(emailVal, name);

    console.log('✅ Validation passed');
    console.log('📝 Creating user:', { name, emailVal, role });

    const showSignupError = (message) => {
      let errEl = document.getElementById('auth-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'auth-error';
        errEl.style.cssText = 'color:var(--color-primary-blue);font-size:0.875rem;margin-bottom:var(--spacing-md);text-align:center;font-weight:600;padding:var(--spacing-sm);background-color:rgba(8,75,131,0.1);border-radius:var(--radius-sm);';
        form.insertBefore(errEl, form.firstChild);
      }
      errEl.textContent = message;
    };

    // Check duplicate email
    const existingUser = users.find(u => u.email === emailVal);
    const canClaimSeededU7 = existingUser
      && existingUser.id === 'u7'
      && existingUser.role === 'client'
      && existingUser.isFirstTimeUser === true
      && existingUser.isProfileComplete === false;

    if (existingUser && !canClaimSeededU7) {
      console.log('⚠️ Email already exists:', emailVal);
      showSignupError('⚠️ An account with this email already exists. Try logging in instead.');
      return;
    }

    if (canClaimSeededU7 && role !== 'client') {
      showSignupError('⚠️ This seeded account can only be created as a client account.');
      return;
    }

    let accountUser;

    if (canClaimSeededU7) {
      existingUser.name = name;
      existingUser.password = passwordVal;
      existingUser.tasksPosted = Number(existingUser.tasksPosted) || 0;
      existingUser.activeProjects = Number(existingUser.activeProjects) || 0;
      existingUser.totalSpent = Number(existingUser.totalSpent) || 0;
      accountUser = existingUser;
      console.log('✅ Seeded user claimed:', accountUser.id);
    } else {
      // Create user stub
      const newUser = {
        id: generateId('u'),
        name: role === 'manager' ? managerDerivedName : name,
        email: emailVal,
        password: passwordVal,
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
      accountUser = newUser;
      console.log('✅ User created:', accountUser);
      console.log('📊 Total users in DB:', users.length);
    }

    saveUsers();

    const sessionUser = {
      id: accountUser.id,
      name: accountUser.role === 'manager'
        ? managerNameFromEmail(accountUser.email, accountUser.name)
        : accountUser.name,
      role: accountUser.role,
      email: accountUser.email
    };
    setUser(sessionUser);
    setPendingUser(sessionUser);
    setWindowUser(sessionUser);
    sessionStorage.setItem('isFirstTimeJoin', '1');
    setOnboardingRole(accountUser.role);

    const dest = dashboardPathForRole(accountUser.role, accountUser.isProfileComplete);
    console.log('🚀 Redirecting to:', dest);
    console.log('📍 Current page:', window.location.pathname);
    try {
      console.log('🔗 Full redirect URL will be:', new URL(dest, window.location.href).toString());
    } catch {
      console.log('🔗 Full redirect URL will be:', dest);
    }

    // Give feedback before redirect
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.textContent = 'Creating account... ⏳';

    // Use setTimeout to ensure state is saved
    setTimeout(() => {
      console.log('🔄 Now redirecting...');
      // Try using replace method which is more reliable
      window.location.replace(dest);
    }, 100);
  });
}

export function init() {
  maybeResetFromQuery();

  const path = window.location.pathname;

  if (path.includes('login.html')) {
    initLogin();
  } else if (path.includes('signup.html')) {
    initSignup();
  }
}
