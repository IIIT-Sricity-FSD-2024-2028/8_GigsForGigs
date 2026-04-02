// ─── adminReviews.js ────────────────────────────────────────────
// reviews.html — Table, filters, verify/remove/flag.
// ─────────────────────────────────────────────────────────────────

import { adminReviews, saveReviews, findById, removeById, fmtDate, exportCSV } from './adminData.js';
import { showModal, closeModal, eyeIcon, trashIcon, flagIcon, checkIcon, statusLabel } from './adminShared.js';

let activeFilter = 'all';
let searchTerm = '';

export function init() {
  renderTable();
  bindFilters();
  bindSearch();
  bindExport();
}

function filtered() {
  let list = adminReviews;
  if (activeFilter === 'reported') list = list.filter(r => r.status === 'reported');
  else if (activeFilter === 'low') list = list.filter(r => r.rating <= 2);
  else if (activeFilter === 'recent') list = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (searchTerm) { const q = searchTerm.toLowerCase(); list = list.filter(r => (r.reviewer||'').toLowerCase().includes(q) || (r.subject||'').toLowerCase().includes(q)); }
  return list;
}

const revStatusClass = { verified: 'rev-status-verified', reported: 'rev-status-reported', pending: 'rev-status-pending' };

function renderTable() {
  const tbody = document.querySelector('#reviews-table tbody') || document.querySelector('.admin-table tbody');
  if (!tbody) return;
  const list = filtered();
  if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:var(--spacing-xxl);color:var(--color-text-muted);">No reviews found.</td></tr>'; return; }
  tbody.innerHTML = list.map(r => `<tr data-id="${r.id}" class="${r.status==='reported'?'rev-row-flagged':''}">
    <td><div class="rev-user-cell"><div class="rev-avatar-stack"><img src="${r.avatarReviewer}" alt="${r.reviewer}" class="rev-avatar rev-avatar-main"><img src="${r.avatarSubject}" alt="${r.subject}" class="rev-avatar rev-avatar-sub"></div><div style="margin-left:6px;"><div class="rev-reviewer-name">${r.reviewer}</div><div class="rev-reviewed-sub">reviewed ${r.subject}</div></div></div></td>
    <td><span class="rev-role-tag ${r.role==='gig'?'rev-role-gig':'rev-role-client'}">${r.role==='gig'?'GIG PRO':'CLIENT'}</span></td>
    <td><span class="rev-rating">${r.rating.toFixed(1)} <span class="rev-star">★</span></span></td>
    <td><span class="rev-feedback">"${r.feedback.length > 40 ? r.feedback.slice(0,40)+'...' : r.feedback}"</span></td>
    <td style="font-size:0.8rem;color:var(--color-text-muted);">${fmtDate(r.date)}</td>
    <td><span class="rev-status ${revStatusClass[r.status]||''}">${(r.status||'').toUpperCase()}</span></td>
    <td><div style="display:flex;gap:4px;">
      <button class="rev-action-btn act-view" title="View" data-id="${r.id}">${eyeIcon}</button>
      ${r.status==='pending'?`<button class="rev-action-btn act-verify" title="Verify" data-id="${r.id}" style="color:var(--color-secondary);">${checkIcon}</button>`:''}
      ${r.status!=='reported'?`<button class="rev-action-btn rev-action-btn-warn act-flag" title="Flag" data-id="${r.id}">${flagIcon}</button>`:''}
      <button class="rev-action-btn rev-action-btn-danger act-delete" title="Remove" data-id="${r.id}" style="color:#d32f2f;">${trashIcon}</button>
    </div></td>
  </tr>`).join('');
  bindTableActions();
}

function bindTableActions() {
  document.querySelectorAll('.act-view').forEach(btn => btn.addEventListener('click', () => {
    const r = findById(adminReviews, btn.dataset.id); if(!r) return;
    showModal(`<h2>Review Details</h2><div style="margin-top:var(--spacing-lg);"><p><strong>${r.reviewer}</strong> reviewed <strong>${r.subject}</strong></p><p style="margin:var(--spacing-md) 0;color:var(--color-text-dark);"><strong>Rating:</strong> ${r.rating.toFixed(1)} ★</p><p style="font-style:italic;color:var(--color-text-muted);background:var(--color-bg-light);padding:var(--spacing-md);border-radius:var(--radius-sm);">"${r.feedback}"</p><p style="margin-top:var(--spacing-md);font-size:0.8rem;color:var(--color-text-muted);">Date: ${fmtDate(r.date)} | Status: ${statusLabel(r.status)}</p></div><div style="text-align:right;margin-top:var(--spacing-xl);"><button class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Close</button></div>`);
  }));
  document.querySelectorAll('.act-verify').forEach(btn => btn.addEventListener('click', () => {
    const r = findById(adminReviews, btn.dataset.id); if(!r) return;
    r.status = 'verified'; saveReviews(); renderTable();
  }));
  document.querySelectorAll('.act-flag').forEach(btn => btn.addEventListener('click', () => {
    const r = findById(adminReviews, btn.dataset.id); if(!r) return;
    if (confirm(`Flag review by "${r.reviewer}" as reported?`)) { r.status = 'reported'; saveReviews(); renderTable(); }
  }));
  document.querySelectorAll('.act-delete').forEach(btn => btn.addEventListener('click', () => {
    if (!confirm('Remove this review permanently?')) return;
    removeById(adminReviews, btn.dataset.id); saveReviews(); renderTable();
  }));
}

function bindFilters() {
  const filterMap = { 'Low Ratings': 'low', 'Reported Reviews': 'reported', 'Recent Reviews': 'recent' };
  document.querySelectorAll('.rev-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isActive = btn.classList.contains('active');
      document.querySelectorAll('.rev-filter-btn').forEach(b => b.classList.remove('active'));
      if (!isActive) { btn.classList.add('active'); activeFilter = filterMap[btn.textContent.trim()] || 'all'; }
      else { activeFilter = 'all'; }
      renderTable();
    });
  });
}

function bindSearch() {
  const input = document.getElementById('reviews-search');
  if (input) input.addEventListener('input', () => { searchTerm = input.value.trim(); renderTable(); });
}

function bindExport() {
  const btn = document.getElementById('export-data-btn');
  if (btn) btn.addEventListener('click', () => {
    exportCSV(['Reviewer','Subject','Role','Rating','Feedback','Date','Status'], adminReviews.map(r=>[r.reviewer,r.subject,r.role,r.rating,r.feedback,r.date,r.status]), 'reviews');
  });
}
