import { fetchAssignments, createAssignment, deleteAssignment } from './adminData.js';
import { showToast, openModal, confirmAction, formatDate, showLoading, formField } from './adminShared.js';
let items = [];
export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);
  await loadData();
}
async function loadData() {
  showLoading('table-body');
  try { items = await fetchAssignments(); render(); } catch (err) { showToast(err.message, 'error'); }
}
function render() {
  const tbody = document.getElementById('table-body'); if (!tbody) return;
  if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No assignments found.</td></tr>'; return; }
  tbody.innerHTML = items.map(a => `<tr>
    <td><code style="font-size:0.75rem;">${a.gig_profile_id}</code></td>
    <td><code style="font-size:0.75rem;">${a.task_id}</code></td>
    <td><code style="font-size:0.75rem;">${a.manager_id}</code></td>
    <td>${formatDate(a.createdAt)}</td>
    <td><button class="admin-action-btn admin-delete-btn" data-gig="${a.gig_profile_id}" data-task="${a.task_id}"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></td>
  </tr>`).join('');
  tbody.querySelectorAll('.admin-delete-btn').forEach(btn => btn.addEventListener('click', async () => {
    if (await confirmAction('Delete this assignment?')) { try { await deleteAssignment(btn.dataset.gig, btn.dataset.task); showToast('Deleted.'); await loadData(); } catch(e){ showToast(e.message,'error'); } }
  }));
}
function openCreateModal() {
  openModal('Create Assignment', [formField('Gig Profile ID','gig_profile_id','text',{placeholder:'gpr-1'}), formField('Task ID','task_id','text',{placeholder:'tsk-2'}), formField('Manager ID','manager_id','text',{placeholder:'mgr-1'})].join(''), async d => { await createAssignment(d); showToast('Created.'); await loadData(); });
}
