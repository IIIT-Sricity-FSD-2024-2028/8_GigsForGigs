// ─── tasks.js ───────────────────────────────────────────────────
// Full CRUD on the in‑memory tasks array.
// Pages:  post-gig.html, my-gigs-client.html, manager-dashboard.html,
//         explore-tasks.html, active-tasks.html
// ─────────────────────────────────────────────────────────────────

import { tasks, users, applications, persistApplications } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';
import { validatePostGigForm } from '../utils/validation.js';
import {
  formatDate, formatCurrency, generateId,
  truncate, getStatusBadgeClass, humaniseStatus, getInitials
} from '../utils/helpers.js';
import {
  getGigDashboardSummary,
  markGigTaskComplete,
  upsertGigRequestFromTask
} from './gigState.js';

const exploreState = {
  search: '',
  category: '',
  budget: '',
  duration: '',
  page: 1,
  pageSize: 6
};

// ── Render helpers ───────────────────────────────────────────────

function getUserById(id) {
  return users.find(u => u.id === id) || null;
}

// ── post-gig.html  (client creates a task) ───────────────────────

function initPostGig() {
  const user = getUser();
  if (!user) return;

  // Find the form — it has no id, select by context
  const form = document.querySelector('.form-page-container form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validatePostGigForm()) return;

    const newTask = {
      id: generateId('t'),
      clientId: user.id,
      title: document.getElementById('gig-title').value.trim(),
      category: document.getElementById('category').value,
      duration: document.getElementById('duration').value,
      description: document.getElementById('description').value.trim(),
      pricing: document.querySelector('input[name="pricing"]:checked')?.value || 'fixed',
      budget: Number(document.getElementById('budget').value),
      skills: (document.getElementById('skills').value || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      status: 'open',
      assignedTo: null,
      deadline: new Date(Date.now() + 30 * 86400000).toISOString(), // default 30 days
      createdAt: new Date().toISOString()
    };

    tasks.push(newTask);

    // Redirect back to client dashboard
    window.location.href = 'my-gigs-client.html';
  });
}

// ── my-gigs-client.html  (client lists / edits / deletes) ────────

