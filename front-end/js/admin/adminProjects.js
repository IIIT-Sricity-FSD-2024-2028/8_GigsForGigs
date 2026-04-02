import { adminProjects, saveProjects, adminId, findById, removeById, exportCSV, fmtDate, fmtCurrency } from './adminData.js';
import { showModal, closeModal, eyeIcon, editIcon, assignIcon, cancelIcon, checkIcon, statusLabel } from './adminShared.js';

let activeTab = 'all';
let searchTerm = '';

export function init() {
  console.log('Projects Module: Initializing...');
  renderTable();
  bindSearchDelegation();
  bindTabsDelegation();
  bindCreateBtn();
  bindTableDelegation();
}

function tabFiltered() {
  let list = adminProjects;
  if (activeTab !== 'all') list = list.filter(p => p.status === activeTab);
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    list = list.filter(p => (p.title || '').toLowerCase().includes(q) || (p.client || '').toLowerCase().includes(q));
  }
  return list;
}

const statusClass = { active: 'prj-status-active', completed: 'prj-status-completed', disputed: 'prj-status-disputed', cancelled: 'prj-status-cancelled' };
const dotClass = { active: 'prj-dot-active', completed: 'prj-dot-completed', disputed: 'prj-dot-disputed', cancelled: 'prj-dot-cancelled' };

function renderTable() {
  const tbody = document.querySelector('#projects-table tbody') || document.querySelector('.admin-table tbody');
  if (!tbody) {
    console.error('Projects Module: No tbody found!');
    return;
  }
  const list = tabFiltered();
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:var(--spacing-xxl);color:var(--color-text-muted);">No projects found.</td></tr>';
  } else {
    tbody.innerHTML = list.map(p => `
      <tr data-id="${p.id}" class="${p.status === 'disputed' ? 'prj-row-highlight' : ''}">
        <td><div class="prj-job-title">${p.title}</div><div class="prj-job-date">Start: ${fmtDate(p.startDate)}</div></td>
        <td style="font-size:0.875rem;color:var(--color-text-dark);">${p.client || '—'}</td>
        <td style="font-size:0.875rem;color:var(--color-text-dark);">${p.manager || '—'}</td>
        <td style="font-size:0.875rem;color:var(--color-text-dark);">${p.professional || '—'}</td>
        <td><span class="prj-budget">${fmtCurrency(p.budget)}</span></td>
        <td><span class="prj-status ${statusClass[p.status] || ''}"><span class="prj-status-dot ${dotClass[p.status] || ''}"></span> ${(p.status || '').toUpperCase()}</span></td>
        <td><div style="display:flex;gap:4px;">
          <button class="prj-action-btn act-view" title="View" data-id="${p.id}">${eyeIcon}</button>
          <button class="prj-action-btn act-edit" title="Edit" data-id="${p.id}">${editIcon}</button>
          <button class="prj-action-btn act-assign" title="Assign" data-id="${p.id}">${assignIcon}</button>
          ${p.status === 'active' ? `<button class="prj-action-btn act-complete" title="Mark Completed" data-id="${p.id}" style="color:var(--color-secondary);">${checkIcon}</button>` : ''}
          ${p.status !== 'cancelled' && p.status !== 'completed' ? `<button class="prj-action-btn prj-action-btn-danger act-cancel" title="Cancel" data-id="${p.id}" style="color:#d32f2f;">${cancelIcon}</button>` : ''}
        </div></td>
      </tr>
    `).join('');
  }
  updatePagination(list.length);
}

function bindTabsDelegation() {
  const container = document.querySelector('.prj-tabs');
  if (!container) {
    console.warn('Projects Module: .prj-tabs container not found');
    return;
  }
  const tabMap = { 'All Jobs': 'all', 'Active Jobs': 'active', 'Completed Jobs': 'completed', 'Cancelled Jobs': 'cancelled', 'Disputed Jobs': 'disputed' };
  
  container.addEventListener('click', (e) => {
    const tab = e.target.closest('.prj-tab');
    if (!tab) return;
    
    console.log('Projects Module: Tab clicked:', tab.textContent.trim());
    
    document.querySelectorAll('.prj-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    activeTab = tabMap[tab.textContent.trim()] || 'all';
    renderTable();
  });
}

function bindTableDelegation() {
  const table = document.querySelector('#projects-table') || document.querySelector('.admin-table');
  if (!table) return;

  table.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains('act-view')) handleView(id);
    else if (btn.classList.contains('act-edit')) handleEdit(id);
    else if (btn.classList.contains('act-assign')) handleAssign(id);
    else if (btn.classList.contains('act-complete')) handleComplete(id);
    else if (btn.classList.contains('act-cancel')) handleCancel(id);
  });
}

