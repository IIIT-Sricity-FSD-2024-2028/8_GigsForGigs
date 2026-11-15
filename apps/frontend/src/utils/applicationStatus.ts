import type { BadgeProps } from '../components/common/Badge';
import type { ApplicationStatus } from '../types/profile';

/** How an application's decision is labelled and coloured wherever it is shown. */
export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; variant: NonNullable<BadgeProps['variant']> }> = {
  pending: { label: 'Applied', variant: 'pending' },
  shortlisted: { label: 'Shortlisted', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  declined: { label: 'Rejected', variant: 'error' },
  withdrawn: { label: 'Withdrawn', variant: 'neutral' },
  removed: { label: 'Removed by client', variant: 'neutral' },
};
