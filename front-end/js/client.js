// ─── client.js ─ All Client Pages ────────────────────────────────
import { apiRequest, requireAuth, logout, formatCurrency, formatDate, getStatusBadgeClass } from './api.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getTaskProgress(status) {
  if (status === 'COMPLETED') return 100;
  if (status === 'IN_PROGRESS') return 50;
  return 0;
}

function getDeliverableId(deliverable) {
  return deliverable.deliverable_id || `${deliverable.task_id}_${deliverable.deliverable_no}`;
}

function normalizeDeliverableStatus(status) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'approved' || value === 'rejected') return value;
  return 'pending';
}

function formatDeliverableStatus(status) {
  const value = normalizeDeliverableStatus(status);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

window.viewTask = function viewTask(taskId) {
  window.location.href = `/pages/client/task-details.html?taskId=${encodeURIComponent(taskId)}`;
};

function getPage() {
  return window.location.pathname.split('/').pop();
}

const CLIENT_NAV_ICONS = {
  dashboard: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
  search: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
  contracts: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  applications: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="14" y2="17"></line></svg>',
  managers: '<svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
};

function getClientNavKey(page) {
  if (page === 'client-dashboard.html') return 'dashboard';
  if (page === 'search-talent.html') return 'search';
  if (page === 'applications.html' || page === 'review-shortlist.html') return 'applications';
  if (page === 'client-profile-selection.html' || page === 'add-manager.html' || page === 'add-manager-flow.html') return 'managers';
  if (page === 'my-gigs-client.html' || page === 'task-details.html' || page === 'review-deliverables.html') return 'contracts';
  return '';
}

function getInitials(name) {
  const parts = String(name || 'Client')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (parts[0]?.[0] || 'C') + (parts[1]?.[0] || '');
}

function renderClientSidebar(user, page) {
  const sidebar = document.querySelector('.dashboard-sidebar');
  if (!sidebar) return;

  const brandName = sidebar.querySelector('.brand-name');
  const brandSub = sidebar.querySelector('.brand-sub');
  const nav = sidebar.querySelector('.sidebar-nav');
  const userInfo = sidebar.querySelector('.sidebar-user-info');
  const userName = sidebar.querySelector('.user-name');
  const userRole = sidebar.querySelector('.user-role');
  const userAvatar = sidebar.querySelector('.user-avatar');
  const activeKey = getClientNavKey(page);
  const displayName = user.name || 'Client';

  if (brandName) brandName.textContent = 'GigsForGigs';
  if (brandSub) brandSub.textContent = 'Client Portal';

  if (userInfo) {
    userInfo.innerHTML = `
      <div class="user-avatar user-avatar-seagrass">${getInitials(displayName).toUpperCase()}</div>
      <div class="user-details">
        <div class="user-name">${escapeHtml(displayName)}</div>
        <div class="user-role">Client Account</div>
      </div>
      <button type="button" class="sidebar-logout-btn" data-action="logout">Logout</button>
    `;
  }

  if (userName) userName.textContent = displayName;
  if (userRole) userRole.textContent = 'Client Account';
  if (userAvatar) userAvatar.textContent = getInitials(displayName).toUpperCase();

  if (!nav) return;

  const items = [
    { key: 'dashboard', href: 'client-dashboard.html', label: 'Dashboard' },
    { key: 'search', href: 'search-talent.html', label: 'Search Talent' },
    { key: 'contracts', href: 'my-gigs-client.html', label: 'Active Contracts' },
    { key: 'applications', href: 'applications.html', label: 'Applications' },
    { key: 'managers', href: 'client-profile-selection.html', label: 'Supervise Manager' },
  ];

  nav.innerHTML = items.map(item => `
    <a href="${item.href}" class="nav-item${item.key === activeKey ? ' active' : ''}">
      ${CLIENT_NAV_ICONS[item.key]}
      ${item.label}
    </a>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth(['CLIENT']);
  if (!user) return;

  const page = getPage();
  renderClientSidebar(user, page);

  // Wire logout buttons
  document.querySelectorAll('[data-action="logout"]').forEach(el =>
    el.addEventListener('click', (e) => { e.preventDefault(); logout(); })
  );

  switch (page) {
    case 'client-dashboard.html': initClientDashboard(user); break;
    case 'post-gig.html': initPostGig(user); break;
    case 'my-gigs-client.html': initMyGigs(user); break;
    case 'task-details.html': initTaskDetails(user); break;
    case 'applications.html': initApplications(user); break;
    case 'review-shortlist.html': initReviewShortlist(user); break;
    case 'review-deliverables.html': initReviewDeliverables(user); break;
    case 'search-talent.html': initSearchTalent(user); break;
    case 'add-manager.html':
    case 'add-manager-flow.html': initAddManager(user); break;
    case 'total-spent-client.html': initTotalSpent(user); break;
    case 'client-profile-selection.html': initProfileSelection(user); break;
  }
});

// ── Dashboard ────────────────────────────────────────────────────
async function initClientDashboard(user) {
  // Update greeting
  const greeting = document.getElementById('client-greeting');
  if (greeting) greeting.textContent = `Welcome back, ${user.name || 'Client'}!`;

  // Update sidebar user info
  const userName = document.querySelector('.user-name');
  if (userName) userName.textContent = user.name || 'Client';

  try {
    const tasks = await apiRequest(`/api/tasks?clientId=${user.userId}`);
    
    const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
    const openTasks = tasks.filter(t => t.status === 'OPEN');
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    
    // Update metrics
    const activeEl = document.getElementById('client-active-tasks');
    if (activeEl) activeEl.textContent = activeTasks.length;
    
    const pendingEl = document.getElementById('client-pending-tasks');
    if (pendingEl) pendingEl.textContent = String(openTasks.length).padStart(2, '0');

    // Total spent from payments
    try {
      const payments = await apiRequest('/admin/payments');
      const clientTaskIds = new Set(tasks.map(t => t.task_id));
      const clientPayments = payments.filter(p => clientTaskIds.has(p.task_id));
      const totalSpent = clientPayments.reduce((sum, p) => sum + p.amount, 0);
      const spentEl = document.getElementById('client-total-spent');
      if (spentEl) spentEl.textContent = formatCurrency(totalSpent);
    } catch (_) {}

    // Posted tasks table
    const postedCount = document.getElementById('client-posted-count');
    if (postedCount) postedCount.textContent = `(${openTasks.length})`;

    const postedTbody = document.querySelector('#client-posted-tasks-table tbody');
    if (postedTbody) {
      if (openTasks.length === 0) {
        postedTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No posted tasks yet.</td></tr>';
      } else {
        postedTbody.innerHTML = openTasks.map(t => `
          <tr>
            <td><div class="task-name-cell">${t.title}</div></td>
            <td>${formatDate(t.createdAt)}</td>
            <td class="budget-cell">${formatCurrency(t.budget)}</td>
            <td><div class="actions-cell">
              <a href="applications.html?taskId=${t.task_id}" class="btn-icon-action" title="View Applications">View</a>
              <a href="post-gig.html?editId=${t.task_id}" class="btn-icon-action" title="Edit">✏️</a>
            </div></td>
          </tr>
        `).join('');
      }
    }

    // Activity table
    const activityTbody = document.querySelector('#client-activity-table tbody');
    if (activityTbody) {
      const nonOpenTasks = tasks.filter(t => t.status !== 'OPEN');
      if (nonOpenTasks.length === 0) {
        activityTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No activity yet.</td></tr>';
      } else {
        activityTbody.innerHTML = nonOpenTasks.map(t => `
          <tr>
            <td><div class="task-name-cell">${t.title}</div></td>
            <td><span class="status-badge ${getStatusBadgeClass(t.status)}">${t.status.replace('_', ' ')}</span></td>
            <td class="progress-cell">
              <div class="progress-bar-track">
                <div class="progress-bar-fill progress-bar-fill-blue" style="width:${t.status === 'COMPLETED' ? 100 : t.status === 'IN_PROGRESS' ? 50 : 0}%"></div>
              </div>
              <div class="progress-label">${t.status === 'COMPLETED' ? '100' : t.status === 'IN_PROGRESS' ? '50' : '0'}%</div>
            </td>
            <td class="budget-cell">${formatCurrency(t.budget)}</td>
            <td><div class="actions-cell">
              <a href="review-deliverables.html?taskId=${t.task_id}" class="btn-icon-action" title="View">👁</a>
            </div></td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Dashboard load failed:', err);
  }
}

// ── Post Gig (Create/Edit Task) ──────────────────────────────────
async function initPostGig(user) {
  const form = document.querySelector('#post-gig-form') || document.querySelector('form');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('editId');

  // Pre-fill if editing
  if (editId) {
    try {
      const tasks = await apiRequest(`/api/tasks?clientId=${user.userId}`);
      const task = tasks.find(t => t.task_id === editId);
      if (task) {
        const title = document.getElementById('gig-title');
        const desc = document.getElementById('description');
        const budget = document.getElementById('budget');
        if (title) title.value = task.title;
        if (desc) desc.value = task.description;
        if (budget) budget.value = task.budget;
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) pageTitle.textContent = 'Edit Task';
      }
    } catch (_) {}
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (document.getElementById('gig-title')?.value || '').trim();
    const description = (document.getElementById('description')?.value || '').trim();
    const budget = Number(document.getElementById('budget')?.value || 0);

    if (!title || !description || budget <= 0) {
      alert('Please fill all required fields');
      return;
    }

    try {
      if (editId) {
        await apiRequest(`/api/tasks/${editId}`, 'PUT', {
          client_id: user.userId,
          title, description, budget,
        });
      } else {
        await apiRequest('/api/tasks', 'POST', {
          client_id: user.userId,
          title, description, budget,
        });
      }
      alert('Task saved successfully!');
      window.location.href = 'client-dashboard.html';
    } catch (err) {
      console.error('Save task failed:', err);
    }
  });
}