function renderMyGigsClient() {
  const user = getUser();
  if (!user) return;

  const container = document.getElementById('active-contracts-content');
  if (!container) return;

  // Client sees own tasks; manager linked to client sees same tasks
  let clientId = user.id;
  if (user.role === 'manager') {
    const mgr = users.find(u => u.id === user.id);
    if (mgr && mgr.clientId) clientId = mgr.clientId;
  }

  const clientTasks = tasks.filter(t => t.clientId === clientId);

  if (clientTasks.length === 0) {
    container.style.textAlign = 'center';
    container.style.padding = 'var(--spacing-xxl)';
    container.style.color = 'var(--color-text-muted)';
    container.innerHTML = 'No active contracts yet. <a href="post-gig.html" style="color:var(--color-primary-blue);">Post a gig</a> to get started.';
    return;
  }

  container.style.textAlign = '';
  container.style.padding = '0';
  container.style.color = '';
  container.style.border = 'none';

  container.innerHTML = `<div style="display:flex;flex-direction:column;gap:var(--spacing-xl);">
    ${clientTasks.map(task => {
      const assignee = task.assignedTo ? getUserById(task.assignedTo) : null;
      const progress = task.status === 'completed' ? 100
        : task.status === 'under_review' ? 90
        : task.status === 'in_progress' ? 45 : 0;
      const progressLabel = humaniseStatus(task.status);

      // Action buttons — role‑gated
      let actions = '';
      if (task.status === 'under_review') {
        actions = `<a href="review-deliverables.html?taskId=${task.id}" class="btn btn-primary" style="background-color:var(--color-secondary);border-color:var(--color-secondary);text-decoration:none;">Review Deliverables →</a>`;
      } else if (task.status === 'in_progress' && assignee) {
        actions = `<span class="btn btn-outline" style="cursor:default;">In Progress</span>`;
      }

      // Delete button — client only, not manager
      let deleteBtn = '';
      if (user.role === 'client') {
        deleteBtn = `<button class="btn btn-outline delete-task-btn" data-task-id="${task.id}" style="padding:6px 12px;font-size:0.8rem;color:var(--color-text-muted);border-color:var(--color-border);margin-left:auto;">Delete</button>`;
      }

      return `
        <div class="dashboard-section" ${task.status === 'under_review' ? 'style="border:2px solid var(--color-secondary);"' : ''}>
          <div style="display:flex;justify-content:space-between;margin-bottom:var(--spacing-md);">
            <div>
              <div style="display:flex;align-items:center;gap:var(--spacing-sm);margin-bottom:4px;">
                <span class="${getStatusBadgeClass(task.status)}">${humaniseStatus(task.status)}</span>
                <span style="font-size:0.875rem;color:var(--color-text-muted);">Due ${formatDate(task.deadline)}</span>
              </div>
              <h2 style="font-size:1.25rem;font-weight:700;color:var(--color-primary-dark);">${task.title}</h2>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.875rem;color:var(--color-text-muted);text-transform:uppercase;">Total Budget</div>
              <div style="font-weight:700;color:var(--color-primary-dark);font-size:1.125rem;">${formatCurrency(task.budget)}</div>
            </div>
          </div>
          <div style="display:flex;gap:var(--spacing-xl);padding-top:var(--spacing-md);border-top:1px solid var(--color-border);align-items:center;">
            ${assignee ? `
              <div style="display:flex;align-items:center;gap:var(--spacing-sm);">
                <div class="talent-avatar" style="width:48px;height:48px;font-size:1rem;color:var(--color-white);background-color:var(--color-primary-dark);">${getInitials(assignee.name)}</div>
                <div>
                  <div style="font-weight:600;color:var(--color-text-dark);">${assignee.name}</div>
                  <div style="font-size:0.75rem;color:var(--color-text-muted);">${assignee.title || 'Professional'}</div>
                </div>
              </div>
            ` : `<div style="font-size:0.875rem;color:var(--color-text-muted);">No professional assigned yet</div>`}
            <div style="flex:1;">
              <div style="display:flex;justify-content:space-between;font-size:0.875rem;margin-bottom:8px;">
                <span style="font-weight:600;color:var(--color-text-dark);">Project Progress</span>
                <span style="color:var(--color-primary-blue);">${progressLabel} (${progress}%)</span>
              </div>
              <div class="progress-container">
                <div class="progress-bar" style="width:${progress}%;"></div>
              </div>
            </div>
            ${actions}
            ${deleteBtn}
          </div>
        </div>`;
    }).join('')}
  </div>`;

  // Attach delete listeners (client only)
  container.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.taskId;
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        tasks.splice(idx, 1);
        renderMyGigsClient(); // re‑render without page reload
      }
    });
  });
}

function initMyGigsClient() {
  renderMyGigsClient();
}

// ── manager-dashboard.html  (list only, no delete) ───────────────

