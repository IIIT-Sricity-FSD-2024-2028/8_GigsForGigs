import { adminTransactions, saveTransactions, adminId, findById, fmtCurrency, fmtDate, exportCSV } from './adminData.js';
import { showModal, closeModal, eyeIcon, refundIcon, downloadIcon, statusLabel } from './adminShared.js';

let searchTerm = '';

export function init() {
  renderTable();
  bindSearch();
  bindHeaderActions();
  bindActionCards();
  wireSegmentControls();
}

function filtered() {
  if (!searchTerm) return adminTransactions;
  const q = searchTerm.toLowerCase();
  return adminTransactions.filter(t => (t.user || '').toLowerCase().includes(q) || (t.txnId || '').toLowerCase().includes(q));
}

const statusClass = { paid: 'pay-status-paid', pending: 'pay-status-pending', refunded: 'pay-status-refunded' };

function renderTable() {
  const tbody = document.querySelector('#transactions-table tbody') || document.querySelector('.admin-table tbody');
  if (!tbody) return;
  const list = filtered();
  tbody.innerHTML = list.map(t => `
    <tr data-id="${t.id}">
      <td style="font-size:0.8rem;color:var(--color-text-muted);">#${t.txnId}</td>
      <td><div class="pay-user-cell"><img src="${t.avatar}" alt="${t.user}" class="pay-avatar"><span style="font-weight:700;">${t.user}</span></div></td>
      <td><span class="pay-role-tag ${t.role === 'client' ? 'pay-role-client' : 'pay-role-gig'}">${t.role === 'client' ? 'Client' : 'Gig Pro'}</span></td>
      <td style="font-weight:700;">${fmtCurrency(t.amount)}</td>
      <td style="color:var(--color-text-muted);">${fmtCurrency(t.fee)}</td>
      <td style="font-size:0.8rem;color:var(--color-text-muted);">${fmtDate(t.date)}</td>
      <td><span class="pay-status ${statusClass[t.status] || ''}"><span class="pay-status-dot"></span>${statusLabel(t.status)}</span></td>
      <td><div style="display:flex;gap:4px;">
        <button class="admin-action-btn act-view" title="View" data-id="${t.id}">${eyeIcon}</button>
        <button class="admin-action-btn act-refund" title="Refund" data-id="${t.id}">${refundIcon}</button>
        <button class="admin-action-btn act-download" title="Download" data-id="${t.id}">${downloadIcon}</button>
      </div></td>
    </tr>
  `).join('');
  
  // Use delegation on tbody
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    if (btn.classList.contains('act-view')) handleView(id);
    else if (btn.classList.contains('act-refund')) handleRefund(id);
    else if (btn.classList.contains('act-download')) handleDownload(id);
  }, { once: true }); // We re-bind on every render, but delegation is better global. 
  // Actually, let's just do it in init().
}

function handleView(id) {
  const t = findById(adminTransactions, id); if (!t) return;
  showModal(`<h2>Transaction Details</h2><table style="width:100%;font-size:0.875rem;margin-top:var(--spacing-lg);"><tr><td style="padding:8px 0;font-weight:600;">ID</td><td>#${t.txnId}</td></tr><tr><td style="padding:8px 0;font-weight:600;">User</td><td>${t.user}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Role</td><td>${t.role}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Amount</td><td>${fmtCurrency(t.amount)}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Fee</td><td>${fmtCurrency(t.fee)}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Date</td><td>${fmtDate(t.date)}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Status</td><td>${statusLabel(t.status)}</td></tr></table><div style="text-align:right;margin-top:var(--spacing-xl);"><button class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Close</button></div>`);
}

function handleRefund(id) {
  const t = findById(adminTransactions, id); if (!t) return;
  if (t.status === 'refunded') { alert('Already refunded.'); return; }
  if (confirm(`Refund ${fmtCurrency(t.amount)} to ${t.user}?`)) { t.status = 'refunded'; saveTransactions(); renderTable(); }
}

function handleDownload(id) {
  const t = findById(adminTransactions, id); if (!t) return;
  exportCSV(['TXN ID', 'User', 'Role', 'Amount', 'Fee', 'Date', 'Status'], [[t.txnId, t.user, t.role, t.amount, t.fee, t.date, t.status]], `invoice_${t.txnId}`);
}

function bindSearch() {
  const input = document.getElementById('payments-search');
  if (input) input.addEventListener('input', () => { searchTerm = input.value.trim(); renderTable(); });
}

function bindHeaderActions() {
  const exportBtn = document.getElementById('export-report-btn');
  if (exportBtn) exportBtn.addEventListener('click', () => {
    exportCSV(['TXN ID', 'User', 'Role', 'Amount', 'Fee', 'Date', 'Status'], adminTransactions.map(t => [t.txnId, t.user, t.role, t.amount, t.fee, t.date, t.status]), 'payments');
  });
  const payoutBtn = document.getElementById('manual-payout-btn');
  if (payoutBtn) payoutBtn.addEventListener('click', () => {
    showModal(`<h2>Manual Payout</h2><form id="mp-form"><div style="display:grid;gap:var(--spacing-md);margin-top:var(--spacing-lg);"><label style="font-weight:600;font-size:0.875rem;">User Name<input id="mp-user" required style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label><label style="font-weight:600;font-size:0.875rem;">Amount<input id="mp-amount" type="number" required style="width:100%;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-top:4px;font-family:inherit;"></label></div><div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-xl);"><button type="button" class="modal-close-btn" style="padding:8px 24px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:var(--color-white);cursor:pointer;font-weight:600;">Cancel</button><button type="submit" style="padding:8px 24px;border-radius:var(--radius-md);border:none;background:var(--color-primary-dark);color:white;cursor:pointer;font-weight:600;">Create Payout</button></div></form>`);
    document.getElementById('mp-form')?.addEventListener('submit', (e) => { e.preventDefault(); const user = document.getElementById('mp-user').value.trim(); const amount = Number(document.getElementById('mp-amount').value); if (!user || !amount) return; adminTransactions.unshift({ id: adminId('txn'), txnId: `TXN-${Date.now().toString().slice(-5)}`, user, role: 'gig', amount, fee: Math.round(amount * 0.15 * 100) / 100, date: new Date().toISOString().slice(0, 10), status: 'paid', avatar: `https://i.pravatar.cc/150?u=${user.toLowerCase().replace(/\s/g, '_')}` }); saveTransactions(); closeModal(); renderTable(); });
  });
}

function bindActionCards() {
  document.querySelectorAll('.pay-deny-btn').forEach(btn => btn.addEventListener('click', () => { btn.closest('.pay-action-card')?.remove(); }));
  document.querySelectorAll('.pay-approve-btn').forEach(btn => btn.addEventListener('click', () => { btn.closest('.pay-action-card')?.remove(); }));
}

function wireSegmentControls() {
  document.querySelectorAll('.pay-segment').forEach(group => {
    group.querySelectorAll('.pay-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => { group.querySelectorAll('.pay-seg-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); });
    });
  });
}