function bindSearchDelegation() {
  const input = document.getElementById('projects-search');
  if (input) {
    input.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      renderTable();
    });
  }
}

function handleView(id) {
  const p = findById(adminProjects, id); if (!p) return;
  showModal(`<h2>Project Details</h2><table style="width:100%;font-size:0.875rem;margin-top:var(--spacing-lg);"><tr><td style="padding:8px 0;font-weight:600;">Title</td><td>${p.title}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Client</td><td>${p.client}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Manager</td><td>${p.manager || '—'}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Professional</td><td>${p.professional || '—'}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Budget</td><td>${fmtCurrency(p.budget)}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Status</td><td>${statusLabel(p.status)}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Start Date</td><td>${fmtDate(p.startDate)}</td></tr></table><div style="text-align:right;margin-top:var(--spacing-xl);"><button class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Close</button></div>`);
}

function handleEdit(id) {
  const p = findById(adminProjects, id); if (!p) return;
  showModal(`<h2>Edit Project</h2><form id="ef-prj"><div style="display:grid;gap:var(--spacing-md);margin-top:var(--spacing-lg);"><label style="font-weight:600;font-size:0.875rem;">Title<input id="ef-title" value="${p.title}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Budget<input id="ef-budget" type="number" value="${p.budget}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Status<select id="ef-status" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"><option value="active" ${p.status === 'active' ? 'selected' : ''}>Active</option><option value="completed" ${p.status === 'completed' ? 'selected' : ''}>Completed</option><option value="disputed" ${p.status === 'disputed' ? 'selected' : ''}>Disputed</option><option value="cancelled" ${p.status === 'cancelled' ? 'selected' : ''}>Cancelled</option></select></label></div><div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);"><button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button><button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Save</button></div></form>`);
  document.getElementById('ef-prj')?.addEventListener('submit', (e) => { e.preventDefault(); p.title = document.getElementById('ef-title').value.trim() || p.title; p.budget = Number(document.getElementById('ef-budget').value) || p.budget; p.status = document.getElementById('ef-status').value; saveProjects(); closeModal(); renderTable(); });
}

function handleAssign(id) {
  const p = findById(adminProjects, id); if (!p) return;
  showModal(`<h2>Assign Professional</h2><form id="as-prj"><label style="font-weight:600;font-size:0.875rem;display:block;margin-top:var(--spacing-lg);">Professional Name<input id="as-name" value="${p.professional || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);"><button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button><button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Assign</button></div></form>`);
  document.getElementById('as-prj')?.addEventListener('submit', (e) => { e.preventDefault(); p.professional = document.getElementById('as-name').value.trim(); saveProjects(); closeModal(); renderTable(); });
}

function handleComplete(id) {
  const p = findById(adminProjects, id); if (!p || !confirm(`Mark "${p.title}" as completed?`)) return;
  p.status = 'completed'; saveProjects(); renderTable();
}

function handleCancel(id) {
  const p = findById(adminProjects, id); if (!p || !confirm(`Cancel project "${p.title}"?`)) return;
  p.status = 'cancelled'; saveProjects(); renderTable();
}

function bindCreateBtn() {
  const btn = document.getElementById('create-project-btn');
  if (btn) btn.addEventListener('click', () => {
    showModal(`<h2>Create New Project</h2><form id="cf-prj"><div style="display:grid;gap:var(--spacing-md);margin-top:var(--spacing-lg);"><label style="font-weight:600;font-size:0.875rem;">Title<input id="cf-title" required style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Client<input id="cf-client" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Budget<input id="cf-budget" type="number" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label></div><div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);"><button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button><button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Create</button></div></form>`);
    document.getElementById('cf-prj')?.addEventListener('submit', (e) => { e.preventDefault(); const title = document.getElementById('cf-title').value.trim(); if (!title) return; adminProjects.push({ id: adminId('aprj'), title, client: document.getElementById('cf-client').value.trim(), manager: '', professional: '', budget: Number(document.getElementById('cf-budget').value) || 0, status: 'active', startDate: new Date().toISOString().slice(0, 10) }); saveProjects(); closeModal(); renderTable(); });
  });
}

function updatePagination(total) {
  const el = document.querySelector('.prj-showing');
  if (el) el.innerHTML = `Showing <strong>1-${Math.min(total, 10)}</strong> of <strong>${total}</strong> projects`;
}