function renderManagerDashboard() {
  const user = getUser();
  if (!user) return;

  const mgr = users.find(u => u.id === user.id);
  const clientId = mgr && mgr.clientId ? mgr.clientId : user.id;

  const activeTasks = tasks.filter(t => t.clientId === clientId && (t.status === 'in_progress' || t.status === 'under_review'));
  const pendingTasks = tasks.filter(t => t.clientId === clientId && (t.status === 'open' || t.status === 'completed'));

  // Active tasks table body
  const activeBody = document.getElementById('manager-active-tasks-body');
  if (activeBody) {
    if (activeTasks.length === 0) {
      activeBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No active tasks yet.</td></tr>`;
    } else {
      activeBody.innerHTML = activeTasks.map(task => {
        const assignee = task.assignedTo ? getUserById(task.assignedTo) : null;
        return `<tr>
          <td>
            <div style="font-weight:600;color:var(--color-text-dark);">${task.title}</div>
            <div style="font-size:0.75rem;color:var(--color-text-muted);">${task.category || ''}</div>
          </td>
          <td>
            <div class="pro-cell">
              <div class="pro-photo"></div>
              ${assignee ? assignee.name : '—'}
            </div>
          </td>
          <td style="color:var(--color-text-muted);">${formatDate(task.deadline)}</td>
          <td style="font-weight:600;">${formatCurrency(task.budget)}</td>
          <td><span class="${getStatusBadgeClass(task.status)}">${humaniseStatus(task.status)}</span></td>
          <td><a href="../client/review-deliverables.html?taskId=${task.id}" class="btn-review-proposal">Review</a></td>
        </tr>`;
      }).join('');
    }
  }

  // Pending tasks table body
  const pendingBody = document.getElementById('manager-pending-tasks-body');
  if (pendingBody) {
    if (pendingTasks.length === 0) {
      pendingBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No pending tasks yet.</td></tr>`;
    } else {
      pendingBody.innerHTML = pendingTasks.map(task => {
        const assignee = task.assignedTo ? getUserById(task.assignedTo) : null;
        return `<tr>
          <td>
            <div style="font-weight:600;color:var(--color-text-dark);">${task.title}</div>
            <div style="font-size:0.75rem;color:var(--color-text-muted);">${task.category || ''}</div>
          </td>
          <td>
            <div class="pro-cell">
              <div class="pro-photo"></div>
              ${assignee ? assignee.name : '—'}
            </div>
          </td>
          <td style="color:var(--color-text-muted);">${formatDate(task.deadline)}</td>
          <td style="font-weight:600;">${formatCurrency(task.budget)}</td>
          <td><span class="${getStatusBadgeClass(task.status)}">${humaniseStatus(task.status)}</span></td>
          <td><button class="more-btn">⋮</button></td>
        </tr>`;
      }).join('');
    }
  }
}

function initManagerDashboard() {
  renderManagerDashboard();
}

// ── explore-tasks.html  (gig sees open tasks, apply button) ──────

