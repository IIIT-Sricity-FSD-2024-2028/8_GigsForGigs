// ─── deliverables.js ────────────────────────────────────────────
// review-deliverables.html  → client approves or requests revision
// project-detail.html       → gig professional submits deliverable
// completed-projects.html   → lists completed tasks
// ─────────────────────────────────────────────────────────────────

import { tasks, users, deliverables, saveTasks } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';
import {
  formatDate, formatCurrency, generateId,
  getStatusBadgeClass, humaniseStatus, getInitials
} from '../utils/helpers.js';
import {
  acceptGigRequest,
  declineGigRequest,
  getClientContractSummary,
  getGigDashboardSummary,
  getProjectDetailRecord,
  markGigTaskComplete
} from './gigState.js';
import { showError, clearError } from '../utils/validation.js';

// ── Helpers ──────────────────────────────────────────────────────

function getUserById(id) {
  return users.find(u => u.id === id) || null;
}

function getTaskById(id) {
  return tasks.find(t => t.id === id) || null;
}

function getTaskIdFromUrl() {
  return new URLSearchParams(window.location.search).get('taskId');
}

function getRequestIdFromUrl() {
  return new URLSearchParams(window.location.search).get('requestId');
}

// ── review-deliverables.html ─────────────────────────────────────

function initReviewDeliverables() {
  const user = getUser();
  if (!user) return;

  const taskId = getTaskIdFromUrl();
  // If no taskId, try to find the first under_review task
  const task = taskId
    ? getTaskById(taskId)
    : tasks.find(t => t.status === 'under_review' && t.clientId === user.id);

  if (!task) return;

  const deliverable = deliverables.find(d => d.taskId === task.id && d.status !== 'approved');
  const assignee = task.assignedTo ? getUserById(task.assignedTo) : null;

  // Update the page title / description (hook into existing elements)
  const pageTitle = document.querySelector('.page-title');
  if (pageTitle) pageTitle.textContent = 'Review Deliverables';

  const subtitleEl = document.querySelector('.dashboard-content p[style*="color"]');
  if (subtitleEl && task) {
    subtitleEl.innerHTML = `Please review the submitted work for <span style="font-weight:600;color:var(--color-text-dark);">${task.title}</span>.`;
  }

  // Update the sidebar info if a deliverable exists
  if (deliverable && assignee) {
    const nameEl = document.querySelector('.deliverable-sidebar [style*="font-weight: 700"][style*="font-size: 1.125rem"]');
    if (nameEl) nameEl.textContent = assignee.name;

    const submittedEl = document.querySelector('.deliverable-sidebar [style*="font-size: 0.75rem"]');
    if (submittedEl) submittedEl.textContent = `Submitted ${formatDate(deliverable.submittedAt)}`;

    const messageEl = document.querySelector('.deliverable-sidebar [style*="font-style: italic"]');
    if (messageEl) messageEl.textContent = deliverable.message || 'No message provided.';
  }

  // Payment amount
  const paymentEl = document.querySelector('.deliverable-sidebar [style*="font-size: 1.25rem"][style*="color: var(--color-secondary)"]');
  if (paymentEl) paymentEl.textContent = formatCurrency(task.budget);

  // Approve button — only visible for client role
  const approveLink = document.querySelector('.btn-primary-blue.btn-full');
  const revisionLink = document.querySelector('.btn-outline.btn-full');

  if (user.role !== 'client') {
    // Manager cannot approve or release payment.
    if (approveLink) approveLink.style.display = 'none';
    if (revisionLink) revisionLink.textContent = 'Awaiting Client Approval';
  } else {
    // Wire up approve button
    if (approveLink) {
      approveLink.href = '#';
      approveLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (deliverable) {
          deliverable.status = 'approved';
          deliverable.approvedAt = new Date().toISOString();
          deliverable.paymentReleased = true;
        }
        task.status = 'completed';
        saveTasks();
        window.location.href = 'my-gigs-client.html';
      });
    }

    // Wire up revision button
    if (revisionLink) {
      revisionLink.href = '#';
      revisionLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (deliverable) {
          deliverable.status = 'revision_requested';
          deliverable.revisionNote = 'Client requested changes.';
        }
        saveTasks();
        window.location.href = 'my-gigs-client.html';
      });
    }

    // Wire up delete button (for submitted deliverables only)
    if (revisionLink && deliverable && deliverable.status === 'submitted') {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-outline';
      deleteBtn.style.cssText = 'color:var(--color-text-muted);border-color:var(--color-border);margin-top:var(--spacing-sm);width:100%;';
      deleteBtn.textContent = 'Delete Deliverable';
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = deliverables.findIndex(d => d.id === deliverable.id);
        if (idx !== -1) {
          deliverables.splice(idx, 1);
        }
        window.location.href = 'my-gigs-client.html';
      });
      if (revisionLink.parentElement) {
        revisionLink.parentElement.appendChild(deleteBtn);
      }
    }
  }

  // Payment release button — only show when status === approved
  if (deliverable && deliverable.status === 'approved' && approveLink) {
    approveLink.textContent = '✓ Payment Released';
    approveLink.style.backgroundColor = 'var(--color-secondary)';
    approveLink.style.pointerEvents = 'none';
  }
}

