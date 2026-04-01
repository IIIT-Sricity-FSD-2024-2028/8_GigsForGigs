// ─── tasks.js ───────────────────────────────────────────────────
// Full CRUD on the in‑memory tasks array.
// Pages:  post-gig.html, my-gigs-client.html, manager-dashboard.html,
//         explore-tasks.html, active-tasks.html
// ─────────────────────────────────────────────────────────────────

import { tasks, users, applications, deliverables, persistApplications, saveTasks } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';
import { validatePostGigForm } from '../utils/validation.js';
import {
  formatDate, formatCurrency, generateId,
  truncate, getStatusBadgeClass, humaniseStatus, getInitials
} from '../utils/helpers.js';
import {
  getGigDashboardSummary,
  markGigTaskComplete,
  upsertGigRequestFromTask,
  getClientContractSummary
} from './gigState.js';

const exploreState = {
  search: '',
  category: '',
  budget: '',
  duration: '',
  page: 1,
  pageSize: 6
};

const TASKS_KEY = 'gfg_tasks';

function syncTaskMemory(taskList) {
  tasks.length = 0;
  taskList.forEach((task) => tasks.push(task));
}

function persistTaskList(taskList) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(taskList));
    } catch {}
  }
  syncTaskMemory(taskList);
}

export function getTasks() {
  const fallback = Array.isArray(tasks) ? tasks.map((task) => ({ ...task })) : [];

  if (typeof localStorage === 'undefined') {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(fallback));
      return fallback;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function saveTask(data) {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Invalid task payload.' };
  }

  const title = String(data.title || '').trim();
  const category = String(data.category || '').trim();
  const description = String(data.description || '').trim();
  const budget = Number(data.budget);

  if (!title) return { ok: false, error: 'Task title is required.' };
  if (!category) return { ok: false, error: 'Task category is required.' };
  if (!description) return { ok: false, error: 'Task description is required.' };
  if (!Number.isFinite(budget) || budget <= 0) return { ok: false, error: 'Task budget must be valid.' };

  const taskList = getTasks();
  const newTask = {
    id: generateId('t'),
    clientId: data.clientId,
    title,
    category,
    duration: data.duration || 'one-time',
    description,
    pricing: data.pricing || 'fixed',
    budget,
    skills: Array.isArray(data.skills) ? data.skills : [],
    status: data.status || 'open',
    assignedTo: data.assignedTo ?? null,
    deadline: data.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: data.createdAt || new Date().toISOString()
  };

  taskList.push(newTask);
  persistTaskList(taskList);
  return { ok: true, task: newTask };
}

// ── Render helpers ───────────────────────────────────────────────

function getUserById(id) {
  return users.find(u => u.id === id) || null;
}

// ── post-gig.html  (client creates a task) ───────────────────────

function initPostGig() {
  const user = getUser();
  if (!user) return;
  if (user.role !== 'client') {
    window.location.replace('../manager/manager-dashboard.html');
    return;
  }

  // Find the form — it has no id, select by context
  const form = document.querySelector('.form-page-container form');
  if (!form) return;

  const budgetField = document.getElementById('budget');
  const budgetPreviewEl = document.getElementById('budget-inr-preview');

  const syncBudgetPreview = () => {
    if (!budgetField || !budgetPreviewEl) return;

    const rawValue = Number(budgetField.value);
    if (!budgetField.value || isNaN(rawValue) || rawValue <= 0) {
      budgetPreviewEl.textContent = 'Budget preview: ₹0.00';
      return;
    }

    budgetPreviewEl.textContent = `Budget preview: ${formatCurrency(rawValue)}`;
  };

  if (budgetField) {
    budgetField.addEventListener('input', syncBudgetPreview);
  }

  // Check if editing existing task
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('editId');
  const taskList = getTasks();
  const editingTask = editId ? taskList.find((t) => t.id === editId) : null;

  // Pre-fill form if editing
  if (editingTask) {
    const titleField = document.getElementById('gig-title');
    const categoryField = document.getElementById('category');
    const durationField = document.getElementById('duration');
    const descField = document.getElementById('description');
    const pricingRadios = document.querySelectorAll('input[name="pricing"]');
    const editBudgetField = document.getElementById('budget');
    const skillsField = document.getElementById('skills');

    if (titleField) titleField.value = editingTask.title;
    if (categoryField) categoryField.value = editingTask.category;
    if (durationField) durationField.value = editingTask.duration;
    if (descField) descField.value = editingTask.description;
    if (editBudgetField) editBudgetField.value = editingTask.budget;
    if (skillsField) skillsField.value = editingTask.skills.join(', ');

    pricingRadios.forEach(radio => {
      if (radio.value === editingTask.pricing) radio.checked = true;
    });

    // Update page title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'Edit Task';
  }

  syncBudgetPreview();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validatePostGigForm()) return;

    if (editingTask) {
      // UPDATE mode
      editingTask.title = document.getElementById('gig-title').value.trim();
      editingTask.category = document.getElementById('category').value;
      editingTask.duration = document.getElementById('duration').value;
      editingTask.description = document.getElementById('description').value.trim();
      editingTask.pricing = document.querySelector('input[name="pricing"]:checked')?.value || 'fixed';
      editingTask.budget = Number(document.getElementById('budget').value);
      editingTask.skills = (document.getElementById('skills').value || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      editingTask.updatedAt = new Date().toISOString();

      persistTaskList(taskList);
    } else {
      // CREATE mode
      const result = saveTask({
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
        assignedTo: null
      });

      if (!result.ok) return;
    }

    // Redirect back to client dashboard
    window.location.href = 'my-gigs-client.html';
  });
}

