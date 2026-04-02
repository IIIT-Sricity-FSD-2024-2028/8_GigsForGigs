// ─── adminReports.js ────────────────────────────────────────────
// disputes-reports.html — Reports table, investigate/resolve/ban.
// ─────────────────────────────────────────────────────────────────

import { adminReports, saveReports, adminId, findById, removeById, fmtDate, exportCSV } from './adminData.js';
import { showModal, closeModal, eyeIcon, checkIcon, banIcon, trashIcon, statusLabel } from './adminShared.js';

let searchTerm = '';

export function init() {
  renderTable();
  bindSearch();
  bindExport();
}

function filtered() {
  if (!searchTerm) return adminReports;
  const q = searchTerm.toLowerCase();
  return adminReports.filter(r => (r.reporter||'').toLowerCase().includes(q) || (r.against||'').toLowerCase().includes(q) || (r.type||'').toLowerCase().includes(q));
}

const severityColor = { critical: '#d32f2f', high: '#bf6900', medium: 'var(--color-primary-dark)', low: 'var(--color-secondary)' };
const statusBadgeClass = { open: 'background:rgba(211,47,47,0.1);color:#d32f2f;', investigating: 'background:rgba(191,105,0,0.1);color:#bf6900;', resolved: 'background:rgba(81,158,138,0.1);color:var(--color-secondary);', closed: 'background:var(--color-bg-light);color:var(--color-text-muted);' };

function renderTable() {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;
  const list = filtered();
  if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:var(--spacing-xxl);color:var(--color-text-muted);">No reports found.</td></tr>'; return; }
  tbody.innerHTML = list.map(r => `<tr data-id="${r.id}">
    <td style="font-weight:700;color:var(--color-text-dark);">${r.type}</td>
    <td style="font-size:0.875rem;">${r.reporter}</td>
    <td style="font-size:0.875rem;">${r.against}</td>
    <td><span style="display:inline-block;padding:3px 10px;border-radius:var(--radius-pill);font-size:0.65rem;font-weight:700;text-transform:uppercase;background:${r.severity==='critical'?'rgba(211,47,47,0.1)':r.severity==='high'?'rgba(191,105,0,0.1)':'rgba(8,75,131,0.08)'};color:${severityColor[r.severity]||'var(--color-text-muted)'};">${r.severity}</span></td>
    <td><span style="display:inline-block;padding:4px 12px;border-radius:var(--radius-pill);font-size:0.65rem;font-weight:700;text-transform:uppercase;${statusBadgeClass[r.status]||''}">${r.status}</span></td>
    <td style="font-size:0.8rem;color:var(--color-text-muted);">${fmtDate(r.createdAt)}</td>
    <td><div style="display:flex;gap:4px;">
      <button class="admin-action-btn act-view" title="View" data-id="${r.id}">${eyeIcon}</button>
      ${r.status==='open'?`<button class="admin-action-btn act-investigate" title="Investigate" data-id="${r.id}" style="color:#bf6900;">${eyeIcon}</button>`:''}
      ${r.status!=='resolved'&&r.status!=='closed'?`<button class="admin-action-btn act-resolve" title="Resolve" data-id="${r.id}" style="color:var(--color-secondary);">${checkIcon}</button>`:''}
      <button class="admin-action-btn act-ban" title="Ban User" data-id="${r.id}" style="color:#d32f2f;">${banIcon}</button>
      <button class="admin-action-btn act-close" title="Close Case" data-id="${r.id}">${trashIcon}</button>
    </div></td>
  </tr>`).join('');
  bindTableActions();
}

function bindTableActions() {
  document.querySelectorAll('.act-view').forEach(btn => btn.addEventListener('click', () => {
    const r = findById(adminReports, btn.dataset.id); if(!r) return;
    showModal(`<h2>Report Details</h2><table style="width:100%;font-size:0.875rem;margin-top:var(--spacing-lg);"><tr><td style="padding:8px 0;font-weight:600;">Type</td><td>${r.type}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Reporter</td><td>${r.reporter}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Against</td><td>${r.against}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Severity</td><td>${r.severity}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Description</td><td>${r.description}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Status</td><td>${statusLabel(r.status)}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Date</td><td>${fmtDate(r.createdAt)}</td></tr></table><div style="text-align:right;margin-top:var(--spacing-xl);"><button class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Close</button></div>`);
  }));
  document.querySelectorAll('.act-investigate').forEach(btn => btn.addEventListener('click', () => {
    const r = findById(adminReports, btn.dataset.id); if(!r) return;
    r.status = 'investigating'; saveReports(); renderTable();
  }));
  document.querySelectorAll('.act-resolve').forEach(btn => btn.addEventListener('click', () => {
    const r = findById(adminReports, btn.dataset.id); if(!r||!confirm(`Mark "${r.type}" as resolved?`)) return;
    r.status = 'resolved'; saveReports(); renderTable();
  }));
  document.querySelectorAll('.act-ban').forEach(btn => btn.addEventListener('click', () => {
    const r = findById(adminReports, btn.dataset.id); if(!r) return;
    if (confirm(`Ban user "${r.against}" and close this case?`)) { r.status = 'closed'; saveReports(); renderTable(); alert(`User "${r.against}" has been banned.`); }
  }));
  document.querySelectorAll('.act-close').forEach(btn => btn.addEventListener('click', () => {
    const r = findById(adminReports, btn.dataset.id); if(!r||!confirm('Close this case?')) return;
    r.status = 'closed'; saveReports(); renderTable();
  }));
}

function bindSearch() {
  const input = document.querySelector('input[type="text"][placeholder]');
  if (input) input.addEventListener('input', () => { searchTerm = input.value.trim(); renderTable(); });
}

function bindExport() {
  document.querySelectorAll('.admin-header-actions button').forEach(btn => {
    if (/export/i.test(btn.textContent)) {
      btn.addEventListener('click', () => {
        exportCSV(['Type','Reporter','Against','Severity','Status','Date','Description'], adminReports.map(r=>[r.type,r.reporter,r.against,r.severity,r.status,r.createdAt,r.description]), 'reports');
      });
    }
  });
}
