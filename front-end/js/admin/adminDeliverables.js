import { fetchDeliverables, createDeliverable, deleteDeliverable } from './adminData.js';
import { showToast, openModal, confirmAction, formatDate, showLoading, formField } from './adminShared.js';
let items = [];
export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);
  await loadData();
}
async function loadData() {
  showLoading('table-body');
  try { items = await fetchDeliverables(); render(); } catch (e) { showToast(e.message, 'error'); }
}
function render() {
  const tbody = document.getElementById('table-body'); if (!tbody) return;
  if (!items.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;">No deliverables.</td></tr>'; return; }
  tbody.innerHTML = items.map(d => `<tr>
    <td><code>${d.task_id}</code></td><td>${d.deliverable_no}</td><td><code>${d.gig_profile_id}</code></td>
    <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.content}</td>
    <td>${formatDate(d.createdAt)}</td>
    <td><button class="admin-action-btn admin-delete-btn" data-task="${d.task_id}" data-no="${d.deliverable_no}"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>
  </tr>`).join('');
  tbody.querySelectorAll('.admin-delete-btn').forEach(b => b.addEventListener('click', async () => {
    if (await confirmAction('Delete?')) { try { await deleteDeliverable(b.dataset.task, +b.dataset.no); showToast('Deleted.'); await loadData(); } catch(e){ showToast(e.message,'error'); } }
  }));
}
function openCreateModal() {
  openModal('Create Deliverable', [formField('Task ID','task_id'), formField('Gig Profile ID','gig_profile_id'), formField('Content','content')].join(''), async d => { await createDeliverable(d); showToast('Created.'); await loadData(); });
}
