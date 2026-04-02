// ─── adminAdmins.js ─────────────────────────────────────────────
// admin-management.html — Admin user CRUD.
// ─────────────────────────────────────────────────────────────────

import { adminUsers, saveAdmins, findById, removeById, fmtDate } from './adminData.js';
import { createAdmin, getAdminSession } from './adminAuth.js';
import { showModal, closeModal, eyeIcon, editIcon, trashIcon, statusBadge, statusLabel } from './adminShared.js';

let searchTerm = '';

export function init() {
  renderTable();
  bindSearch();
  bindCreateBtn();
}

function filtered() {
  if (!searchTerm) return adminUsers;
  const q = searchTerm.toLowerCase();
  return adminUsers.filter(a => (a.name||'').toLowerCase().includes(q) || (a.email||'').toLowerCase().includes(q));
}

function renderTable() {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;
  const list = filtered();
  const session = getAdminSession();
  if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:var(--spacing-xxl);color:var(--color-text-muted);">No admins found.</td></tr>'; return; }
  tbody.innerHTML = list.map(a => `<tr data-id="${a.id}">
    <td><div style="display:flex;align-items:center;gap:var(--spacing-md);"><div style="width:40px;height:40px;border-radius:50%;background-image:url('${a.avatar||''}');background-size:cover;background-color:var(--color-border);"></div><div><div style="font-weight:700;color:var(--color-primary-dark);">${a.name}</div><div style="font-size:0.7rem;color:var(--color-text-muted);">${a.email}</div></div></div></td>
    <td><span style="display:inline-block;padding:3px 10px;border-radius:var(--radius-sm);font-size:0.65rem;font-weight:700;text-transform:uppercase;background:${a.role==='super_admin'?'rgba(8,75,131,0.1)':'rgba(81,158,138,0.1)'};color:${a.role==='super_admin'?'var(--color-primary-dark)':'var(--color-secondary)'};">${a.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}</span></td>
    <td><span class="admin-tag ${statusBadge(a.status)}">${statusLabel(a.status)}</span></td>
    <td style="font-size:0.8rem;color:var(--color-text-muted);">${fmtDate(a.createdAt)}</td>
    <td><div style="display:flex;gap:4px;">
      <button class="admin-action-btn act-view" title="View" data-id="${a.id}">${eyeIcon}</button>
      <button class="admin-action-btn act-edit" title="Edit" data-id="${a.id}">${editIcon}</button>
      ${a.id !== session?.id ? `<button class="admin-action-btn act-delete" title="Delete" data-id="${a.id}" style="color:#d32f2f;">${trashIcon}</button>` : ''}
    </div></td>
  </tr>`).join('');
  bindTableActions();
}

function bindTableActions() {
  document.querySelectorAll('.act-view').forEach(btn => btn.addEventListener('click', () => {
    const a = findById(adminUsers, btn.dataset.id); if(!a) return;
    showModal(`<h2>Admin Details</h2><table style="width:100%;font-size:0.875rem;margin-top:var(--spacing-lg);"><tr><td style="padding:8px 0;font-weight:600;">Name</td><td>${a.name}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Email</td><td>${a.email}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Role</td><td>${a.role==='super_admin'?'Super Admin':'Admin'}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Status</td><td>${statusLabel(a.status)}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Created</td><td>${fmtDate(a.createdAt)}</td></tr></table><div style="text-align:right;margin-top:var(--spacing-xl);"><button class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Close</button></div>`);
  }));
  document.querySelectorAll('.act-edit').forEach(btn => btn.addEventListener('click', () => {
    const a = findById(adminUsers, btn.dataset.id); if(!a) return;
    showModal(`<h2>Edit Admin</h2><form id="ef-form"><div style="display:grid;gap:var(--spacing-md);margin-top:var(--spacing-lg);"><label style="font-weight:600;font-size:0.875rem;">Name<input id="ef-name" value="${a.name}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Role<select id="ef-role" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"><option value="super_admin" ${a.role==='super_admin'?'selected':''}>Super Admin</option><option value="admin" ${a.role==='admin'?'selected':''}>Admin</option></select></label></div><div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);"><button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button><button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Save</button></div></form>`);
    document.getElementById('ef-form')?.addEventListener('submit', (e) => { e.preventDefault(); a.name=document.getElementById('ef-name').value.trim()||a.name; a.role=document.getElementById('ef-role').value; saveAdmins(); closeModal(); renderTable(); });
  }));
  document.querySelectorAll('.act-delete').forEach(btn => btn.addEventListener('click', () => {
    const a = findById(adminUsers, btn.dataset.id); if(!a) return;
    if (!confirm(`Delete admin "${a.name}"? This cannot be undone.`)) return;
    removeById(adminUsers, btn.dataset.id); saveAdmins(); renderTable();
  }));
}

function bindSearch() {
  const input = document.querySelector('input[type="text"][placeholder]');
  if (input) input.addEventListener('input', () => { searchTerm = input.value.trim(); renderTable(); });
}

function bindCreateBtn() {
  document.querySelectorAll('.admin-header-actions button').forEach(btn => {
    if (/add|create|new|invite/i.test(btn.textContent)) {
      btn.addEventListener('click', () => {
        showModal(`<h2>Add New Admin</h2><form id="cf-form"><div style="display:grid;gap:var(--spacing-md);margin-top:var(--spacing-lg);"><label style="font-weight:600;font-size:0.875rem;">Name<input id="cf-name" required style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Email<input id="cf-email" type="email" required style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Password<input id="cf-pass" type="password" required minlength="6" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Role<select id="cf-role" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></label></div><div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);"><button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button><button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Create</button></div></form>`);
        document.getElementById('cf-form')?.addEventListener('submit', (e) => {
          e.preventDefault();
          const result = createAdmin({ name: document.getElementById('cf-name').value.trim(), email: document.getElementById('cf-email').value.trim(), password: document.getElementById('cf-pass').value, role: document.getElementById('cf-role').value });
          if (!result.ok) { alert(result.error); return; }
          closeModal(); renderTable();
        });
      });
    }
  });
}
