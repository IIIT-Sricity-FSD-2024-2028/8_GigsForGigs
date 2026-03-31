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
  'login.html':                     { module: auth,          public: true },
  'signup.html':                    { module: auth,          public: true },
  'role-selection.html':            { module: auth,          public: true },

  // Client pages
  'post-gig.html':                  { module: tasks,         roles: ['client', 'manager'] },
  'my-gigs-client.html':            { module: tasks,         roles: ['client', 'manager'] },
  'review-shortlist.html':          { module: applications,  roles: ['client', 'manager'] },
  'review-deliverables.html':       { module: deliverables,  roles: ['client', 'manager'] },
  'search-talent.html':             { module: null,          roles: ['client', 'manager'] },
  'client-dashboard.html':          { module: dashboard,     roles: ['client'] },
  'client-profile-selection.html':  { module: dashboard,     roles: ['client'] },
  'add-manager.html':               { module: managers,      roles: ['client'] },
  'add-manager-flow.html':          { module: managers,      roles: ['client'] },
  'profile-completion-client.html': { module: profile,       roles: [] },

  // Manager pages
  'manager-dashboard.html':         { module: dashboard,     roles: ['manager'] },

  // Gig professional pages
  'gig-dashboard.html':             { module: dashboard,     roles: ['gig'] },
  'gig-profile.html':               { module: profile,       roles: ['gig'] },
  'profile-completion-gig.html':    { module: profile,       roles: [] },
  'explore-tasks.html':             { module: tasks,         roles: ['gig'] },
  'pending-requests.html':          { module: applications,  roles: ['gig'] },
  'active-tasks.html':              { module: tasks,         roles: ['gig'] },
  'completed-projects.html':        { module: deliverables,  roles: ['gig'] },
  'project-detail.html':            { module: deliverables,  roles: ['gig', 'client', 'manager'] },
  'post-service.html':              { module: null,          roles: ['gig'] },
  'total-earnings.html':            { module: null,          roles: ['gig'] }
};

// ── Bootstrap ────────────────────────────────────────────────────

function bootstrap() {
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

  // Call the module's init() if one is mapped
  if (config.module && typeof config.module.init === 'function') {
    config.module.init();
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
