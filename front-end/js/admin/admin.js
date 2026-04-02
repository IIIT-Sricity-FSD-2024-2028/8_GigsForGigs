import * as adminAuth from './adminAuth.js';

const PAGE_MODULES = {
  'dashboard.html': () => import('./adminDashboard.js'),
  'client-management.html': () => import('./adminClients.js'),
  'managers-management.html': () => import('./adminManagers.js'),
  'gig-professional-management.html': () => import('./adminProfessionals.js'),
  'projects.html': () => import('./adminProjects.js'),
  'payments-revenue.html': () => import('./adminPayments.js'),
  'reviews.html': () => import('./adminReviews.js'),
  'disputes-reports.html': () => import('./adminReports.js'),
  'admin-analytics.html': () => import('./adminAnalytics.js'),
  'platform-settings.html': () => import('./adminSettings.js'),
  'admin-management.html': () => import('./adminAdmins.js'),
  'admin-profile.html': () => import('./adminProfile.js'),
};

document.addEventListener('DOMContentLoaded', () => {
    const session = adminAuth.guardAdminPage();
    if (session) {
        adminAuth.injectAdminIdentity();
        adminAuth.bindAdminLogout();
        initPage();
    }
});

async function initPage() {
    const page = currentPageName();
    const loader = PAGE_MODULES[page];
    
    if (loader) {
        try {
            const module = await loader();
            if (module.init) {
                module.init();
            }
        } catch (err) {
            console.error(`Admin System: Failed to load module for [${page}]:`, err);
        }
    }
    
    updateActiveNavItem(page);
}

function currentPageName() {
    const path = window.location.pathname;
    const name = path.split('/').pop() || 'dashboard.html';
    return name;
}

function updateActiveNavItem(page) {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(page)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}
