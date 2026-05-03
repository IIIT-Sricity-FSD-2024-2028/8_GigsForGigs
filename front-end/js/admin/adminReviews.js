import { fetchReviews, createReview, deleteReview } from './adminData.js';
import { showToast, openModal, confirmAction, formatDate, showLoading, formField } from './adminShared.js';
let items = [];
export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);
  await loadData();
}
async function loadData() {
  showLoading('table-body');
  try { items = await fetchReviews(); render(); } catch (e) { showToast(e.message, 'error'); }
}
function stars(n) { return '★'.repeat(n) + '☆'.repeat(5-n); }
function render() {
  const tbody = document.getElementById('table-body'); if (!tbody) return;
  if (!items.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;">No reviews.</td></tr>'; return; }
  tbody.innerHTML = items.map(r => `<tr>
    <td><code>${r.review_id}</code></td><td><code>${r.reviewer_id}</code></td><td><code>${r.reviewee_id}</code></td>
    <td><code>${r.task_id}</code></td>
    <td style="color:#bf6900;font-weight:600;">${stars(r.rating)}</td>
    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.comment || '—'}</td>
    <td><button class="admin-action-btn admin-delete-btn" data-id="${r.review_id}"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>
  </tr>`).join('');
  tbody.querySelectorAll('.admin-delete-btn').forEach(b => b.addEventListener('click', async () => {
    if (await confirmAction('Delete?')) { try { await deleteReview(b.dataset.id); showToast('Deleted.'); await loadData(); } catch(e){ showToast(e.message,'error'); } }
  }));
}
function openCreateModal() {
  openModal('Create Review', [formField('Reviewer User ID','reviewer_id'), formField('Reviewee User ID','reviewee_id'), formField('Task ID','task_id'), formField('Rating (1-5)','rating','number',{placeholder:'5'}), formField('Comment','comment','text',{required:false})].join(''), async d => { await createReview(d); showToast('Created.'); await loadData(); });
}
