import { fetchApplications, createApplication, deleteApplication } from './adminData.js';
import { showToast, openModal, confirmAction, formatDate, showLoading, formField, renderSearchBar, renderFilterBar } from './adminShared.js';

let items = [];
let searchQuery = '';
let filters = { sort: '' };

export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);

  renderSearchBar('applications-search-container', 'Search by gig ID or task ID...', (q) => {
    searchQuery = q; render();
  });

  renderFilterBar('applications-filter-container', [
    { key: 'sort', label: 'Sort', options: [
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' },
    ]},
  ], (f) => { filters = f; render(); });

  await loadData();
}

async function loadData() {
  showLoading('table-body');
  try { items = await fetchApplications(); render(); } catch (err) { showToast(err.message, 'error'); }
}

function render() {
  const tbody = document.getElementById('table-body'); if (!tbody) return;

  let filtered = items.filter(a => {
    return !searchQuery ||
      a.gig_profile_id.toLowerCase().includes(searchQuery) ||
      a.task_id.toLowerCase().includes(searchQuery) ||
      a.application_id.toLowerCase().includes(searchQuery);
  });

  if (filters.sort === 'newest') filtered = [...filtered].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (filters.sort === 'oldest') filtered = [...filtered].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

  const count = document.getElementById('applications-count');
  if (count) count.textContent = `${filtered.length} of ${items.length} applications`;

  if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No applications match the current filters.</td></tr>'; return; }

  tbody.innerHTML = filtered.map(a => `<tr>
    <td><code style="font-size:0.75rem;">${a.application_id}</code></td>
    <td><code style="font-size:0.75rem;">${a.gig_profile_id}</code></td>
    <td><code style="font-size:0.75rem;">${a.task_id}</code></td>
    <td>${formatDate(a.createdAt)}</td>
    <td><button class="admin-action-btn admin-delete-btn" data-id="${a.application_id}"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></td>
  </tr>`).join('');

  tbody.querySelectorAll('.admin-delete-btn').forEach(btn => btn.addEventListener('click', async () => {
    if (await confirmAction('Delete this application?')) { try { await deleteApplication(btn.dataset.id); showToast('Deleted.'); await loadData(); } catch(e){ showToast(e.message,'error'); } }
  }));
}

function openCreateModal() {
  openModal('Create Application', [
    formField('Gig Profile ID','gig_profile_id','text',{placeholder:'gpr-1'}),
    formField('Task ID','task_id','text',{placeholder:'tsk-1'})
  ].join(''), async d => { await createApplication(d); showToast('Created.'); await loadData(); });
}

