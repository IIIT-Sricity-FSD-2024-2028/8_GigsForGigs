// ─── api.js ─ Central API service layer ──────────────────────────
const API_BASE = 'http://localhost:3000';

export async function apiRequest(url, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'role': localStorage.getItem('role') || '',
    'x-role': localStorage.getItem('role') || '',
    'x-user-id': localStorage.getItem('userId') || '',
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

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
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('userName');
  if (!userId || !role) return null;
  return { userId, role, name };
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
  localStorage.removeItem('userId');
  localStorage.removeItem('role');
  localStorage.removeItem('userName');
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
    'DECLINED': 'status-cancelled',
    'APPROVED': 'status-review-needed',
    'REJECTED': 'status-cancelled',
  };
  return map[status] || 'status-scheduled';
}