// ── project-detail.html (gig submits deliverable) ────────────────

function initProjectDetail() {
  const user = getUser();
  if (!user) return;

  if (user.role === 'gig') {
    initGigProjectDetail(user);
    return;
  }

  const query = new URLSearchParams(window.location.search);
  const requestId = query.get('requestId');
  const taskId = query.get('taskId');

  let clientId = user.id;
  if (user.role === 'manager') {
    const managerRecord = users.find((candidate) => candidate.id === user.id);
    if (managerRecord?.clientId) clientId = managerRecord.clientId;
  }

  const clientContracts = getClientContractSummary(clientId);
  const contractRecord = clientContracts.find((contract) => {
    if (requestId && contract.requestId === requestId) return true;
    if (taskId && (contract.taskId === taskId || contract.sourceTaskId === taskId)) return true;
    return false;
  }) || null;

  const fallbackTask = taskId
    ? getTaskById(taskId)
    : tasks.find((task) => task.clientId === clientId && task.status === 'open');

  const task = fallbackTask || null;
  if (!contractRecord && !task) return;

  const recordTitle = contractRecord?.title || task?.title || 'Project';
  const recordBudget = contractRecord?.budget ?? task?.budget ?? 0;
  const recordDeadline = contractRecord?.deadline || task?.deadline || new Date().toISOString();
  const recordDescription = contractRecord?.description || task?.description || '';
  const recordStatus = contractRecord?.status || task?.status || 'pending';

  // Update task title
  const titleEl = document.querySelector('.dashboard-content h2[style*="font-size: 1.75rem"]');
  if (titleEl) titleEl.textContent = recordTitle;

  // Update budget
  const budgetEl = document.querySelector('.dashboard-section [style*="font-size: 2rem"]');
  if (budgetEl) budgetEl.textContent = formatCurrency(recordBudget);

  // Update deadline
  const deadlineEl = document.querySelector('.dashboard-section [style*="font-size: 1.25rem"][style*="font-weight: 600"]');
  if (deadlineEl) deadlineEl.textContent = formatDate(recordDeadline);

  // Update description
  const descEls = document.querySelectorAll('.dashboard-content p[style*="line-height: 1.6"]');
  if (descEls.length > 0) descEls[0].textContent = recordDescription;

  // Update status badge
  const badgeEl = document.querySelector('.badge');
  if (badgeEl) {
    badgeEl.className = getStatusBadgeClass(recordStatus);
    badgeEl.textContent = humaniseStatus(recordStatus);
  }

  // Client info
  const client = getUserById(clientId);
  if (client) {
    const clientNameEl = document.querySelector('.dashboard-section [style*="font-weight: 600"][style*="font-size: 1rem"]');
    if (clientNameEl) clientNameEl.textContent = client.company || client.name;
  }

  // Accept / Decline buttons — gig professional actions
  const acceptBtn = document.querySelector('.btn-primary-blue.btn-full');
  const declineBtn = document.querySelector('.btn-outline.btn-full');

  // If gig is viewing and task is assigned to them (in_progress), show submit deliverable
  if (user.role === 'gig' && task.assignedTo === user.id && task.status === 'in_progress') {
    if (acceptBtn) {
      acceptBtn.textContent = 'Submit Deliverable';
      acceptBtn.href = `submit-deliverables.html?taskId=${task.id}`;
    }
    if (declineBtn) declineBtn.style.display = 'none';
  } else if (user.role === 'gig' && task.status === 'open') {
    // Show accept/decline for open tasks
    if (acceptBtn) {
      acceptBtn.href = '#';
      acceptBtn.addEventListener('click', (e) => {
        e.preventDefault();
        task.assignedTo = user.id;
        task.status = 'in_progress';
        saveTasks();
        window.location.href = 'active-tasks.html';
      });
    }
    if (declineBtn) {
      declineBtn.href = '#';
      declineBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'explore-tasks.html';
      });
    }
  } else if (user.role === 'client' || user.role === 'manager') {
    const sourceTaskId = contractRecord?.sourceTaskId || contractRecord?.taskId || task?.id || null;

    if (acceptBtn) {
      if (user.role === 'client' && sourceTaskId && (recordStatus === 'active' || recordStatus === 'completed')) {
        acceptBtn.style.display = '';
        acceptBtn.textContent = 'Review Deliverables';
        acceptBtn.href = `../client/review-deliverables.html?taskId=${sourceTaskId}`;
      } else {
        acceptBtn.style.display = 'none';
      }
    }

    if (declineBtn) {
      declineBtn.style.display = '';
      declineBtn.textContent = user.role === 'manager' ? 'Back to Dashboard' : 'Back to Active Contracts';
      declineBtn.href = user.role === 'manager'
        ? '../manager/manager-dashboard.html'
        : '../client/my-gigs-client.html';
    }
  }
}

