// ─── dashboard.js ────────────────────────────────────────────────
// Dashboard initialization for client, manager, and gig roles.
// Displays the user's stats based on mock data.
// ─────────────────────────────────────────────────────────────────

import { users } from '../data/mockData.js';
import { get, getUser, set } from '../utils/storage.js';
import { formatDate, formatCurrency, getStatusBadgeClass, humaniseStatus } from '../utils/helpers.js';
import { getGigDashboardSummary } from './gigState.js';

const WITHDRAWAL_HISTORY_KEY = 'gig_withdrawal_history';

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

  const greetingEl = document.getElementById('client-greeting');
  if (greetingEl) greetingEl.textContent = `Welcome back, ${fullUser.name}!`;

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

  const greetingEl = document.getElementById('manager-greeting');
  if (greetingEl) greetingEl.textContent = `Welcome back, ${fullUser.name}!`;

  // Manager-specific stats if needed
}

// ── Gig Dashboard ────────────────────────────────────────────────

function initGigDashboard() {
  const currentUser = getUser();
  if (!currentUser || currentUser.role !== 'gig') return;

  const summary = getGigDashboardSummary(currentUser.id);

  const activeCountEl = document.getElementById('gig-active-count');
  const pendingCountEl = document.getElementById('gig-pending-count');
  const completedCountEl = document.getElementById('gig-completed-count');
  const earningsEl = document.getElementById('gig-earnings-count');

  if (activeCountEl) activeCountEl.textContent = String(summary.activeTasks.length);
  if (pendingCountEl) pendingCountEl.textContent = String(summary.pendingRequests.length);
  if (completedCountEl) completedCountEl.textContent = String(summary.completedTasks.length);
  if (earningsEl) earningsEl.textContent = formatCurrency(summary.totalEarnings);

  const totalTracked = summary.activeTasks.length + summary.completedTasks.length;
  const completionRate = totalTracked === 0
    ? 0
    : Math.round((summary.completedTasks.length / totalTracked) * 100);

  const profileRateEl = document.getElementById('gig-profile-success-rate');
  if (profileRateEl) {
    const safeRate = Math.max(0, Math.min(100, completionRate));
    profileRateEl.textContent = `${safeRate}%`;
    profileRateEl.setAttribute('aria-label', `Project success rate ${safeRate} percent`);
  }

  const profileCircleEl = document.getElementById('gig-profile-success-circle');
  if (profileCircleEl) {
    const safeRate = Math.max(0, Math.min(100, completionRate));
    profileCircleEl.setAttribute('stroke-dasharray', `${safeRate}, 100`);
  }

  const requestsTableBody = document.getElementById('gig-dashboard-requests-body');
  if (requestsTableBody) {
    const requestRows = [...summary.pendingRequests, ...summary.declinedRequests]
      .slice(0, 6)
      .map((request) => `
        <tr>
          <td><div style="font-weight: 600; color: var(--color-text-dark);">${request.clientName}</div></td>
          <td>${request.title}</td>
          <td>${formatDate(request.deadline)}</td>
          <td style="font-weight: 600;">${formatCurrency(request.budget)}</td>
          <td><span class="${getStatusBadgeClass(request.status)}">${humaniseStatus(request.status)}</span></td>
        </tr>
      `)
      .join('');

    requestsTableBody.innerHTML = requestRows || `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--color-text-muted); padding: var(--spacing-xl);">
          No request activity yet.
        </td>
      </tr>
    `;
  }

  const activePreviewEl = document.getElementById('dashboard-active-preview');
  if (activePreviewEl) {
    activePreviewEl.innerHTML = summary.activeTasks.slice(0, 3).map((task) => `
      <a href="active-tasks.html" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;text-decoration:none;border-bottom:1px solid var(--color-border);">
        <span style="color:var(--color-text-dark);font-weight:500;">${task.title}</span>
        <span class="${getStatusBadgeClass('active')}">Active</span>
      </a>
    `).join('') || '<div style="color:var(--color-text-muted);font-size:0.875rem;">No active tasks</div>';
  }

  const pendingPreviewEl = document.getElementById('dashboard-pending-preview');
  if (pendingPreviewEl) {
    pendingPreviewEl.innerHTML = summary.pendingRequests.slice(0, 3).map((request) => `
      <a href="pending-requests.html" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;text-decoration:none;border-bottom:1px solid var(--color-border);">
        <span style="color:var(--color-text-dark);font-weight:500;">${request.title}</span>
        <span class="${getStatusBadgeClass('pending')}">Pending</span>
      </a>
    `).join('') || '<div style="color:var(--color-text-muted);font-size:0.875rem;">No pending requests</div>';
  }

  const completedPreviewEl = document.getElementById('dashboard-completed-preview');
  if (completedPreviewEl) {
    completedPreviewEl.innerHTML = summary.completedTasks.slice(0, 3).map((task) => `
      <a href="completed-projects.html" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;text-decoration:none;border-bottom:1px solid var(--color-border);">
        <span style="color:var(--color-text-dark);font-weight:500;">${task.title}</span>
        <span class="${getStatusBadgeClass('completed')}">Completed</span>
      </a>
    `).join('') || '<div style="color:var(--color-text-muted);font-size:0.875rem;">No completed projects</div>';
  }
}

