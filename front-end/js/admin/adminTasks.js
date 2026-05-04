import { fetchTasks, createTask, updateTask, deleteTask } from './adminData.js';
import { showToast, openModal, confirmAction, statusBadge, formatDate, formatCurrency, showLoading, formField, renderSearchBar, renderFilterBar } from './adminShared.js';

let tasks = [];
let searchQuery = '';
let filters = { status: '', budget: '' };

export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);

  renderSearchBar('tasks-search-container', 'Search by title or ID...', (q) => {
    searchQuery = q; render();
  });

  renderFilterBar('tasks-filter-container', [
    { key: 'status', label: 'Status', options: [
      { value: 'OPEN',        label: 'Open' },
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'COMPLETED',   label: 'Completed' },
      { value: 'CANCELLED',   label: 'Cancelled' },
    ]},
    { key: 'budget', label: 'Budget', options: [
      { value: 'low',    label: 'Under ₹10,000' },
      { value: 'medium', label: '₹10k – ₹50k' },
      { value: 'high',   label: 'Over ₹50,000' },
    ]},
  ], (f) => { filters = f; render(); });

  await loadData();
}

async function loadData() {
  showLoading('table-body');
  try { tasks = await fetchTasks(); render(); }
  catch (err) { showToast('Failed to load tasks: ' + err.message, 'error'); }
}

function render() {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;

  const filtered = tasks.filter(t => {
    const matchSearch = !searchQuery ||
      t.title.toLowerCase().includes(searchQuery) ||
      t.task_id.toLowerCase().includes(searchQuery);
    const matchStatus = !filters.status || t.status === filters.status;
    let matchBudget = true;
    if (filters.budget === 'low')    matchBudget = t.budget < 10000;
    if (filters.budget === 'medium') matchBudget = t.budget >= 10000 && t.budget <= 50000;
    if (filters.budget === 'high')   matchBudget = t.budget > 50000;
    return matchSearch && matchStatus && matchBudget;
  });

  const count = document.getElementById('tasks-count');
  if (count) count.textContent = `${filtered.length} of ${tasks.length} tasks`;

  if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:var(--spacing-xl);">No tasks match the current filters.</td></tr>'; return; }

  tbody.innerHTML = filtered.map(t => `<tr>
    <td><code style="font-size:0.75rem;color:var(--color-text-muted);">${t.task_id}</code></td>
    <td style="font-weight:600;">${t.title}</td>
    <td><code style="font-size:0.75rem;color:var(--color-text-muted);">${t.client_id}</code></td>
    <td>${formatCurrency(t.budget)}</td>
    <td>${statusBadge(t.status)}</td>
    <td>${formatDate(t.createdAt)}</td>
    <td>
      <button class="admin-action-btn" title="Edit" data-action="edit" data-id="${t.task_id}">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
      <button class="admin-action-btn admin-delete-btn" title="Delete" data-action="delete" data-id="${t.task_id}">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </td>
  </tr>`).join('');

  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await confirmAction('Delete this task?')) {
        try { await deleteTask(btn.dataset.id); showToast('Task deleted.'); await loadData(); }
        catch (err) { showToast(err.message, 'error'); }
      }
    });
  });

  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = tasks.find(x => x.task_id === btn.dataset.id);
      if (t) openEditModal(t);
    });
  });
}

const STATUS_CHOICES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function openCreateModal() {
  const body = [
    formField('Client ID', 'client_id', 'text', { placeholder: 'e.g. cli-1' }),
    formField('Title', 'title', 'text', { placeholder: 'Task title' }),
    formField('Description', 'description', 'text', { placeholder: 'Task description' }),
    formField('Budget (₹)', 'budget', 'number', { placeholder: '10000' }),
    formField('Status', 'status', 'text', { choices: STATUS_CHOICES }),
  ].join('');

  openModal('Create Task', body, async (data) => {
    await createTask(data); showToast('Task created.'); await loadData();
  });
}

function openEditModal(task) {
  const body = [
    formField('Title', 'title', 'text', { value: task.title }),
    formField('Description', 'description', 'text', { value: task.description }),
    formField('Budget (₹)', 'budget', 'number', { value: task.budget }),
    formField('Status', 'status', 'text', { value: task.status, choices: STATUS_CHOICES }),
  ].join('');

  openModal('Edit Task', body, async (data) => {
    await updateTask(task.task_id, data); showToast('Task updated.'); await loadData();
  });
}
