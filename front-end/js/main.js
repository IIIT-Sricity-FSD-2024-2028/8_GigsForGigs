// ─── main.js ────────────────────────────────────────────────────
// Entry point.  Detects the current page from window.location,
// runs guardPage(), then calls the correct module's init().
//
// Included in each HTML file as:
//   <script type="module" src="../../js/main.js">
// ─────────────────────────────────────────────────────────────────

import { guardPage } from './modules/auth.js';
import * as auth from './modules/auth.js';

const MODULE_LOADERS = {
  auth: async () => auth,
  tasks: async () => import('./modules/tasks.js'),
  applications: async () => import('./modules/applications.js'),
  deliverables: async () => import('./modules/deliverables.js'),
  managers: async () => import('./modules/managers.js'),
  profile: async () => import('./modules/profile.js'),
  dashboard: async () => import('./modules/dashboard.js')
};

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
  'search-talent.html':             { moduleKey: null,            roles: ['client', 'manager'] },
  'client-dashboard.html':          { moduleKey: 'dashboard',     roles: ['client'] },
  'client-profile-selection.html':  { moduleKey: 'dashboard',     roles: ['client'] },
  'add-manager.html':               { moduleKey: 'managers',      roles: ['client'] },
  'add-manager-flow.html':          { moduleKey: 'managers',      roles: ['client'] },
  'profile-completion-client.html': { moduleKey: 'profile',       roles: [] },

  // Manager pages
  'manager-dashboard.html':         { moduleKey: 'tasks',         roles: ['manager'] },

  // Gig professional pages
  'gig-dashboard.html':             { moduleKey: 'dashboard',     roles: ['gig'] },
  'gig-profile.html':               { moduleKey: 'profile',       roles: ['gig'] },
  'profile-completion-gig.html':    { moduleKey: 'profile',       roles: [] },
  'explore-tasks.html':             { moduleKey: 'tasks',         roles: ['gig'] },
  'pending-requests.html':          { moduleKey: 'applications',  roles: ['gig'] },
  'active-tasks.html':              { moduleKey: 'tasks',         roles: ['gig'] },
  'completed-projects.html':        { moduleKey: 'deliverables',  roles: ['gig'] },
  'project-detail.html':            { moduleKey: 'deliverables',  roles: ['gig', 'client', 'manager'] },
  'post-service.html':              { moduleKey: null,            roles: ['gig'] },
  'total-earnings.html':            { moduleKey: null,            roles: ['gig'] }
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
function bindLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      auth.logout();
    });
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootstrap();
  });
} else {
  bootstrap();
  bindLogout();
}
