/**
 * @file paymentApi.ts
 * @description Dedicated API repository for client escrow funding/release and admin escrow oversight.
 * Strictly adheres to 1:1 repository-to-slice mapping required by REDUX_MIGRATION_TEAM_PLAN.md.
 */

import { apiFetch } from '../httpClient';

export interface EscrowPayment {
  id: string;
  paymentId: number;
  taskId: string;
  taskTitle: string;
  clientId?: string;
  clientName: string;
  gigProId?: string;
  gigProName: string;
  amount: number;
  platformFee: number;
  totalAmount: number;
  status: 'AWAITING_FUNDING' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED' | string;
  createdAt: string;
  settledAt: string | null;
}

export interface OverridePaymentResult {
  paymentId: number;
  taskId: number;
  gigProfileId: number;
  amount: number | string;
  platformFee: number | string;
  status: string;
  settledAt: string | null;
}

export const paymentApi = {
  /**
   * Client: Fund escrow for a task after accepting a hire.
   * POST /payments/pay
   */
  async payTask(taskId: number, gigProfileId: number): Promise<void> {
    return apiFetch<void>('/payments/pay', {
      method: 'POST',
      body: { taskId, gigProfileId },
      actor: 'client',
    });
  },

  /**
   * Client: Release escrowed funds to gig professional after approving all deliverables.
   * POST /payments/release
   */
  async releasePayment(taskId: number, gigProfileId: number): Promise<void> {
    return apiFetch<void>('/payments/release', {
      method: 'POST',
      body: { taskId, gigProfileId },
      actor: 'client',
    });
  },

  /**
   * Super Admin: Fetch complete transaction and escrow ledger.
   * GET /admin/payments
   */
  async getPayments(): Promise<EscrowPayment[]> {
    return apiFetch<EscrowPayment[]>('/admin/payments', {
      actor: 'admin',
    });
  },

  /**
   * Super Admin: Manually override escrow with an audit reason (RELEASE or REFUND).
   * PATCH /admin/payments/:paymentId/override
   */
  async overridePayment(
    paymentId: string | number,
    action: 'RELEASE' | 'REFUND',
    auditReason: string,
  ): Promise<OverridePaymentResult> {
    const rawId = String(paymentId).replace(/\D/g, '');
    return apiFetch<OverridePaymentResult>(`/admin/payments/${rawId}/override`, {
      method: 'PATCH',
      body: { action, auditReason },
      actor: 'admin',
    });
  },
};

export default paymentApi;
