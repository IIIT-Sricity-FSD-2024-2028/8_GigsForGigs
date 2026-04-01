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

// ── Page → module mapping ────────────────────────────────────────
// Pages that do NOT require auth (public pages)
const PUBLIC_PAGES = [
  'login.html',
  'signup.html',
  'role-selection.html'
];

// Page → { module, allowedRoles }
// allowedRoles: empty array = any authenticated role
const PAGE_MAP = {
  // Auth pages (public — no guard)
  'login.html':                     { moduleKey: 'auth',          public: true },
  'signup.html':                    { moduleKey: 'auth',          public: true },
  'role-selection.html':            { moduleKey: 'auth',          public: true },
  'manager-invite-setup.html':      { moduleKey: 'managers',      public: true },

  // Client pages
  'post-gig.html':                  { moduleKey: 'tasks',         roles: ['client'] },
  'my-gigs-client.html':            { moduleKey: 'tasks',         roles: ['client', 'manager'] },
  'review-shortlist.html':          { moduleKey: 'applications',  roles: ['client', 'manager'] },
  'review-deliverables.html':       { moduleKey: 'deliverables',  roles: ['client', 'manager'] },
  'search-talent.html':             { moduleKey: 'marketplace',   roles: ['client', 'manager'] },
  'client-dashboard.html':          { moduleKey: 'dashboard',     roles: ['client'] },
  'client-profile-selection.html':  { moduleKey: 'dashboard',     roles: ['client'] },
  'add-manager.html':               { moduleKey: 'managers',      roles: ['client'] },
  'add-manager-flow.html':          { moduleKey: 'managers',      roles: ['client'] },
  'profile-completion-client.html': { moduleKey: 'profile',       roles: [] },

  // Manager pages
  'manager-dashboard.html':         { moduleKey: 'tasks',         roles: ['manager'] },

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
  if (!config.moduleKey) return;

  const loader = MODULE_LOADERS[config.moduleKey];
  if (!loader) return;

  try {
    const module = await loader();
    if (module && typeof module.init === 'function') {
      module.init();
    }
  } catch (error) {
    console.error('Module bootstrap failed:', config.moduleKey, error);
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
    .gfg-logout-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 26px;
      padding: 0 8px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.32);
      background: rgba(255, 255, 255, 0.08);
      color: var(--color-white, #fff);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 0.88rem;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      transition: transform 0.15s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .gfg-inline-profile {
      flex-wrap: nowrap !important;
      gap: 8px !important;
    }

    .gfg-inline-profile .user-details {
      min-width: 0;
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      overflow: hidden;
    }

    .gfg-inline-profile .user-name,
    .gfg-inline-profile .user-role {
      display: inline;
      margin: 0;
      line-height: 1.1;
      white-space: nowrap;
    }

    .gfg-inline-profile .user-name {
      font-size: 0.76rem;
    }

    .gfg-inline-profile .user-role {
      font-size: 0.66rem;
      opacity: 0.85;
    }

    .gfg-inline-profile .user-role::before {
      content: "•";
      margin-right: 4px;
      opacity: 0.75;
    }

    .gfg-sidebar-meta {
      min-width: 0;
      display: flex !important;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      overflow: hidden;
      font-size: 0.76rem !important;
      line-height: 1.1;
    }

    .gfg-sidebar-meta > div {
      display: inline;
      margin: 0;
      white-space: nowrap;
    }

    .gfg-sidebar-meta > div:last-child::before {
      content: "•";
      margin-right: 4px;
      opacity: 0.75;
    }

    .gfg-logout-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.45);
      transform: translateY(-1px);
    }

    .gfg-logout-btn:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25), 0 0 0 4px rgba(8, 75, 131, 0.45);
    }

    .gfg-logout-btn.gfg-logout-floating {
      position: fixed;
      left: 16px;
      bottom: 16px;
      z-index: 1000;
      border: 1px solid var(--color-border, #d6d6d6);
      background: var(--color-white, #fff);
      color: var(--color-primary-dark, #084b83);
      box-shadow: 0 8px 24px rgba(8, 75, 131, 0.16);
    }

    .gfg-logout-btn.gfg-logout-floating:hover {
      background: #f3f7fb;
      border-color: #b8c9da;
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
  btn.innerHTML = '|-&gt;';
  return btn;
}

function bindLogout() {
  const pageConfig = getCurrentPageConfig();
  if (!pageConfig || pageConfig.public) return;

  ensureLogoutStyles();

  let logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) {
    logoutBtn = createAutoLogoutButton();
  }

  // Keep a consistent "|->" control beside profile identity.
  logoutBtn.classList.add('gfg-logout-btn');
  logoutBtn.classList.remove('gfg-logout-floating');
  logoutBtn.innerHTML = '|-&gt;';
  logoutBtn.removeAttribute('style');

  const sidebarUserInfo = document.querySelector('.sidebar-user-info');
  const sidebarFooter = document.querySelector('.sidebar-footer');

  if (sidebarUserInfo) {
    sidebarUserInfo.classList.add('gfg-inline-profile');

    const userDetails = sidebarUserInfo.querySelector('.user-details');
    if (userDetails) {
      userDetails.insertAdjacentElement('afterend', logoutBtn);
    } else {
      sidebarUserInfo.appendChild(logoutBtn);
    }
    logoutBtn.style.marginLeft = '8px';
  } else if (sidebarFooter) {
    sidebarFooter.classList.add('gfg-inline-profile');
    const profileMeta = sidebarFooter.querySelector('div[style*="font-size"]');
    if (profileMeta) profileMeta.classList.add('gfg-sidebar-meta');

    sidebarFooter.appendChild(logoutBtn);
    logoutBtn.style.marginLeft = 'auto';
  } else {
    logoutBtn.classList.add('gfg-logout-floating');
    logoutBtn.style.marginLeft = '';
    if (!document.body.contains(logoutBtn)) {
      document.body.appendChild(logoutBtn);
    }
  }

  if (logoutBtn.dataset.boundLogout === '1') return;
  logoutBtn.dataset.boundLogout = '1';

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
  });
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootstrap();
    bindLogout();
  });
} else {
  bootstrap();
  bindLogout();
}
