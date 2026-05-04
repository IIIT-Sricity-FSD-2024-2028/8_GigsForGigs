// ─── adminShared.js ─────────────────────────────────────────────
// Shared DOM helpers for all Super Admin pages:
//   - Sidebar HTML injection
//   - Toast notifications
//   - Modal dialogs
//   - Table rendering
//   - Formatting utilities
// ─────────────────────────────────────────────────────────────────

// ── Sidebar ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: 'dashboard.html',          icon: 'grid',        label: 'Dashboard' },
  { href: 'users.html',              icon: 'users',       label: 'Users' },
  { href: 'clients.html',            icon: 'user',        label: 'Clients' },
  { href: 'managers.html',           icon: 'user-plus',   label: 'Managers' },
  { href: 'gig-professionals.html',  icon: 'briefcase',   label: 'Gig Professionals' },
  { href: 'tasks.html',              icon: 'folder',      label: 'Tasks' },
  { href: 'applications.html',       icon: 'file-text',   label: 'Applications' },
  { href: 'assignments.html',        icon: 'link',        label: 'Assignments' },
  { href: 'deliverables.html',       icon: 'package',     label: 'Deliverables' },
  { href: 'payments.html',           icon: 'credit-card', label: 'Payments' },
  { href: 'reviews.html',            icon: 'star',        label: 'Reviews' },
  { href: 'settings.html',           icon: 'settings',    label: 'Settings' },
];

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>',
  package: '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>',
  'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
  settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
};

function svgIcon(name) {
  return `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`;
}

export function injectSidebar(activePage) {
  const sidebar = document.getElementById('admin-sidebar');
  if (!sidebar) return;

  const navHtml = NAV_ITEMS.map(item => {
    const active = activePage === item.href ? ' active' : '';
    return `<a href="${item.href}" class="admin-nav-item${active}">${svgIcon(item.icon)} ${item.label}</a>`;
  }).join('');

  sidebar.innerHTML = `
    <div class="admin-sidebar-brand" style="margin-bottom:var(--spacing-md);">
      <div class="admin-brand-text">
        <span class="admin-brand-title">GigsForGigs</span>
        <span class="admin-brand-subtitle" style="font-size:0.65rem;">Platform Admin</span>
      </div>
    </div>
    <nav class="admin-nav">${navHtml}</nav>
    <div class="admin-sidebar-footer">
      <div class="admin-footer-avatar">SA</div>
      <div class="admin-footer-info" style="flex:1;">
        <span class="admin-footer-name">Super Admin</span>
        <span class="admin-footer-role" style="text-transform:uppercase;font-size:0.6rem;letter-spacing:0.08em;">ADMIN</span>
      </div>
    </div>
    <div style="padding: 0 var(--spacing-md) var(--spacing-xl);">
      <button class="admin-sidebar-logout" id="admin-logout-btn">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        Logout
      </button>
    </div>
  `;

  document.getElementById('admin-logout-btn')?.addEventListener('click', async () => {
    const ok = await confirmAction('Are you sure you want to log out of the admin panel?');
    if (ok) {
      sessionStorage.clear();
      localStorage.removeItem('admin_token');
      window.location.href = '../../index.html';
    }
  });
}

// ── Toast ─────────────────────────────────────────────────────────

let toastTimer = null;

export function showToast(message, type = 'success') {
  let container = document.getElementById('admin-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'admin-toast-container';
    container.style.cssText = 'position:fixed;top:24px;right:24px;z-index:10000;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `admin-toast admin-toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Modal ─────────────────────────────────────────────────────────

export function openModal(title, bodyHtml, onSubmit) {
  closeModal(); // close any existing

  const backdrop = document.createElement('div');
  backdrop.id = 'admin-modal-backdrop';
  backdrop.className = 'admin-modal-backdrop';

  backdrop.innerHTML = `
    <div class="admin-modal-panel">
      <div class="admin-modal-header">
        <h2 class="admin-modal-title">${title}</h2>
        <button class="admin-modal-close" id="admin-modal-close-btn" aria-label="Close">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <form id="admin-modal-form" class="admin-modal-body">
        ${bodyHtml}
        <div class="admin-modal-footer">
          <button type="button" class="btn btn-outline" id="admin-modal-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary-blue">Save</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('visible'));

  const close = () => closeModal();
  backdrop.querySelector('#admin-modal-close-btn').addEventListener('click', close);
  backdrop.querySelector('#admin-modal-cancel-btn').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  backdrop.querySelector('#admin-modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    // Convert numeric fields
    for (const key of ['budget', 'amount', 'rating', 'deliverable_no']) {
      if (data[key] !== undefined && data[key] !== '') {
        data[key] = Number(data[key]);
      }
    }
    try {
      await onSubmit(data);
      close();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

export function closeModal() {
  const existing = document.getElementById('admin-modal-backdrop');
  if (existing) {
    existing.classList.remove('visible');
    setTimeout(() => existing.remove(), 200);
  }
}

// ── Confirm Dialog ────────────────────────────────────────────────

export function confirmAction(message) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'admin-modal-backdrop';
    backdrop.innerHTML = `
      <div class="admin-modal-panel" style="max-width:420px;">
        <div class="admin-modal-header">
          <h2 class="admin-modal-title">Confirm Action</h2>
        </div>
        <div class="admin-modal-body">
          <p style="color:var(--color-text-muted);margin-bottom:var(--spacing-xl);line-height:1.6;">${message}</p>
          <div class="admin-modal-footer">
            <button type="button" class="btn btn-outline" id="confirm-cancel">Cancel</button>
            <button type="button" class="btn btn-primary-blue" id="confirm-ok" style="background:#d32f2f;border-color:#d32f2f;">Delete</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('visible'));

    const cleanup = (result) => {
      backdrop.classList.remove('visible');
      setTimeout(() => backdrop.remove(), 200);
      resolve(result);
    };

    backdrop.querySelector('#confirm-cancel').addEventListener('click', () => cleanup(false));
    backdrop.querySelector('#confirm-ok').addEventListener('click', () => cleanup(true));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cleanup(false); });
  });
}

