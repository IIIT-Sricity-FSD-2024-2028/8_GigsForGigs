// ─── api.js ─ Central API service layer ──────────────────────────
const API_BASE = 'http://localhost:3000';

let sessionState = null;

function normalizeRole(role) {
  if (role === 'GIG') return 'GIG_PROFESSIONAL';
  return role || '';
}

function hydrateSessionFromWindow() {
  if (sessionState) return sessionState;

  if (typeof window === 'undefined') {
    return null;
  }

  if (window.__GFG_SESSION__ && window.__GFG_SESSION__.userId && window.__GFG_SESSION__.role) {
    sessionState = {
      ...window.__GFG_SESSION__,
      role: normalizeRole(window.__GFG_SESSION__.role),
      appliedTaskIds: Array.isArray(window.__GFG_SESSION__.appliedTaskIds)
        ? window.__GFG_SESSION__.appliedTaskIds
        : [],
    };
    return sessionState;
  }

  if (typeof window.name === 'string' && window.name.trim()) {
    try {
      const parsed = JSON.parse(window.name);
      if (parsed && parsed.userId && parsed.role) {
        sessionState = {
          userId: parsed.userId,
          role: normalizeRole(parsed.role),
          name: parsed.name || '',
          appliedTaskIds: Array.isArray(parsed.appliedTaskIds)
            ? parsed.appliedTaskIds
            : [],
        };
        window.__GFG_SESSION__ = sessionState;
        return sessionState;
      }
    } catch (_) {
      // Ignore invalid window.name payloads.
    }
  }

  return null;
}

function persistSession(nextSession) {
  sessionState = nextSession
    ? {
        userId: nextSession.userId,
        role: normalizeRole(nextSession.role),
        name: nextSession.name || '',
        appliedTaskIds: Array.isArray(nextSession.appliedTaskIds)
          ? [...new Set(nextSession.appliedTaskIds)]
          : [],
      }
    : null;

  if (typeof window !== 'undefined') {
    window.__GFG_SESSION__ = sessionState;
    window.name = sessionState ? JSON.stringify(sessionState) : '';
  }

  return sessionState;
}

export function setSession(session) {
  return persistSession(session);
}

export function updateSession(patch) {
  const current = getUser();
  if (!current) return null;
  return persistSession({
    ...current,
    ...patch,
    appliedTaskIds: patch.appliedTaskIds ?? current.appliedTaskIds ?? [],
  });
}

export function clearSession() {
  sessionState = null;
  if (typeof window !== 'undefined') {
    window.__GFG_SESSION__ = null;
    window.name = '';
  }
}

export function apiRequest(url, method = 'GET', body = null) {
  return request(url, method, body);
}

async function request(url, method, body) {
  const user = getUser();
  const headers = {
    'Content-Type': 'application/json',
    'x-role': user?.role || '',
    'x-user-id': user?.userId || '',
  };

  const options = { method, headers };
  if (body !== null && body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${url}`, options);

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const err = await res.json();
      msg = err.message || msg;
    } catch (_) {}
    alert(msg);
    throw new Error(msg);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function getUser() {
  return hydrateSessionFromWindow();
}

export function requireAuth(allowedRoles) {
  const user = getUser();
  if (!user) {
    window.location.href = getLoginPath();
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    window.location.href = getDashboardPath(user.role);
    return null;
  }
  return user;
}

export function logout() {
  clearSession();
  window.location.href = getLoginPath();
}

function getLoginPath() {
  const depth = window.location.pathname.split('/pages/').length > 1;
  if (window.location.pathname.includes('/pages/client/') ||
      window.location.pathname.includes('/pages/gig/') ||
      window.location.pathname.includes('/pages/manager/')) {
    return '../login.html';
  }
  return 'login.html';
}

export function getDashboardPath(role) {
  const prefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';
  const rel = window.location.pathname.includes('/client/') || 
              window.location.pathname.includes('/gig/') || 
              window.location.pathname.includes('/manager/') ? '../' : '';
  
  switch (role) {
    case 'CLIENT': return `${rel}${prefix}client/client-dashboard.html`;
    case 'GIG_PROFESSIONAL': return `${rel}${prefix}gig/gig-dashboard.html`;
    case 'MANAGER': return `${rel}${prefix}manager/manager-dashboard.html`;
    default: return `${rel}${prefix}client/client-dashboard.html`;
  }
}

export function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getStatusBadgeClass(status) {
  const map = {
    'OPEN': 'status-scheduled',
    'IN_PROGRESS': 'status-in-progress',
    'COMPLETED': 'status-review-needed',
    'CANCELLED': 'status-cancelled',
    'PENDING': 'status-scheduled',
    'SHORTLISTED': 'status-in-progress',
    'ACCEPTED': 'status-review-needed',
    'REJECTED': 'status-cancelled',
    'DECLINED': 'status-cancelled',
    'accepted': 'status-review-needed',
    'rejected': 'status-cancelled',
    'declined': 'status-cancelled',
  };
  return map[status] || 'status-scheduled';
}
