/**
 * @file payment.service.ts
 * @description Centralized Payment Service containing financial calculations, escrow state transitions, and dispute arbitration logic.
 */

import type { PaymentRecord, FinancialCalculationResult, SuperAdminRevenueMetrics } from './payment.types.js';
import { PaymentStatus } from './payment.types.js';

export class PaymentService {
  private static DEFAULT_PLATFORM_FEE = 100; // Standard ₹100 platform fee

  /**
   * Calculate financial totals on the server. Never trust amounts sent directly by the frontend.
   */
  public static calculateFinancials(gigAmount: number, overrideFee?: number): FinancialCalculationResult {
    const platformFee = typeof overrideFee === 'number' ? overrideFee : this.DEFAULT_PLATFORM_FEE;
    const totalAmount = gigAmount + platformFee;
    return {
      gigAmount,
      platformFee,
      totalAmount
    };
  }

  /**
   * Validate payment status transitions to prevent illegal state jumps.
   */
  public static validateStatusTransition(currentStatus: PaymentStatus, targetStatus: PaymentStatus): boolean {
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.PENDING]: [PaymentStatus.PAYMENT_PROCESSING, PaymentStatus.CANCELLED, PaymentStatus.ESCROWED],
      [PaymentStatus.PAYMENT_PROCESSING]: [PaymentStatus.ESCROWED, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
      [PaymentStatus.ESCROWED]: [PaymentStatus.WORK_SUBMITTED, PaymentStatus.AWAITING_APPROVAL, PaymentStatus.DISPUTED, PaymentStatus.CANCELLED],
      [PaymentStatus.WORK_SUBMITTED]: [PaymentStatus.AWAITING_APPROVAL, PaymentStatus.RELEASE_APPROVED, PaymentStatus.DISPUTED],
      [PaymentStatus.AWAITING_APPROVAL]: [PaymentStatus.RELEASE_APPROVED, PaymentStatus.RELEASED, PaymentStatus.COMPLETED, PaymentStatus.DISPUTED],
      [PaymentStatus.RELEASE_APPROVED]: [PaymentStatus.RELEASED, PaymentStatus.COMPLETED],
      [PaymentStatus.RELEASED]: [PaymentStatus.COMPLETED],
      [PaymentStatus.COMPLETED]: [],
      [PaymentStatus.CANCELLED]: [],
      [PaymentStatus.REFUNDED]: [],
      [PaymentStatus.DISPUTED]: [PaymentStatus.RELEASED, PaymentStatus.REFUNDED, PaymentStatus.COMPLETED],
      [PaymentStatus.FAILED]: [PaymentStatus.PENDING]
    };

    const allowed = validTransitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Compute platform-wide revenue and escrow metrics for Super Admin.
   */
  public static computeMetrics(records: PaymentRecord[]): SuperAdminRevenueMetrics {
    let totalPlatformRevenue = 0;
    let platformFeesCollected = 0;
    let platformFeesPendingRelease = 0;
    let totalEscrowFunds = 0;
    let totalGigPayouts = 0;
    let completedTransactionsCount = 0;
    let disputedPaymentsCount = 0;
    let refundedPaymentsCount = 0;

    for (const record of records) {
      if (record.status === PaymentStatus.COMPLETED || record.status === PaymentStatus.RELEASED) {
        totalPlatformRevenue += record.platformFee;
        platformFeesCollected += record.platformFee;
        totalGigPayouts += record.gigAmount;
        completedTransactionsCount += 1;
      } else if (record.status === PaymentStatus.ESCROWED || record.status === PaymentStatus.WORK_SUBMITTED || record.status === PaymentStatus.AWAITING_APPROVAL) {
        totalEscrowFunds += record.gigAmount;
        platformFeesPendingRelease += record.platformFee;
      } else if (record.status === PaymentStatus.DISPUTED) {
        totalEscrowFunds += record.gigAmount;
        disputedPaymentsCount += 1;
      } else if (record.status === PaymentStatus.REFUNDED) {
        refundedPaymentsCount += 1;
      }
    }

    return {
      totalPlatformRevenue,
      platformFeesCollected,
      platformFeesPendingRelease,
      totalEscrowFunds,
      totalGigPayouts,
      completedTransactionsCount,
      disputedPaymentsCount,
      refundedPaymentsCount
    };
  }
}
