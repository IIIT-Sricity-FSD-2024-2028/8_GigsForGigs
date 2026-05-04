import { fetchPayments, createPayment, deletePayment } from './adminData.js';
import { showToast, openModal, confirmAction, formatDate, formatCurrency, showLoading, formField, renderSearchBar, renderFilterBar } from './adminShared.js';

let items = [];
let searchQuery = '';
let filters = { amount: '' };

export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);

  renderSearchBar('payments-search-container', 'Search by task ID or gig ID...', (q) => {
    searchQuery = q; render();
  });

  renderFilterBar('payments-filter-container', [
    { key: 'amount', label: 'Amount', options: [
      { value: 'low',    label: 'Under ₹10,000' },
      { value: 'medium', label: '₹10k – ₹50k' },
      { value: 'high',   label: 'Over ₹50,000' },
    ]},
  ], (f) => { filters = f; render(); });

  await loadData();
}

async function loadData() {
  showLoading('table-body');
  try { items = await fetchPayments(); render(); } catch (e) { showToast(e.message, 'error'); }
}

function render() {
  const tbody = document.getElementById('table-body'); if (!tbody) return;

  const filtered = items.filter(p => {
    const matchSearch = !searchQuery ||
      p.task_id.toLowerCase().includes(searchQuery) ||
      p.gig_profile_id.toLowerCase().includes(searchQuery) ||
      p.payment_id.toLowerCase().includes(searchQuery);
    let matchAmount = true;
    if (filters.amount === 'low')    matchAmount = p.amount < 10000;
    if (filters.amount === 'medium') matchAmount = p.amount >= 10000 && p.amount <= 50000;
    if (filters.amount === 'high')   matchAmount = p.amount > 50000;
    return matchSearch && matchAmount;
  });

  const count = document.getElementById('payments-count');
  if (count) count.textContent = `${filtered.length} of ${items.length} payments`;

  if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-text-muted);">No payments match the current filters.</td></tr>'; return; }

  tbody.innerHTML = filtered.map(p => `<tr>
    <td><code>${p.payment_id}</code></td><td><code>${p.task_id}</code></td><td><code>${p.gig_profile_id}</code></td>
    <td style="font-weight:600;color:var(--color-secondary);">${formatCurrency(p.amount)}</td>
    <td>${formatDate(p.paidAt)}</td>
    <td><button class="admin-action-btn admin-delete-btn" data-id="${p.payment_id}"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>
  </tr>`).join('');

  tbody.querySelectorAll('.admin-delete-btn').forEach(b => b.addEventListener('click', async () => {
    if (await confirmAction('Delete this payment record?')) { try { await deletePayment(b.dataset.id); showToast('Deleted.'); await loadData(); } catch(e){ showToast(e.message,'error'); } }
  }));
}

function openCreateModal() {
  openModal('Record Payment', [formField('Task ID','task_id'), formField('Gig Profile ID','gig_profile_id'), formField('Amount (₹)','amount','number',{placeholder:'10000'})].join(''), async d => { await createPayment(d); showToast('Created.'); await loadData(); });
}

