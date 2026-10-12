import React from 'react';
import { Badge, type BadgeProps } from '../../Badge/Badge';

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

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = '', variant, children, ...props }) => {
  const normalized = status.toLowerCase().replace(/[\s-]+/g, '_');
  const label = children ?? status.replace(/[_-]+/g, ' ');
  return <Badge variant={variant || statusVariants[normalized] || 'neutral'} {...props}>{label}</Badge>;
};

export default StatusBadge;
