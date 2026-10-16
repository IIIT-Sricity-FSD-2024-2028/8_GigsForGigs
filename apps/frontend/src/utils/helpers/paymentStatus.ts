import type { PaymentStatus } from '../../context/ClientContext';

export const PAYMENT_STATUS_UI: Record<PaymentStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Payment Required', bg: '#fff0f0', fg: '#c5221f' },
  held: { label: 'Held in Escrow', bg: '#e8f0fe', fg: '#1a73e8' },
  completed: { label: 'Released to Pro', bg: '#e6f4ea', fg: '#137333' },
  refunded: { label: 'Refunded', bg: '#f1f3f4', fg: '#5f6368' },
  failed: { label: 'Failed', bg: '#fff0f0', fg: '#c5221f' },
};
