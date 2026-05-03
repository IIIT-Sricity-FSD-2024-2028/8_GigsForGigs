// ─── adminUsers.js ──────────────────────────────────────────
import { fetchUsers, createUser, updateUser, deleteUser } from './adminData.js';
import { showToast, openModal, confirmAction, statusBadge, formatDate, getInitials, showLoading, formField } from './adminShared.js';

let users = [];

export async function init() {
  document.getElementById('add-user-btn')?.addEventListener('click', openCreateModal);
  await loadUsers();
}

async function loadUsers() {
  showLoading('users-table-body');
  try {
    users = await fetchUsers();
    render();
  } catch (err) {
    showToast('Failed to load users: ' + err.message, 'error');
  }
}

function render() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><code style="font-size:0.75rem;color:var(--color-text-muted);">${u.user_id}</code></td>
      <td>
        <div style="display:flex;align-items:center;gap:var(--spacing-sm);">
          <div class="admin-footer-avatar" style="width:28px;height:28px;font-size:0.65rem;">${getInitials(u.name)}</div>
          <span style="font-weight:600;">${u.name}</span>
        </div>
      </td>
      <td>${u.email}</td>
      <td>${statusBadge(u.role)}</td>
      <td>${formatDate(u.createdAt)}</td>
      <td>
        <button class="admin-action-btn" title="Edit" data-action="edit" data-id="${u.user_id}">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="admin-action-btn admin-delete-btn" title="Delete" data-action="delete" data-id="${u.user_id}">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (await confirmAction('Are you sure you want to delete this user? This cannot be undone.')) {
        try {
          await deleteUser(id);
          showToast('User deleted successfully.');
          await loadUsers();
        } catch (err) { showToast(err.message, 'error'); }
      }
    });
  });

  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const user = users.find(u => u.user_id === id);
      if (user) openEditModal(user);
    });
  });
}

function openCreateModal() {
  const body = [
    formField('Name', 'name', 'text', { placeholder: 'Full name' }),
    formField('Email', 'email', 'email', { placeholder: 'user@example.com' }),
    formField('Password', 'password', 'password', { placeholder: 'Min 6 characters' }),
    formField('Role', 'role', 'text', { choices: [
      { value: 'CLIENT', label: 'Client' },
      { value: 'GIG', label: 'Gig Professional' },
      { value: 'MANAGER', label: 'Manager' },
      { value: 'ADMIN', label: 'Admin' },
    ]}),
  ].join('');

  openModal('Create User', body, async (data) => {
    await createUser(data);
    showToast('User created successfully.');
    await loadUsers();
  });
}

function openEditModal(user) {
  const body = [
    formField('Name', 'name', 'text', { value: user.name }),
    formField('Email', 'email', 'email', { value: user.email }),
    formField('Role', 'role', 'text', { value: user.role, choices: [
      { value: 'CLIENT', label: 'Client' },
      { value: 'GIG', label: 'Gig Professional' },
      { value: 'MANAGER', label: 'Manager' },
      { value: 'ADMIN', label: 'Admin' },
    ]}),
  ].join('');

  openModal('Edit User', body, async (data) => {
    await updateUser(user.user_id, data);
    showToast('User updated successfully.');
    await loadUsers();
  });
}
