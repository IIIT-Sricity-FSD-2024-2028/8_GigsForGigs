import { fetchClients, createClient, deleteClient } from './adminData.js';
import { showToast, openModal, confirmAction, formatDate, getInitials, showLoading, formField } from './adminShared.js';

let clients = [];

export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);
  await loadData();
}

async function loadData() {
  showLoading('table-body');
  try { clients = await fetchClients(); render(); }
  catch (err) { showToast('Failed to load clients: ' + err.message, 'error'); }
}

function render() {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;
  if (clients.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No clients found.</td></tr>'; return; }

  tbody.innerHTML = clients.map(c => `<tr>
    <td><code style="font-size:0.75rem;color:var(--color-text-muted);">${c.client_id}</code></td>
    <td>
      <div style="display:flex;align-items:center;gap:var(--spacing-sm);">
        <div class="admin-footer-avatar" style="width:28px;height:28px;font-size:0.65rem;">${getInitials(c.user?.name || 'CL')}</div>
        <span style="font-weight:600;">${c.user?.name || '—'}</span>
      </div>
    </td>
    <td>${c.user?.email || '—'}</td>
    <td>${formatDate(c.createdAt)}</td>
    <td>
      <button class="admin-action-btn admin-delete-btn" data-id="${c.client_id}" title="Delete">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </td>
  </tr>`).join('');

  tbody.querySelectorAll('.admin-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await confirmAction('Delete this client profile?')) {
        try { await deleteClient(btn.dataset.id); showToast('Client deleted.'); await loadData(); }
        catch (err) { showToast(err.message, 'error'); }
      }
    });
  });
}

function openCreateModal() {
  openModal('Create Client', formField('User ID', 'user_id', 'text', { placeholder: 'e.g. usr-1' }), async (data) => {
    await createClient(data); showToast('Client created.'); await loadData();
  });
}
