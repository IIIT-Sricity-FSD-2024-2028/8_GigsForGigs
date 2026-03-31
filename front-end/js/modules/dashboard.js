// ─── dashboard.js ────────────────────────────────────────────────
// Dashboard initialization for client, manager, and gig roles.
// Displays the user's stats based on mock data.
// ─────────────────────────────────────────────────────────────────

import { users } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';

// ── Client Dashboard ──────────────────────────────────────────────

function initClientDashboard() {
  const currentUser = getUser();
  if (!currentUser) return;

  // Find full user object from mockData
  const fullUser = users.find(u => u.id === currentUser.id);
  if (!fullUser) return;

  // Update sidebar with dynamic user name
  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = fullUser.name;

  // Update dashboard stats
  const totalSpentEl = document.getElementById('total-spent-value');
  const thisMonthEl = document.getElementById('this-month-value');
  const activeBudgetEl = document.getElementById('active-budget-value');

  if (fullUser.isFirstTimeUser) {
    // First-time user: show 0s
    if (totalSpentEl) totalSpentEl.textContent = '₹0.00';
    if (thisMonthEl) thisMonthEl.textContent = '₹0.00';
    if (activeBudgetEl) activeBudgetEl.textContent = '-';
  } else {
    // Existing user: show their mock data
    const totalSpent = fullUser.totalSpent || 0;
    const thisMonth = Math.floor(totalSpent * 0.3); // Mock: assume 30% of total is this month
    const activeBudget = fullUser.activeProjects > 0 ? `${fullUser.activeProjects} active` : '-';

    if (totalSpentEl) totalSpentEl.textContent = `₹${totalSpent.toLocaleString('en-IN')}`;
    if (thisMonthEl) thisMonthEl.textContent = `₹${thisMonth.toLocaleString('en-IN')}`;
    if (activeBudgetEl) activeBudgetEl.textContent = activeBudget;
  }
}

// ── Manager Dashboard ─────────────────────────────────────────────

function initManagerDashboard() {
  const currentUser = getUser();
  if (!currentUser) return;

  const fullUser = users.find(u => u.id === currentUser.id);
  if (!fullUser) return;

  // Update sidebar with dynamic user name
  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = fullUser.name;

  // Manager-specific stats if needed
}

// ── Gig Dashboard ────────────────────────────────────────────────

function initGigDashboard() {
  const currentUser = getUser();
  if (!currentUser) return;

  const fullUser = users.find(u => u.id === currentUser.id);
  if (!fullUser) return;

  // Update sidebar with dynamic user name
  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = fullUser.name;

  // Update gig dashboard stats
  const totalEarningsEl = document.getElementById('total-earnings-value');
  const completedTasksEl = document.getElementById('completed-tasks-value');
  const avgRatingEl = document.getElementById('avg-rating-value');

  if (fullUser.isFirstTimeUser) {
    // First-time user: show 0s
    if (totalEarningsEl) totalEarningsEl.textContent = '₹0.00';
    if (completedTasksEl) completedTasksEl.textContent = '0';
    if (avgRatingEl) avgRatingEl.textContent = '0.0';
  } else {
    // Existing user: show their mock data
    if (totalEarningsEl) totalEarningsEl.textContent = `₹${(fullUser.totalEarnings || 0).toLocaleString('en-IN')}`;
    if (completedTasksEl) completedTasksEl.textContent = fullUser.completedTasks || '0';
    if (avgRatingEl) avgRatingEl.textContent = (fullUser.avgRating || 0).toFixed(1);
  }
}

// ── Client Profile Selection ──────────────────────────────────────

function initClientProfileSelection() {
  const currentUser = getUser();
  if (!currentUser) return;

  const fullUser = users.find(u => u.id === currentUser.id);
  if (!fullUser) return;

  const noteEl = document.getElementById('first-time-profile-note');
  const managersContainer = document.getElementById('managers-container');

  if (!managersContainer) return;

  if (fullUser.isFirstTimeUser) {
    // First-time user: hide note, don't populate any managers
    if (noteEl) noteEl.style.display = 'none';
    managersContainer.innerHTML = ''; // Empty container = no managers shown
  } else {
    // Existing user: populate with their actual managers
    const clientManagers = users.filter(u => u.role === 'manager' && u.clientId === fullUser.id);

    if (clientManagers.length === 0) {
      // No managers added yet
      managersContainer.innerHTML = '';
      if (noteEl) noteEl.style.display = 'block';
    } else {
      // Dynamically create manager profile links
      const colors = ['var(--color-primary-blue)', 'var(--color-secondary)'];
      let html = '';

      clientManagers.forEach((manager, index) => {
        const initials = manager.name.split(' ').map(n => n[0]).join('').toUpperCase();
        const bgColor = colors[index % colors.length];
        html += `
          <a class="manager-profile-link" href="../manager/manager-dashboard.html" data-manager-id="${manager.id}" style="text-decoration: none;">
            <button class="profile-avatar-btn" type="button">
              <div class="avatar-square" style="color: var(--color-white); background-color: ${bgColor};">
                ${initials}
              </div>
              <div style="display: flex; flex-direction: column; align-items: center;">
                <span class="avatar-name">${manager.name}</span>
              </div>
            </button>
          </a>
        `;
      });

      managersContainer.innerHTML = html;
      if (noteEl) noteEl.style.display = 'none';
    }
  }
}

// ── Main Init ─────────────────────────────────────────────────────

export function init() {
  const path = window.location.pathname;

  if (path.includes('client-dashboard.html')) {
    initClientDashboard();
  } else if (path.includes('manager-dashboard.html')) {
    initManagerDashboard();
  } else if (path.includes('gig-dashboard.html')) {
    initGigDashboard();
  } else if (path.includes('client-profile-selection.html')) {
    initClientProfileSelection();
  }
}
