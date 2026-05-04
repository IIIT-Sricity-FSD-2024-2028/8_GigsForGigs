// ─── gig.js ─ All Gig Professional Pages ────────────────────────
import {
  apiRequest,
  requireAuth,
  logout,
  formatCurrency,
  formatDate,
  getStatusBadgeClass,
  updateSession,
  getUser,
} from './api.js';

const GIG_ROLE = 'GIG_PROFESSIONAL';

function getPage() {
  return window.location.pathname.split('/').pop();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function initials(name) {
  return (name || 'GP')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function currentUserLabel(user) {
  return user?.name || 'Gig Professional';
}

function bindGlobalControls() {
  document.querySelectorAll('[data-action="logout"]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      logout();
    });
  });
}

function renderSidebarFooter(user) {
  const sidebar = document.querySelector('.dashboard-sidebar');
  const footer = sidebar?.querySelector('.sidebar-footer');
  if (!footer) return;

  const name = currentUserLabel(user);
  const avatar = initials(name);

  footer.innerHTML = `
    <div class="profile-mini" id="sidebar-avatar">${avatar}</div>
    <div class="sidebar-footer-info">
      <div class="sidebar-footer-top">
        <div class="sidebar-footer-name" id="sidebar-user-name">${name}</div>
        <button type="button" class="sidebar-logout-btn" data-action="logout">Logout</button>
      </div>
      <div class="sidebar-footer-role" id="sidebar-user-role">Gig Professional</div>
    </div>
  `;
}

function syncSidebarIdentity(user) {
  const name = currentUserLabel(user);
  const avatar = initials(name);
  const roleLabel = 'Gig Professional';

  const sidebarNameTargets = [
    document.getElementById('sidebar-user-name'),
    document.querySelector('[data-gfg-user-name]'),
  ];
  sidebarNameTargets.forEach((target) => {
    if (target) target.textContent = name;
  });

  const avatarTargets = [
    document.getElementById('profile-avatar-text'),
    document.getElementById('sidebar-avatar'),
    document.querySelector('[data-gfg-user-avatar]'),
  ];
  avatarTargets.forEach((target) => {
    if (target) target.textContent = avatar;
  });

  const roleTargets = [
    document.querySelector('#sidebar-user-role'),
    document.querySelector('[data-gfg-user-role]'),
  ];
  roleTargets.forEach((target) => {
    if (target) target.textContent = roleLabel;
  });
}

function extractSubmissionLink(content) {
  if (!content) return '';
  const match = String(content).match(/https?:\/\/[^\s<>'"]+/i);
  return match ? match[0] : '';
}

function setText(selector, value) {
  const target = document.querySelector(selector);
  if (target) target.textContent = value;
}

function setHtml(selector, value) {
  const target = document.querySelector(selector);
  if (target) target.innerHTML = value;
}

function createEmptyState(message) {
  return `<p style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xxl);">${message}</p>`;
}

function taskProgress(task) {
  if (task.status === 'COMPLETED') return 100;
  if (task.deliverables && task.deliverables.length > 0) return 25;
  return 0;
}

function formatMoney(amount) {
  return formatCurrency(amount || 0);
}

function bindNavToProfileCompletion() {
  const editButton = document.querySelector('.btn.btn-outline');
  if (editButton && getPage() === 'gig-profile.html') {
    editButton.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = 'profile-completion-gig.html';
    });
  }
}

