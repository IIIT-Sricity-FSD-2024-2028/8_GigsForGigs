import { fetchGigProfiles, createGigProfile, deleteGigProfile } from './adminData.js';
import { showToast, openModal, confirmAction, formatDate, getInitials, showLoading, formField } from './adminShared.js';

let profiles = [];

export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);
  await loadData();
}

async function loadData() {
  showLoading('table-body');
  try { profiles = await fetchGigProfiles(); render(); }
  catch (err) { showToast('Failed to load gig profiles: ' + err.message, 'error'); }
}

function render() {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;
  if (profiles.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No gig professionals found.</td></tr>'; return; }

  tbody.innerHTML = profiles.map(g => `<tr>
    <td><code style="font-size:0.75rem;color:var(--color-text-muted);">${g.gig_profile_id}</code></td>
    <td>
      <div style="display:flex;align-items:center;gap:var(--spacing-sm);">
        <div class="admin-footer-avatar" style="width:28px;height:28px;font-size:0.65rem;">${getInitials(g.user?.name || 'GP')}</div>
        <span style="font-weight:600;">${g.user?.name || '—'}</span>
      </div>
    </td>
    <td>${g.user?.email || '—'}</td>
    <td>${g.skills.length > 0 ? g.skills.map(s => `<span class="admin-tag" style="margin:2px;">${s}</span>`).join(' ') : '—'}</td>
    <td>${g.tools.length > 0 ? g.tools.join(', ') : '—'}</td>
    <td>
      <button class="admin-action-btn admin-delete-btn" data-id="${g.gig_profile_id}" title="Delete">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </td>
  </tr>`).join('');

  tbody.querySelectorAll('.admin-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await confirmAction('Delete this gig profile?')) {
        try { await deleteGigProfile(btn.dataset.id); showToast('Gig profile deleted.'); await loadData(); }
        catch (err) { showToast(err.message, 'error'); }
      }
    });
  });
}

function openCreateModal() {
  openModal('Create Gig Profile', formField('User ID', 'user_id', 'text', { placeholder: 'e.g. usr-4' }), async (data) => {
    await createGigProfile(data); showToast('Gig profile created.'); await loadData();
  });
}
