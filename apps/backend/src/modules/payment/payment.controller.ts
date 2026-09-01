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
  public static async initiatePayment(taskId: string, gigProfileId: string, gigAmount: number) {
    const financials = PaymentService.calculateFinancials(gigAmount);
    const numericTaskId = Number(taskId.replace(/[^0-9]/g, '')) || 1;
    const numericGigId = Number(gigProfileId.replace(/[^0-9]/g, '')) || 1;

    await PaymentService.persistPayment(numericTaskId, numericGigId, financials.gigAmount, 'pending');

    const newPayment: Partial<PaymentRecord> = {
      paymentId: 'PAY-' + numericTaskId,
      taskId,
      gigProfileId,
      gigAmount: financials.gigAmount,
      platformFee: financials.platformFee,
      totalAmount: financials.totalAmount,
      status: PaymentStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    return this.formatResponse(true, 'Payment initiated successfully', {
      ...newPayment,
      gigPayout: financials.gigPayout,
      platformRevenue: financials.platformRevenue
    });
  }

  /**
   * Client endpoint: release an escrowed payment to the gig professional
   * and mark the task completed. Trusts taskId/gigProfileId/gigAmount as
   * given by the caller rather than re-deriving them server-side.
   */
  public static async releasePayment(payment: PaymentRecord) {
    const numericTaskId = Number(String(payment.taskId).replace(/[^0-9]/g, '')) || 1;
    const numericGigId = Number(String(payment.gigProfileId).replace(/[^0-9]/g, '')) || 1;
    const gigAmount = Number(payment.gigAmount || 5000);

    await PaymentService.releasePaymentInDb(numericTaskId, numericGigId, gigAmount);

    const financials = PaymentService.calculateFinancials(gigAmount);
    const updatedPayment: PaymentRecord = {
      ...payment,
      platformFee: financials.platformFee,
      totalAmount: financials.totalAmount,
      status: PaymentStatus.COMPLETED,
      releasedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.formatResponse(true, 'Payment approved and released to Gig Professional', {
      ...updatedPayment,
      gigPayout: financials.gigPayout,
      platformRevenue: financials.platformRevenue
    });
  }

  /**
   * Client / Manager endpoint: Fetch payment for a specific task.
   */
  public static async getPaymentByTask(taskId: string) {
    const numericTaskId = Number(taskId.replace(/[^0-9]/g, '')) || 1;
    const payment = await PaymentService.getPaymentByTaskId(numericTaskId);
    if (!payment) {
      return this.formatResponse(true, 'No payment record found', null);
    }
    const financials = PaymentService.calculateFinancials(Number(payment.amount));
    return this.formatResponse(true, 'Payment record found', {
      paymentId: 'PAY-' + payment.paymentId,
      taskId: String(payment.taskId),
      gigProfileId: String(payment.gigProfileId),
      gigProName: payment.gigProfile?.user?.name || 'Gig Professional',
      gigAmount: financials.gigAmount,
      platformFee: financials.platformFee,
      totalAmount: financials.totalAmount,
      status: payment.status.toUpperCase(),
      createdAt: payment.createdAt.toISOString()
    });
  }
}
