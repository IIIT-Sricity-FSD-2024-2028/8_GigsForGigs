import { adminProfessionals, saveProfessionals, adminId, findById, removeById, toggleStatus, exportCSV, fmtDate } from './adminData.js';
import { showModal, closeModal, eyeIcon, editIcon, banIcon, trashIcon, checkIcon, statusBadge, statusLabel } from './adminShared.js';

let searchTerm = '';

export function init() {
  renderTable();
  bindSearch();
  bindTableDelegation();
  bindHeaderActions();
}

function filtered() {
  if (!searchTerm) return adminProfessionals;
  const q = searchTerm.toLowerCase();
  return adminProfessionals.filter(p =>
    (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q)
  );
}

function renderTable() {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;
  const list = filtered();
  if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:var(--spacing-xxl);color:var(--color-text-muted);">No professionals found.</td></tr>'; return; }
  tbody.innerHTML = list.map(p => `
    <tr data-id="${p.id}">
      <td><div style="display:flex;align-items:center;gap:var(--spacing-md);"><div style="width:40px;height:40px;border-radius:50%;background-image:url('${p.avatar}');background-size:cover;background-color:var(--color-border);"></div><div><div style="font-weight:700;color:var(--color-primary-dark);">${p.name}</div><div style="font-size:0.65rem;color:var(--color-text-muted);">${p.title}</div></div></div></td>
      <td style="color:var(--color-text-muted);font-size:0.875rem;">${p.email}</td>
      <td style="font-size:0.8rem;">${(p.skills || []).join(', ')}</td>
      <td style="font-weight:700;">${p.rating?.toFixed(1) || '—'} ★</td>
      <td style="font-weight:700;color:var(--color-primary-dark);">${p.completedJobs || 0}</td>
      <td><span class="admin-tag ${statusBadge(p.status)}">${statusLabel(p.status)}</span></td>
      <td><div style="display:flex;gap:4px;">
        <button class="admin-action-btn act-view" title="View" data-id="${p.id}">${eyeIcon}</button>
        <button class="admin-action-btn act-edit" title="Edit" data-id="${p.id}">${editIcon}</button>
        ${p.status === 'pending' ? `<button class="admin-action-btn act-approve" title="Approve" data-id="${p.id}" style="color:var(--color-secondary);">${checkIcon}</button>` : ''}
        <button class="admin-action-btn act-toggle" title="${p.status === 'suspended' ? 'Activate' : 'Suspend'}" data-id="${p.id}" style="color:${p.status === 'suspended' ? 'var(--color-secondary)' : '#d32f2f'}">${banIcon}</button>
        <button class="admin-action-btn act-delete" title="Delete" data-id="${p.id}" style="color:#d32f2f">${trashIcon}</button>
      </div></td>
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
    else if (btn.classList.contains('act-approve')) handleApprove(id);
    else if (btn.classList.contains('act-toggle')) handleToggle(id);
    else if (btn.classList.contains('act-delete')) handleDelete(id);
  });
}

function handleView(id) {
  const p = findById(adminProfessionals, id); if (!p) return;
  showModal(`<h2>Professional Details</h2><table style="width:100%;font-size:0.875rem;margin-top:var(--spacing-lg);"><tr><td style="padding:8px 0;font-weight:600;">Name</td><td>${p.name}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Title</td><td>${p.title}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Email</td><td>${p.email}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Skills</td><td>${(p.skills||[]).join(', ')}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Rating</td><td>${p.rating?.toFixed(1) || '—'} ★</td></tr><tr><td style="padding:8px 0;font-weight:600;">Completed Jobs</td><td>${p.completedJobs}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Status</td><td>${statusLabel(p.status)}</td></tr></table><div style="text-align:right;margin-top:var(--spacing-xl);"><button class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Close</button></div>`);
}

function handleEdit(id) {
  const p = findById(adminProfessionals, id); if (!p) return;
  showModal(`<h2>Edit Professional</h2><form id="ap-edit-form"><div style="display:grid;gap:var(--spacing-md);margin-top:var(--spacing-lg);"><label style="font-weight:600;font-size:0.875rem;">Name<input id="ef-name" value="${p.name}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Title<input id="ef-title" value="${p.title}" style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label></div><div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);"><button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button><button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Save</button></div></form>`);
  document.getElementById('ap-edit-form')?.addEventListener('submit', (e) => { e.preventDefault(); p.name = document.getElementById('ef-name').value.trim()||p.name; p.title = document.getElementById('ef-title').value.trim()||p.title; saveProfessionals(); closeModal(); renderTable(); });
}

function handleApprove(id) {
  const p = findById(adminProfessionals, id); if (!p) return;
  if (confirm(`Approve professional "${p.name}"?`)) { p.status = 'verified'; saveProfessionals(); renderTable(); }
}

function handleToggle(id) {
  const p = findById(adminProfessionals, id); if (!p) return;
  if (confirm(`${p.status==='suspended'?'Activate':'Suspend'} "${p.name}"?`)) { toggleStatus(p); saveProfessionals(); renderTable(); }
}

function handleDelete(id) {
  if (!confirm('Are you sure you want to delete this professional?')) return;
  removeById(adminProfessionals, id); saveProfessionals(); renderTable();
}

function bindHeaderActions() {
  document.querySelector('.admin-header-actions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const txt = btn.textContent.trim().toLowerCase();
    if (txt.includes('onboard') || txt.includes('add')) handleOnboard();
    else if (txt.includes('export')) handleExport();
  });
}

function handleOnboard() {
  showModal(`<h2>Onboard Professional</h2><form id="ap-onboard-form"><div style="display:grid;gap:var(--spacing-md);margin-top:var(--spacing-lg);"><label style="font-weight:600;font-size:0.875rem;">Name<input id="cf-name" required style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Email<input id="cf-email" type="email" required style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label></div><div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);"><button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button><button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Onboard</button></div></form>`);
  document.getElementById('ap-onboard-form')?.addEventListener('submit', (e) => { e.preventDefault(); const name=document.getElementById('cf-name').value.trim(); const email=document.getElementById('cf-email').value.trim(); if(!name||!email) return; adminProfessionals.unshift({id:adminId('ap'),name,email,title:'Professional',skills:[],rating:0,completedJobs:0,status:'pending',joinDate:new Date().toISOString().slice(0,10),avatar:`https://i.pravatar.cc/150?u=${email.split('@')[0]}`}); saveProfessionals(); closeModal(); renderTable(); });
}

function handleExport() {
  exportCSV(['Name','Email','Title','Skills','Rating','Jobs','Status','Joined'], adminProfessionals.map(p=>[p.name,p.email,p.title,(p.skills||[]).join('; '),p.rating,p.completedJobs,p.status,p.joinDate]),'professionals');
}

function bindSearch() {
  const input = document.getElementById('professionals-search') || document.querySelector('.admin-search-input input');
  if (input) input.addEventListener('input', () => { searchTerm = input.value.trim(); renderTable(); });
}
