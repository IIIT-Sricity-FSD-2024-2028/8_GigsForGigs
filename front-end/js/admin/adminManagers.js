import { fetchManagers, createManager, deleteManager } from './adminData.js';
import { showToast, openModal, confirmAction, formatDate, getInitials, showLoading, formField } from './adminShared.js';

let managers = [];

export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);
  await loadData();
}

async function loadData() {
  showLoading('table-body');
  try { managers = await fetchManagers(); render(); }
  catch (err) { showToast('Failed to load managers: ' + err.message, 'error'); }
}

function render() {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;
  if (managers.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No managers found.</td></tr>'; return; }

  tbody.innerHTML = managers.map(m => `<tr>
    <td><code style="font-size:0.75rem;color:var(--color-text-muted);">${m.manager_id}</code></td>
    <td><code style="font-size:0.75rem;color:var(--color-text-muted);">${m.client_id}</code></td>
    <td>
      <div style="display:flex;align-items:center;gap:var(--spacing-sm);">
        <div class="admin-footer-avatar" style="width:28px;height:28px;font-size:0.65rem;">${getInitials(m.user?.name || 'MG')}</div>
        <span style="font-weight:600;">${m.user?.name || '—'}</span>
      </div>
    </td>
    <td>${m.user?.email || '—'}</td>
    <td>${formatDate(m.createdAt)}</td>
    <td>
      <button class="admin-action-btn admin-delete-btn" data-client="${m.client_id}" data-manager="${m.manager_id}" title="Delete">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </td>
  </tr>`).join('');

  tbody.querySelectorAll('.admin-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await confirmAction('Delete this manager?')) {
        try { await deleteManager(btn.dataset.client, btn.dataset.manager); showToast('Manager deleted.'); await loadData(); }
        catch (err) { showToast(err.message, 'error'); }
      }
    });
  });
}

function openCreateModal() {
  const body = [
    formField('Client ID', 'client_id', 'text', { placeholder: 'e.g. cli-1' }),
    formField('User ID', 'user_id', 'text', { placeholder: 'e.g. usr-6' }),
  ].join('');
  openModal('Create Manager', body, async (data) => {
    await createManager(data); showToast('Manager created.'); await loadData();
  });
}
