/**
 * @file payment.types.ts
 * @description Centralized type definitions and PaymentStatus enum for the GigsForGigs escrow payment engine.
 */

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  ESCROWED = 'ESCROWED',
  WORK_SUBMITTED = 'WORK_SUBMITTED',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  RELEASE_APPROVED = 'RELEASE_APPROVED',
  RELEASED = 'RELEASED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  FAILED = 'FAILED'
}

export interface PaymentRecord {
  paymentId: string;
  taskId: string;
  taskTitle: string;
  clientId: string;
  clientName: string;
  gigProfileId: string;
  gigProName: string;
  gigAmount: number;        // Agreed amount for Gig Professional's work (e.g. ₹5000)
  platformFee: number;      // Fee charged by platform (e.g. ₹100)
  totalAmount: number;      // Total paid by Client (gigAmount + platformFee = ₹5100)
  status: PaymentStatus;
  paymentProvider: string;
  transactionReference?: string;
  createdAt: string;
  escrowedAt?: string;
  releasedAt?: string;
  updatedAt: string;
  disputeReason?: string;
  auditLogs?: Array<{ action: string; timestamp: string; note: string }>;
}

export interface FinancialCalculationResult {
  gigAmount: number;
  platformFee: number;
  totalAmount: number;
}

export interface SuperAdminRevenueMetrics {
  totalPlatformRevenue: number;
  platformFeesCollected: number;
  platformFeesPendingRelease: number;
  totalEscrowFunds: number;
  totalGigPayouts: number;
  completedTransactionsCount: number;
  disputedPaymentsCount: number;
  refundedPaymentsCount: number;
}

