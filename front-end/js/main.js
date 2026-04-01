// ─── main.js ────────────────────────────────────────────────────
// Entry point.  Detects the current page from window.location,
// runs guardPage(), then calls the correct module's init().
//
// Included in each HTML file as:
//   <script type="module" src="../../js/main.js">
// ─────────────────────────────────────────────────────────────────

import { guardPage } from './modules/auth.js';
import * as auth from './modules/auth.js';
import * as tasks from './modules/tasks.js';
import * as applications from './modules/applications.js';
import * as deliverables from './modules/deliverables.js';
import * as managers from './modules/managers.js';
import * as profile from './modules/profile.js';
import * as dashboard from './modules/dashboard.js';
import * as services from './modules/services.js';
import { getUser } from './utils/storage.js';
import { users } from './data/mockData.js';

// ── Page → module mapping ────────────────────────────────────────

// Page → { module, allowedRoles }
// allowedRoles: empty array = any authenticated role
const PAGE_MAP = {
  // Auth pages (public — no guard)
  'login.html':                     { module: auth,          public: true },
  'signup.html':                    { module: auth,          public: true },
  'role-selection.html':            { module: auth,          public: true },
  'manager-invite-setup.html':      { module: managers,      public: true },

  // Client pages
  'post-gig.html':                  { module: tasks,         roles: ['client'] },
  'my-gigs-client.html':            { module: tasks,         roles: ['client', 'manager'] },
  'review-shortlist.html':          { module: applications,  roles: ['client', 'manager'] },
  'review-deliverables.html':       { module: deliverables,  roles: ['client', 'manager'] },
  'search-talent.html':             { module: services,      roles: ['client', 'manager'] },
  'client-dashboard.html':          { module: dashboard,     roles: ['client'] },
  'client-profile-selection.html':  { module: dashboard,     roles: ['client'] },
  'add-manager.html':               { module: managers,      roles: ['client'] },
  'add-manager-flow.html':          { module: managers,      roles: ['client'] },
  'profile-completion-client.html': { module: profile,       roles: [] },

  // Manager pages
  'manager-dashboard.html':         { module: tasks,         roles: ['manager'] },

  // Gig professional pages
  'gig-dashboard.html':             { module: dashboard,     roles: ['gig'] },
  'gig-profile.html':               { module: profile,       roles: ['gig'] },
  'profile-completion-gig.html':    { module: profile,       roles: [] },
  'explore-tasks.html':             { module: tasks,         roles: ['gig'] },
  'pending-requests.html':          { module: applications,  roles: ['gig'] },
  'active-tasks.html':              { module: tasks,         roles: ['gig'] },
  'completed-projects.html':        { module: deliverables,  roles: ['gig'] },
  'project-detail.html':            { module: deliverables,  roles: ['gig', 'client', 'manager'] },
  'post-service.html':              { module: services,      roles: ['gig'] },
  'service-published.html':         { module: null,          roles: ['gig'] },
  'total-earnings.html':            { module: null,          roles: ['gig'] },
  'submit-deliverables.html':       { module: deliverables,  roles: ['gig'] },
  'submission-success.html':        { module: null,          roles: ['gig'] }
};

const SEEDED_CLIENT_IDS = new Set(['u1']);
const SEARCH_TALENT_CLIENT_IDS = new Set(['u1', 'u7']);

const CLIENT_SIDEBAR_ITEMS = [
  {
    key: 'client-dashboard.html',
    href: 'client-dashboard.html',
    label: 'Dashboard',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>'
  },
  {
    key: 'post-gig.html',
    href: 'post-gig.html',
    label: 'Post a Gig',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
  },
  {
    key: 'search-talent.html',
    href: 'search-talent.html',
    label: 'Search Talent',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
  },
  {
    key: 'my-gigs-client.html',
    href: 'my-gigs-client.html',
    label: 'My Gigs',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
  },
  {
    key: 'review-shortlist.html',
    href: 'review-shortlist.html',
    label: 'Review Shortlist',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>'
  },
  {
    key: 'review-deliverables.html',
    href: 'review-deliverables.html',
    label: 'Review Deliverables',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>'
  },
  {
    key: 'client-profile-selection.html',
    href: 'client-profile-selection.html',
    label: 'Supervise Manager',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'
  }
];