// ── My Gigs (list/edit/delete) ───────────────────────────────────
async function initMyGigs(user) {
  try {
    const tasks = await apiRequest(`/api/tasks?clientId=${user.userId}`);
    const container = document.getElementById('active-contracts-content');
    const tbody = document.querySelector('#active-contracts-table tbody');
    const target = tbody || container;
    if (!target) return;

    if (tasks.length === 0) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">No tasks found.</td></tr>';
      else target.innerHTML = '<p style="text-align:center;padding:2rem;">No tasks found.</p>';
      return;
    }

    if (tbody) {
      tbody.innerHTML = tasks.map(t => {
        const progress = getTaskProgress(t.status);

        return `
          <tr>
            <td>
              <div class="task-name-cell">${escapeHtml(t.title)}</div>
              <div class="task-category">${escapeHtml(formatDate(t.createdAt))}</div>
            </td>
            <td><span class="status-badge ${getStatusBadgeClass(t.status)}">${escapeHtml(t.status.replace('_', ' '))}</span></td>
            <td class="progress-cell">
              <div class="progress-bar-track">
                <div class="progress-bar-fill progress-bar-fill-blue" style="width:${progress}%"></div>
              </div>
              <div class="progress-label">${progress}%</div>
            </td>
            <td class="budget-cell">${formatCurrency(t.budget)}</td>
            <td><div class="actions-cell">
              <button class="btn-review-proposal" type="button" data-view-task="${t.task_id}">View Task</button>
              <a href="post-gig.html?editId=${t.task_id}" class="btn-icon-action" title="Edit">Edit</a>
              <button class="btn-icon-action" title="Delete" data-delete-task="${t.task_id}">Delete</button>
            </div></td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('[data-view-task]').forEach(btn => {
        btn.addEventListener('click', () => window.viewTask(btn.dataset.viewTask));
      });

      tbody.querySelectorAll('[data-delete-task]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this task?')) return;
          await apiRequest(`/api/tasks/${btn.dataset.deleteTask}?clientId=${user.userId}`, 'DELETE');
          initMyGigs(user);
        });
      });
    }
  } catch (err) {
    console.error('My gigs load failed:', err);
  }
}

// ── Review Shortlist ─────────────────────────────────────────────
// Task Details
async function initTaskDetails(user) {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get('taskId');

  const taskContainer = document.getElementById('task-details-panel');
  const gigsContainer = document.getElementById('associated-gigs-panel');
  const deliverablesContainer = document.getElementById('deliverables-panel');
  const addDeliverableBtn = document.getElementById('addDeliverableBtn');
  const addDeliverableForm = document.getElementById('addDeliverableForm');
  const cancelDeliverableBtn = document.getElementById('cancelDeliverableBtn');
  const descriptionInput = document.getElementById('description');
  const gigSelect = document.getElementById('gigSelect');
  let associatedGigs = [];
  let currentTask = null;

  if (!taskId) {
    if (taskContainer) taskContainer.innerHTML = '<p style="color:#b42318;">Missing taskId in the URL.</p>';
    return;
  }

  if (addDeliverableBtn) {
    addDeliverableBtn.disabled = true;
  }

  async function loadTask() {
    const tasks = await apiRequest(`/api/tasks?clientId=${user.userId}`);
    const task = tasks.find(item => item.task_id === taskId);

    if (!task) {
      taskContainer.innerHTML = '<p style="color:#b42318;">Task not found for this client.</p>';
      return null;
    }

    currentTask = task;
    document.getElementById('task-details-title').textContent = task.title;
    taskContainer.innerHTML = `
      <div class="detail-grid">
        <div>
          <div class="detail-label">Title</div>
          <div class="detail-value">${escapeHtml(task.title)}</div>
        </div>
        <div>
          <div class="detail-label">Status</div>
          <span class="status-badge ${getStatusBadgeClass(task.status)}">${escapeHtml(task.status.replace('_', ' '))}</span>
        </div>
        <div>
          <div class="detail-label">Budget</div>
          <div class="detail-value">${formatCurrency(task.budget)}</div>
        </div>
        <div>
          <div class="detail-label">Task ID</div>
          <div class="detail-value">${escapeHtml(task.task_id)}</div>
        </div>
      </div>
      <div style="margin-top:var(--spacing-lg);">
        <div class="detail-label">Description</div>
        <p class="detail-copy">${escapeHtml(task.description)}</p>
      </div>
    `;
    return task;
  }

  async function loadApplications(task) {
    const [apps, services] = await Promise.all([
      apiRequest(`/api/applications?taskId=${taskId}`),
      apiRequest('/api/services').catch(() => []),
    ]);
    associatedGigs = buildAssociatedGigs(apps, task, services);
    renderAssociatedGigs();
    renderDeliverableGigOptions();

    if (addDeliverableBtn) {
      addDeliverableBtn.disabled = associatedGigs.length === 0;
    }
  }

  function buildAssociatedGigs(apps, task, services = []) {
    const byGigId = new Map();
    const gigNameById = new Map(
      (Array.isArray(services) ? services : [])
        .filter(service => service?.gig_profile_id)
        .map(service => [
          service.gig_profile_id,
          service.user?.name || service.name || service.title || '',
        ])
    );
    const getGigName = (gigProfileId) => gigNameById.get(gigProfileId) || '';

    const assignedGigs = Array.isArray(task.assignedGigs)
      ? task.assignedGigs
      : (task.assigned_to ? [task.assigned_to] : []);

    assignedGigs.forEach((gigProfileId) => {
      if (!gigProfileId) return;
      byGigId.set(gigProfileId, {
        gig_profile_id: gigProfileId,
        gig_name: getGigName(gigProfileId),
        status: 'assigned',
      });
    });

    if (byGigId.size === 0) {
      apps
        .filter(app => String(app.status).toLowerCase() === 'accepted')
        .forEach(app => {
          if (!app.gig_profile_id) return;
          byGigId.set(app.gig_profile_id, {
            gig_profile_id: app.gig_profile_id,
            gig_name: getGigName(app.gig_profile_id),
            status: app.status || 'associated',
          });
        });
    }

    return Array.from(byGigId.values());
  }

  function renderAssociatedGigs() {
    if (associatedGigs.length === 0) {
      gigsContainer.innerHTML = '<p class="empty-state">No gigs assigned to this task</p>';
      if (addDeliverableForm) addDeliverableForm.classList.remove('is-visible');
      return;
    }

    gigsContainer.innerHTML = associatedGigs.map(gig => {
      return `
        <div class="relationship-row">
          <div>
            <div class="detail-value">Gig ${escapeHtml(gig.gig_profile_id)}</div>
            <div class="detail-copy" style="font-weight:600;">${escapeHtml(gig.gig_name || 'Name unavailable')}</div>
            <div class="detail-label">Gig Profile: ${escapeHtml(gig.gig_profile_id)}</div>
          </div>
          <span class="status-badge ${getStatusBadgeClass(gig.status)}">${escapeHtml(gig.status)}</span>
        </div>
      `;
    }).join('');
  }

  async function loadDeliverables() {
    const deliverables = await apiRequest(`/api/tasks/${taskId}/deliverables`);

    if (deliverables.length === 0) {
      deliverablesContainer.innerHTML = '<p class="empty-state">No deliverables submitted yet.</p>';
      return;
    }

    deliverablesContainer.innerHTML = deliverables.map(deliverable => {
      const status = normalizeDeliverableStatus(deliverable.status);
      const isClosed = status === 'approved' || status === 'rejected';
      const deliverableId = getDeliverableId(deliverable);

      return `
        <div class="deliverable-card">
          <div class="deliverable-card-header">
            <div>
              <h3>Deliverable #${escapeHtml(deliverable.deliverable_no)}</h3>
              <p>Assigned Gig ID: ${escapeHtml(deliverable.gig_profile_id)}</p>
              <p>Submitted by: ${deliverable.submitted_by ? escapeHtml(deliverable.submitted_by) : `Gig ${escapeHtml(deliverable.gig_profile_id)}`}</p>
            </div>
            <span class="deliverable-status ${status}">Status: ${formatDeliverableStatus(status)}</span>
          </div>
          <p class="detail-copy">${escapeHtml(deliverable.description || deliverable.content)}</p>
          <div class="deliverable-meta">ID: ${escapeHtml(deliverableId)}</div>
          <div class="actions-cell" style="margin-top:var(--spacing-md);">
            <button class="btn btn-primary" type="button" data-deliverable-action="approved" data-deliverable-id="${escapeHtml(deliverableId)}" ${isClosed ? 'disabled' : ''}>Approve</button>
            <button class="btn btn-outline" type="button" data-deliverable-action="rejected" data-deliverable-id="${escapeHtml(deliverableId)}" ${isClosed ? 'disabled' : ''}>Reject</button>
          </div>
        </div>
      `;
    }).join('');

    deliverablesContainer.querySelectorAll('[data-deliverable-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await apiRequest(`/api/deliverables/${btn.dataset.deliverableId}`, 'PATCH', {
          status: btn.dataset.deliverableAction,
        });
        await loadDeliverables();
      });
    });
  }

  function renderDeliverableGigOptions() {
    if (!gigSelect) return;

    gigSelect.innerHTML = '<option value="">Select Gig</option>';

    gigSelect.disabled = associatedGigs.length === 0;
    associatedGigs.forEach(gig => {
      if (!gig.gig_profile_id) return;

      const option = document.createElement('option');
      option.value = gig.gig_profile_id;
      option.textContent = gig.gig_name
        ? `Gig ${gig.gig_profile_id} - ${gig.gig_name}`
        : `Gig ${gig.gig_profile_id}`;
      gigSelect.appendChild(option);
    });
  }

  if (addDeliverableBtn && addDeliverableForm) {
    addDeliverableBtn.addEventListener('click', () => {
      if (associatedGigs.length === 0) {
        alert('No gigs assigned to this task');
        return;
      }
      renderDeliverableGigOptions();
      addDeliverableForm.classList.add('is-visible');
      gigSelect?.focus();
    });
  }

  if (cancelDeliverableBtn && addDeliverableForm) {
    cancelDeliverableBtn.addEventListener('click', () => {
      addDeliverableForm.reset();
      addDeliverableForm.classList.remove('is-visible');
    });
  }

  if (addDeliverableForm) {
    addDeliverableForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const content = String(descriptionInput?.value || '').trim();
      const gigId = String(gigSelect?.value || '').trim();

      if (!gigId) {
        alert('Please select a gig');
        return;
      }

      if (!content) {
        alert('Please enter deliverable content.');
        return;
      }

      await apiRequest(`/api/managers/me/tasks/${taskId}/deliverables`, 'POST', {
        gig_profile_id: gigId,
        content: content,
      });

      addDeliverableForm.reset();
      addDeliverableForm.classList.remove('is-visible');
      await loadDeliverables();
    });
  }

  try {
    const task = await loadTask();
    if (!task) return;
    await Promise.all([loadApplications(task), loadDeliverables()]);
  } catch (err) {
    console.error('Task details load failed:', err);
  }
}

async function initApplications(user) {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get('taskId');
  const tbody = document.querySelector('#applications-table tbody');
  const title = document.getElementById('applications-task-title');

  if (!tbody) return;

  async function render() {
    const tasks = await apiRequest(`/api/tasks?clientId=${user.userId}`);
    const task = taskId ? tasks.find(item => item.task_id === taskId) : null;
    const applicationsByTask = taskId
      ? [[taskId, await apiRequest(`/api/applications?taskId=${taskId}`)]]
      : await Promise.all(tasks.map(async item => {
          try {
            return [item.task_id, await apiRequest(`/api/applications?taskId=${item.task_id}`)];
          } catch (_) {
            return [item.task_id, []];
          }
        }));
    const taskTitleById = new Map(tasks.map(item => [item.task_id, item.title]));
    const apps = applicationsByTask.flatMap(([currentTaskId, rows]) =>
      (Array.isArray(rows) ? rows : []).map(app => ({
        ...app,
        task_id: currentTaskId,
        task_title: taskTitleById.get(currentTaskId) || currentTaskId,
      }))
    );

    if (title) title.textContent = taskId ? (task ? task.title : taskId) : 'All posted tasks';

    if (apps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;">No applications yet.</td></tr>';
      return;
    }

    tbody.innerHTML = apps.map(app => {
      const status = String(app.status || 'pending').toLowerCase();
      const isClosed = status === 'accepted' || status === 'rejected';

      return `
        <tr>
          <td>${escapeHtml(app.application_id)}</td>
          <td>
            ${escapeHtml(app.gig_profile_id)}
            ${taskId ? '' : `<div class="task-category">${escapeHtml(app.task_title)}</div>`}
          </td>
          <td><span class="status-badge ${getStatusBadgeClass(status)}">${escapeHtml(status)}</span></td>
          <td><div class="actions-cell">
            <button class="btn btn-primary" style="padding:4px 12px;font-size:0.8rem;" data-accept="${escapeHtml(app.application_id)}" ${isClosed ? 'disabled' : ''}>Accept</button>
            <button class="btn btn-outline" style="padding:4px 12px;font-size:0.8rem;" data-reject="${escapeHtml(app.application_id)}" ${isClosed ? 'disabled' : ''}>Reject</button>
          </div></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-accept]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await apiRequest(`/api/applications/${btn.dataset.accept}`, 'PATCH', { status: 'accepted' });
        await render();
      });
    });

    tbody.querySelectorAll('[data-reject]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await apiRequest(`/api/applications/${btn.dataset.reject}`, 'PATCH', { status: 'rejected' });
        await render();
      });
    });
  }

  try {
    await render();
  } catch (err) {
    console.error('Applications load failed:', err);
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;">Unable to load applications.</td></tr>';
  }
}