function renderExploreTasks() {
  const user = getUser();
  if (!user || user.role !== 'gig') return;

  const openTasks = tasks.filter(t => t.status === 'open');
  const workflowSummary = getGigDashboardSummary(user.id);
  const requestByTaskId = new Map(
    workflowSummary.requests.map((request) => [request.sourceTaskId, request])
  );
  const grid = document.getElementById('explore-tasks-grid')
    || document.querySelector('.dashboard-content .explore-card')?.parentElement
    || document.querySelector('.dashboard-content [style*="grid-template-columns"]');
  const pagination = document.getElementById('explore-pagination');
  if (!grid) return;

  const filteredTasks = openTasks.filter((task) => {
    const matchesSearch = !exploreState.search
      || task.title.toLowerCase().includes(exploreState.search)
      || (task.description || '').toLowerCase().includes(exploreState.search);

    const matchesCategory = !exploreState.category || task.category === exploreState.category;

    const budget = Number(task.budget) || 0;
    const matchesBudget = !exploreState.budget
      || (exploreState.budget === '1' && budget < 500)
      || (exploreState.budget === '2' && budget >= 500 && budget <= 1000)
      || (exploreState.budget === '3' && budget > 1000);

    const duration = task.duration || '';
    const matchesDuration = !exploreState.duration
      || (exploreState.duration === '1' && ['one-time', 'less-week'].includes(duration))
      || (exploreState.duration === '2' && ['less-month', '1-4-weeks'].includes(duration))
      || (exploreState.duration === '3' && ['1-3-months', 'ongoing'].includes(duration));

    return matchesSearch && matchesCategory && matchesBudget && matchesDuration;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / exploreState.pageSize));
  exploreState.page = Math.min(exploreState.page, totalPages);
  const startIndex = (exploreState.page - 1) * exploreState.pageSize;
  const pagedTasks = filteredTasks.slice(startIndex, startIndex + exploreState.pageSize);

  if (pagedTasks.length === 0) {
    const message = filteredTasks.length === 0
      ? 'No tasks match your current filters.'
      : 'No tasks available on this page.';
    grid.innerHTML = `<div style="grid-column:1/-1;padding:var(--spacing-xxl);text-align:center;color:var(--color-text-muted);border:1px dashed var(--color-border);border-radius:var(--radius-lg);">${message}</div>`;
    if (pagination) pagination.innerHTML = '';
    return;
  }

  const colors = [
    'rgba(8, 75, 131, 0.1)',
    'rgba(191, 105, 0, 0.1)',
    'rgba(81, 158, 138, 0.1)',
    'var(--color-border)'
  ];

  grid.innerHTML = pagedTasks.map((task, i) => {
    const client = getUserById(task.clientId);
    const linkedRequest = requestByTaskId.get(task.id) || null;
    const existingApp = applications.find((app) => app.taskId === task.id && app.gigId === user.id);
    const statusLabel = linkedRequest
      ? humaniseStatus(linkedRequest.status)
      : existingApp
        ? humaniseStatus(existingApp.status)
        : '';

    return `
      <div class="explore-card">
        <div class="explore-image" style="background-color:${colors[i % colors.length]};">
          <svg width="48" height="48" fill="none" stroke="var(--color-primary-dark)" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </div>
        <div class="explore-content">
          <h3 class="explore-title">${task.title}</h3>
          <p class="explore-client">${client ? client.company || client.name : 'Unknown'}</p>
          <div class="explore-price">${formatCurrency(task.budget)}</div>
          <div class="explore-footer" style="display:flex;gap:var(--spacing-sm);">
            <a href="project-detail.html?taskId=${task.id}" class="btn btn-outline" style="flex:1;text-align:center;text-decoration:none;">View Details</a>
            ${(linkedRequest || existingApp)
              ? `<span class="btn btn-outline" style="flex:1;text-align:center;opacity:0.85;cursor:default;">${statusLabel}</span>`
              : `<button class="btn btn-primary apply-task-btn" data-task-id="${task.id}" style="flex:1;">Apply</button>`
            }
          </div>
        </div>
      </div>`;
  }).join('');

  // Apply listeners
  grid.querySelectorAll('.apply-task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.taskId;
      if (!taskId) return;

      const sourceTask = tasks.find((task) => task.id === taskId);
      if (!sourceTask) return;

      const duplicate = applications.find((app) => app.taskId === taskId && app.gigId === user.id);
      if (!duplicate) {
        applications.push({
          id: generateId('a'),
          taskId,
          gigId: user.id,
          coverLetter: 'Application submitted from Explore Tasks.',
          proposedBudget: Number(sourceTask.budget) || 0,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        persistApplications();
      }

      upsertGigRequestFromTask(user.id, sourceTask);

      renderExploreTasks(); // re‑render
    });
  });

  if (pagination) {
    const pageButtons = [];
    const prevDisabled = exploreState.page === 1 ? 'style="opacity:0.5;pointer-events:none;"' : '';
    pageButtons.push(`<a href="#" class="page-btn" data-page="${Math.max(1, exploreState.page - 1)}" ${prevDisabled}>&laquo;</a>`);

    for (let page = 1; page <= totalPages; page += 1) {
      pageButtons.push(`<a href="#" class="page-btn ${page === exploreState.page ? 'active' : ''}" data-page="${page}">${page}</a>`);
    }

    const nextDisabled = exploreState.page === totalPages ? 'style="opacity:0.5;pointer-events:none;"' : '';
    pageButtons.push(`<a href="#" class="page-btn" data-page="${Math.min(totalPages, exploreState.page + 1)}" ${nextDisabled}>&raquo;</a>`);

    pagination.innerHTML = pageButtons.join('');

    pagination.querySelectorAll('[data-page]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const nextPage = Number(link.getAttribute('data-page'));
        if (!Number.isFinite(nextPage)) return;
        exploreState.page = Math.max(1, Math.min(totalPages, nextPage));
        renderExploreTasks();
      });
    });
  }
}

