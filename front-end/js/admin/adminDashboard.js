// ─── adminDashboard.js ──────────────────────────────────────
import { fetchDashboardStats } from './adminData.js';
import { showToast, formatCurrency, statusBadge, formatDate, getInitials } from './adminShared.js';

export async function init() {
  try {
    const stats = await fetchDashboardStats();
    renderKPIs(stats);
    renderRecentUsers(stats.recentUsers);
    renderRecentTasks(stats.recentTasks);
  } catch (err) {
    showToast('Failed to load dashboard: ' + err.message, 'error');
  }
}

function renderKPIs(stats) {
  const kpis = [
    { label: 'Total Users', value: stats.counts.users, icon: 'users', color: '#084b83' },
    { label: 'Clients', value: stats.counts.clients, icon: 'user', color: '#084b83' },
    { label: 'Gig Professionals', value: stats.counts.gigProfiles, icon: 'briefcase', color: '#519e8a' },
    { label: 'Tasks', value: stats.counts.tasks, icon: 'folder', color: '#084b83' },
    { label: 'Open Tasks', value: stats.tasksByStatus.open, icon: 'clock', color: '#bf6900' },
    { label: 'In Progress', value: stats.tasksByStatus.inProgress, icon: 'activity', color: '#084b83' },
    { label: 'Completed', value: stats.tasksByStatus.completed, icon: 'check', color: '#519e8a' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: 'dollar', color: '#519e8a' },
  ];

  const grid = document.getElementById('kpi-grid');
  if (!grid) return;
  grid.innerHTML = kpis.map(kpi => `
    <div class="dash-kpi-card">
      <div class="dash-kpi-icon" style="background:${kpi.color}15;">
        <svg width="20" height="20" fill="none" stroke="${kpi.color}" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>
      </div>
      <div class="dash-kpi-label">${kpi.label}</div>
      <div class="dash-kpi-value">${kpi.value}</div>
    </div>
  `).join('');
}

function renderRecentUsers(users) {
  const tbody = document.getElementById('recent-users-body');
  if (!tbody) return;
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No users yet.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:var(--spacing-sm);">
          <div class="admin-footer-avatar" style="width:28px;height:28px;font-size:0.65rem;">${getInitials(u.name)}</div>
          ${u.name}
        </div>
      </td>
      <td>${u.email}</td>
      <td>${statusBadge(u.role)}</td>
      <td>${formatDate(u.createdAt)}</td>
    </tr>
  `).join('');
}

function renderRecentTasks(tasks) {
  const tbody = document.getElementById('recent-tasks-body');
  if (!tbody) return;
  if (!tasks || tasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No tasks yet.</td></tr>';
    return;
  }
  tbody.innerHTML = tasks.map(t => `
    <tr>
      <td style="font-weight:600;">${t.title}</td>
      <td>${formatCurrency(t.budget)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${formatDate(t.createdAt)}</td>
    </tr>
  `).join('');
}
