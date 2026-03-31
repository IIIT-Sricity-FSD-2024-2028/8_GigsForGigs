// ─── deliverables.js ────────────────────────────────────────────
// review-deliverables.html  → client approves or requests revision
// project-detail.html       → gig professional submits deliverable
// completed-projects.html   → lists completed tasks
// ─────────────────────────────────────────────────────────────────

import { tasks, users, deliverables } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';
import {
  formatDate, formatCurrency, generateId,
  getStatusBadgeClass, humaniseStatus, getInitials
} from '../utils/helpers.js';

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

  const taskId = getTaskIdFromUrl();
  const task = taskId ? getTaskById(taskId) : tasks.find(t => t.status === 'open');
  if (!task) return;

  // Update task title
  const titleEl = document.querySelector('.dashboard-content h2[style*="font-size: 1.75rem"]');
  if (titleEl) titleEl.textContent = task.title;

  // Update budget
  const budgetEl = document.querySelector('.dashboard-section [style*="font-size: 2rem"]');
  if (budgetEl) budgetEl.textContent = formatCurrency(task.budget);

  // Update deadline
  const deadlineEl = document.querySelector('.dashboard-section [style*="font-size: 1.25rem"][style*="font-weight: 600"]');
  if (deadlineEl) deadlineEl.textContent = formatDate(task.deadline);

  // Update description
  const descEls = document.querySelectorAll('.dashboard-content p[style*="line-height: 1.6"]');
  if (descEls.length > 0) descEls[0].textContent = task.description || '';

  // Update status badge
  const badgeEl = document.querySelector('.badge');
  if (badgeEl) {
    badgeEl.className = getStatusBadgeClass(task.status);
    badgeEl.textContent = humaniseStatus(task.status);
  }

  // Client info
  const client = getUserById(task.clientId);
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
      acceptBtn.href = '#';
      acceptBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Create a deliverable
        deliverables.push({
          id: generateId('d'),
          taskId: task.id,
          gigId: user.id,
          title: `${task.title} - Deliverable`,
          description: 'Deliverable submitted for review.',
          files: ['deliverable_files.zip'],
          message: 'Please review the submitted work.',
          status: 'submitted',
          submittedAt: new Date().toISOString()
        });
        task.status = 'under_review';
        window.location.href = 'active-tasks.html';
      });
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
    // Client/manager viewing — hide accept/decline
    if (acceptBtn) acceptBtn.style.display = 'none';
    if (declineBtn) declineBtn.style.display = 'none';
  }
}

// ── completed-projects.html (lists completed tasks) ──────────────

function renderCompletedProjects() {
  const user = getUser();
  if (!user) return;

  const grid = document.getElementById('completed-projects-grid');
  const countEl = document.getElementById('completed-total-count');
  if (!grid) return;

  const completedTasks = tasks.filter(
    t => t.status === 'completed' && t.assignedTo === user.id
  );

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
    const client = getUserById(task.clientId);
    const deliverable = deliverables.find(d => d.taskId === task.id && d.status === 'approved');
    const stars = '★ ★ ★ ★ ★';

    return `
      <div class="task-card" style="flex-direction:column;align-items:flex-start;">
        <div style="width:100%;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--spacing-md);">
          <div style="display:flex;gap:var(--spacing-md);align-items:center;">
            <div style="width:48px;height:48px;background-color:${bgColors[i % bgColors.length]};border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--color-primary-dark);">${client ? getInitials(client.company || client.name) : '??'}</div>
            <div>
              <h3 style="font-size:1.125rem;font-weight:600;color:var(--color-text-dark);margin-bottom:2px;">${task.title}</h3>
              <p style="font-size:0.875rem;color:var(--color-text-muted);">${client ? client.company || client.name : 'Client'} • Completed ${formatDate(deliverable?.approvedAt || task.deadline)}</p>
            </div>
          </div>
        </div>
        <div style="width:100%;display:flex;justify-content:space-between;align-items:center;margin-top:var(--spacing-sm);padding-top:var(--spacing-md);border-top:1px solid var(--color-border);">
          <div class="star-rating">${stars}</div>
          <div style="font-weight:700;font-size:1.25rem;color:var(--color-secondary);">${formatCurrency(task.budget)}</div>
        </div>
      </div>`;
  }).join('');
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
  }
}
