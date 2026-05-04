// ─── gig.js ─ All Gig Professional Pages ────────────────────────
import { apiRequest, requireAuth, logout, formatCurrency, formatDate, getStatusBadgeClass } from './api.js';

function getPage() {
  return window.location.pathname.split('/').pop();
}

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth(['GIG_PROFESSIONAL']);
  if (!user) return;

  document.querySelectorAll('[data-action="logout"]').forEach(el =>
    el.addEventListener('click', (e) => { e.preventDefault(); logout(); })
  );

  const page = getPage();
  switch (page) {
    case 'gig-dashboard.html': initGigDashboard(user); break;
    case 'explore-tasks.html': initExploreTasks(user); break;
    case 'active-tasks.html': initActiveTasks(user); break;
    case 'pending-requests.html': initPendingRequests(user); break;
    case 'gig-profile.html': initGigProfile(user); break;
    case 'submit-deliverables.html': initSubmitDeliverables(user); break;
    case 'post-service.html': initPostService(user); break;
    case 'completed-projects.html': initCompletedProjects(user); break;
    case 'total-earnings.html': initTotalEarnings(user); break;
    case 'profile-completion-gig.html': initProfileCompletion(user); break;
  }
});

// ── Dashboard ────────────────────────────────────────────────────
async function initGigDashboard(user) {
  // Update sidebar name
  const nameEl = document.querySelector('.sidebar-footer div[style*="font-weight"] , .sidebar-footer div div:first-child');
  if (nameEl) nameEl.textContent = user.name || 'Professional';
  const miniEl = document.querySelector('.profile-mini');
  if (miniEl && user.name) miniEl.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  try {
    // Fetch all data in parallel
    const [activeTasks, pendingRequests, completedProjects, earnings] = await Promise.all([
      apiRequest('/gig/tasks/active').catch(() => []),
      apiRequest('/gig/requests/pending').catch(() => []),
      apiRequest('/gig/projects/completed').catch(() => []),
      apiRequest('/gig/earnings').catch(() => ({ totalEarnings: 0 })),
    ]);

    // Metrics
    const activeCountEl = document.getElementById('gig-active-count');
    if (activeCountEl) activeCountEl.textContent = Array.isArray(activeTasks) ? activeTasks.length : 0;

    const pendingCountEl = document.getElementById('gig-pending-count');
    if (pendingCountEl) pendingCountEl.textContent = Array.isArray(pendingRequests) ? pendingRequests.length : 0;

    const completedCountEl = document.getElementById('gig-completed-count');
    if (completedCountEl) completedCountEl.textContent = Array.isArray(completedProjects) ? completedProjects.length : 0;

    const earningsEl = document.getElementById('gig-earnings-count');
    const totalEarn = earnings.totalEarnings || earnings.total || (typeof earnings === 'number' ? earnings : 0);
    if (earningsEl) earningsEl.textContent = formatCurrency(totalEarn);

    // Profile success rate
    const total = (Array.isArray(activeTasks) ? activeTasks.length : 0) + (Array.isArray(completedProjects) ? completedProjects.length : 0);
    const rate = total > 0 ? Math.round(((Array.isArray(completedProjects) ? completedProjects.length : 0) / total) * 100) : 0;
    const circleEl = document.getElementById('gig-profile-success-circle');
    if (circleEl) circleEl.setAttribute('stroke-dasharray', `${rate}, 100`);
    const rateEl = document.getElementById('gig-profile-success-rate');
    if (rateEl) rateEl.textContent = `${rate}%`;

    // Requests table
    const tbody = document.getElementById('gig-dashboard-requests-body');
    if (tbody) {
      const items = Array.isArray(pendingRequests) ? pendingRequests : [];
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No pending requests.</td></tr>';
      } else {
        tbody.innerHTML = items.slice(0, 5).map(r => `
          <tr>
            <td>${r.client_name || r.task?.client_id || '—'}</td>
            <td>${r.task?.title || r.title || '—'}</td>
            <td>${formatDate(r.task?.createdAt || r.createdAt)}</td>
            <td>${formatCurrency(r.task?.budget || r.budget || 0)}</td>
            <td><span class="status-badge ${getStatusBadgeClass(r.status || 'PENDING')}">${r.status || 'PENDING'}</span></td>
          </tr>
        `).join('');
      }
    }

    // Workflow snapshot previews
    const activePreview = document.getElementById('dashboard-active-preview');
    if (activePreview) {
      const items = Array.isArray(activeTasks) ? activeTasks : [];
      activePreview.innerHTML = items.length > 0 
        ? items.slice(0, 3).map(t => `<p style="padding:4px 0;border-bottom:1px solid var(--color-border);font-size:0.875rem;">${t.title || t.task?.title || '—'}</p>`).join('')
        : '<p style="color:var(--color-text-muted);font-size:0.875rem;">No active tasks</p>';
    }
    const pendingPreview = document.getElementById('dashboard-pending-preview');
    if (pendingPreview) {
      const items = Array.isArray(pendingRequests) ? pendingRequests : [];
      pendingPreview.innerHTML = items.length > 0
        ? items.slice(0, 3).map(r => `<p style="padding:4px 0;border-bottom:1px solid var(--color-border);font-size:0.875rem;">${r.task?.title || '—'}</p>`).join('')
        : '<p style="color:var(--color-text-muted);font-size:0.875rem;">No pending requests</p>';
    }
    const completedPreview = document.getElementById('dashboard-completed-preview');
    if (completedPreview) {
      const items = Array.isArray(completedProjects) ? completedProjects : [];
      completedPreview.innerHTML = items.length > 0
        ? items.slice(0, 3).map(p => `<p style="padding:4px 0;border-bottom:1px solid var(--color-border);font-size:0.875rem;">${p.title || p.task?.title || '—'}</p>`).join('')
        : '<p style="color:var(--color-text-muted);font-size:0.875rem;">No completed projects</p>';
    }
  } catch (err) {
    console.error('Gig dashboard failed:', err);
  }
}