async function initReviewShortlist(user) {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get('taskId');
  if (!taskId) return;

  try {
    const apps = await apiRequest(`/api/applications?taskId=${taskId}`);
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    if (apps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;">No applications yet.</td></tr>';
      return;
    }

    tbody.innerHTML = apps.map(a => `
      <tr>
        <td>${a.gig_profile_id}</td>
        <td><span class="status-badge ${getStatusBadgeClass(a.status)}">${a.status}</span></td>
        <td>${formatDate(a.createdAt)}</td>
        <td><div class="actions-cell">
          <button class="btn btn-primary" style="padding:4px 12px;font-size:0.8rem;" data-accept="${a.application_id}">Accept</button>
          <button class="btn btn-outline" style="padding:4px 12px;font-size:0.8rem;" data-reject="${a.application_id}">Reject</button>
        </div></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-accept]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await apiRequest(`/api/applications/${btn.dataset.accept}`, 'PATCH', { status: 'accepted' });
        initReviewShortlist(user);
      });
    });

    tbody.querySelectorAll('[data-reject]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await apiRequest(`/api/applications/${btn.dataset.reject}`, 'PATCH', { status: 'rejected' });
        initReviewShortlist(user);
      });
    });
  } catch (err) {
    console.error('Review shortlist failed:', err);
  }
}

// ── Review Deliverables ──────────────────────────────────────────
async function initReviewDeliverables(user) {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get('taskId');
  if (!taskId) return;

  try {
    const deliverables = await apiRequest(`/api/tasks/${taskId}/deliverables`);
    const container = document.querySelector('.deliverables-list') || document.querySelector('.dashboard-content');
    if (!container) return;

    if (deliverables.length === 0) {
      container.innerHTML += '<p style="text-align:center;padding:2rem;color:var(--color-text-muted);">No deliverables submitted yet.</p>';
      return;
    }

    const html = deliverables.map(d => `
      <div style="background:var(--color-white);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--spacing-lg);margin-bottom:var(--spacing-md);">
        <p style="font-weight:600;">Deliverable #${d.deliverable_no}</p>
        <p style="margin:var(--spacing-sm) 0;">${d.content}</p>
        <p style="font-size:0.8rem;color:var(--color-text-muted);">Submitted: ${formatDate(d.createdAt)}</p>
        <button class="btn btn-primary" style="margin-top:var(--spacing-sm);padding:4px 16px;font-size:0.85rem;" data-approve-del="${d.task_id}:${d.deliverable_no}">Approve</button>
      </div>
    `).join('');
    container.innerHTML += html;

    container.querySelectorAll('[data-approve-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const [tid] = btn.dataset.approveDel.split(':');
        await apiRequest(`/api/deliverables/${tid}`, 'PATCH', { action: 'approve' });
        alert('Deliverable approved!');
        location.reload();
      });
    });
  } catch (err) {
    console.error('Review deliverables failed:', err);
  }
}

// ── Search Talent ────────────────────────────────────────────────
async function initSearchTalent(user) {
  try {
    const services = await apiRequest('/api/services');
    const grid = document.getElementById('talent-grid') || document.querySelector('.talent-grid') || document.querySelector('.dashboard-content');
    if (!grid) return;

    const serviceList = Array.isArray(services) ? services : [];
    if (serviceList.length === 0) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--color-text-muted);padding:var(--spacing-xxl);">No services available yet.</p>';
      return;
    }

    grid.innerHTML = serviceList.map((service) => `
      <article class="talent-card">
        <div class="talent-banner talent-banner-blue">
          <span class="talent-vetted-badge">✓ Active</span>
        </div>
        <div class="talent-body">
          <div class="talent-header">
            <span class="talent-name">${service.title}</span>
            <span class="talent-rate">₹${Number(service.price || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="talent-title">${service.user?.name || 'Gig Professional'}</div>
          <div class="talent-rating">
            <span class="star">★</span> ${service.user?.name || service.gig_profile_id}
          </div>
          <div class="talent-skills">
            ${(service.skills || service.tags || []).map((tag) => `<span class="skill-chip">${tag}</span>`).join('') || '<span class="skill-chip">No tags</span>'}
          </div>
          <p style="font-size:0.875rem;color:var(--color-text-muted);margin-top:var(--spacing-sm);">${service.description}</p>
          <div class="talent-actions">
            <button type="button" class="btn-hire" data-request-service="${service.service_id}">Request / Hire</button>
          </div>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('[data-request-service]').forEach((button) => {
      button.addEventListener('click', async () => {
        const serviceId = button.dataset.requestService;
        const service = serviceList.find((item) => item.service_id === serviceId);
        if (!service) return;

        const requestPayload = {
          client_id: user.userId,
          title: service.title,
          description: service.description,
          budget: Number(service.price || 0),
        };

        try {
          await apiRequest(`/api/services/${serviceId}/requests`, 'POST', requestPayload);
          button.textContent = 'Requested';
          button.disabled = true;
        } catch (error) {
          console.error('Service request failed:', error);
        }
      });
    });
  } catch (err) {
    console.error('Search talent failed:', err);
  }
}

// ── Add Manager ──────────────────────────────────────────────────
async function initAddManager(user) {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('manager-name')?.value || '').trim();
    const email = (document.getElementById('manager-email')?.value || '').trim();
    const password = (document.getElementById('manager-password')?.value || 'default123');

    if (!name || !email) { alert('Name and email are required'); return; }

    try {
      await apiRequest('/api/manager-invites', 'POST', {
        client_id: user.userId,
        name, email, password,
        manager_id: 'mgr-' + Date.now(),
      });
      alert('Manager invited successfully!');
      window.location.href = 'client-dashboard.html';
    } catch (err) {
      console.error('Add manager failed:', err);
    }
  });
}

