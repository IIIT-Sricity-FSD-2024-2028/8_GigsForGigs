import React from 'react';

/**
 * @file StatusBadge.tsx
 * @description
 * Semantic status pill component mapping application entity statuses (Users, Tasks,
 * Escrow, Disputes, Reviews) to normalized visual color tokens.
 */

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');

  let badgeClass = 'badge-neutral';
  let displayLabel = status.replace(/_/g, ' ');

  switch (normalized) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'APPROVED':
    case 'RELEASED':
    case 'ACCEPTED':
    case 'TOP_RATED':
      badgeClass = 'badge-success';
      break;

    case 'OPEN':
    case 'IN_PROGRESS':
    case 'REVIEWING':
    case 'ASSIGNED':
    case 'VERIFIED_PRO':
    case 'STANDARD':
    case 'HELD_IN_ESCROW':
      badgeClass = 'badge-info';
      break;

    case 'PENDING':
    case 'PENDING_KYC':
    case 'UNDER_REVIEW':
    case 'INVITED':
      badgeClass = 'badge-warning';
      break;

    case 'DISPUTED':
    case 'SUSPENDED':
    case 'BANNED':
    case 'FLAGGED':
    case 'CANCELLED':
    case 'REFUNDED':
    case 'REVOKED':
    case 'EXPIRED':
      badgeClass = 'badge-danger';
      break;

    case 'SUPER_ADMIN':
    case 'OWNER':
    case 'FINANCIAL_ADMIN':
      badgeClass = 'badge-purple';
      break;

    default:
      badgeClass = 'badge-neutral';
  }

  return (
    <span className={`admin-badge ${badgeClass} ${className}`}>
      {displayLabel}
    </span>
  );
};
