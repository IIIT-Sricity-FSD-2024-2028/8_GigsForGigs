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

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth(['CLIENT']);
  if (!user) return;

  const page = getPage();

  // Wire logout buttons
  document.querySelectorAll('[data-action="logout"]').forEach(el =>
    el.addEventListener('click', (e) => { e.preventDefault(); logout(); })
  );

  switch (page) {
    case 'client-dashboard.html': initClientDashboard(user); break;
    case 'post-gig.html': initPostGig(user); break;
    case 'my-gigs-client.html': initMyGigs(user); break;
    case 'task-details.html': initTaskDetails(user); break;
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
              <a href="review-shortlist.html?taskId=${t.task_id}" class="btn-icon-action" title="View Applications">👁</a>
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
    const applicationGroups = await Promise.all(
      tasks.map(async (task) => {
        try {
          const apps = await apiRequest(`/api/applications?taskId=${task.task_id}`);
          return [task.task_id, apps];
        } catch (_) {
          return [task.task_id, []];
        }
      })
    );
    const appsByTaskId = new Map(applicationGroups);
    const container = document.getElementById('active-contracts-content');
    const tbody = document.querySelector('#active-contracts-table tbody');
    const target = tbody || container;
    if (!target) return;

    if (tasks.length === 0) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">No tasks found.</td></tr>';
      else target.innerHTML = '<p style="text-align:center;padding:2rem;">No tasks found.</p>';
      return;
    }

    if (tbody) {
      tbody.innerHTML = tasks.map(t => `
        <tr>
          <td><div class="task-name-cell">${t.title}</div></td>
          <td><span class="status-badge ${getStatusBadgeClass(t.status)}">${t.status.replace('_', ' ')}</span></td>
          <td class="budget-cell">${formatCurrency(t.budget)}</td>
          <td>${formatDate(t.createdAt)}</td>
          <td><div class="actions-cell">
            <a href="post-gig.html?editId=${t.task_id}" class="btn-icon-action" title="Edit">✏️</a>
            <button class="btn-icon-action" title="Delete" data-delete-task="${t.task_id}">🗑️</button>
          </div></td>
        </tr>
      `).join('');

      tbody.innerHTML = tasks.map(t => {
        const apps = appsByTaskId.get(t.task_id) || [];
        const professionals = t.assigned_to || apps.map(app => app.gig_profile_id).join(', ') || 'Not assigned';
        const progress = getTaskProgress(t.status);

        return `
          <tr>
            <td>
              <div class="task-name-cell">${escapeHtml(t.title)}</div>
              <div class="task-category">${escapeHtml(formatDate(t.createdAt))}</div>
            </td>
            <td>
              <div class="pro-cell">
                <div class="pro-photo"></div>
                ${escapeHtml(professionals)}
              </div>
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
    const apps = await apiRequest(`/api/applications?taskId=${taskId}`);
    associatedGigs = buildAssociatedGigs(apps, task);
    renderAssociatedGigs();
    renderDeliverableGigOptions();

    if (addDeliverableBtn) {
      addDeliverableBtn.disabled = associatedGigs.length === 0;
    }
  }

  function buildAssociatedGigs(apps, task) {
    const byGigId = new Map();

    if (task.assigned_to) {
      byGigId.set(task.assigned_to, {
        gig_profile_id: task.assigned_to,
        status: 'assigned',
      });
    }

    if (byGigId.size === 0) {
      apps
        .filter(app => String(app.status).toLowerCase() === 'accepted')
        .forEach(app => {
          if (!app.gig_profile_id) return;
          byGigId.set(app.gig_profile_id, {
            gig_profile_id: app.gig_profile_id,
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
      option.textContent = `Gig ${gig.gig_profile_id}`;
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
        await apiRequest(`/api/applications/${btn.dataset.accept}`, 'PATCH', { status: 'shortlisted' });
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
    const grid = document.querySelector('.talent-grid') || document.querySelector('.dashboard-content .metrics-grid') || document.querySelector('.dashboard-content');
    if (!grid) return;

    if (services.length === 0) return;

    const cardsHtml = services.map(s => `
      <div style="background:var(--color-white);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--spacing-lg);">
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:var(--spacing-xs);">${s.user?.name || 'Professional'}</h3>
        <p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:var(--spacing-sm);">${(s.skills || []).join(', ') || 'No skills listed'}</p>
        <p style="font-size:0.875rem;">${s.tools ? s.tools.join(', ') : ''}</p>
        <a href="review-shortlist.html" class="btn btn-outline btn-full" style="margin-top:var(--spacing-md);text-align:center;text-decoration:none;">View Profile</a>
      </div>
    `).join('');
    
    // Inject after existing content or replace placeholder
    const existingGrid = grid.querySelector('.metrics-grid, .talent-cards');
    if (existingGrid) existingGrid.innerHTML = cardsHtml;
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
