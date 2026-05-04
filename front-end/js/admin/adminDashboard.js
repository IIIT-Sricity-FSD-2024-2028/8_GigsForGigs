// ─── adminDashboard.js ──────────────────────────────────────
import { fetchDashboardStats, fetchPayments } from './adminData.js';
import { showToast, formatCurrency, statusBadge, formatDate, getInitials } from './adminShared.js';

export async function init() {
  try {
    const stats = await fetchDashboardStats();
    let payments = [];
    try { payments = await fetchPayments(); } catch(e) {} // For revenue chart
    
    renderKPIs(stats);
    renderRecentUsers(stats.recentUsers);
    renderRecentTasks(stats.recentTasks);
    
    // Render Charts
    renderDonutChart(stats);
    renderActivityChart(stats);
    renderBarChart(stats);
    renderGaugeChart(stats);
    renderRevenueChart(payments);
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
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: 'dollar-sign', color: '#519e8a' },
  ];

  // Provide actual SVG paths for icons instead of circles
  const getIconSvg = (name) => {
    const p = {
      'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>',
      'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
      'briefcase': '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
      'folder': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
      'clock': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
      'activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
      'check': '<polyline points="20 6 9 17 4 12"></polyline>',
      'dollar-sign': '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>'
    };
    return p[name] || '<circle cx="12" cy="12" r="10"></circle>';
  };

  const grid = document.getElementById('kpi-grid');
  if (!grid) return;
  grid.innerHTML = kpis.map(kpi => `
    <div class="dash-kpi-card">
      <div class="dash-kpi-icon" style="background:${kpi.color}15;">
        <svg width="20" height="20" fill="none" stroke="${kpi.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          ${getIconSvg(kpi.icon)}
        </svg>
      </div>
      <div class="dash-kpi-label">${kpi.label}</div>
      <div class="dash-kpi-value">${kpi.value}</div>
    </div>
  `).join('');
}

// ── SVG Chart Renderers ──────────────────────────────────────────

