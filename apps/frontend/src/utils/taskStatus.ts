/**
 * User-facing state of one hire, identical in both portals. The value itself is
 * derived on the server (hireWorkStatus in backend lib/taskRules.ts); this only
 * maps it to a label and badge colours.
 */
export type HireWorkStatus = 'awaiting_funding' | 'in_progress' | 'submitted' | 'revision_requested' | 'completed' | 'cancelled';

export const HIRE_WORK_STATUS: Record<HireWorkStatus, { label: string; bg: string; color: string }> = {
  awaiting_funding: { label: 'Awaiting Funding', bg: '#fde8d7', color: '#9a3412' },
  in_progress: { label: 'In Progress', bg: '#fef3c7', color: '#92400e' },
  submitted: { label: 'Deliverable Submitted', bg: '#e8f0fe', color: '#1a73e8' },
  revision_requested: { label: 'Revision Requested', bg: '#fff0f0', color: '#c5221f' },
  completed: { label: 'Completed', bg: '#e6f4ea', color: '#137333' },
  cancelled: { label: 'Cancelled', bg: '#f1f3f4', color: '#5f6368' },
};