// ── my-gigs-client.html  (client lists / edits / deletes) ────────

function renderMyGigsClient() {
  const user = getUser();
  if (!user) return;

  const cardContainer = document.getElementById('active-contracts-content');
  const tableBody = document.querySelector('#active-contracts-table tbody');
  if (!cardContainer && !tableBody) return;

  // Client sees own tasks; manager linked to client sees same tasks
  let clientId = user.id;
  if (user.role === 'manager') {
    const mgr = users.find(u => u.id === user.id);
    if (mgr && mgr.clientId) clientId = mgr.clientId;
  }

  const searchInput = document.getElementById('gigs-search');
  const query = String(searchInput?.value || '').trim().toLowerCase();

  const contracts = getClientContractSummary(clientId).filter((contract) => contract.status !== 'declined');
  const sourceTaskIds = new Set(
    contracts.map((contract) => contract.sourceTaskId).filter(Boolean)
  );

  const taskList = getTasks();
  const legacyLinkedTasks = taskList
    .filter((task) => task.clientId === clientId && task.assignedTo && !sourceTaskIds.has(task.id))
    .map((task) => {
      const gigUser = getUserById(task.assignedTo);
      const normalizedStatus = task.status === 'completed'
        ? 'completed'
        : task.status === 'open'
          ? 'pending'
          : 'active';

      const progress = normalizedStatus === 'completed'
        ? 100
        : normalizedStatus === 'active'
          ? 45
          : 0;

      return {
        id: task.id,
        requestId: null,
        taskId: task.id,
        title: task.title,
        gigName: gigUser?.name || 'Not assigned',
        gigTitle: gigUser?.title || 'Professional',
        status: normalizedStatus,
        progress,
        budget: Number(task.budget) || 0,
        deadline: task.deadline,
        createdAt: task.createdAt || new Date().toISOString()
      };
    });

  const normalizedContracts = contracts.map((contract) => ({
    id: contract.id,
    requestId: contract.requestId,
    taskId: contract.taskId,
    title: contract.title,
    gigName: contract.gigName,
    gigTitle: contract.gigTitle,
    status: contract.status,
    progress: Number(contract.progress) || 0,
    budget: Number(contract.budget) || 0,
    deadline: contract.deadline,
    createdAt: contract.createdAt || new Date().toISOString()
  }));

  const combinedContracts = [...normalizedContracts, ...legacyLinkedTasks]
    .filter((item) => {
      if (!query) return true;
      const haystack = `${item.title} ${item.gigName} ${item.gigTitle}`.toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  if (combinedContracts.length === 0) {
    if (cardContainer) {
      cardContainer.style.textAlign = 'center';
      cardContainer.style.padding = 'var(--spacing-xxl)';
      cardContainer.style.color = 'var(--color-text-muted)';
      cardContainer.innerHTML = 'No active contracts yet. <a href="search-talent.html" style="color:var(--color-primary-blue);">Hire talent</a> to start your pipeline.';
    }

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">
            No active contracts yet. <a href="search-talent.html" style="color:var(--color-primary-blue);">Hire talent</a> to get started.
          </td>
        </tr>
      `;
    }

    return;
  }

  if (cardContainer) {
    cardContainer.style.textAlign = '';
    cardContainer.style.padding = '0';
    cardContainer.style.color = '';
    cardContainer.style.border = 'none';
  }

  if (tableBody) {
    tableBody.innerHTML = combinedContracts.map((contract) => {
      const statusClass = getStatusBadgeClass(contract.status);
      const statusLabel = humaniseStatus(contract.status);
      const progressValue = Math.max(0, Math.min(100, Number(contract.progress) || 0));

      let actionMarkup = '<span style="color:var(--color-text-muted);font-size:0.8125rem;">Awaiting gig response</span>';
      if (contract.status === 'active' || contract.status === 'completed') {
        const queryParam = contract.requestId
          ? `requestId=${contract.requestId}`
          : `taskId=${contract.taskId}`;
        actionMarkup = `<a href="../gig/project-detail.html?${queryParam}" class="btn-review-proposal">View</a>`;
      }

      return `
        <tr>
          <td>
            <div class="task-name-cell">${contract.title}</div>
            <div class="task-category">${contract.gigTitle || 'Professional Service'}</div>
          </td>
          <td>
            <div class="pro-cell">
              <div class="pro-photo">${getInitials(contract.gigName || 'GP')}</div>
              ${contract.gigName || 'Gig Professional'}
            </div>
          </td>
          <td><span class="${statusClass}">${statusLabel}</span></td>
          <td class="progress-cell">
            <div class="progress-bar-track">
              <div class="progress-bar-fill progress-bar-fill-blue" style="width: ${progressValue}%"></div>
            </div>
            <div class="progress-label">${contract.status === 'pending' ? 'Pending' : `${progressValue}%`}</div>
          </td>
          <td class="budget-cell">${formatCurrency(contract.budget)}</td>
          <td>
            <div class="actions-cell">
              ${actionMarkup}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function initMyGigsClient() {
  const searchInput = document.getElementById('gigs-search');
  if (searchInput && searchInput.dataset.boundContractsSearch !== '1') {
    searchInput.dataset.boundContractsSearch = '1';
    searchInput.addEventListener('input', renderMyGigsClient);
  }

  if (!window.__gfgClientContractsRealtimeBound) {
    window.__gfgClientContractsRealtimeBound = true;
    window.addEventListener('gfg:workflow-updated', renderMyGigsClient);
    window.addEventListener('storage', (event) => {
      if (event.key === 'gfg_gig_workflow_state') {
        renderMyGigsClient();
      }
    });
  }

  renderMyGigsClient();
}

// ── manager-dashboard.html  (list only, no delete) ───────────────

function renderManagerDashboard() {
  const user = getUser();
  if (!user) return;

  const mgr = users.find(u => u.id === user.id);
  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = mgr?.name || user.name || 'Manager';

  const clientId = mgr && mgr.clientId ? mgr.clientId : user.id;

  // First-time manager should start with empty dashboard state.
  if (mgr?.isFirstTimeUser) {
    const activeBody = document.getElementById('manager-active-tasks-body');
    if (activeBody) {
      activeBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No active tasks yet. Your client will assign work soon.</td></tr>`;
    }

    const pendingBody = document.getElementById('manager-pending-tasks-body');
    if (pendingBody) {
      pendingBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No pending tasks yet.</td></tr>`;
    }
    return;
  }

  const taskList = getTasks();
  const activeTasks = taskList.filter(t => t.clientId === clientId && (t.status === 'in_progress' || t.status === 'under_review'));
  const pendingTasks = taskList.filter(t => t.clientId === clientId && (t.status === 'open' || t.status === 'completed'));

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

  const taskList = getTasks();
  const openTasks = taskList.filter(t => t.status === 'open');
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
    const hasApplied = Boolean(linkedRequest || existingApp);
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
          ${statusLabel ? `<div style="font-size:0.75rem;color:var(--color-text-muted);margin-bottom:var(--spacing-sm);">Application: ${statusLabel}</div>` : ''}
          <div class="explore-footer" style="display:flex;gap:var(--spacing-sm);">
            <a href="project-detail.html?taskId=${task.id}" class="btn btn-outline" style="flex:1;text-align:center;text-decoration:none;">View Details</a>
            ${hasApplied
              ? `<button class="btn btn-outline withdraw-app-btn" data-task-id="${task.id}" style="flex:1;color:var(--color-text-muted);">Withdraw ✕</button>`
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

      const sourceTask = openTasks.find((task) => task.id === taskId);
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

  // Withdraw listeners
  grid.querySelectorAll('.withdraw-app-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.taskId;
      const idx = applications.findIndex(a => a.taskId === taskId && a.gigId === user.id);
      if (idx !== -1) {
        applications.splice(idx, 1);
        persistApplications();
        renderExploreTasks(); // re‑render
      }
    });
  });

  if (pagination) {
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    pagination.innerHTML = Array.from({ length: totalPages }, (_, index) => {
      const page = index + 1;
      const activeClass = page === exploreState.page ? 'active' : '';
      return `<button class="page-btn ${activeClass}" data-page="${page}" type="button">${page}</button>`;
    }).join('');

    pagination.querySelectorAll('.page-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const nextPage = Number(button.dataset.page);
        if (!Number.isFinite(nextPage) || nextPage === exploreState.page) return;
        exploreState.page = nextPage;
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

/* ── Submission Modal + Success Overlay (injected once) ─────────── */

function injectSubmitModalStyles() {
  if (document.getElementById('gfg-submit-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'gfg-submit-modal-styles';
  style.textContent = `
    /* ── BACKDROP ──────────────────────────────────────────────── */
    .submit-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9000;
      background: rgba(80, 36, 25, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    .submit-modal-backdrop.visible {
      opacity: 1;
      pointer-events: auto;
    }

    /* ── MODAL PANEL ──────────────────────────────────────────── */
    .submit-modal-panel {
      background: var(--color-white);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: 0 24px 64px rgba(8, 75, 131, 0.22);
      width: 96%;
      max-width: 640px;
      max-height: 90vh;
      overflow-y: auto;
      padding: var(--spacing-xxl);
      transform: translateY(24px) scale(0.97);
      transition: transform 0.3s ease;
    }
    .submit-modal-backdrop.visible .submit-modal-panel {
      transform: translateY(0) scale(1);
    }
    .submit-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
    }
    .submit-modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-dark);
      margin-bottom: 4px;
    }
    .submit-modal-subtitle {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      line-height: 1.5;
    }
    .submit-modal-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      padding: 4px;
      border-radius: var(--radius-sm);
      transition: color 0.2s, background 0.2s;
      flex-shrink: 0;
      margin-left: var(--spacing-md);
    }
    .submit-modal-close:hover {
      color: var(--color-text-dark);
      background: var(--color-bg-light);
    }

    /* ── PROJECT CONTEXT (inside modal) ───────────────────────── */
    .modal-project-context {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      background: var(--color-bg-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }
    .modal-project-preview {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
    .modal-preview-page {
      width: 60px;
      height: 74px;
      background: var(--color-white);
      border: 1px solid var(--color-border);
      border-radius: 3px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .modal-preview-page:nth-child(2) { margin-top: 6px; }
    .modal-preview-hdr { width:100%; height:18px; background:var(--color-primary-dark); border-radius:2px; opacity:0.8; }
    .modal-preview-hdr-alt { width:100%; height:18px; background:linear-gradient(135deg, var(--color-primary-dark) 60%, var(--color-secondary)); border-radius:2px; opacity:0.7; }
    .modal-preview-line { width:100%; height:3px; background:var(--color-border); border-radius:2px; }
    .modal-preview-line-thick { width:65%; height:5px; background:var(--color-border); border-radius:2px; }
    .modal-project-info { flex:1; min-width:0; }
    .modal-project-label {
      display:inline-block; font-size:0.6rem; font-weight:700;
      text-transform:uppercase; letter-spacing:0.08em;
      color:var(--color-secondary); margin-bottom:2px;
    }
    .modal-project-name {
      font-size:1.1rem; font-weight:700;
      color:var(--color-text-dark); margin-bottom:2px;
    }
    .modal-project-client {
      display:flex; align-items:center; gap:4px;
      font-size:0.8rem; color:var(--color-text-muted);
    }

    /* ── FORM FIELDS (reused from submit-deliverables) ─────────── */
    .modal-form-section {
      border-top: 1px solid var(--color-border);
      padding-top: var(--spacing-xl);
    }
    .modal-form-section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text-dark);
      margin-bottom: var(--spacing-lg);
    }
    .modal-field { margin-bottom: var(--spacing-lg); }
    .modal-label {
      display:block; font-size:0.875rem; font-weight:600;
      color:var(--color-text-dark); margin-bottom:var(--spacing-sm);
    }
    .modal-textarea {
      width:100%; padding:var(--spacing-md);
      border:1px solid var(--color-border); border-radius:var(--radius-md);
      font-family:var(--font-family-sans); font-size:0.9375rem;
      color:var(--color-text-dark); background:var(--color-white);
      resize:vertical; min-height:100px; line-height:1.5;
      transition:border-color 0.2s;
      box-sizing: border-box;
    }
    .modal-textarea::placeholder { color:var(--color-text-muted); }
    .modal-textarea:focus {
      border-color:var(--color-primary-dark); outline:none;
      box-shadow:0 0 0 3px rgba(8,75,131,0.08);
    }
    .modal-dropzone {
      border:2px dashed var(--color-primary-blue);
      border-radius:var(--radius-lg);
      padding:var(--spacing-xl) var(--spacing-lg);
      text-align:center; cursor:pointer;
      background:rgba(191,105,0,0.03);
      transition:all 0.25s ease; position:relative;
    }
    .modal-dropzone:hover {
      border-color:var(--color-primary-dark);
      background:rgba(8,75,131,0.04);
    }
    .modal-dropzone.drag-over {
      border-color:var(--color-secondary);
      background:rgba(81,158,138,0.06);
      transform:scale(1.01);
    }
    .modal-dropzone-icon {
      display:flex; align-items:center; justify-content:center;
      width:48px; height:48px; border-radius:50%;
      background:rgba(8,75,131,0.08); color:var(--color-primary-dark);
      margin:0 auto var(--spacing-sm);
    }
    .modal-dropzone-text { font-size:0.875rem; font-weight:600; color:var(--color-text-dark); margin-bottom:2px; }
    .modal-dropzone-hint { font-size:0.75rem; color:var(--color-text-muted); }
    .modal-dropzone-input {
      position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer;
    }
    .modal-file-list {
      display:flex; flex-direction:column; gap:var(--spacing-sm); margin-top:var(--spacing-sm);
    }
    .modal-file-list:empty { display:none; }
    .modal-file-item {
      display:flex; align-items:center; gap:var(--spacing-sm);
      padding:6px var(--spacing-md); background:var(--color-bg-light);
      border:1px solid var(--color-border); border-radius:var(--radius-md);
      animation:slideIn 0.25s ease;
    }
    @keyframes slideIn {
      from { opacity:0; transform:translateY(-8px); }
      to { opacity:1; transform:translateY(0); }
    }
    .modal-file-item-icon {
      display:flex; align-items:center; justify-content:center;
      width:30px; height:30px; border-radius:var(--radius-sm);
      background:rgba(8,75,131,0.1); color:var(--color-primary-dark); flex-shrink:0;
    }
    .modal-file-item-info { flex:1; min-width:0; }
    .modal-file-item-name { font-size:0.8rem; font-weight:600; color:var(--color-text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .modal-file-item-size { font-size:0.7rem; color:var(--color-text-muted); }
    .modal-file-item-remove {
      background:none; border:none; cursor:pointer; color:var(--color-text-muted);
      padding:4px; border-radius:var(--radius-sm); transition:color 0.2s;
      display:flex; align-items:center;
    }
    .modal-file-item-remove:hover { color:#d32f2f; }
    .modal-link-wrap {
      display:flex; align-items:center; gap:var(--spacing-sm);
      padding:var(--spacing-sm) var(--spacing-md);
      border:1px solid var(--color-border); border-radius:var(--radius-md);
      background:var(--color-white); transition:border-color 0.2s;
    }
    .modal-link-wrap:focus-within {
      border-color:var(--color-primary-dark);
      box-shadow:0 0 0 3px rgba(8,75,131,0.08);
    }
    .modal-link-field {
      flex:1; border:none; background:transparent;
      font-family:var(--font-family-sans); font-size:0.9375rem;
      color:var(--color-text-dark); outline:none;
    }
    .modal-link-field::placeholder { color:var(--color-text-muted); }

    /* ── SUBMIT BUTTON ────────────────────────────────────────── */
    .modal-submit-footer { display:flex; justify-content:flex-end; margin-top:var(--spacing-lg); }
    .modal-btn-submit {
      display:inline-flex; align-items:center; justify-content:center;
      padding:14px 32px; background:var(--color-primary-blue);
      color:var(--color-white); border:none; border-radius:var(--radius-md);
      font-family:var(--font-family-sans); font-size:1rem; font-weight:600;
      cursor:pointer; transition:all 0.2s ease;
      box-shadow:0 2px 8px rgba(191,105,0,0.25);
    }
    .modal-btn-submit:hover {
      background:#a65b00;
      box-shadow:0 4px 12px rgba(191,105,0,0.35);
      transform:translateY(-1px);
    }
    .modal-btn-submit:active { transform:translateY(0); }
    .modal-btn-submit:disabled { opacity:0.6; cursor:not-allowed; transform:none; box-shadow:none; }

    /* ── SUCCESS OVERLAY ──────────────────────────────────────── */
    .submit-success-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9500;
      background: rgba(80, 36, 25, 0.45);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
    }
    .submit-success-backdrop.visible {
      opacity: 1;
      pointer-events: auto;
    }
    .submit-success-card {
      background: var(--color-white);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xxl) 3rem;
      max-width: 520px;
      width: 92%;
      text-align: center;
      box-shadow: 0 24px 64px rgba(8, 75, 131, 0.18);
      animation: successFadeIn 0.5s ease;
    }
    @keyframes successFadeIn {
      from { opacity:0; transform:translateY(24px); }
      to { opacity:1; transform:translateY(0); }
    }
    .success-confetti-icon {
      font-size: 2rem;
      margin-bottom: var(--spacing-md);
      animation: confettiBounce 0.6s ease 0.3s both;
    }
    @keyframes confettiBounce {
      0% { transform:scale(0); }
      50% { transform:scale(1.3); }
      100% { transform:scale(1); }
    }
    .success-check-wrap {
      display:flex; align-items:center; justify-content:center;
      width:88px; height:88px; border-radius:50%;
      background:rgba(81,158,138,0.12);
      margin:0 auto var(--spacing-xl);
      animation:checkPop 0.4s ease 0.2s both;
    }
    @keyframes checkPop {
      0% { transform:scale(0.5); opacity:0; }
      70% { transform:scale(1.1); }
      100% { transform:scale(1); opacity:1; }
    }
    .success-check-wrap svg { color:var(--color-secondary); }
    .success-heading {
      font-size:1.75rem; font-weight:700;
      color:var(--color-text-dark); margin-bottom:var(--spacing-sm);
    }
    .success-text {
      font-size:0.9375rem; color:var(--color-text-muted);
      line-height:1.6; margin-bottom:var(--spacing-xxl);
    }
    .success-dashboard-btn {
      display:inline-flex; align-items:center; justify-content:center;
      gap:var(--spacing-sm); padding:14px 32px;
      background:var(--color-primary-dark); color:var(--color-white);
      border:none; border-radius:var(--radius-md);
      font-family:var(--font-family-sans); font-size:1rem; font-weight:600;
      cursor:pointer; text-decoration:none;
      transition:all 0.2s ease;
      box-shadow:0 2px 8px rgba(8,75,131,0.25);
    }
    .success-dashboard-btn:hover {
      background:#063a66;
      box-shadow:0 4px 14px rgba(8,75,131,0.35);
      transform:translateY(-1px);
    }
  `;
  document.head.appendChild(style);
}

function createSubmitModal(task, clientName) {
  // Remove any existing modal
  const existing = document.getElementById('gfg-submit-modal');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'gfg-submit-modal';
  backdrop.className = 'submit-modal-backdrop';
  backdrop.innerHTML = `
    <div class="submit-modal-panel">
      <!-- Header -->
      <div class="submit-modal-header">
        <div>
          <div class="submit-modal-title">Submit Project Deliverables</div>
          <div class="submit-modal-subtitle">Complete your project milestones by submitting your high-quality work for review.</div>
        </div>
        <button class="submit-modal-close" id="modal-close-btn" aria-label="Close">
          <svg fill="none" stroke="currentColor" stroke-width="2" width="22" height="22" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <!-- Project context -->
      <div class="modal-project-context">
        <div class="modal-project-preview">
          <div class="modal-preview-page">
            <div class="modal-preview-hdr"></div>
            <div class="modal-preview-line-thick"></div>
            <div class="modal-preview-line"></div>
            <div class="modal-preview-line"></div>
          </div>
          <div class="modal-preview-page">
            <div class="modal-preview-hdr-alt"></div>
            <div class="modal-preview-line-thick"></div>
            <div class="modal-preview-line"></div>
          </div>
        </div>
        <div class="modal-project-info">
          <span class="modal-project-label">Active Project</span>
          <div class="modal-project-name">${task.title}</div>
          <div class="modal-project-client">
            <svg fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Client: ${clientName}
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="modal-form-section">
        <div class="modal-form-section-title">Submission Details</div>
        <form id="modal-submit-form">
          <div class="modal-field">
            <label class="modal-label" for="modal-submission-notes">Submission Notes</label>
            <textarea id="modal-submission-notes" class="modal-textarea" rows="4" placeholder="Provide a brief description of the deliverables or instructions for the client..."></textarea>
          </div>

          <div class="modal-field">
            <label class="modal-label">Upload Deliverables (ZIP, PDF, JPG, etc.)</label>
            <div class="modal-dropzone" id="modal-dropzone">
              <div class="modal-dropzone-icon">
                <svg fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 12 15 15"></polyline></svg>
              </div>
              <p class="modal-dropzone-text">Click to upload or drag and drop</p>
              <span class="modal-dropzone-hint">Maximum file size: 500MB</span>
              <input type="file" id="modal-file-upload" class="modal-dropzone-input" multiple accept=".zip,.pdf,.jpg,.png,.psd,.ai,.fig">
            </div>
            <div id="modal-file-list" class="modal-file-list"></div>
          </div>

          <div class="modal-field">
            <label class="modal-label" for="modal-external-link">External Link (e.g., Figma, GitHub)</label>
            <div class="modal-link-wrap">
              <svg fill="none" stroke="var(--color-text-muted)" stroke-width="2" width="18" height="18" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              <input type="url" id="modal-external-link" class="modal-link-field" placeholder="https://www.figma.com/file/...">
            </div>
          </div>

          <div class="modal-submit-footer">
            <button type="submit" class="modal-btn-submit" id="modal-submit-btn">Submit Final Work</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  // Show with animation
  requestAnimationFrame(() => {
    backdrop.classList.add('visible');
  });

  return backdrop;
}

function createSuccessOverlay() {
  const existing = document.getElementById('gfg-success-overlay');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'gfg-success-overlay';
  backdrop.className = 'submit-success-backdrop';
  backdrop.innerHTML = `
    <div class="submit-success-card">
      <div class="success-confetti-icon">🎉</div>
      <div class="success-check-wrap">
        <svg fill="none" stroke="currentColor" stroke-width="2" width="44" height="44" viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h1 class="success-heading">Task Submitted Successfully!</h1>
      <p class="success-text">Your deliverable has been submitted and is now under review by the client. You'll be notified once the client reviews your work.</p>
      <a href="gig-dashboard.html" class="success-dashboard-btn" id="success-back-btn">
        <svg fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        Back to Dashboard
      </a>
    </div>
  `;

  document.body.appendChild(backdrop);

  requestAnimationFrame(() => {
    backdrop.classList.add('visible');
  });

  return backdrop;
}

function openSubmitModal(task, user) {
  injectSubmitModalStyles();

  const client = getUserById(task.clientId);
  const clientName = client ? (client.company || client.name) : (task.clientName || 'Client');
  const backdrop = createSubmitModal(task, clientName);

  // ── Close behaviour ─────────────────────────────────────────────
  const closeBtn = backdrop.querySelector('#modal-close-btn');
  const closeModal = () => {
    backdrop.classList.remove('visible');
    setTimeout(() => backdrop.remove(), 300);
  };
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  // ── Drag & drop file upload ─────────────────────────────────────
  const dropzone = backdrop.querySelector('#modal-dropzone');
  const fileInput = backdrop.querySelector('#modal-file-upload');
  const fileListEl = backdrop.querySelector('#modal-file-list');
  let selectedFiles = [];

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function renderFiles() {
    if (!fileListEl) return;
    fileListEl.innerHTML = selectedFiles.map((f, i) => `
      <div class="modal-file-item" data-idx="${i}">
        <div class="modal-file-item-icon">
          <svg fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        </div>
        <div class="modal-file-item-info">
          <div class="modal-file-item-name">${f.name}</div>
          <div class="modal-file-item-size">${fmtSize(f.size)}</div>
        </div>
        <button type="button" class="modal-file-item-remove" data-idx="${i}" title="Remove">
          <svg fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');

    fileListEl.querySelectorAll('.modal-file-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedFiles.splice(parseInt(btn.dataset.idx, 10), 1);
        renderFiles();
      });
    });
  }

  function addFiles(files) {
    for (const f of files) {
      if (!selectedFiles.some(s => s.name === f.name && s.size === f.size)) {
        selectedFiles.push(f);
      }
    }
    renderFiles();
  }

  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('drag-over'); });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));
    });
  }
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) { addFiles(Array.from(fileInput.files)); fileInput.value = ''; }
    });
  }

  // ── Form submission ─────────────────────────────────────────────
  const form = backdrop.querySelector('#modal-submit-form');
  const submitBtn = backdrop.querySelector('#modal-submit-btn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const notes = backdrop.querySelector('#modal-submission-notes')?.value?.trim() || '';
    const link = backdrop.querySelector('#modal-external-link')?.value?.trim() || '';

    if (!notes && selectedFiles.length === 0 && !link) {
      alert('Please provide submission notes, upload files, or add an external link before submitting.');
      return;
    }

    // Disable button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    // Create deliverable record
    const fileNames = selectedFiles.map(f => f.name);
    const newDeliverable = {
      id: generateId('d'),
      taskId: task.id,
      gigId: user.id,
      title: `${task.title} - Deliverable`,
      description: notes,
      files: fileNames,
      externalLink: link || null,
      message: notes || 'Please review the submitted work.',
      status: 'submitted',
      submittedAt: new Date().toISOString()
    };

    // Push to deliverables array (imported at top of file)
    deliverables.push(newDeliverable);

    // Update task status to under_review
    markGigTaskComplete(user.id, task.id);

    // Close modal, show success overlay
    backdrop.classList.remove('visible');
    setTimeout(() => {
      backdrop.remove();
      createSuccessOverlay();
    }, 300);
  });
}

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
        <div style="display:flex;flex-direction:column;justify-content:center;margin-left:var(--spacing-xxl);min-width:160px;">
          <a href="project-detail.html?taskId=${task.id}" class="btn btn-outline btn-full" style="text-align:center;margin-bottom:var(--spacing-sm);text-decoration:none;">View Details</a>
          <button class="btn btn-primary-blue btn-full submit-deliverable-btn" data-task-id="${task.id}" style="text-align:center;">Submit Deliverable</button>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.submit-deliverable-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const taskId = button.dataset.taskId;
      if (!taskId) return;

      // Find the task object from summary
      const taskObj = myActive.find(t => t.id === taskId);
      if (!taskObj) return;

      openSubmitModal(taskObj, user);
    });
  });
}

function initActiveTasks() {
  if (!window.__gfgActiveTasksRealtimeBound) {
    window.__gfgActiveTasksRealtimeBound = true;
    window.addEventListener('gfg:workflow-updated', renderActiveTasks);
    window.addEventListener('storage', (event) => {
      if (event.key === 'gfg_gig_workflow_state') {
        renderActiveTasks();
      }
    });
  }

  renderActiveTasks();
}

export function renderTasks() {
  renderExploreTasks();
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