const GIG_SIDEBAR_ITEMS = [
  {
    key: 'gig-dashboard.html',
    href: 'gig-dashboard.html',
    label: 'Dashboard',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
  },
  {
    key: 'explore-tasks.html',
    href: 'explore-tasks.html',
    label: 'Explore Tasks',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
  },
  {
    key: 'active-tasks.html',
    href: 'active-tasks.html',
    label: 'Active Tasks',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
  },
  {
    key: 'pending-requests.html',
    href: 'pending-requests.html',
    label: 'Pending Requests',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
  },
  {
    key: 'completed-projects.html',
    href: 'completed-projects.html',
    label: 'Completed Projects',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>'
  },
  {
    key: 'total-earnings.html',
    href: 'total-earnings.html',
    label: 'Total Earnings',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'
  },
  {
    key: 'post-service.html',
    href: 'post-service.html',
    label: 'Post a Service',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
  },
  {
    key: 'gig-profile.html',
    href: 'gig-profile.html',
    label: 'My Profile',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
  }
];

const CLIENT_PAGE_ALIASES = {
  'add-manager.html': 'client-profile-selection.html',
  'add-manager-flow.html': 'client-profile-selection.html'
};

const GIG_PAGE_ALIASES = {
  'project-detail.html': 'active-tasks.html',
  'submit-deliverables.html': 'active-tasks.html',
  'submission-success.html': 'active-tasks.html',
  'service-published.html': 'post-service.html'
};

function getCurrentPageName() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function getDisplayInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function renderSidebarNav(navEl, items, activeKey) {
  if (!navEl) return;
  navEl.innerHTML = items
    .map((item) => {
      const activeClass = item.key === activeKey ? ' active' : '';
      return `<a href="${item.href}" class="nav-item${activeClass}">${item.icon}${item.label}</a>`;
    })
    .join('');
}

function normalizeSidebarBrand(sidebarEl, role) {
  if (!sidebarEl) return;

  if (role === 'client' || role === 'manager') {
    const brand = sidebarEl.querySelector('.client-sidebar-brand');
    if (!brand) return;

    brand.setAttribute('href', role === 'manager' ? '../manager/manager-dashboard.html' : 'client-dashboard.html');
    brand.innerHTML = `
      <div class="brand-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 12l3 3 5-5"></path></svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">GigsForGigs</span>
        <span class="brand-sub">Client Portal</span>
      </div>
    `;
    return;
  }

  if (role === 'gig') {
    const brand = sidebarEl.querySelector('.sidebar-header');
    if (!brand) return;
    brand.setAttribute('href', 'gig-dashboard.html');
    brand.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-white)"><circle cx="12" cy="12" r="10"></circle></svg>GigsForGigs';
  }
}

function normalizeSidebarIdentity(sidebarEl, user) {
  if (!sidebarEl || !user) return;

  if (user.role === 'client' || user.role === 'manager') {
    const nameEl = sidebarEl.querySelector('.sidebar-user-info .user-name');
    const roleEl = sidebarEl.querySelector('.sidebar-user-info .user-role');
    const avatarEl = sidebarEl.querySelector('.sidebar-user-info .user-avatar');

    if (nameEl) nameEl.textContent = user.name || 'Client';
    if (roleEl) roleEl.textContent = user.role === 'manager' ? 'Manager' : 'Client';
    if (avatarEl) avatarEl.textContent = getDisplayInitials(user.name || 'Client');
    return;
  }

  if (user.role === 'gig') {
    const miniEl = sidebarEl.querySelector('.sidebar-footer .profile-mini');
    const metaEl = sidebarEl.querySelector('.sidebar-footer > div[style*="font-size"]');
    const nameLine = metaEl?.children?.[0] || null;
    const roleLine = metaEl?.children?.[1] || null;

    if (miniEl) miniEl.textContent = getDisplayInitials(user.name || 'Gig Professional');
    if (nameLine) nameLine.textContent = user.name || 'Gig Professional';
    if (roleLine) roleLine.textContent = 'Gig Professional';
  }
}

