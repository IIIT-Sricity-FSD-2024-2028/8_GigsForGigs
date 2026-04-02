import { adminClients, saveClients, adminId, findById, removeById, toggleStatus, exportCSV, fmtDate, initials } from './adminData.js';
import { showModal, closeModal, eyeIcon, editIcon, banIcon, trashIcon, statusBadge, statusLabel } from './adminShared.js';

let searchTerm = '';

export function init() {
  renderTable();
  bindSearch();
  bindExport();
  bindCreateBtn();
}

function filtered() {
  if (!searchTerm) return adminClients;
  const q = searchTerm.toLowerCase();
  return adminClients.filter(c =>
    (c.name || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    (c.company || '').toLowerCase().includes(q)
  );
}

function renderTable() {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;

  const list = filtered();

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:var(--spacing-xxl);color:var(--color-text-muted);">No clients found.</td></tr>';
    updatePagination(0);
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr data-id="${c.id}">
      <td>
        <div class="client-avatar-cell">
          <div class="client-avatar" style="background-image:url('${c.avatar || ''}')"></div>
          <div>
            <div class="client-name">${c.name}</div>
            <div class="client-account-type">${c.accountType || 'Individual Account'}</div>
          </div>
        </div>
      </td>
      <td class="client-email">${c.email}</td>
      <td><div class="client-company">${c.company || '—'}</div></td>
      <td class="client-jobs">${c.jobsPosted || 0}</td>
      <td><span class="admin-tag ${statusBadge(c.status)}">${statusLabel(c.status)}</span></td>
      <td class="client-date">${fmtDate(c.joinDate)}</td>
      <td>
        <div style="display:flex;gap:4px;">
          <button class="admin-action-btn act-view" title="View" data-id="${c.id}">${eyeIcon}</button>
          <button class="admin-action-btn act-edit" title="Edit" data-id="${c.id}">${editIcon}</button>
          <button class="admin-action-btn act-toggle" title="${c.status === 'suspended' ? 'Activate' : 'Suspend'}" data-id="${c.id}" style="color:${c.status === 'suspended' ? 'var(--color-secondary)' : '#d32f2f'}">${banIcon}</button>
          <button class="admin-action-btn act-delete" title="Delete" data-id="${c.id}" style="color:#d32f2f">${trashIcon}</button>
        </div>
      </td>
    </tr>
  `).join('');

  updatePagination(list.length);
  bindActions();
}

function bindActions() {
  document.querySelectorAll('.act-view').forEach(btn => btn.addEventListener('click', () => showViewModal(btn.dataset.id)));
  document.querySelectorAll('.act-edit').forEach(btn => btn.addEventListener('click', () => showEditModal(btn.dataset.id)));
  document.querySelectorAll('.act-toggle').forEach(btn => btn.addEventListener('click', () => { toggleClient(btn.dataset.id); }));
  document.querySelectorAll('.act-delete').forEach(btn => btn.addEventListener('click', () => { deleteClient(btn.dataset.id); }));
}

function toggleClient(id) {
  const c = findById(adminClients, id);
  if (!c) return;
  if (!confirm(`${c.status === 'suspended' ? 'Activate' : 'Suspend'} client "${c.name}"?`)) return;
  toggleStatus(c);
  saveClients();
  renderTable();
}

function deleteClient(id) {
  const c = findById(adminClients, id);
  if (!c) return;
  if (!confirm(`Permanently delete client "${c.name}"?`)) return;
  removeById(adminClients, id);
  saveClients();
  renderTable();
}

function showViewModal(id) {
  const c = findById(adminClients, id);
  if (!c) return;
  showModal(`
    <h2 style="margin-bottom:var(--spacing-lg);">Client Details</h2>
    <div style="display:flex;align-items:center;gap:var(--spacing-lg);margin-bottom:var(--spacing-xl);">
      <div class="client-avatar" style="width:64px;height:64px;border-radius:50%;background-image:url('${c.avatar || ''}');background-size:cover;"></div>
      <div>
        <div style="font-size:1.25rem;font-weight:700;">${c.name}</div>
        <div style="color:var(--color-text-muted);">${c.email}</div>
      </div>
    </div>
    <table style="width:100%;font-size:0.875rem;">
      <tr><td style="padding:8px 0;font-weight:600;">Company</td><td>${c.company || '—'}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Account Type</td><td>${c.accountType || '—'}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Jobs Posted</td><td>${c.jobsPosted || 0}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Status</td><td>${statusLabel(c.status)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Joined</td><td>${fmtDate(c.joinDate)}</td></tr>
    </table>
    <div style="text-align:right;margin-top:var(--spacing-xl);"><button class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Close</button></div>
  `);
}

function showEditModal(id) {
  const c = findById(adminClients, id);
  if (!c) return;
  showModal(`
    <h2 style="margin-bottom:var(--spacing-lg);">${id ? 'Edit' : 'Add'} Client</h2>
    <form id="admin-edit-client-form">
      <div style="display:grid;gap:var(--spacing-md);">
        <label style="font-weight:600;font-size:0.875rem;">Name<input id="ef-name" type="text" value="${c.name || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label>
        <label style="font-weight:600;font-size:0.875rem;">Email<input id="ef-email" type="email" value="${c.email || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label>
        <label style="font-weight:600;font-size:0.875rem;">Company<input id="ef-company" type="text" value="${c.company || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label>
        <label style="font-weight:600;font-size:0.875rem;">Account Type<input id="ef-type" type="text" value="${c.accountType || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label>
      </div>
      <div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);">
        <button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button>
        <button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Save</button>
      </div>
    </form>
  `);
  document.getElementById('admin-edit-client-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    c.name = document.getElementById('ef-name').value.trim() || c.name;
    c.email = document.getElementById('ef-email').value.trim() || c.email;
    c.company = document.getElementById('ef-company').value.trim();
    c.accountType = document.getElementById('ef-type').value.trim();
    saveClients();
    closeModal();
    renderTable();
  });
}

function bindCreateBtn() {
  const headerBtns = document.querySelectorAll('.admin-header-actions button');
  headerBtns.forEach(btn => {
    if (/export/i.test(btn.textContent)) return;
    btn.addEventListener('click', () => showCreateModal());
  });
}

function showCreateModal() {
  showModal(`
    <h2 style="margin-bottom:var(--spacing-lg);">Add New Client</h2>
    <form id="admin-create-client-form">
      <div style="display:grid;gap:var(--spacing-md);">
        <label style="font-weight:600;font-size:0.875rem;">Name<input id="cf-name" type="text" required style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label>
        <label style="font-weight:600;font-size:0.875rem;">Email<input id="cf-email" type="email" required style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label>
        <label style="font-weight:600;font-size:0.875rem;">Company<input id="cf-company" type="text" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label>
        <label style="font-weight:600;font-size:0.875rem;">Account Type<input id="cf-type" type="text" placeholder="Individual Account" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label>
      </div>
      <div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);">
        <button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button>
        <button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Create</button>
      </div>
    </form>
  `);
  document.getElementById('admin-create-client-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    if (!name || !email) return;
    adminClients.push({
      id: adminId('ac'),
      name, email,
      company: document.getElementById('cf-company').value.trim(),
      accountType: document.getElementById('cf-type').value.trim() || 'Individual Account',
      jobsPosted: 0,
      status: 'active',
      joinDate: new Date().toISOString().slice(0, 10),
      avatar: `https://i.pravatar.cc/150?u=${email.split('@')[0]}`
    });
    saveClients();
    closeModal();
    renderTable();
  });
}

function bindSearch() {
  const input = document.querySelector('input[placeholder*="client"]') || document.querySelector('input[placeholder*="Client"]');
  if (input) {
    input.addEventListener('input', () => { searchTerm = input.value.trim(); renderTable(); });
  }
}

function bindExport() {
  const exportBtn = Array.from(document.querySelectorAll('.admin-header-actions button')).find(btn => /export/i.test(btn.textContent));
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportCSV(
        ['Name', 'Email', 'Company', 'Jobs Posted', 'Status', 'Join Date'],
        adminClients.map(c => [c.name, c.email, c.company, c.jobsPosted, c.status, c.joinDate]),
        'clients'
      );
    });
  }
}

function updatePagination(total) {
  const showing = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Showing') && d.children.length === 0) || document.querySelector('.prj-showing');
  if (showing) {
    showing.innerHTML = `Showing <span style="font-weight:700;">1-${Math.min(total, 10)}</span> of <strong>${total.toLocaleString()}</strong> clients`;
  }
}