function initExploreTasks() {
  const searchInput = document.getElementById('explore-search-input');
  const categoryFilter = document.getElementById('explore-category-filter');
  const budgetFilter = document.getElementById('explore-budget-filter');
  const durationFilter = document.getElementById('explore-duration-filter');
  const filterButton = document.getElementById('explore-filter-btn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      exploreState.search = searchInput.value.trim().toLowerCase();
      exploreState.page = 1;
      renderExploreTasks();
    });
  }

  const applyFilters = () => {
    exploreState.category = categoryFilter?.value || '';
    exploreState.budget = budgetFilter?.value || '';
    exploreState.duration = durationFilter?.value || '';
    exploreState.page = 1;
    renderExploreTasks();
  };

  if (filterButton) {
    filterButton.addEventListener('click', applyFilters);
  }

  if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
  if (budgetFilter) budgetFilter.addEventListener('change', applyFilters);
  if (durationFilter) durationFilter.addEventListener('change', applyFilters);

  renderExploreTasks();
}

// ── active-tasks.html  (gig sees in_progress tasks) ──────────────

function renderActiveTasks() {
  const user = getUser();
  if (!user || user.role !== 'gig') return;

  const container = document.getElementById('active-tasks-list');
  if (!container) return;

  const summary = getGigDashboardSummary(user.id);
  const myActive = summary.activeTasks;

  if (myActive.length === 0) {
    container.innerHTML = `<div style="padding:var(--spacing-xl);border:1px dashed var(--color-border);border-radius:var(--radius-lg);text-align:center;color:var(--color-text-muted);">No active tasks yet. Browse <a href="explore-tasks.html" style="color:var(--color-primary-blue);">open tasks</a> to find work.</div>`;
    return;
  }

  const colors = [
    'rgba(8, 75, 131, 0.1)',
    'rgba(191, 105, 0, 0.1)',
    'var(--color-text-dark)'
  ];

  container.innerHTML = myActive.map((task, i) => {
    const daysLeft = Math.max(0, Math.ceil((new Date(task.deadline) - Date.now()) / 86400000));
    const progress = Math.max(5, Math.min(95, Number(task.progress) || 20));

    return `
      <div class="task-card" style="align-items:stretch;">
        <div style="width:120px;background-color:${colors[i % colors.length]};border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;margin-right:var(--spacing-lg);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${i % 3 === 2 ? 'var(--color-white)' : 'var(--color-primary-dark)'}" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--spacing-md);">
            <div class="task-details">
              <h3>${task.title}</h3>
              <p>${task.clientName || 'Client'} • Due in ${daysLeft} days (${formatDate(task.deadline)})</p>
            </div>
            <div style="font-size:1.25rem;font-weight:700;color:var(--color-secondary);">${formatCurrency(task.budget)}</div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.875rem;color:var(--color-text-muted);">
            <span>Progress: In Development</span>
            <span style="font-weight:600;color:var(--color-primary-dark);">${progress}%</span>
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width:${progress}%;"></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center;margin-left:var(--spacing-xxl);min-width:140px;">
          <a href="project-detail.html?taskId=${task.id}" class="btn btn-outline btn-full" style="text-align:center;margin-bottom:var(--spacing-sm);text-decoration:none;">View Details</a>
          <button class="btn btn-primary-blue btn-full mark-complete-btn" data-task-id="${task.id}" style="text-align:center;">Mark Complete</button>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.mark-complete-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const taskId = button.dataset.taskId;
      if (!taskId) return;
      markGigTaskComplete(user.id, taskId);
      renderActiveTasks();
    });
  });
}

function initActiveTasks() {
  renderActiveTasks();
}

// ── Public entry point ───────────────────────────────────────────

export function init() {
  const path = window.location.pathname;

  if (path.includes('post-gig.html')) {
    initPostGig();
  } else if (path.includes('my-gigs-client.html')) {
    initMyGigsClient();
  } else if (path.includes('manager-dashboard.html')) {
    initManagerDashboard();
  } else if (path.includes('explore-tasks.html')) {
    initExploreTasks();
  } else if (path.includes('active-tasks.html')) {
    initActiveTasks();
  }
}
