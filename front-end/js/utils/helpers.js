// ─── helpers.js ─────────────────────────────────────────────────
// Pure utility functions — no side‑effects, no DOM, no storage.
// ─────────────────────────────────────────────────────────────────

/**
 * Format an ISO date string into a human‑readable form.
 * Example: "2024-10-24T00:00:00Z" → "Oct 24, 2024"
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a number as Indian Rupee currency.
 * Example: 1200 → "₹1,200.00"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0.00';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Generate a short pseudo‑unique id.
 * Not cryptographically secure — fine for in‑memory mock data.
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Truncate a string to `max` characters, appending "…" if trimmed.
 */
export function truncate(str, max = 80) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + '…';
}

/**
 * Return a CSS class name for a task / deliverable / application status badge.
 * Maps to the existing badge classes found in the HTML: badge-pending,
 * badge-active, badge-success, badge-warning, badge-completed.
 */
export function getStatusBadgeClass(status) {
  const map = {
    open:               'badge badge-pending',
    pending:            'badge badge-pending',
    in_progress:        'badge badge-active',
    under_review:       'badge badge-warning',
    completed:          'badge badge-completed',
    approved:           'badge badge-success',
    rejected:           'badge badge-completed',
    shortlisted:        'badge badge-active',
    submitted:          'badge badge-warning',
    revision_requested: 'badge badge-pending'
  };
  return map[status] || 'badge';
}

/**
 * Capitalise and humanise a snake_case / camelCase status string.
 * Example: "in_progress" → "In Progress"
 */
export function humaniseStatus(status) {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get initials from a full name (up to 2 characters).
 * Example: "Alex Johnson" → "AJ"
 */
export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