function initGigProjectDetail(user) {
  const context = getProjectDetailRecord(user.id, window.location.search);
  const request = context.request;
  const task = context.task;

  if (!request && !task) {
    const content = document.querySelector('.dashboard-content');
    if (content) {
      content.innerHTML = '<div style="padding:var(--spacing-xl);border:1px dashed var(--color-border);border-radius:var(--radius-lg);text-align:center;color:var(--color-text-muted);">No project selected. Open a request or active task to view details.</div>';
    }
    return;
  }

  const record = task || request;
  const status = task
    ? task.status
    : request?.status === 'accepted'
      ? 'active'
      : request?.status;

  const titleEl = document.getElementById('project-detail-title') || document.querySelector('.dashboard-content h2');
  if (titleEl) titleEl.textContent = record.title;

  const subtitleEl = document.getElementById('project-detail-subtitle');
  if (subtitleEl) {
    subtitleEl.textContent = `Client: ${record.clientName || 'Client'} • Deadline: ${formatDate(record.deadline)}`;
  }

  const descEl = document.getElementById('project-detail-description') || document.querySelector('.dashboard-content p[style*="line-height: 1.6"]');
  if (descEl) descEl.textContent = record.description || 'No description provided.';

  const badgeEl = document.getElementById('project-detail-status-badge') || document.querySelector('.badge');
  if (badgeEl) {
    badgeEl.className = getStatusBadgeClass(status);
    badgeEl.textContent = humaniseStatus(status);
  }

  const budgetEl = document.getElementById('project-detail-budget') || document.querySelector('.dashboard-section [style*="font-size: 2rem"]');
  if (budgetEl) budgetEl.textContent = formatCurrency(record.budget);

  const deadlineEl = document.getElementById('project-detail-deadline') || document.querySelector('.dashboard-section [style*="font-size: 1.25rem"][style*="font-weight: 600"]');
  if (deadlineEl) deadlineEl.textContent = formatDate(record.deadline);

  const clientNameEl = document.getElementById('project-detail-client-name') || document.querySelector('.dashboard-section [style*="font-weight: 600"][style*="font-size: 1rem"]');
  if (clientNameEl) clientNameEl.textContent = record.clientName || 'Client';

  const clientInitialsEl = document.getElementById('project-detail-client-initials');
  if (clientInitialsEl) clientInitialsEl.textContent = record.clientInitials || getInitials(record.clientName || 'Client');

  const actionPrimary = document.getElementById('project-detail-primary-action') || document.querySelector('.btn-primary-blue.btn-full');
  const actionSecondary = document.getElementById('project-detail-secondary-action') || document.querySelector('.btn-outline.btn-full');

  if (!actionPrimary || !actionSecondary) return;

  actionPrimary.style.display = '';
  actionSecondary.style.display = '';
  actionPrimary.href = '#';
  actionSecondary.href = '#';

  if (status === 'pending' && request) {
    actionPrimary.textContent = 'Accept Request';
    actionSecondary.textContent = 'Decline Request';

    actionPrimary.onclick = (event) => {
      event.preventDefault();
      acceptGigRequest(user.id, request.id);
      window.location.href = 'active-tasks.html';
    };

    actionSecondary.onclick = (event) => {
      event.preventDefault();
      declineGigRequest(user.id, request.id);
      window.location.href = 'pending-requests.html';
    };
    return;
  }

  if (status === 'active' && task) {
    actionPrimary.textContent = 'Submit Deliverable';
    actionSecondary.textContent = 'Back to Active Tasks';

    actionPrimary.onclick = (event) => {
      event.preventDefault();
      window.location.href = `submit-deliverables.html?taskId=${task.id}`;
    };

    actionSecondary.onclick = (event) => {
      event.preventDefault();
      window.location.href = 'active-tasks.html';
    };
    return;
  }

  if (status === 'completed') {
    actionPrimary.textContent = 'View Completed Projects';
    actionSecondary.textContent = 'Back to Dashboard';

    actionPrimary.onclick = (event) => {
      event.preventDefault();
      window.location.href = 'completed-projects.html';
    };

    actionSecondary.onclick = (event) => {
      event.preventDefault();
      window.location.href = 'gig-dashboard.html';
    };
    return;
  }

  if (status === 'declined') {
    actionPrimary.textContent = 'Back to Pending Requests';
    actionSecondary.textContent = 'Go to Dashboard';

    actionPrimary.onclick = (event) => {
      event.preventDefault();
      window.location.href = 'pending-requests.html';
    };

    actionSecondary.onclick = (event) => {
      event.preventDefault();
      window.location.href = 'gig-dashboard.html';
    };
    return;
  }

  actionPrimary.textContent = 'Back to Dashboard';
  actionSecondary.style.display = 'none';
  actionPrimary.onclick = (event) => {
    event.preventDefault();
    window.location.href = 'gig-dashboard.html';
  };
}