// ── Explore Tasks (Marketplace) ──────────────────────────────────
async function initExploreTasks(user) {
  try {
    const tasks = await apiRequest('/gig/tasks/marketplace');
    const grid = document.getElementById('explore-tasks-grid');
    if (!grid) return;

    if (!tasks || tasks.length === 0) {
      grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:var(--color-text-muted);padding:var(--spacing-xxl);">No tasks available right now.</p>';
      return;
    }

    const colors = ['rgba(8,75,131,0.1)', 'rgba(191,105,0,0.1)', 'rgba(81,158,138,0.1)', 'var(--color-border)'];
    grid.innerHTML = tasks.map((t, i) => `
      <div class="explore-card">
        <div class="explore-image" style="background-color:${colors[i % colors.length]};">
          <svg width="48" height="48" fill="none" stroke="var(--color-primary-dark)" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
        </div>
        <div class="explore-content">
          <h3 class="explore-title">${t.title}</h3>
          <p class="explore-client">${t.client_id}</p>
          <div class="explore-price">${formatCurrency(t.budget)}</div>
          <div class="explore-footer">
            <button class="btn btn-primary btn-full" data-apply-task="${t.task_id}">Apply Now</button>
          </div>
        </div>
      </div>
    `).join('');

    // Apply buttons
    grid.querySelectorAll('[data-apply-task]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiRequest('/gig/applications', 'POST', { taskId: btn.dataset.applyTask });
          btn.textContent = 'Applied ✓';
          btn.disabled = true;
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-outline');
        } catch (err) {
          console.error('Apply failed:', err);
        }
      });
    });
  } catch (err) {
    console.error('Explore tasks failed:', err);
  }
}

