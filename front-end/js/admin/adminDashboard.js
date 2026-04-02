// ─── adminDashboard.js ──────────────────────────────────────────
// dashboard.html — Dynamic KPIs, system feed, new entrants.
// ─────────────────────────────────────────────────────────────────

import {
  adminClients, adminManagers, adminProfessionals, adminProjects,
  adminTransactions, adminReports, fmtCurrency, fmtDate
} from './adminData.js';
import { getPlatformUsers, getPlatformTasks } from './adminData.js';

export function init() {
  populateKPIs();
  populateNewEntrants();
  wireSegmentControls();
}

function populateKPIs() {
  const platformUsers = getPlatformUsers();
  const platformTasks = getPlatformTasks();

  const totalClients = adminClients.length + platformUsers.filter(u => u.role === 'client' && !u.deleted).length;
  const totalManagers = adminManagers.length + platformUsers.filter(u => u.role === 'manager' && !u.deleted).length;
  const totalPros = adminProfessionals.length + platformUsers.filter(u => u.role === 'gig' && !u.deleted).length;
  const activeJobs = adminProjects.filter(p => p.status === 'active').length + platformTasks.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const completedJobs = adminProjects.filter(p => p.status === 'completed').length + platformTasks.filter(t => t.status === 'completed').length;
  const pendingDisputes = adminReports.filter(r => r.status === 'open' || r.status === 'investigating').length;
  const totalRevenue = adminTransactions.reduce((s, t) => s + (t.amount || 0), 0);
  const pendingApprovals = adminProfessionals.filter(p => p.status === 'pending').length + adminClients.filter(c => c.status === 'pending').length;

  const kpiCards = document.querySelectorAll('.dash-kpi-value');
  if (kpiCards.length >= 8) {
    kpiCards[0].textContent = totalClients.toLocaleString();
    kpiCards[1].textContent = totalManagers.toLocaleString();
    kpiCards[2].textContent = totalPros.toLocaleString();
    kpiCards[3].textContent = activeJobs.toLocaleString();
    kpiCards[4].textContent = completedJobs.toLocaleString();
    kpiCards[5].textContent = pendingDisputes.toString();
    kpiCards[6].textContent = fmtCurrency(totalRevenue);
    kpiCards[7].textContent = pendingApprovals.toString();
  }
}

function populateNewEntrants() {
  const container = document.querySelector('.dash-card:last-child .entrant-item')?.parentElement;
  if (!container) return;

  const allEntrants = [
    ...adminProfessionals.map(p => ({ ...p, entrantRole: 'professional' })),
    ...adminClients.map(c => ({ ...c, entrantRole: 'client', title: c.company })),
    ...adminManagers.map(m => ({ ...m, entrantRole: 'manager', title: m.clientCompany }))
  ]
    .sort((a, b) => new Date(b.joinDate || 0) - new Date(a.joinDate || 0))
    .slice(0, 4);

  const badgeClass = { professional: 'entrant-badge-pro', client: 'entrant-badge-client', manager: 'entrant-badge-manager' };
  const badgeLabel = { professional: 'PROFESSIONAL', client: 'CLIENT', manager: 'MANAGER' };

  // Keep the "Manage All Users" link
  const manageLink = container.querySelector('.manage-all-link');

  const items = container.querySelectorAll('.entrant-item');
  items.forEach(item => item.remove());

  allEntrants.forEach(ent => {
    const div = document.createElement('div');
    div.className = 'entrant-item';
    div.innerHTML = `
      <img src="${ent.avatar || `https://i.pravatar.cc/150?u=${ent.id}`}" alt="${ent.name}" class="entrant-avatar">
      <div class="entrant-info">
        <div class="entrant-name">${ent.name}</div>
        <div class="entrant-role-label">${ent.title || ''}</div>
      </div>
      <span class="entrant-badge ${badgeClass[ent.entrantRole] || ''}">${badgeLabel[ent.entrantRole] || ''}</span>
    `;
    if (manageLink) {
      container.insertBefore(div, manageLink);
    } else {
      container.appendChild(div);
    }
  });
}

function wireSegmentControls() {
  document.querySelectorAll('.segment-control').forEach(group => {
    group.querySelectorAll('.segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });
}
