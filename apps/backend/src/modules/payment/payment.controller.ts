/**
 * @file payment.controller.ts
 * @description Controller endpoints managing escrow initiation, status updates, client work approval, and admin dispute arbitration.
 */

import { PaymentService } from './payment.service.js';
import type { PaymentRecord } from './payment.types.js';
import { PaymentStatus } from './payment.types.js';

export class PaymentController {
  /**
   * Helper to format standardized JSON API responses.
   */
  private static formatResponse(success: boolean, message: string, data?: any, error?: any) {
    return {
      success,
      message,
      data,
      error
    };
  }

  /**
   * Client endpoint: Initiate payment for a hired task.
   */
  public static initiatePayment(taskId: string, gigProfileId: string, gigAmount: number) {
    const financials = PaymentService.calculateFinancials(gigAmount);
    const newPayment: Partial<PaymentRecord> = {
      paymentId: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
      taskId,
      gigProfileId,
      gigAmount: financials.gigAmount,
      platformFee: financials.platformFee,
      totalAmount: financials.totalAmount,
      status: PaymentStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    return this.formatResponse(true, 'Payment initiated successfully', newPayment);
  }

  /**
   * Client endpoint: Approve completed work and release payout.
   */
  public static releasePayment(payment: PaymentRecord) {
    if (!PaymentService.validateStatusTransition(payment.status, PaymentStatus.RELEASED)) {
      return this.formatResponse(false, `Invalid status transition from ${payment.status} to RELEASED`);
    }

    const updatedPayment: PaymentRecord = {
      ...payment,
      status: PaymentStatus.COMPLETED,
      releasedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.formatResponse(true, 'Payment approved and released to Gig Professional', updatedPayment);
  }
}