function readWithdrawalHistory(gigId) {
  const root = get(WITHDRAWAL_HISTORY_KEY) || {};
  const list = root[gigId];
  return Array.isArray(list) ? [...list] : [];
}

function writeWithdrawalHistory(gigId, history) {
  const root = get(WITHDRAWAL_HISTORY_KEY) || {};
  root[gigId] = history;
  set(WITHDRAWAL_HISTORY_KEY, root);
}

function getMonthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getRecentMonthBuckets(count = 6) {
  const now = new Date();
  const buckets = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const bucketDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, '0')}`,
      label: getMonthLabel(bucketDate),
      total: 0
    });
  }

  return buckets;
}

function getMonthKeyFromIso(isoString) {
  const date = new Date(isoString || Date.now());
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function renderEarningsTrend(container, completedTasks) {
  if (!container) return;

  const buckets = getRecentMonthBuckets(6);
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  completedTasks.forEach((task) => {
    const completedAt = task.completedAt || task.updatedAt || task.deadline;
    const key = getMonthKeyFromIso(completedAt);
    if (!key) return;
    const bucket = bucketMap.get(key);
    if (!bucket) return;
    bucket.total += Number(task.budget) || 0;
  });

  const maxTotal = Math.max(...buckets.map((bucket) => bucket.total), 1);

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(${buckets.length},minmax(0,1fr));gap:var(--spacing-md);align-items:end;min-height:220px;">
      ${buckets.map((bucket) => {
        const heightPct = Math.round((bucket.total / maxTotal) * 100);
        return `
          <div style="display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:8px;">
            <div style="font-size:0.75rem;color:var(--color-text-muted);">${bucket.total > 0 ? formatCurrency(bucket.total) : '-'}</div>
            <div style="width:100%;height:${Math.max(8, heightPct)}%;background:linear-gradient(180deg,var(--color-primary-dark),var(--color-primary-blue));border-radius:8px 8px 4px 4px;min-height:10px;"></div>
            <div style="font-size:0.8rem;color:var(--color-text-muted);">${bucket.label}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderTransactionsTable(body, completedTasks, withdrawalHistory) {
  if (!body) return;

  const paidTransactions = completedTasks.map((task) => ({
    type: 'paid',
    date: task.completedAt || task.updatedAt || task.deadline,
    description: task.title,
    client: task.clientName || 'Client',
    amount: Number(task.budget) || 0,
    status: 'paid'
  }));

  const withdrawalTransactions = withdrawalHistory.map((item) => ({
    type: 'withdrawal',
    date: item.createdAt,
    description: 'Earnings Withdrawal',
    client: 'Direct to Bank',
    amount: -Math.abs(Number(item.amount) || 0),
    status: 'processed'
  }));

  const merged = [...paidTransactions, ...withdrawalTransactions]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 12);

  if (merged.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No transactions yet.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = merged.map((row) => {
    const amountColor = row.amount >= 0 ? 'var(--color-secondary)' : 'var(--color-text-dark)';
    const amountPrefix = row.amount >= 0 ? '+' : '-';
    return `
      <tr>
        <td>${formatDate(row.date)}</td>
        <td>${row.description}</td>
        <td>${row.client}</td>
        <td><span style="color:${amountColor};font-weight:600;">${amountPrefix}${formatCurrency(Math.abs(row.amount))}</span></td>
        <td><span class="${getStatusBadgeClass(row.status)}">${humaniseStatus(row.status)}</span></td>
      </tr>
    `;
  }).join('');
}