// ── completed-projects.html (lists completed tasks) ──────────────

function renderCompletedProjects() {
  const user = getUser();
  if (!user || user.role !== 'gig') return;

  const grid = document.getElementById('completed-projects-grid');
  const countEl = document.getElementById('completed-total-count');
  if (!grid) return;

  const summary = getGigDashboardSummary(user.id);
  const completedTasks = summary.completedTasks;

  if (countEl) countEl.textContent = completedTasks.length;

  if (completedTasks.length === 0) {
    grid.innerHTML = `<div style="padding:var(--spacing-xl);border:1px dashed var(--color-border);border-radius:var(--radius-lg);text-align:center;color:var(--color-text-muted);grid-column:1/-1;">No completed projects yet. Keep delivering great work!</div>`;
    return;
  }

  const bgColors = [
    'rgba(8, 75, 131, 0.1)',
    'rgba(191, 105, 0, 0.1)',
    'var(--color-border)',
    'rgba(81, 158, 138, 0.1)'
  ];

  grid.innerHTML = completedTasks.map((task, i) => {
    const completedOn = task.completedAt || task.updatedAt || task.deadline;
    const stars = task.rating && task.rating < 5
      ? `${'★ '.repeat(task.rating).trim()} <span class="star-empty">${'★ '.repeat(5 - task.rating).trim()}</span>`
      : '★ ★ ★ ★ ★';
    const projectId = task.id;

    return `
      <div class="task-card" style="flex-direction:column;align-items:flex-start;">
        <div style="width:100%;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--spacing-md);">
          <div style="display:flex;gap:var(--spacing-md);align-items:center;">
            <div style="width:48px;height:48px;background-color:${bgColors[i % bgColors.length]};border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--color-primary-dark);">${task.clientInitials || getInitials(task.clientName || 'Client')}</div>
            <div>
              <h3 style="font-size:1.125rem;font-weight:600;color:var(--color-text-dark);margin-bottom:2px;">${task.title}</h3>
              <p style="font-size:0.875rem;color:var(--color-text-muted);">${task.clientName || 'Client'} • Completed ${formatDate(completedOn)}</p>
            </div>
          </div>
        </div>
        <div style="width:100%;display:flex;justify-content:space-between;align-items:center;margin-top:var(--spacing-sm);padding-top:var(--spacing-md);border-top:1px solid var(--color-border);">
          <div class="star-rating">${stars}</div>
          <div style="font-weight:700;font-size:1.25rem;color:var(--color-secondary);">${formatCurrency(task.budget)}</div>
        </div>
        <a href="project-detail.html?taskId=${projectId}" style="margin-top:var(--spacing-md);color:var(--color-primary-blue);font-size:0.875rem;font-weight:600;text-decoration:none;">View Project Details →</a>
      </div>`;
  }).join('');
}