// ── Total Spent ──────────────────────────────────────────────────
async function initTotalSpent(user) {
  try {
    const tasks = await apiRequest(`/api/tasks?clientId=${user.userId}`);
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    const totalSpent = completedTasks.reduce((sum, t) => sum + t.budget, 0);

    const totalEl = document.getElementById('total-spent-amount') || document.querySelector('.metric-value');
    if (totalEl) totalEl.textContent = formatCurrency(totalSpent);
  } catch (err) {
    console.error('Total spent failed:', err);
  }
}

// ── Profile Selection (Manage Managers) ──────────────────────────
async function initProfileSelection(user) {
  try {
    const managers = await apiRequest(`/api/manager-invites?clientId=${user.userId}`);
    const container = document.querySelector('.dashboard-content') || document.querySelector('main');
    if (!container || managers.length === 0) return;

    const list = managers.map(m => `
      <div style="background:var(--color-white);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--spacing-lg);margin-bottom:var(--spacing-md);">
        <p style="font-weight:600;">${m.user?.name || 'Manager'}</p>
        <p style="font-size:0.8rem;color:var(--color-text-muted);">${m.user?.email || ''}</p>
      </div>
    `).join('');
    container.innerHTML += `<h2 style="margin:var(--spacing-lg) 0;">Your Managers</h2>` + list;
  } catch (err) {
    console.error('Profile selection failed:', err);
  }
}