function getSessionUser() {
  return getUser() || null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth([GIG_ROLE]);
  if (!user) return;

  renderSidebarFooter(user);
  bindGlobalControls();
  syncSidebarIdentity(user);
  bindNavToProfileCompletion();

  const page = getPage();
  switch (page) {
    case 'gig-dashboard.html':
      await initGigDashboard(user);
      break;
    case 'explore-tasks.html':
      await initExploreTasks(user);
      break;
    case 'active-tasks.html':
      await initActiveTasks(user);
      break;
    case 'pending-requests.html':
      await initPendingRequests(user);
      break;
    case 'gig-profile.html':
      await initGigProfile(user);
      break;
    case 'submit-deliverables.html':
      await initSubmitDeliverables(user);
      break;
    case 'post-service.html':
      await initPostService(user);
      break;
    case 'completed-projects.html':
      await initCompletedProjects(user);
      break;
    case 'total-earnings.html':
      await initTotalEarnings(user);
      break;
    case 'profile-completion-gig.html':
      await initProfileCompletion(user);
      break;
    case 'project-detail.html':
      await initProjectDetail(user);
      break;
  }
});

async function initGigDashboard(user) {
  try {
    const [activeTasks, pendingRequests, completedProjects, earnings] = await Promise.all([
      apiRequest('/gig/tasks/active').catch(() => []),
      apiRequest('/gig/requests/pending').catch(() => []),
      apiRequest('/gig/projects/completed').catch(() => []),
      apiRequest('/gig/earnings').catch(() => ({ totalEarnings: 0, payments: [] })),
    ]);

    const activeList = safeArray(activeTasks);
    const pendingList = safeArray(pendingRequests);
    const completedList = safeArray(completedProjects);
    const payments = safeArray(earnings.payments);
    const completedTasks = Number(earnings.completedTasks || 0);
    const totalEarnings = completedTasks === 0 ? 0 : Number(earnings.totalEarnings || 0);

    setText('#gig-active-count', String(activeList.length));
    setText('#gig-pending-count', String(pendingList.length));
    setText('#gig-completed-count', String(completedList.length));
    setText('#gig-earnings-count', formatMoney(totalEarnings));

    const totalWork = activeList.length + completedList.length;
    const rate = totalWork > 0 ? Math.round((completedList.length / totalWork) * 100) : 0;
    const circle = document.getElementById('gig-profile-success-circle');
    if (circle) circle.setAttribute('stroke-dasharray', `${rate}, 100`);
    setText('#gig-profile-success-rate', `${rate}%`);

    const requestRows = pendingList.length
      ? pendingList
          .slice(0, 5)
          .map(
            (request) => `
              <tr>
                <td>${request.task?.client_id || '—'}</td>
                <td>${request.task?.title || '—'}</td>
                <td>${formatDate(request.task?.createdAt || request.createdAt)}</td>
                <td>${formatMoney(request.task?.budget || request.budget || 0)}</td>
                <td><span class="status-badge ${getStatusBadgeClass(request.status)}">${String(request.status || 'PENDING').replace(/_/g, ' ')}</span></td>
              </tr>
            `,
          )
          .join('')
      : `<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No pending requests.</td></tr>`;
    setHtml('#gig-dashboard-requests-body', requestRows);

    setHtml(
      '#dashboard-active-preview',
      activeList.length
        ? activeList
            .slice(0, 3)
            .map((task) => `<p style="padding:4px 0;border-bottom:1px solid var(--color-border);font-size:0.875rem;">${task.title}</p>`)
            .join('')
        : '<p style="color:var(--color-text-muted);font-size:0.875rem;">No active tasks</p>',
    );

    setHtml(
      '#dashboard-pending-preview',
      pendingList.length
        ? pendingList
            .slice(0, 3)
            .map((request) => `<p style="padding:4px 0;border-bottom:1px solid var(--color-border);font-size:0.875rem;">${request.task?.title || '—'}</p>`)
            .join('')
        : '<p style="color:var(--color-text-muted);font-size:0.875rem;">No pending requests</p>',
    );

    setHtml(
      '#dashboard-completed-preview',
      completedList.length
        ? completedList
            .slice(0, 3)
            .map((project) => `<p style="padding:4px 0;border-bottom:1px solid var(--color-border);font-size:0.875rem;">${project.title}</p>`)
            .join('')
        : '<p style="color:var(--color-text-muted);font-size:0.875rem;">No completed projects</p>',
    );

    const sidebarGreeting = document.querySelector('.sidebar-footer div[style*="font-weight: 600"]');
    if (sidebarGreeting) sidebarGreeting.textContent = currentUserLabel(user);
    const pendingCount = document.getElementById('gig-pending-count');
    if (pendingCount && payments.length === 0 && totalEarnings === 0) {
      pendingCount.textContent = pendingList.length.toString();
    }
  } catch (error) {
    console.error('Gig dashboard failed:', error);
  }
}