function enforceRoleSidebarConsistency() {
  const user = getUser();
  if (!user) return;

  const sidebarEl = document.querySelector('.dashboard-sidebar');
  const navEl = sidebarEl?.querySelector('.sidebar-nav');
  if (!sidebarEl || !navEl) return;

  const path = window.location.pathname;
  const currentPage = getCurrentPageName();

  if ((user.role === 'client' || user.role === 'manager') && path.includes('/pages/client/')) {
    const activeKey = CLIENT_PAGE_ALIASES[currentPage] || currentPage;
    renderSidebarNav(navEl, CLIENT_SIDEBAR_ITEMS, activeKey);
    normalizeSidebarBrand(sidebarEl, user.role);
    normalizeSidebarIdentity(sidebarEl, user);
    return;
  }

  if (user.role === 'gig' && path.includes('/pages/gig/')) {
    const activeKey = GIG_PAGE_ALIASES[currentPage] || currentPage;
    renderSidebarNav(navEl, GIG_SIDEBAR_ITEMS, activeKey);
    normalizeSidebarBrand(sidebarEl, user.role);
    normalizeSidebarIdentity(sidebarEl, user);
  }
}

function getCurrentClientRecord() {
  const sessionUser = getUser();
  if (!sessionUser || sessionUser.role !== 'client') return null;
  return users.find((user) => user.id === sessionUser.id) || null;
}

function shouldHideMockClientData() {
  const client = getCurrentClientRecord();
  if (!client) return false;
  return !SEEDED_CLIENT_IDS.has(client.id);
}

function canUseSearchTalentMockData(client) {
  if (!client) return false;
  return SEARCH_TALENT_CLIENT_IDS.has(client.id);
}

function applyEmptyStateToTable(tableId, message, colSpan = 6) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="${colSpan}" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">
        ${message}
      </td>
    </tr>
  `;
}

function applyClientNoMockDataState() {
  if (!shouldHideMockClientData()) return;

  const client = getCurrentClientRecord();
  const path = window.location.pathname;

  if (client?.name) {
    document.querySelectorAll('.user-name').forEach((el) => {
      el.textContent = client.name;
    });
  }

  if (path.includes('client-dashboard.html')) {
    const greetingEl = document.getElementById('client-greeting');
    if (greetingEl && client?.name) greetingEl.textContent = `Welcome, ${client.name}!`;

    const subtitleEl = document.querySelector('.welcome-subtitle');
    if (subtitleEl) subtitleEl.textContent = 'Start by posting your first gig to build activity.';

    const activeTasksEl = document.getElementById('client-active-tasks');
    if (activeTasksEl) activeTasksEl.textContent = '0';

    const pendingTasksEl = document.getElementById('client-pending-tasks');
    if (pendingTasksEl) pendingTasksEl.textContent = '0';

    const totalSpentEl = document.getElementById('client-total-spent');
    if (totalSpentEl) totalSpentEl.textContent = '₹0.00';

    applyEmptyStateToTable(
      'client-activity-table',
      'No activity yet. Post your first gig to start tracking progress.',
      5
    );
  }

  if (path.includes('my-gigs-client.html')) {
    applyEmptyStateToTable(
      'active-contracts-table',
      'No active contracts yet. Post your first gig to get started.',
      6
    );
  }

  if (path.includes('review-shortlist.html')) {
    applyEmptyStateToTable(
      'shortlist-table',
      'No shortlisted candidates yet. Shortlists will appear here once professionals apply.',
      6
    );
  }

  if (path.includes('review-deliverables.html')) {
    const reviewLayout = document.querySelector('.review-layout');
    if (reviewLayout) {
      reviewLayout.innerHTML = `
        <div style="padding:var(--spacing-xxl);border:1px dashed var(--color-border);border-radius:var(--radius-lg);text-align:center;color:var(--color-text-muted);">
          No deliverables to review yet. Deliverables will appear here after work is submitted.
        </div>
      `;
    }
  }

  if (path.includes('search-talent.html')) {
    if (!canUseSearchTalentMockData(client)) {
      const grid = document.getElementById('talent-grid');
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;padding:var(--spacing-xxl);text-align:center;color:var(--color-text-muted);border:1px dashed var(--color-border);border-radius:var(--radius-lg);">
            No talent data to show yet for this new account.
          </div>
        `;
      }

      const pagination = document.querySelector('.pagination');
      if (pagination) pagination.style.display = 'none';
    }
  }
}

// ── Bootstrap ────────────────────────────────────────────────────

