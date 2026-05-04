// ─── manager.js ─ Manager Dashboard & Tasks ─────────────────────
import { apiRequest, requireAuth, logout, formatCurrency, formatDate, getStatusBadgeClass } from './api.js';

function getPage() {
  return window.location.pathname.split('/').pop();
}

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth(['MANAGER']);
  if (!user) return;

  document.querySelectorAll('[data-action="logout"]').forEach(el =>
    el.addEventListener('click', (e) => { e.preventDefault(); logout(); })
  );

  const page = getPage();
  switch (page) {
    case 'manager-dashboard.html': initManagerDashboard(user); break;
    case 'manager-invite-setup.html': initInviteSetup(user); break;
  }
});

// ── Dashboard ────────────────────────────────────────────────────
async function initManagerDashboard(user) {
  // Update greeting
  const greeting = document.getElementById('manager-greeting');
  if (greeting) greeting.textContent = `Welcome back, ${user.name || 'Manager'}!`;

  const nameEl = document.querySelector('.user-name');
  if (nameEl) nameEl.textContent = user.name || 'Manager';

  try {
    const [profile, tasks] = await Promise.all([
      apiRequest('/api/managers/me').catch(() => null),
      apiRequest('/api/managers/me/tasks').catch(() => []),
    ]);

    const taskList = Array.isArray(tasks) ? tasks : [];
    const activeTasks = taskList.filter(t => {
      const s = t.status || t.task?.status;
      return s === 'IN_PROGRESS';
    });
    const openTasks = taskList.filter(t => {
      const s = t.status || t.task?.status;
      return s === 'OPEN';
    });

    // Metrics
    const activeEl = document.getElementById('manager-active-projects');
    if (activeEl) activeEl.textContent = activeTasks.length;

    const pendingEl = document.getElementById('manager-pending-apps');
    if (pendingEl) pendingEl.textContent = openTasks.length;

    const postedEl = document.getElementById('manager-tasks-posted');
    if (postedEl) postedEl.textContent = taskList.length;

    // Activity table
    const tbody = document.querySelector('#manager-activity-table tbody');
    if (tbody) {
      if (taskList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No projects assigned yet.</td></tr>';
      } else {
        tbody.innerHTML = taskList.map(t => {
          const task = t.task || t;
          const status = task.status || 'OPEN';
          const progress = status === 'COMPLETED' ? 100 : status === 'IN_PROGRESS' ? 50 : 0;
          return `
            <tr>
              <td>
                <div class="task-name-cell">${task.title}</div>
              </td>
              <td><span class="status-badge ${getStatusBadgeClass(status)}">${status.replace('_', ' ')}</span></td>
              <td class="progress-cell">
                <div class="progress-bar-track">
                  <div class="progress-bar-fill progress-bar-fill-blue" style="width:${progress}%"></div>
                </div>
                <div class="progress-label">${progress}%</div>
              </td>
              <td class="budget-cell">${formatCurrency(task.budget)}</td>
              <td>
                <div class="actions-cell">
                  <button class="btn-icon-action" title="View" data-view-task="${task.task_id}">👁</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Pending queue
    const pendingDiv = document.querySelector('#pending-activity div[style*="dashed"]');
    if (pendingDiv && openTasks.length > 0) {
      pendingDiv.innerHTML = openTasks.map(t => {
        const task = t.task || t;
        return `<p style="padding:var(--spacing-sm) 0;border-bottom:1px solid var(--color-border);">${task.title} — ${formatCurrency(task.budget)}</p>`;
      }).join('');
    }
  } catch (err) {
    console.error('Manager dashboard failed:', err);
  }
}

// ── Invite Setup ─────────────────────────────────────────────────
async function initInviteSetup(user) {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('invite-email')?.value?.trim();
    const password = document.getElementById('invite-password')?.value;

    if (!email || !password) {
      alert('Email and password required');
      return;
    }

    try {
      await apiRequest('/api/auth/manager/login', 'POST', { email, password });
      window.location.href = 'manager-dashboard.html';
    } catch (err) {
      console.error('Invite setup failed:', err);
    }
  });
}
