/** Display formatters shared by the profile and task-detail views. */

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/** 4500 -> "₹4,500". */
export function formatCurrency(amount: number): string {
  return inr.format(amount);
}

/** ISO date -> "14 Nov 2026"; missing/invalid -> the fallback. */
export function formatDate(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** ISO date -> "Nov 2026" (for "Member since"). */
export function formatMonthYear(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}