async function bootstrap() {
  const path = window.location.pathname;

  // Find which page we're on
  let matchedKey = null;
  for (const pageName of Object.keys(PAGE_MAP)) {
    if (path.endsWith(pageName) || path.includes(`/${pageName}`)) {
      matchedKey = pageName;
      break;
    }
  }

  // If page not in map, do nothing (e.g. index.html, landing page)
  if (!matchedKey) return;

  const config = PAGE_MAP[matchedKey];

  // Guard: skip for public pages, enforce for everything else
  if (!config.public) {
    const roles = config.roles || [];
    if (!guardPage(roles)) return; // will redirect
  }

  // Call the module's init() if one is mapped.
  const mod = config.module;
  if (!mod) return;

  try {
    if (typeof mod.init === 'function') {
      mod.init();
    }
  } catch (error) {
    console.error('Module bootstrap failed:', matchedKey, error);
  }
}

// ── Global Logout Handler ────────────────────────────────────────
// Wire up logout button present in all dashboard sidebars.
function getCurrentPageConfig() {
  const path = window.location.pathname;
  for (const pageName of Object.keys(PAGE_MAP)) {
    if (path.endsWith(pageName) || path.includes(`/${pageName}`)) {
      return PAGE_MAP[pageName];
    }
  }
  return null;
}

function ensureLogoutStyles() {
  if (document.getElementById('gfg-logout-style')) return;

  const style = document.createElement('style');
  style.id = 'gfg-logout-style';
  style.textContent = `
    .gfg-topbar-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-md, 12px);
      margin-left: auto;
    }

    .gfg-logout-btn {
      flex-shrink: 0;
      white-space: nowrap;
      text-decoration: none;
    }

    .dashboard-topbar .gfg-logout-btn {
      margin-left: 0;
    }
  `;

  document.head.appendChild(style);
}

function createAutoLogoutButton() {
  const btn = document.createElement('button');
  btn.id = 'logout-btn';
  btn.type = 'button';
  btn.title = 'Log out';
  btn.setAttribute('aria-label', 'Log out');
  btn.classList.add('btn', 'btn-primary', 'gfg-logout-btn');
  btn.textContent = 'Log Out';
  return btn;
}

function getTopbarActionsContainer(topbar) {
  if (!topbar) return null;

  const explicitContainer = topbar.querySelector(':scope > .topbar-actions, :scope > .gfg-topbar-actions');
  if (explicitContainer) return explicitContainer;

  const inlineFlexContainer = Array.from(topbar.children).find((child) => {
    if (!(child instanceof HTMLElement) || child.classList.contains('topbar-search')) return false;
    const inlineStyle = child.getAttribute('style') || '';
    return inlineStyle.includes('display: flex') && inlineStyle.includes('align-items');
  });

  if (inlineFlexContainer) return inlineFlexContainer;

  const container = document.createElement('div');
  container.className = 'gfg-topbar-actions';
  topbar.appendChild(container);
  return container;
}

function bindLogout() {
  const pageConfig = getCurrentPageConfig();
  if (!pageConfig || pageConfig.public) return;

  ensureLogoutStyles();

  let logoutBtn = document.getElementById('logout-btn')
    || document.querySelector('button[title="Log out"], a[title="Log out"], button[title="Logout"], a[title="Logout"]');

  if (!logoutBtn) {
    logoutBtn = createAutoLogoutButton();
  }

  // Keep a consistent LOGOUT control beside profile identity.
  logoutBtn.classList.add('btn', 'btn-primary', 'gfg-logout-btn');
  logoutBtn.classList.remove('gfg-logout-floating');
  logoutBtn.textContent = 'Log Out';
  logoutBtn.removeAttribute('style');

  const topbar = document.querySelector('.dashboard-topbar');
  if (topbar) {
    const actionsContainer = getTopbarActionsContainer(topbar);
    actionsContainer.classList.add('gfg-topbar-actions');

    if (!actionsContainer.contains(logoutBtn)) {
      actionsContainer.appendChild(logoutBtn);
    }
  }

  if (logoutBtn.dataset.boundLogout === '1') return;
  logoutBtn.dataset.boundLogout = '1';

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
  });
}

async function startApp() {
  await bootstrap();
  enforceRoleSidebarConsistency();
  applyClientNoMockDataState();
  bindLogout();
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    startApp();
  });
} else {
  startApp();
}
