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

  /**
   * Client endpoint: Fetch all payments for tasks owned by the authenticated client.
   */
  public static async getClientPayments(clientId: number) {
    const payments = await PaymentService.getClientPayments(clientId);
    const records = payments.map((payment) => {
      const financials = PaymentService.calculateFinancials(Number(payment.amount));
      
      let status = 'PENDING';
      const rawStatus = String(payment.status || '').toLowerCase();
      if (payment.taskStatus === 'completed' || rawStatus === 'completed') {
        status = 'COMPLETED';
      } else if (rawStatus === 'held' || rawStatus === 'escrowed') {
        status = 'ESCROWED';
      } else if (rawStatus === 'failed') {
        status = 'FAILED';
      } else if (rawStatus === 'refunded') {
        status = 'REFUNDED';
      } else if (rawStatus === 'work_submitted' || rawStatus === 'awaiting_approval') {
        status = 'AWAITING_APPROVAL';
      } else if (rawStatus) {
        status = rawStatus.toUpperCase();
      }

      const pIdStr = String(payment.paymentId);
      const formattedPaymentId = pIdStr.startsWith('PAY-') ? pIdStr : 'PAY-' + pIdStr;

      let createdAtStr = new Date().toISOString();
      if (payment.createdAt instanceof Date) {
        createdAtStr = payment.createdAt.toISOString();
      } else if (payment.createdAt) {
        createdAtStr = new Date(payment.createdAt).toISOString();
      }

      return {
        paymentId: formattedPaymentId,
        taskId: String(payment.taskId),
        taskTitle: payment.taskTitle || payment.task?.title || `Task #${payment.taskId}`,
        taskStatus: payment.taskStatus || payment.task?.status || 'in_progress',
        gigProfileId: payment.gigProfileId ? String(payment.gigProfileId) : null,
        gigProName: payment.gigProName || payment.gigProfile?.user?.name || 'Gig Professional',
        gigAmount: financials.gigAmount,
        platformFee: financials.platformFee,
        totalAmount: financials.totalAmount,
        status,
        createdAt: createdAtStr,
      };
    });
    return this.formatResponse(true, 'Client payments retrieved successfully', records);
  }
}

