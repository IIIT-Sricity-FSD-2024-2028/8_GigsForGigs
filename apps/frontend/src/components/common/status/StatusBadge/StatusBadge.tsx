import React from 'react';
import { Badge, type BadgeProps } from '../../Badge/Badge';

/** Status text (lowercase, words joined by _) -> badge colour variant. Unknown statuses are 'neutral'. */
const statusVariants: Record<string, NonNullable<BadgeProps['variant']>> = {
  pending: 'pending', requested: 'pending', reviewing: 'pending', under_review: 'pending',
  active: 'active', in_progress: 'active', assigned: 'active',
  completed: 'success', approved: 'success', accepted: 'success', paid: 'success', payment_completed: 'success',
  rejected: 'error', cancelled: 'error', canceled: 'error', failed: 'error', disputed: 'error',
  changes_requested: 'warning', revision_requested: 'warning', overdue: 'warning',
  escrowed: 'info', payment_required: 'info'
};

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status?: string;
  variant?: BadgeProps['variant'];
}

/** Badge for any status string (e.g. "IN_PROGRESS", "revision-requested"): picks the colour from `statusVariants` and shows the text with underscores/dashes as spaces. */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = '', variant, children, ...props }) => {
  // "In Progress" / "in-progress" / "IN_PROGRESS" all become "in_progress".
  const normalized = status.toLowerCase().replace(/[\s-]+/g, '_');
  const label = children ?? status.replace(/[_-]+/g, ' ');
  return <Badge variant={variant || statusVariants[normalized] || 'neutral'} {...props}>{label}</Badge>;
};

export default StatusBadge;
