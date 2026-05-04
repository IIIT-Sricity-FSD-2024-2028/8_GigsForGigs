import { fetchReviews, createReview, deleteReview } from './adminData.js';
import { showToast, openModal, confirmAction, formatDate, showLoading, formField, renderSearchBar, renderFilterBar } from './adminShared.js';

let items = [];
let searchQuery = '';
let filters = { rating: '' };

export async function init() {
  document.getElementById('add-btn')?.addEventListener('click', openCreateModal);

  renderSearchBar('reviews-search-container', 'Search by user ID or comment...', (q) => {
    searchQuery = q; render();
  });

  renderFilterBar('reviews-filter-container', [
    { key: 'rating', label: 'Rating', options: [
      { value: '5', label: '★★★★★ (5 stars)' },
      { value: '4', label: '★★★★☆ (4 stars)' },
      { value: '3', label: '★★★☆☆ (3 stars)' },
      { value: '2', label: '★★☆☆☆ (2 stars)' },
      { value: '1', label: '★☆☆☆☆ (1 star)' },
    ]},
  ], (f) => { filters = f; render(); });

  await loadData();
}

async function loadData() {
  showLoading('table-body');
  try { items = await fetchReviews(); render(); } catch (e) { showToast(e.message, 'error'); }
}

function stars(n) {
  return '<span style="color:#fbbf24;">' + '★'.repeat(n) + '</span><span style="color:#e2e8f0;">' + '☆'.repeat(5-n) + '</span>';
}

function render() {
  const tbody = document.getElementById('table-body'); if (!tbody) return;

  const filtered = items.filter(r => {
    const matchSearch = !searchQuery ||
      r.reviewer_id.toLowerCase().includes(searchQuery) ||
      r.reviewee_id.toLowerCase().includes(searchQuery) ||
      (r.comment || '').toLowerCase().includes(searchQuery);
    const matchRating = !filters.rating || String(r.rating) === filters.rating;
    return matchSearch && matchRating;
  });

  const count = document.getElementById('reviews-count');
  if (count) count.textContent = `${filtered.length} of ${items.length} reviews`;

  if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-text-muted);">No reviews match the current filters.</td></tr>'; return; }

  tbody.innerHTML = filtered.map(r => `<tr>
    <td><code>${r.review_id}</code></td><td><code>${r.reviewer_id}</code></td><td><code>${r.reviewee_id}</code></td>
    <td><code>${r.task_id}</code></td>
    <td>${stars(r.rating)}</td>
    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.comment || '—'}</td>
    <td><button class="admin-action-btn admin-delete-btn" data-id="${r.review_id}"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>
  </tr>`).join('');

  tbody.querySelectorAll('.admin-delete-btn').forEach(b => b.addEventListener('click', async () => {
    if (await confirmAction('Delete this review?')) { try { await deleteReview(b.dataset.id); showToast('Deleted.'); await loadData(); } catch(e){ showToast(e.message,'error'); } }
  }));
}

function openCreateModal() {
  openModal('Create Review', [
    formField('Reviewer User ID','reviewer_id'),
    formField('Reviewee User ID','reviewee_id'),
    formField('Task ID','task_id'),
    formField('Rating (1-5)','rating','number',{placeholder:'5'}),
    formField('Comment','comment','text',{required:false})
  ].join(''), async d => { await createReview(d); showToast('Created.'); await loadData(); });
}