function initGigTotalEarnings() {
  const currentUser = getUser();
  if (!currentUser || currentUser.role !== 'gig') return;

  const summary = getGigDashboardSummary(currentUser.id);
  const withdrawalHistory = readWithdrawalHistory(currentUser.id);
  const withdrawnAmount = withdrawalHistory.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalEarnings = summary.totalEarnings;
  const expectedThisMonth = summary.activeTasks.reduce((sum, task) => sum + (Number(task.budget) || 0), 0);
  const availableForWithdrawal = Math.max(0, totalEarnings - withdrawnAmount);

  const totalEl = document.getElementById('earnings-total-ytd');
  const expectedEl = document.getElementById('earnings-expected-month');
  const availableEl = document.getElementById('earnings-available-withdrawal');
  const activeMilestonesEl = document.getElementById('earnings-active-milestones');
  const withdrawnMetaEl = document.getElementById('earnings-withdrawn-total');

  if (totalEl) totalEl.textContent = formatCurrency(totalEarnings);
  if (expectedEl) expectedEl.textContent = formatCurrency(expectedThisMonth);
  if (availableEl) availableEl.textContent = formatCurrency(availableForWithdrawal);
  if (activeMilestonesEl) activeMilestonesEl.textContent = `From ${summary.activeTasks.length} active tasks`;
  if (withdrawnMetaEl) withdrawnMetaEl.textContent = `Withdrawn so far: ${formatCurrency(withdrawnAmount)}`;

  const trendContainer = document.getElementById('earnings-trend-chart');
  renderEarningsTrend(trendContainer, summary.completedTasks);

  const transactionsBody = document.getElementById('earnings-transactions-body');
  renderTransactionsTable(transactionsBody, summary.completedTasks, withdrawalHistory);

  const withdrawBtn = document.getElementById('withdraw-funds-btn');
  if (withdrawBtn) {
    withdrawBtn.disabled = availableForWithdrawal <= 0;
    withdrawBtn.textContent = availableForWithdrawal > 0 ? 'Withdraw Funds' : 'No Funds Available';
    withdrawBtn.onclick = () => {
      const latestAvailable = Math.max(
        0,
        getGigDashboardSummary(currentUser.id).totalEarnings - readWithdrawalHistory(currentUser.id).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      );

      if (latestAvailable <= 0) {
        initGigTotalEarnings();
        return;
      }

      const nextHistory = [
        {
          id: `wd_${Date.now()}`,
          amount: latestAvailable,
          createdAt: new Date().toISOString(),
          status: 'processed'
        },
        ...readWithdrawalHistory(currentUser.id)
      ];

      writeWithdrawalHistory(currentUser.id, nextHistory);
      initGigTotalEarnings();
    };
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
  } else if (path.includes('total-earnings.html')) {
    initGigTotalEarnings();
  } else if (path.includes('client-profile-selection.html')) {
    initClientProfileSelection();
  }
}