async function initExploreTasks(user) {
  try {
    const [tasks, activeTasks, pendingRequests] = await Promise.all([
      apiRequest('/gig/tasks/marketplace').catch(() => []),
      apiRequest('/gig/tasks/active').catch(() => []),
      apiRequest('/gig/requests/pending').catch(() => []),
    ]);

    const grid = document.getElementById('explore-tasks-grid');
    if (!grid) return;

    const blockedTaskIds = new Set([
      ...safeArray(user.appliedTaskIds),
      ...safeArray(activeTasks).map((task) => task.task_id),
      ...safeArray(pendingRequests).map((request) => request.task_id || request.task?.task_id),
    ]);

    if (!safeArray(tasks).length) {
      grid.innerHTML = createEmptyState('No tasks available right now.');
      return;
    }

    const colors = ['rgba(8,75,131,0.1)', 'rgba(191,105,0,0.1)', 'rgba(81,158,138,0.1)', 'var(--color-border)'];
    grid.innerHTML = safeArray(tasks)
      .map((task, index) => {
        const alreadyApplied = blockedTaskIds.has(task.task_id);
        const buttonLabel = alreadyApplied ? 'Applied ✓' : 'Apply Now';
        const buttonClass = alreadyApplied ? 'btn-outline' : 'btn-primary';
        return `
          <div class="explore-card">
            <div class="explore-image" style="background-color:${colors[index % colors.length]};">
              <svg width="48" height="48" fill="none" stroke="var(--color-primary-dark)" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            </div>
            <div class="explore-content">
              <h3 class="explore-title">${task.title}</h3>
              <p class="explore-client">Client ID: ${task.client_id}</p>
              <div class="explore-price">${formatMoney(task.budget)}</div>
              <p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:var(--spacing-lg);">${task.description}</p>
              <div class="explore-footer">
                <button class="btn ${buttonClass} btn-full" data-apply-task="${task.task_id}" ${alreadyApplied ? 'disabled' : ''}>${buttonLabel}</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-apply-task]').forEach((button) => {
      button.addEventListener('click', async () => {
        const taskId = button.dataset.applyTask;
        if (!taskId) return;

        const session = getSessionUser();
        if (safeArray(session?.appliedTaskIds).includes(taskId)) {
          button.textContent = 'Applied ✓';
          button.disabled = true;
          return;
        }

        try {
          await apiRequest('/gig/applications', 'POST', { taskId });
          const nextTaskIds = Array.from(new Set([...(session?.appliedTaskIds || []), taskId]));
          updateSession({ appliedTaskIds: nextTaskIds });
          button.textContent = 'Applied ✓';
          button.disabled = true;
          button.classList.remove('btn-primary');
          button.classList.add('btn-outline');
        } catch (error) {
          if (String(error?.message || '').toLowerCase().includes('unique')) {
            const nextTaskIds = Array.from(new Set([...(session?.appliedTaskIds || []), taskId]));
            updateSession({ appliedTaskIds: nextTaskIds });
            button.textContent = 'Applied ✓';
            button.disabled = true;
          }
        }
      });
    });
  } catch (error) {
    console.error('Explore tasks failed:', error);
  }
}

async function initActiveTasks(user) {
  try {
    const tasks = safeArray(await apiRequest('/gig/tasks/active').catch(() => []));
    const container = document.getElementById('active-tasks-list');
    if (!container) return;

    if (!tasks.length) {
      container.innerHTML = createEmptyState('No active tasks.');
      return;
    }

    container.innerHTML = tasks
      .map((task) => {
        const deliverableCount = safeArray(task.deliverables).length;
        return `
          <article class="task-card" style="align-items: stretch;">
            <div style="width: 120px; background-color: rgba(8, 75, 131, 0.1); border-radius: var(--radius-sm); border: 1px solid rgba(8, 75, 131, 0.2); display: flex; align-items: center; justify-content: center; margin-right: var(--spacing-lg);">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-dark)" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-md);">
                <div class="task-details">
                  <h3>${task.title}</h3>
                  <p>Client ID: ${task.client_id}</p>
                </div>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-secondary);">${formatMoney(task.budget)}</div>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; color: var(--color-text-muted);">
                <span>Progress: ${task.status === 'IN_PROGRESS' ? 'In Development' : 'In Progress'}</span>
                <span style="font-weight: 600; color: var(--color-primary-dark);">0%</span>
              </div>
              <div class="progress-container"><div class="progress-bar" style="width: 0%;"></div></div>
              <div style="font-size:0.875rem;color:var(--color-text-muted);margin-top:var(--spacing-sm);">${deliverableCount} deliverable(s)</div>
            </div>
            <div style="display: flex; flex-direction: column; justify-content: center; margin-left: var(--spacing-xxl); min-width: 140px;">
              <a href="project-detail.html?taskId=${task.task_id}" class="btn btn-outline btn-full" style="text-align: center; margin-bottom: var(--spacing-sm); text-decoration: none;">View Details</a>
              <a href="submit-deliverables.html?taskId=${task.task_id}" class="btn btn-primary-blue btn-full" style="text-align: center; text-decoration: none;">Submit Deliverable</a>
            </div>
          </article>
        `;
      })
      .join('');
  } catch (error) {
    console.error('Active tasks failed:', error);
  }
}

async function initPendingRequests(user) {
  try {
    const requests = safeArray(await apiRequest('/gig/requests/pending').catch(() => []));
    const container = document.getElementById('pending-requests-list');
    if (!container) return;

    if (!requests.length) {
      container.innerHTML = createEmptyState('No pending requests');
      return;
    }

    container.innerHTML = requests
      .map(
        (request) => `
          <article class="dashboard-section" style="margin-bottom:0;">
            <div style="display:flex;justify-content:space-between;gap:var(--spacing-lg);align-items:flex-start;">
              <div>
                <h3 style="font-size:1rem;font-weight:700;margin-bottom:var(--spacing-xs);">${request.task?.title || '—'}</h3>
                <p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:var(--spacing-sm);">${request.task?.description || ''}</p>
                <p style="font-weight:600;color:var(--color-secondary);">${formatMoney(request.task?.budget || 0)}</p>
              </div>
              <span class="status-badge ${getStatusBadgeClass(request.status)}">${String(request.status || 'PENDING').replace(/_/g, ' ')}</span>
            </div>
            <div style="display:flex;gap:var(--spacing-sm);margin-top:var(--spacing-lg);flex-wrap:wrap;">
              <button class="btn btn-primary" style="padding:6px 16px;font-size:0.85rem;" data-respond-accept="${request.application_id}">Accept</button>
              <button class="btn btn-outline" style="padding:6px 16px;font-size:0.85rem;" data-respond-decline="${request.application_id}">Decline</button>
            </div>
          </article>
        `,
      )
      .join('');

    container.querySelectorAll('[data-respond-accept]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await apiRequest(`/gig/requests/${button.dataset.respondAccept}/respond`, 'POST', {
            action: 'accepted',
          });
          window.location.href = 'active-tasks.html';
        } catch (error) {
          console.error('Accept request failed:', error);
        }
      });
    });

    container.querySelectorAll('[data-respond-decline]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await apiRequest(`/gig/requests/${button.dataset.respondDecline}/respond`, 'POST', {
            action: 'declined',
          });
          await initPendingRequests(user);
        } catch (error) {
          console.error('Decline request failed:', error);
        }
      });
    });
  } catch (error) {
    console.error('Pending requests failed:', error);
  }
}

async function initGigProfile(user) {
  try {
    const [profile, services, activeTasks, completedProjects] = await Promise.all([
      apiRequest('/gig/profile').catch(() => null),
      apiRequest('/gig/services/mine').catch(() => []),
      apiRequest('/gig/tasks/active').catch(() => []),
      apiRequest('/gig/projects/completed').catch(() => []),
    ]);

    if (!profile) return;

    syncSidebarIdentity({ ...user, name: profile.name || user.name });

    setText('#profile-name-text', profile.name || user.name || 'Gig Professional');
    setText('#profile-avatar-text', initials(profile.name || user.name || 'GP'));
    setText('#profile-subtitle-text', profile.email || 'Active gig professional');

    const about = document.getElementById('about-me-text');
    if (about) {
      about.textContent = profile.bio || 'No bio added yet.';
    }

    const skillsList = document.getElementById('skills-list');
    if (skillsList) {
      const skills = safeArray(profile.skills);
      skillsList.innerHTML = skills.length
        ? skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join('')
        : '<span class="skill-tag">No skills added yet</span>';
    }

    const servicesList = document.getElementById('services-list');
    if (servicesList) {
      const ownedServices = safeArray(services);
      servicesList.innerHTML = ownedServices.length
        ? ownedServices
            .map(
              (service) => `
                <div style="display:flex;border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden;">
                  <div style="width:150px;background-color:rgba(8,75,131,0.1);display:flex;align-items:center;justify-content:center;">
                    <svg width="48" height="48" fill="none" stroke="var(--color-primary-dark)" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  </div>
                  <div style="padding:var(--spacing-lg);flex:1;display:flex;flex-direction:column;">
                    <h3 style="font-size:1.125rem;font-weight:600;color:var(--color-text-dark);margin-bottom:4px;">${service.title}</h3>
                    <div style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:var(--spacing-sm);">${service.description}</div>
                    <div style="font-weight:700;color:var(--color-secondary);margin-top:auto;">${formatMoney(service.price)}</div>
                  </div>
                </div>
              `,
            )
            .join('')
        : '<p style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No services posted yet.</p>';
    }

    const completedCount = safeArray(completedProjects).length;
    const activeCount = safeArray(activeTasks).length;
    const totalCompletedMetrics = completedCount + activeCount;
    const successRate = totalCompletedMetrics > 0 ? Math.round((completedCount / totalCompletedMetrics) * 100) : 0;
    setText('#job-success-text', `${successRate}%`);
    const successBar = document.getElementById('job-success-bar');
    if (successBar) successBar.style.width = `${successRate}%`;

    const ratingRow = document.getElementById('job-rating-row');
    const reviews = safeArray(completedProjects).flatMap((project) => safeArray(project.reviews));
    if (ratingRow) {
      if (reviews.length) {
        const avg = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
        ratingRow.innerHTML = `<span style="color:#facc15;font-size:1.25rem;">★ ★ ★ ★ ★</span><span style="font-weight:600;font-size:0.875rem;">${avg.toFixed(1)} (${reviews.length} Reviews)</span>`;
      } else {
        ratingRow.innerHTML = '<span style="color:var(--color-text-muted);font-size:0.875rem;">No reviews yet</span>';
      }
    }

    const languages = document.getElementById('languages-list');
    if (languages) {
      const portfolioItems = safeArray(profile.portfolio);
      if (portfolioItems.length) {
        languages.innerHTML = portfolioItems
          .slice(0, 4)
          .map((item) => `<li style="display:flex;justify-content:space-between;font-size:0.875rem;"><span style="font-weight:600;">Portfolio</span><span style="color:var(--color-text-muted);">${item}</span></li>`)
          .join('');
      }
    }
  } catch (error) {
    console.error('Gig profile failed:', error);
  }
}

async function initSubmitDeliverables(user) {
  try {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    const activeTasks = safeArray(await apiRequest('/gig/tasks/active').catch(() => []));
    const task = activeTasks.find((entry) => entry.task_id === taskId);
    const form = document.getElementById('submit-deliverables-form') || document.querySelector('form');

    if (!task) {
      setHtml('#project-context-card', createEmptyState('No active task selected. Open this page from Active Tasks.'));
      if (form) form.style.display = 'none';
      return;
    }

    setText('#context-project-name', task.title);
    setText('#context-client-name', `Client: ${task.client_id}`);
    const viewLink = document.getElementById('view-project-link');
    if (viewLink) viewLink.href = `project-detail.html?taskId=${task.task_id}`;

    const taskDeliverables = safeArray(task.deliverables);
    const historyMarkup = taskDeliverables.length
      ? taskDeliverables
          .map(
            (deliverable) => `
              <div style="padding:var(--spacing-md) 0;border-bottom:1px solid var(--color-border);">
                <div style="font-weight:600;margin-bottom:4px;">Deliverable #${deliverable.deliverable_no}</div>
                <div style="font-size:0.875rem;color:var(--color-text-muted);">${deliverable.content}</div>
              </div>
            `,
          )
          .join('')
      : '<p style="color:var(--color-text-muted);">No deliverables submitted yet.</p>';

    const historyContainer = document.getElementById('deliverables-history') || document.createElement('div');
    historyContainer.id = 'deliverables-history';
    historyContainer.className = 'dashboard-section';
    historyContainer.innerHTML = `<div class="section-header"><h2>Deliverables</h2></div>${historyMarkup}`;

    const submitCard = document.querySelector('.submission-form-card');
    if (submitCard && !document.getElementById('deliverables-history')) {
      submitCard.parentElement.insertBefore(historyContainer, submitCard.nextSibling);
    } else if (!document.getElementById('deliverables-history') && form) {
      form.insertAdjacentElement('afterend', historyContainer);
    }

    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const content = (document.getElementById('submission-notes')?.value || '').trim();
        const notes = (document.getElementById('external-link')?.value || '').trim();

        if (!content) {
          alert('Deliverable content is required');
          return;
        }

        try {
          await apiRequest('/gig/deliverables', 'POST', {
            taskId: task.task_id,
            content,
            notes,
          });
          alert('Deliverable submitted!');
          window.location.href = 'submission-success.html';
        } catch (error) {
          console.error('Submit deliverable failed:', error);
        }
      });
    }
  } catch (error) {
    console.error('Submit deliverables failed:', error);
  }
}

async function initPostService(user) {
  const form = document.getElementById('post-service-form') || document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = (document.getElementById('service-title')?.value || '').trim();
    const description = (document.getElementById('description')?.value || document.querySelector('textarea')?.value || '').trim();
    const price = Number(document.getElementById('amount')?.value || 0);
    const category = (document.getElementById('category')?.value || '').trim();
    const delivery = (document.getElementById('delivery')?.value || '').trim();
    const thumbnail = (document.getElementById('thumbnail')?.value || '').trim();

    const tags = [category, delivery].filter(Boolean);

    if (!title || !description || !Number.isFinite(price) || price <= 0 || tags.length === 0) {
      alert('All fields are required');
      return;
    }

    const servicePayload = {
      title,
      description,
      price,
      tags,
      ...(thumbnail ? { thumbnail } : {}),
    };

    console.log(servicePayload);

    try {
      await apiRequest('/gig/services', 'POST', servicePayload);
      alert('Service posted!');
      window.location.href = 'service-published.html';
    } catch (error) {
      console.error('Post service failed:', error);
    }
  });
}

async function initCompletedProjects(user) {
  try {
    const projects = safeArray(await apiRequest('/gig/projects/completed').catch(() => []));
    const container = document.getElementById('completed-projects-grid');
    if (!container) return;

    setText('#completed-total-count', String(projects.length));

    if (!projects.length) {
      container.innerHTML = createEmptyState('No completed projects yet.');
      return;
    }

    container.innerHTML = projects
      .map((project) => {
        const reviews = safeArray(project.reviews);
        const payment = project.payment;
        return `
          <article class="dashboard-section" style="margin-bottom:0;">
            <div style="display:flex;justify-content:space-between;gap:var(--spacing-lg);align-items:flex-start;">
              <div>
                <h3 style="font-size:1rem;font-weight:700;margin-bottom:var(--spacing-xs);">${project.title}</h3>
                <p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:var(--spacing-sm);">${project.description || ''}</p>
                <p style="font-weight:600;color:var(--color-secondary);">${formatMoney(project.budget)}</p>
              </div>
              <span class="status-badge status-review-needed">Completed</span>
            </div>
            <div style="display:flex;gap:var(--spacing-lg);flex-wrap:wrap;margin-top:var(--spacing-lg);font-size:0.875rem;color:var(--color-text-muted);">
              <span>${reviews.length} review(s)</span>
              <span>${payment ? `Paid ${formatMoney(payment.amount)}` : 'Payment pending'}</span>
            </div>
          </article>
        `;
      })
      .join('');
  } catch (error) {
    console.error('Completed projects failed:', error);
  }
}

async function initTotalEarnings(user) {
  try {
    const earnings = await apiRequest('/gig/earnings').catch(() => ({ totalEarnings: 0, completedTasks: 0, payments: [] }));
    const payments = safeArray(earnings.payments);
    const completedTasks = Number(earnings.completedTasks || 0);
    const total = completedTasks === 0 ? 0 : Number(earnings.totalEarnings || 0);

    setText('#earnings-total-ytd', formatMoney(total));

    const monthKey = new Date().toISOString().slice(0, 7);
    const monthlyTotal = payments.reduce((sum, payment) => {
      const paidAt = payment.paidAt ? new Date(payment.paidAt).toISOString().slice(0, 7) : '';
      return paidAt === monthKey ? sum + Number(payment.amount || 0) : sum;
    }, 0);

    setText('#earnings-expected-month', formatMoney(monthlyTotal));
    setText('#earnings-available-withdrawal', formatMoney(total));
    setText('#earnings-active-milestones', `From ${completedTasks} completed tasks`);
    setText('#earnings-withdrawn-total', 'Withdrawals are synced with backend payments.');

    const chart = document.getElementById('earnings-trend-chart');
    if (chart) {
      chart.innerHTML = payments.length
        ? `<div style="display:grid;gap:var(--spacing-sm);">${payments
            .slice(-6)
            .map((payment) => {
              const label = payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—';
              return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--color-border);"><span>${label}</span><strong>${formatMoney(payment.amount)}</strong></div>`;
            })
            .join('')}</div>`
        : createEmptyState('No payment activity yet.');
    }

    const tbody = document.getElementById('earnings-transactions-body');
    if (tbody) {
      tbody.innerHTML = payments.length
        ? payments
            .slice()
            .reverse()
            .map(
              (payment) => `
                <tr>
                  <td>${formatDate(payment.paidAt || payment.createdAt)}</td>
                  <td>Payment for ${payment.task_id}</td>
                  <td>${payment.gig_profile_id}</td>
                  <td>${formatMoney(payment.amount)}</td>
                  <td><span class="status-badge status-review-needed">Paid</span></td>
                </tr>
              `,
            )
            .join('')
        : '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No transactions yet.</td></tr>';
    }
  } catch (error) {
    console.error('Total earnings failed:', error);
  }
}

async function initProfileCompletion(user) {
  const form = document.querySelector('form');
  if (!form) return;

  try {
    const profile = await apiRequest('/gig/profile').catch(() => null);
    if (profile && document.getElementById('bio')) {
      document.getElementById('bio').value = profile.bio || '';
    }
  } catch (_) {
    // Ignore prefill errors.
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const bio = (document.getElementById('bio')?.value || '').trim();
    try {
      await apiRequest('/gig/profile', 'PUT', { bio });
      alert('Profile completed!');
      window.location.href = 'gig-dashboard.html';
    } catch (error) {
      console.error('Profile completion failed:', error);
    }
  });
}

async function initProjectDetail(user) {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get('taskId');

  if (!taskId) {
    setText('#project-detail-title', 'Select a task to view details');
    setText('#project-detail-subtitle', 'Open this page from an active task.');
    setText('#project-detail-description', 'No task was provided.');
    setHtml('#project-detail-deliverables-list', createEmptyState('No deliverables available.'));
    return;
  }

  try {
    const activeTasks = safeArray(await apiRequest('/gig/tasks/active').catch(() => []));
    const task = activeTasks.find((entry) => entry.task_id === taskId);

    if (!task) {
      setText('#project-detail-title', 'Task not found');
      setText('#project-detail-subtitle', 'This task is not currently assigned to you.');
      setText('#project-detail-description', 'Open the task from Active Tasks to view live details.');
      setHtml('#project-detail-deliverables-list', createEmptyState('No deliverables available.'));
      return;
    }

    renderSidebarFooter(user);
    bindGlobalControls();

    setText('#project-detail-title', task.title || 'Task Details');
    setText('#project-detail-subtitle', `${currentUserLabel(user)} • ${formatMoney(task.budget)} • ${task.status}`);
    setText('#project-detail-description', task.description || 'No description available.');
    setText('#project-detail-budget', formatMoney(task.budget));
    setText('#project-detail-deadline', task.updatedAt ? formatDate(task.updatedAt) : '—');
    setText('#project-detail-client-name', task.client_id || 'Client unavailable');
    setText('#project-detail-client-initials', initials(task.client_id || 'GP'));
    setText('#project-detail-status-badge', task.status === 'IN_PROGRESS' ? 'In Progress' : 'Task Details');

    const deliverables = safeArray(task.deliverables);

    const deliverablesMarkup = deliverables.length
      ? deliverables
          .map((deliverable) => {
            const link = extractSubmissionLink(deliverable.content);
            return `
              <article style="padding:var(--spacing-lg); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-white); display:grid; gap:var(--spacing-sm);">
                <div style="display:flex; gap:var(--spacing-md); align-items:center;">
                  <h3 style="font-size:1rem; font-weight:700; color:var(--color-text-dark);">Atomic Deliverable #${deliverable.deliverable_no}</h3>
                </div>
                <p style="margin:0; color:var(--color-text-muted); font-size:0.875rem;">${deliverable.content || 'No submission content provided.'}</p>
                ${link ? `<a href="${link}" target="_blank" rel="noreferrer" style="color:var(--color-primary-blue); font-weight:600; text-decoration:none;">Submission link</a>` : '<span style="color:var(--color-text-muted); font-size:0.875rem;">No submission link</span>'}
                <div style="display:flex; justify-content:flex-end; margin-top:var(--spacing-sm);">
                  <button type="button" class="btn btn-primary-blue" data-project-detail-submit>Submit Deliverable</button>
                </div>
              </article>
            `;
          })
          .join('')
      : createEmptyState('No deliverables found for this task yet.');

    setHtml('#project-detail-deliverables-list', deliverablesMarkup);
    document.querySelectorAll('[data-project-detail-submit]').forEach((button) => {
      button.addEventListener('click', () => {
        button.textContent = 'Submitted';
        button.disabled = true;
        button.classList.remove('btn-primary-blue');
        button.style.background = 'rgba(81, 158, 138, 0.16)';
        button.style.color = 'var(--color-secondary)';
        button.style.border = '1px solid rgba(81, 158, 138, 0.32)';
        button.style.cursor = 'not-allowed';
        button.style.opacity = '1';
      });
    });
  } catch (error) {
    console.error('Project detail failed:', error);
  }
}
