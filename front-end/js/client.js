// ─── client.js ─ All Client Pages ────────────────────────────────
import { apiRequest, requireAuth, logout, formatCurrency, formatDate, getStatusBadgeClass } from './api.js';

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
