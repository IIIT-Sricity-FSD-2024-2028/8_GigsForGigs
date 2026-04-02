import { adminManagers, saveManagers, adminId, findById, removeById, toggleStatus, exportCSV, fmtDate, initials } from './adminData.js';
import { showModal, closeModal, eyeIcon, editIcon, banIcon, trashIcon, statusBadge, statusLabel } from './adminShared.js';

let searchTerm = '';

export function init() {
  renderTable();
  bindSearch();
  bindTableDelegation();
  bindHeaderActions();
}

function filtered() {
  if (!searchTerm) return adminManagers;
  const q = searchTerm.toLowerCase();
  return adminManagers.filter(m =>
    (m.name || '').toLowerCase().includes(q) ||
    (m.email || '').toLowerCase().includes(q) ||
    (m.clientCompany || '').toLowerCase().includes(q)
  );
}

function renderTable() {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;
  const list = filtered();
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:var(--spacing-xxl);color:var(--color-text-muted);">No managers found.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(m => `
    <tr data-id="${m.id}">
      <td>
        <div style="display:flex;align-items:center;gap:var(--spacing-md);">
          <div style="width:40px;height:40px;border-radius:50%;background-image:url('${m.avatar || ''}');background-size:cover;background-color:var(--color-border);"></div>
          <div>
            <div style="font-weight:700;color:var(--color-primary-dark);">${m.name}</div>
            <div style="font-size:0.65rem;color:var(--color-text-muted);text-transform:uppercase;">${m.clientCompany || '—'}</div>
          </div>
        </div>
      </td>
      <td style="color:var(--color-text-muted);font-size:0.875rem;">${m.email}</td>
      <td style="font-weight:600;">${m.clientCompany || '—'}</td>
      <td style="font-weight:700;color:var(--color-primary-dark);font-size:1.125rem;">${m.assignedProjects || 0}</td>
      <td><span class="admin-tag ${statusBadge(m.status)}">${statusLabel(m.status)}</span></td>
      <td style="color:var(--color-text-muted);font-size:0.875rem;">${fmtDate(m.joinDate)}</td>
      <td>
        <div style="display:flex;gap:4px;">
          <button class="admin-action-btn act-view" title="View" data-id="${m.id}">${eyeIcon}</button>
          <button class="admin-action-btn act-edit" title="Edit" data-id="${m.id}">${editIcon}</button>
          <button class="admin-action-btn act-toggle" title="${m.status === 'suspended' ? 'Activate' : 'Suspend'}" data-id="${m.id}" style="color:${m.status === 'suspended' ? 'var(--color-secondary)' : '#d32f2f'}">${banIcon}</button>
          <button class="admin-action-btn act-delete" title="Delete" data-id="${m.id}" style="color:#d32f2f">${trashIcon}</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function bindTableDelegation() {
  const table = document.querySelector('.admin-table');
  if (!table) return;
  table.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    if (btn.classList.contains('act-view')) handleView(id);
    else if (btn.classList.contains('act-edit')) handleEdit(id);
    else if (btn.classList.contains('act-toggle')) handleToggle(id);
    else if (btn.classList.contains('act-delete')) handleDelete(id);
  });
}

function handleView(id) {
  const m = findById(adminManagers, id); if (!m) return;
  showModal(`<h2 style="margin-bottom:var(--spacing-lg);">Manager Details</h2><table style="width:100%;font-size:0.875rem;"><tr><td style="padding:8px 0;font-weight:600;">Name</td><td>${m.name}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Email</td><td>${m.email}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Client Company</td><td>${m.clientCompany || '—'}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Assigned Projects</td><td>${m.assignedProjects || 0}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Status</td><td>${statusLabel(m.status)}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Joined</td><td>${fmtDate(m.joinDate)}</td></tr></table><div style="text-align:right;margin-top:var(--spacing-xl);"><button class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Close</button></div>`);
}

function handleEdit(id) {
  const m = findById(adminManagers, id); if (!m) return;
  showModal(`<h2 style="margin-bottom:var(--spacing-lg);">Edit Manager</h2><form id="am-edit-form"><div style="display:grid;gap:var(--spacing-md);"><label style="font-weight:600;font-size:0.875rem;">Name<input id="ef-name" type="text" value="${m.name}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Email<input id="ef-email" type="email" value="${m.email}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label></div><div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);"><button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button><button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Save</button></div></form>`);
  document.getElementById('am-edit-form')?.addEventListener('submit', (e) => { e.preventDefault(); m.name = document.getElementById('ef-name').value.trim() || m.name; m.email = document.getElementById('ef-email').value.trim() || m.email; saveManagers(); closeModal(); renderTable(); });
}

function handleToggle(id) {
  const m = findById(adminManagers, id); if (!m || !confirm(`${m.status === 'suspended' ? 'Activate' : 'Suspend'} manager "${m.name}"?`)) return;
  toggleStatus(m); saveManagers(); renderTable();
}

function handleDelete(id) {
  if (!confirm('Are you sure you want to delete this manager?')) return;
  removeById(adminManagers, id); saveManagers(); renderTable();
}

function bindHeaderActions() {
  document.querySelector('.admin-header-actions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const txt = btn.textContent.trim().toLowerCase();
    if (txt.includes('add') || txt.includes('create')) handleCreate();
    else if (txt.includes('export')) handleExport();
  });
}

function handleCreate() {
  showModal(`<h2>Add New Manager</h2><form id="am-create-form"><div style="display:grid;gap:var(--spacing-md);margin-top:var(--spacing-lg);"><label style="font-weight:600;font-size:0.875rem;">Name<input id="cf-name" required style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Email<input id="cf-email" required type="email" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label></div><div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);"><button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button><button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Create</button></div></form>`);
  document.getElementById('am-create-form')?.addEventListener('submit', (e) => { e.preventDefault(); const name = document.getElementById('cf-name').value.trim(); const email = document.getElementById('cf-email').value.trim(); adminManagers.unshift({ id: adminId('am'), name, email, clientCompany: '', assignedProjects: 0, status: 'active', joinDate: new Date().toISOString().slice(0, 10), avatar: `https://i.pravatar.cc/150?u=${email.split('@')[0]}` }); saveManagers(); closeModal(); renderTable(); });
}

function handleExport() {
  exportCSV(['Name', 'Email', 'Client Company', 'Projects', 'Status', 'Join Date'], adminManagers.map(m => [m.name, m.email, m.clientCompany, m.assignedProjects, m.status, m.joinDate]), 'managers');
}

function bindSearch() {
  const input = document.getElementById('managers-search') || document.querySelector('.admin-search-input input');
  if (input) input.addEventListener('input', () => { searchTerm = input.value.trim(); renderTable(); });
}
