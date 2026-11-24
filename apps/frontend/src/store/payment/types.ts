/**
 * @file types.ts
 * @description Type definitions for the payment Redux domain.
 */

import type { EscrowPayment } from '../../services/api/payment/paymentApi';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface RequestState {
  status: RequestStatus;
  error: string | null;
  requestId?: string;
}

export interface PaymentState {
  payments: EscrowPayment[];
  paymentsRequest: RequestState;
  overrideRequest: RequestState;
  clientPayRequest: RequestState;
  clientReleaseRequest: RequestState;
}