// ── Table Rendering ───────────────────────────────────────────────

export function renderTable(containerId, { columns, rows, onDelete, deleteLabel = 'Delete', emptyMessage = 'No data found.' }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (rows.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-state">
        <svg width="48" height="48" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
        <p>${emptyMessage}</p>
      </div>`;
    return;
  }

  const ths = columns.map(c => `<th>${c.label}</th>`).join('') + (onDelete ? '<th>Actions</th>' : '');
  const trs = rows.map(row => {
    const tds = columns.map(c => {
      const val = typeof c.render === 'function' ? c.render(row) : (row[c.key] ?? '—');
      return `<td>${val}</td>`;
    }).join('');
    const actions = onDelete
      ? `<td><button class="admin-action-btn admin-delete-btn" data-id="${c => c.id}" title="${deleteLabel}">
           <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
         </button></td>`
      : '';
    return `<tr>${tds}${actions}</tr>`;
  }).join('');

  container.innerHTML = `
    <table class="admin-table">
      <thead><tr>${ths}</tr></thead>
      <tbody>${trs}</tbody>
    </table>`;
}

// ── Search Bar ────────────────────────────────────────────────────

export function renderSearchBar(containerId, placeholder, onSearch) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="admin-search-wrapper">
      <svg class="admin-search-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <input type="text" class="admin-search-input" placeholder="${placeholder}">
    </div>
  `;

  const input = container.querySelector('input');
  input.addEventListener('input', (e) => {
    onSearch(e.target.value.toLowerCase());
  });
}

// ── Filter Bar ────────────────────────────────────────────────────
// filters: [{ key, label, options: [{value, label}] }]
// onFilter: called with an object of { key: selectedValue } whenever any filter changes

export function renderFilterBar(containerId, filters, onFilter) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const state = {};
  filters.forEach(f => state[f.key] = '');

  const selects = filters.map(f => {
    const opts = [{ value: '', label: `All ${f.label}` }, ...f.options]
      .map(o => `<option value="${o.value}">${o.label}</option>`).join('');
    return `
      <div style="display:flex;align-items:center;gap:6px;">
        <select class="admin-filter-select" data-filter-key="${f.key}">
          ${opts}
        </select>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="admin-filter-bar">
      <span class="admin-filter-label">Filter:</span>
      ${selects}
      <button class="admin-filter-reset" id="filter-reset-${containerId}">✕ Reset</button>
    </div>
  `;

  container.querySelectorAll('.admin-filter-select').forEach(sel => {
    sel.addEventListener('change', () => {
      state[sel.dataset.filterKey] = sel.value;
      onFilter({ ...state });
    });
  });

  container.querySelector(`#filter-reset-${containerId}`)?.addEventListener('click', () => {
    container.querySelectorAll('.admin-filter-select').forEach(sel => {
      sel.value = '';
      state[sel.dataset.filterKey] = '';
    });
    onFilter({ ...state });
  });
}

// ── Formatting ────────────────────────────────────────────────────

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getInitials(name) {
  const parts = String(name || 'U').split(/\s+/);
  return `${parts[0][0]}${(parts[1] || '')[0] || ''}`.toUpperCase();
}

export function statusBadge(status) {
  const map = {
    OPEN: 'admin-badge-active',
    IN_PROGRESS: 'admin-badge-pending',
    COMPLETED: 'admin-badge-verified',
    CANCELLED: 'admin-badge-suspended',
    CLIENT: 'admin-badge-active',
    GIG: 'admin-badge-verified',
    MANAGER: 'admin-badge-pending',
    ADMIN: 'admin-badge-pending',
    SUPER_ADMIN: 'admin-badge-super-admin',
    // Rating levels
    HIGH: 'admin-badge-verified',
    MEDIUM: 'admin-badge-pending',
    LOW: 'admin-badge-suspended',
  };
  const cls = map[status] || 'admin-tag';
  const label = String(status || '').replace(/_/g, ' ');
  return `<span class="admin-tag ${cls}">${label}</span>`;
}

// ── Loading State ─────────────────────────────────────────────────

export function showLoading(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="admin-loading">
      <div class="admin-spinner"></div>
      <p>Loading data...</p>
    </div>`;
}

// ── Form Field Helper ─────────────────────────────────────────────

export function formField(label, name, type = 'text', options = {}) {
  const { required = true, placeholder = '', value = '', choices } = options;
  const req = required ? 'required' : '';

  if (choices) {
    const opts = choices.map(c => {
      const sel = c.value === value ? 'selected' : '';
      return `<option value="${c.value}" ${sel}>${c.label}</option>`;
    }).join('');
    return `
      <div class="admin-form-group">
        <label class="admin-form-label">${label}</label>
        <select name="${name}" class="admin-form-input" ${req}>${opts}</select>
      </div>`;
  }

  return `
    <div class="admin-form-group">
      <label class="admin-form-label">${label}</label>
      <input type="${type}" name="${name}" class="admin-form-input" placeholder="${placeholder}" value="${value}" ${req}>
    </div>`;
}