// ── Active Tasks ─────────────────────────────────────────────────
async function initActiveTasks(user) {
  try {
    const tasks = await apiRequest('/gig/tasks/active');
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    if (!tasks || tasks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No active tasks.</td></tr>';
      return;
    }

    tbody.innerHTML = tasks.map(t => {
      const task = t.task || t;
      return `
        <tr>
          <td><div class="task-name-cell">${task.title}</div></td>
          <td>${task.client_id || '—'}</td>
          <td>${formatCurrency(task.budget)}</td>
          <td><span class="status-badge status-in-progress">In Progress</span></td>
          <td><a href="submit-deliverables.html?taskId=${task.task_id}" class="btn btn-outline" style="padding:4px 12px;font-size:0.8rem;text-decoration:none;">Submit Work</a></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Active tasks failed:', err);
  }
}

// ── Pending Requests ─────────────────────────────────────────────
async function initPendingRequests(user) {
  try {
    const requests = await apiRequest('/gig/requests/pending');
    const container = document.querySelector('.dashboard-content') || document.querySelector('main');
    if (!container) return;

    const existing = container.querySelector('.requests-list');
    const target = existing || document.createElement('div');
    target.className = 'requests-list';

    if (!requests || requests.length === 0) {
      target.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xxl);">No pending requests at this time.</p>';
    } else {
      target.innerHTML = requests.map(r => `
        <div style="background:var(--color-white);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--spacing-lg);margin-bottom:var(--spacing-md);">
          <h3 style="font-size:1rem;font-weight:700;">${r.task?.title || r.title || '—'}</h3>
          <p style="font-size:0.875rem;color:var(--color-text-muted);">${r.task?.description || ''}</p>
          <p style="font-weight:600;color:var(--color-secondary);margin:var(--spacing-sm) 0;">${formatCurrency(r.task?.budget || r.budget || 0)}</p>
          <div style="display:flex;gap:var(--spacing-sm);">
            <button class="btn btn-primary" style="padding:6px 16px;font-size:0.85rem;" data-respond-accept="${r.application_id}">Accept</button>
            <button class="btn btn-outline" style="padding:6px 16px;font-size:0.85rem;" data-respond-decline="${r.application_id}">Decline</button>
          </div>
        </div>
      `).join('');

      target.querySelectorAll('[data-respond-accept]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await apiRequest(`/gig/requests/${btn.dataset.respondAccept}/respond`, 'POST', { action: 'ACCEPT' });
          alert('Request accepted!');
          initPendingRequests(user);
        });
      });

      target.querySelectorAll('[data-respond-decline]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await apiRequest(`/gig/requests/${btn.dataset.respondDecline}/respond`, 'POST', { action: 'DECLINE' });
          alert('Request declined.');
          initPendingRequests(user);
        });
      });
    }

    if (!existing) container.appendChild(target);
  } catch (err) {
    console.error('Pending requests failed:', err);
  }
}

// ── Gig Profile ──────────────────────────────────────────────────
async function initGigProfile(user) {
  try {
    const profile = await apiRequest('/gig/profile');

    // Populate profile fields
    const nameEl = document.getElementById('profile-name') || document.querySelector('.profile-name');
    if (nameEl) nameEl.textContent = profile.name || user.name || '';

    const bioEl = document.getElementById('profile-bio') || document.querySelector('#bio');
    if (bioEl) bioEl.value = profile.bio || '';

    const skillsEl = document.getElementById('profile-skills');
    if (skillsEl && profile.skills) {
      skillsEl.innerHTML = profile.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
    }

    const toolsEl = document.getElementById('profile-tools');
    if (toolsEl && profile.tools) {
      toolsEl.innerHTML = profile.tools.map(t => `<span class="skill-tag">${t}</span>`).join('');
    }

    // Save handler
    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bio = document.getElementById('bio')?.value || '';
        await apiRequest('/gig/profile', 'PUT', { bio });
        alert('Profile updated!');
      });
    }
  } catch (err) {
    console.error('Gig profile failed:', err);
  }
}

// ── Submit Deliverables ──────────────────────────────────────────
async function initSubmitDeliverables(user) {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get('taskId');

  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = (document.getElementById('deliverable-content')?.value || document.querySelector('textarea')?.value || '').trim();
    const tid = taskId || document.getElementById('task-id')?.value || '';

    if (!content || !tid) { alert('Task ID and content are required'); return; }

    try {
      await apiRequest('/gig/deliverables', 'POST', { taskId: tid, content });
      alert('Deliverable submitted!');
      window.location.href = 'submission-success.html';
    } catch (err) {
      console.error('Submit deliverable failed:', err);
    }
  });
}

// ── Post Service ─────────────────────────────────────────────────
async function initPostService(user) {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (document.getElementById('service-title')?.value || '').trim();
    const description = (document.getElementById('service-description')?.value || document.querySelector('textarea')?.value || '').trim();
    const price = Number(document.getElementById('service-price')?.value || 0);
    const tags = (document.getElementById('service-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);

    if (!title || !description || price <= 0) { alert('All fields are required'); return; }

    try {
      await apiRequest('/gig/services', 'POST', { title, description, price, tags });
      alert('Service posted!');
      window.location.href = 'service-published.html';
    } catch (err) {
      console.error('Post service failed:', err);
    }
  });
}

// ── Completed Projects ───────────────────────────────────────────
async function initCompletedProjects(user) {
  try {
    const projects = await apiRequest('/gig/projects/completed');
    const container = document.querySelector('.dashboard-content') || document.querySelector('main');
    if (!container) return;

    const target = container.querySelector('.projects-list') || document.createElement('div');
    target.className = 'projects-list';

    if (!projects || projects.length === 0) {
      target.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xxl);">No completed projects yet.</p>';
    } else {
      target.innerHTML = projects.map(p => {
        const task = p.task || p;
        return `
          <div style="background:var(--color-white);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--spacing-lg);margin-bottom:var(--spacing-md);">
            <h3 style="font-size:1rem;font-weight:700;">${task.title}</h3>
            <p style="font-size:0.875rem;color:var(--color-text-muted);">${task.description || ''}</p>
            <p style="font-weight:600;color:var(--color-secondary);">${formatCurrency(task.budget)}</p>
          </div>
        `;
      }).join('');
    }

    if (!container.querySelector('.projects-list')) container.appendChild(target);
  } catch (err) {
    console.error('Completed projects failed:', err);
  }
}

// ── Total Earnings ───────────────────────────────────────────────
async function initTotalEarnings(user) {
  try {
    const earnings = await apiRequest('/gig/earnings');
    const totalEl = document.getElementById('total-earnings-amount') || document.querySelector('.metric-value');
    const total = earnings.totalEarnings || earnings.total || (typeof earnings === 'number' ? earnings : 0);
    if (totalEl) totalEl.textContent = formatCurrency(total);
  } catch (err) {
    console.error('Total earnings failed:', err);
  }
}

// ── Profile Completion ───────────────────────────────────────────
async function initProfileCompletion(user) {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bio = (document.getElementById('bio')?.value || '').trim();
    try {
      await apiRequest('/gig/profile', 'PUT', { bio });
      alert('Profile completed!');
      window.location.href = 'gig-dashboard.html';
    } catch (err) {
      console.error('Profile completion failed:', err);
    }
  });
}
