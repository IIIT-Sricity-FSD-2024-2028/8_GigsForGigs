// ─── admin.js ────────────────────────────────────────────────
// Super Admin entry point — detects page and calls init function.
// ─────────────────────────────────────────────────────────────

import { injectSidebar } from './adminShared.js';

const page = location.pathname.split('/').pop() || 'dashboard.html';

// Inject sidebar on every page
injectSidebar(page);

// Dynamic import for the active page module
const PAGE_MAP = {
  'dashboard.html':          () => import('./adminDashboard.js').then(m => m.init()),
  'users.html':              () => import('./adminUsers.js').then(m => m.init()),
  'clients.html':            () => import('./adminClients.js').then(m => m.init()),
  'managers.html':           () => import('./adminManagers.js').then(m => m.init()),
  'gig-professionals.html':  () => import('./adminProfessionals.js').then(m => m.init()),
  'tasks.html':              () => import('./adminTasks.js').then(m => m.init()),
  'applications.html':       () => import('./adminApplications.js').then(m => m.init()),
  'assignments.html':        () => import('./adminAssignments.js').then(m => m.init()),
  'deliverables.html':       () => import('./adminDeliverables.js').then(m => m.init()),
  'payments.html':           () => import('./adminPayments.js').then(m => m.init()),
  'reviews.html':            () => import('./adminReviews.js').then(m => m.init()),
  'settings.html':           () => import('./adminSettings.js').then(m => m.init()),
};

const loader = PAGE_MAP[page];
if (loader) loader().catch(err => console.error(`[Admin] Failed to init ${page}:`, err));
