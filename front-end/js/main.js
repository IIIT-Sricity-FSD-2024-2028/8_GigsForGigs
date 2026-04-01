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
      gap: var(--spacing-sm, 8px);
      margin-left: auto;
    }

    .gfg-logout-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 36px;
      padding: 0 14px;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--color-border, #d6d6d6);
      background: var(--color-primary-dark, #084b83);
      color: var(--color-white, #fff);
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.1;
      font-family: inherit;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .gfg-logout-btn svg {
      width: 16px;
      height: 16px;
      stroke: currentColor;
      flex-shrink: 0;
    }

    .gfg-logout-btn:hover {
      background: var(--color-primary-blue, #bf6900);
      border-color: var(--color-primary-blue, #bf6900);
    }

    .gfg-logout-btn:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px rgba(8, 75, 131, 0.2);
    }

    .dashboard-topbar .gfg-logout-btn {
      margin-left: 0;
    }

    .sidebar-footer .gfg-logout-btn,
    .sidebar-user-info .gfg-logout-btn {
      display: none;
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
  btn.classList.add('gfg-logout-btn');
  btn.innerHTML = `
    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
    <span>Log Out</span>
  `;
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

  logoutBtn.classList.add('gfg-logout-btn');
  logoutBtn.classList.remove('btn-logout', 'sidebar-logout-btn');
  logoutBtn.id = 'logout-btn';
  logoutBtn.innerHTML = `
    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
    <span>Log Out</span>
  `;

  if (logoutBtn instanceof HTMLButtonElement) {
    logoutBtn.type = 'button';
  }

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