function renderDonutChart(stats) {
  const container = document.getElementById('chart-tasks-status');
  if (!container) return;
  
  const { open, inProgress, completed, cancelled } = stats.tasksByStatus;
  const total = open + inProgress + completed + cancelled;
  
  if (total === 0) {
    container.innerHTML = '<div style="color:var(--color-text-muted)">No tasks data</div>';
    return;
  }

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  
  const data = [
    { value: completed, color: '#519e8a', label: 'Completed' },
    { value: inProgress, color: '#084b83', label: 'In Progress' },
    { value: open, color: '#bf6900', label: 'Open' },
    { value: cancelled, color: '#d32f2f', label: 'Cancelled' }
  ];

  let offset = 0;
  const circles = data.map(d => {
    if (d.value === 0) return '';
    const sliceLength = (d.value / total) * circumference;
    const circle = `<circle class="chart-donut-circle" cx="80" cy="80" r="${radius}" stroke="${d.color}" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="${-offset}"></circle>`;
    offset += sliceLength;
    return circle;
  }).join('');

  const legend = data.map(d => `
    <div class="chart-legend-item">
      <div class="chart-legend-color" style="background:${d.color}"></div>
      ${d.label} (${d.value})
    </div>
  `).join('');

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <div style="position:relative; width:160px; height:160px;">
        <svg class="chart-donut" width="160" height="160" viewBox="0 0 160 160">
          <circle class="chart-donut-bg" cx="80" cy="80" r="${radius}"></circle>
          ${circles}
        </svg>
        <div class="chart-donut-label">
          <div class="chart-donut-label-value">${total}</div>
          <div class="chart-donut-label-text">Tasks</div>
        </div>
      </div>
      <div class="chart-legend">${legend}</div>
    </div>
  `;
}

function renderBarChart(stats) {
  const container = document.getElementById('chart-user-roles');
  if (!container) return;
  
  const { clients, gigs, managers, admins } = stats.usersByRole;
  const max = Math.max(clients, gigs, managers, admins, 1);
  
  const data = [
    { label: 'Clients', value: clients, color: '#084b83' },
    { label: 'Gigs', value: gigs, color: '#519e8a' },
    { label: 'Managers', value: managers, color: '#bf6900' },
    { label: 'Admins', value: admins, color: '#d32f2f' }
  ];

  const bars = data.map(d => {
    const pct = (d.value / max) * 100;
    return `
      <div class="chart-bar-row">
        <div class="chart-bar-label">${d.label}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${pct}%; background:${d.color}"></div>
        </div>
        <div class="chart-bar-value">${d.value}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="chart-bar-container">${bars}</div>`;
  // Trigger animation
  setTimeout(() => {
    const fills = container.querySelectorAll('.chart-bar-fill');
    fills.forEach(f => f.style.width = f.style.width); // Force reflow if needed
  }, 50);
}

function renderActivityChart(stats) {
  const container = document.getElementById('chart-activity');
  if (!container) return;
  
  const data = [
    { label: 'Applications', value: stats.counts.applications },
    { label: 'Assignments', value: stats.counts.assignments },
    { label: 'Deliverables', value: stats.counts.deliverables },
    { label: 'Reviews', value: stats.counts.reviews }
  ];
  const max = Math.max(...data.map(d => d.value), 1);
  
  const bars = data.map(d => {
    const pct = (d.value / max) * 100;
    return `
      <div class="chart-bar-row">
        <div class="chart-bar-label">${d.label}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${pct}%; background:var(--color-text-muted)"></div>
        </div>
        <div class="chart-bar-value">${d.value}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="chart-bar-container">${bars}</div>`;
}

function renderGaugeChart(stats) {
  const container = document.getElementById('chart-avg-rating');
  if (!container) return;
  
  const rating = stats.avgRating || 0;
  
  let starsHtml = '';
  for(let i=1; i<=5; i++) {
    if(rating >= i) {
      starsHtml += `<svg class="chart-gauge-star filled" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    } else if(rating >= i - 0.5) {
      starsHtml += `
        <svg class="chart-gauge-star half" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="half-star-gradient">
              <stop offset="50%" stop-color="#fbbf24"/>
              <stop offset="50%" stop-color="#e2e8f0"/>
            </linearGradient>
          </defs>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>`;
    } else {
      starsHtml += `<svg class="chart-gauge-star" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    }
  }

  container.innerHTML = `
    <div class="chart-gauge">
      <div class="chart-gauge-stars">${starsHtml}</div>
      <div class="chart-gauge-value">${rating.toFixed(1)} <span style="font-size:1rem;color:var(--color-text-muted)">/ 5.0</span></div>
      <div style="font-size:0.75rem;color:var(--color-text-muted)">Average across ${stats.counts.reviews} reviews</div>
    </div>
  `;
}

function renderRevenueChart(payments) {
  const container = document.getElementById('chart-revenue');
  if (!container) return;
  
  if(!payments || payments.length === 0) {
    container.innerHTML = '<div style="color:var(--color-text-muted)">No payment data</div>';
    return;
  }

  // Pure SVG Vertical Bar Chart
  const w = 400; const h = 160;
  const bars = payments.slice(-8); // Last 8 payments
  const max = Math.max(...bars.map(p => p.amount), 1);
  const barW = (w / bars.length) * 0.6;
  const gap = (w / bars.length) * 0.4;
  
  const rects = bars.map((p, i) => {
    const barH = (p.amount / max) * h;
    const x = i * (barW + gap) + gap/2;
    const y = h - barH;
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#519e8a" rx="4" ry="4">
        <title>${formatCurrency(p.amount)}</title>
      </rect>
    `;
  }).join('');

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center;">
      <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="overflow:visible;">
        ${rects}
      </svg>
      <div style="width:100%; display:flex; justify-content:space-around; margin-top:12px; font-size:0.75rem; color:var(--color-text-muted);">
        ${bars.map(p => `<span>Tx ${p.payment_id.split('-').pop()}</span>`).join('')}
      </div>
    </div>
  `;
}

// ── Tables ───────────────────────────────────────────────────────

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