// ── submit-deliverables.html ─────────────────────────────────────

function initSubmitDeliverables() {
  const user = getUser();
  if (!user) return;

  // ── Populate sidebar user info ─────────────────────────────────
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarName = document.getElementById('sidebar-user-name');
  if (sidebarAvatar && user.name) sidebarAvatar.textContent = getInitials(user.name);
  if (sidebarName && user.name) sidebarName.textContent = user.name;

  // ── Resolve the project from URL or first in-progress task ─────
  const taskId = getTaskIdFromUrl();
  const task = taskId
    ? getTaskById(taskId)
    : tasks.find(t => t.status === 'in_progress' && t.assignedTo === user.id);

  if (task) {
    const client = getUserById(task.clientId);
    const nameEl = document.getElementById('context-project-name');
    const clientEl = document.getElementById('context-client-name');
    const linkEl = document.getElementById('view-project-link');

    if (nameEl) nameEl.textContent = task.title;
    if (clientEl) {
      const clientName = client ? (client.company || client.name) : 'Client';
      clientEl.innerHTML = `
        <svg fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        Client: ${clientName}`;
    }
    if (linkEl) linkEl.href = `project-detail.html?taskId=${task.id}`;
  }

  // ── Drag-and-drop file upload ──────────────────────────────────
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-upload');
  const fileListEl = document.getElementById('file-list');
  let selectedFiles = [];

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function renderFileList() {
    if (!fileListEl) return;
    fileListEl.innerHTML = selectedFiles.map((file, i) => `
      <div class="file-item" data-index="${i}">
        <div class="file-item-icon">
          <svg fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        </div>
        <div class="file-item-info">
          <div class="file-item-name">${file.name}</div>
          <div class="file-item-size">${formatFileSize(file.size)}</div>
        </div>
        <button type="button" class="file-item-remove" data-index="${i}" title="Remove file">
          <svg fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');

    fileListEl.querySelectorAll('.file-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        selectedFiles.splice(idx, 1);
        renderFileList();
      });
    });
  }

  function addFiles(fileArray) {
    for (const f of fileArray) {
      if (!selectedFiles.some(sf => sf.name === f.name && sf.size === f.size)) {
        selectedFiles.push(f);
      }
    }
    renderFileList();
  }

  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) {
        addFiles(Array.from(e.dataTransfer.files));
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        addFiles(Array.from(fileInput.files));
        fileInput.value = '';
      }
    });
  }

  // ── Form submission ────────────────────────────────────────────
  const form = document.getElementById('submit-deliverables-form');
  const submitBtn = document.getElementById('submit-work-btn');
  const toast = document.getElementById('submit-toast');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const notes = document.getElementById('submission-notes')?.value?.trim() || '';
      const link = document.getElementById('external-link')?.value?.trim() || '';

      clearError('submission-notes');
      if (!notes && selectedFiles.length === 0 && !link) {
        showError('submission-notes', 'Please provide submission notes, upload files, or add an external link before submitting.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        submitBtn.classList.add('submitting');
      }

      const fileNames = selectedFiles.map(f => f.name);
      const newDeliverable = {
        id: generateId('d'),
        taskId: task ? task.id : null,
        gigId: user.id,
        title: task ? `${task.title} - Deliverable` : 'Deliverable Submission',
        description: notes,
        files: fileNames,
        externalLink: link || null,
        message: notes || 'Please review the submitted work.',
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };

      deliverables.push(newDeliverable);

      if (task && task.status === 'in_progress') {
        task.status = 'under_review';
      }

      if (toast) {
        toast.classList.add('visible');
      }

      setTimeout(() => {
        window.location.href = 'submission-success.html';
      }, 1800);
    });
  }
}

// ── Public entry point ───────────────────────────────────────────

export function init() {
  const path = window.location.pathname;

  if (path.includes('review-deliverables.html')) {
    initReviewDeliverables();
  } else if (path.includes('project-detail.html')) {
    initProjectDetail();
  } else if (path.includes('completed-projects.html')) {
    renderCompletedProjects();
  } else if (path.includes('submit-deliverables.html')) {
    initSubmitDeliverables();
  }
}
