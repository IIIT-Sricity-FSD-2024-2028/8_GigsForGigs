import { fetchPayments, createPayment, deletePayment } from './adminData.js';
import { showToast, openModal, confirmAction, formatDate, formatCurrency, showLoading, formField } from './adminShared.js';
let items = [];
export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);
  await loadData();
}
async function loadData() {
  showLoading('table-body');
  try { items = await fetchPayments(); render(); } catch (e) { showToast(e.message, 'error'); }
}
function render() {
  const tbody = document.getElementById('table-body'); if (!tbody) return;
  if (!items.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;">No payments.</td></tr>'; return; }
  tbody.innerHTML = items.map(p => `<tr>
    <td><code>${p.payment_id}</code></td><td><code>${p.task_id}</code></td><td><code>${p.gig_profile_id}</code></td>
    <td style="font-weight:600;">${formatCurrency(p.amount)}</td>
    <td>${formatDate(p.paidAt)}</td>
    <td><button class="admin-action-btn admin-delete-btn" data-id="${p.payment_id}"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>
  </tr>`).join('');
  tbody.querySelectorAll('.admin-delete-btn').forEach(b => b.addEventListener('click', async () => {
    if (await confirmAction('Delete?')) { try { await deletePayment(b.dataset.id); showToast('Deleted.'); await loadData(); } catch(e){ showToast(e.message,'error'); } }
  }));
}
function openCreateModal() {
  openModal('Create Payment', [formField('Task ID','task_id'), formField('Gig Profile ID','gig_profile_id'), formField('Amount (₹)','amount','number',{placeholder:'10000'})].join(''), async d => { await createPayment(d); showToast('Created.'); await loadData(); });
}
