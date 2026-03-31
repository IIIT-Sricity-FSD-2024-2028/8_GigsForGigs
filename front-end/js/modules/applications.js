// ─── applications.js ────────────────────────────────────────────
// Client side  → review-shortlist.html : list applicants, shortlist / reject
// Gig side     → pending-requests.html : list service requests, accept / decline
// ─────────────────────────────────────────────────────────────────

import { tasks, users, applications } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';
import {
  formatDate, formatCurrency, getStatusBadgeClass,
  humaniseStatus, getInitials
} from '../utils/helpers.js';

// ── Helpers ──────────────────────────────────────────────────────

function getUserById(id) {
  return users.find(u => u.id === id) || null;
}

function getTaskById(id) {
  return tasks.find(t => t.id === id) || null;
}

// ── review-shortlist.html (client / manager) ─────────────────────

function renderReviewShortlist() {
  const user = getUser();
  if (!user) return;

  const container = document.getElementById('shortlist-content');
  if (!container) return;

  // Determine which client's tasks to show
  let clientId = user.id;
  if (user.role === 'manager') {
    const mgr = users.find(u => u.id === user.id);
    if (mgr && mgr.clientId) clientId = mgr.clientId;
  }

  // Get all applications for this client's tasks
  const clientTaskIds = tasks.filter(t => t.clientId === clientId).map(t => t.id);
  const relevantApps = applications.filter(a => clientTaskIds.includes(a.taskId));

  if (relevantApps.length === 0) {
    container.style.textAlign = 'center';
    container.style.padding = 'var(--spacing-xxl)';
    container.style.color = 'var(--color-text-muted)';
    container.innerHTML = 'No shortlist approvals yet. Applications will appear here when professionals apply to your gigs.';
    return;
  }

  container.style.textAlign = 'left';
  container.style.padding = '0';
  container.style.color = '';
  container.style.border = 'none';

  container.innerHTML = relevantApps.map(app => {
    const task = getTaskById(app.taskId);
    const gig = getUserById(app.gigId);
    if (!task || !gig) return '';

    // Only client can approve (shortlist → hire); manager can view & shortlist but not approve payment
    const canApprove = user.role === 'client';

    let actionButtons = '';
    if (app.status === 'pending') {
      actionButtons = `
        <button class="btn btn-primary shortlist-btn" data-app-id="${app.id}" style="background-color:var(--color-secondary);border-color:var(--color-secondary);">Shortlist</button>
        <button class="btn btn-outline reject-btn" data-app-id="${app.id}">Reject</button>
      `;
    } else if (app.status === 'shortlisted' && canApprove) {
      actionButtons = `
        <a href="my-gigs-client.html" class="btn btn-primary approve-hire-btn" data-app-id="${app.id}" style="background-color:var(--color-secondary);border-color:var(--color-secondary);text-decoration:none;">Approve & Hire</a>
        <a href="client-dashboard.html" class="btn btn-outline" style="text-decoration:none;">View Full Profile</a>
      `;
    } else if (app.status === 'shortlisted') {
      actionButtons = `<span class="badge badge-active">Shortlisted — Awaiting Client Approval</span>`;
    } else if (app.status === 'rejected') {
      actionButtons = `<span class="badge badge-completed">Rejected</span>`;
    }

    return `
      <div class="dashboard-section" style="padding:var(--spacing-xl);margin-bottom:var(--spacing-lg);">
        <div style="display:flex;justify-content:space-between;margin-bottom:var(--spacing-lg);border-bottom:1px solid var(--color-border);padding-bottom:var(--spacing-md);">
          <div>
            <h2 style="font-size:1.125rem;font-weight:700;color:var(--color-text-dark);">${task.title}</h2>
            <div style="font-size:0.875rem;color:var(--color-text-muted);">Applied: ${formatDate(app.createdAt)} • Status: ${humaniseStatus(app.status)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.875rem;color:var(--color-text-muted);text-transform:uppercase;">Proposed Budget</div>
            <div style="font-weight:700;color:var(--color-secondary);font-size:1.125rem;">${formatCurrency(app.proposedBudget)}</div>
          </div>
        </div>
        <div style="display:flex;gap:var(--spacing-lg);">
          <div class="talent-avatar" style="width:80px;height:80px;font-size:2rem;color:var(--color-primary-blue);background-color:rgba(8,75,131,0.1);">${getInitials(gig.name)}</div>
          <div style="flex:1;">
            <h3 style="font-size:1.25rem;font-weight:700;color:var(--color-primary-dark);">${gig.name}</h3>
            <div style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:var(--spacing-sm);">${gig.title || 'Professional'}</div>
            <p style="font-size:0.875rem;color:var(--color-text-dark);margin-bottom:var(--spacing-md);line-height:1.5;">${app.coverLetter || ''}</p>
            <div style="display:flex;gap:var(--spacing-md);">
              ${actionButtons}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  // Shortlist button handler
  container.querySelectorAll('.shortlist-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const app = applications.find(a => a.id === btn.dataset.appId);
      if (app) {
        app.status = 'shortlisted';
        renderReviewShortlist();
      }
    });
  });

  // Reject button handler
  container.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const app = applications.find(a => a.id === btn.dataset.appId);
      if (app) {
        app.status = 'rejected';
        renderReviewShortlist();
      }
    });
  });

  // Approve & Hire handler (client only)
  container.querySelectorAll('.approve-hire-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const app = applications.find(a => a.id === btn.dataset.appId);
      if (app) {
        // Assign the gig professional to the task and move to in_progress
        const task = getTaskById(app.taskId);
        if (task) {
          task.assignedTo = app.gigId;
          task.status = 'in_progress';
        }
        // Reject other pending applications for this task
        applications
          .filter(a => a.taskId === app.taskId && a.id !== app.id && a.status === 'pending')
          .forEach(a => { a.status = 'rejected'; });
        app.status = 'shortlisted'; // keep as shortlisted (hired)
        window.location.href = 'my-gigs-client.html';
      }
    });
  });
}

// ── pending-requests.html (gig professional) ─────────────────────

function renderPendingRequests() {
  const user = getUser();
  if (!user) return;

  const container = document.getElementById('pending-requests-list');
  if (!container) return;

  // Tasks where this gig professional has pending applications
  const myPendingApps = applications.filter(
    a => a.gigId === user.id && a.status === 'pending'
  );

  if (myPendingApps.length === 0) {
    container.innerHTML = `<div style="padding:var(--spacing-xl);border:1px dashed var(--color-border);border-radius:var(--radius-lg);text-align:center;color:var(--color-text-muted);">No pending requests yet. Invitations from clients will appear here.</div>`;
    return;
  }

  container.innerHTML = myPendingApps.map(app => {
    const task = getTaskById(app.taskId);
    if (!task) return '';
    const client = getUserById(task.clientId);

    return `
      <div class="task-card" style="align-items:flex-start;padding:var(--spacing-xl);">
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--spacing-md);">
            <div class="task-details">
              <div style="display:flex;align-items:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm);">
                <div style="width:32px;height:32px;background-color:var(--color-border);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.875rem;">${client ? getInitials(client.company || client.name) : '??'}</div>
                <span style="font-weight:500;color:var(--color-text-dark);">${client ? client.company || client.name : 'Client'}</span>
                <span class="badge badge-pending" style="font-size:0.7rem;padding:2px 8px;">Pending Review</span>
              </div>
              <h3 style="font-size:1.25rem;">${task.title}</h3>
              <p style="margin-top:var(--spacing-sm);line-height:1.5;max-width:800px;">${task.description || ''}</p>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.5rem;font-weight:700;color:var(--color-secondary);">${formatCurrency(task.budget)}</div>
              <div style="font-size:0.875rem;color:var(--color-text-muted);margin-top:4px;">Proposed Budget</div>
            </div>
          </div>
          <div style="margin-top:var(--spacing-lg);padding-top:var(--spacing-lg);border-top:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
            <a href="project-detail.html?taskId=${task.id}" style="color:var(--color-primary-blue);font-size:0.875rem;font-weight:500;text-decoration:none;">View Full Details →</a>
            <div style="display:flex;gap:var(--spacing-md);">
              <button class="btn btn-outline decline-req-btn" data-app-id="${app.id}" style="min-width:120px;text-align:center;color:var(--color-text-dark);border-color:var(--color-border);">Decline</button>
              <button class="btn btn-primary-blue accept-req-btn" data-app-id="${app.id}" style="min-width:120px;text-align:center;">Accept</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  // Accept handler — move task to in_progress, assign gig
  container.querySelectorAll('.accept-req-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const app = applications.find(a => a.id === btn.dataset.appId);
      if (app) {
        const task = getTaskById(app.taskId);
        if (task) {
          task.assignedTo = app.gigId;
          task.status = 'in_progress';
        }
        app.status = 'shortlisted';
        renderPendingRequests();
      }
    });
  });

  // Decline handler
  container.querySelectorAll('.decline-req-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const app = applications.find(a => a.id === btn.dataset.appId);
      if (app) {
        app.status = 'rejected';
        renderPendingRequests();
      }
    });
  });
}

// ── Public entry point ───────────────────────────────────────────

export function init() {
  const path = window.location.pathname;

  if (path.includes('review-shortlist.html')) {
    renderReviewShortlist();
  } else if (path.includes('pending-requests.html')) {
    renderPendingRequests();
  }
}
