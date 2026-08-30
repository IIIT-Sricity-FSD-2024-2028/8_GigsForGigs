/**
 * @file payment.dto.ts
 * @description Data Transfer Objects for initiating, confirming, releasing, refunding, and arbitrating escrow payments.
 */

import { PaymentStatus } from './payment.types';

export interface CreatePaymentDto {
  taskId: string;
  gigProfileId: string;
  gigAmount: number;
  platformFee?: number;
}

export interface InitiatePaymentDto {
  paymentId: string;
  paymentProvider?: string;
}

export interface ConfirmPaymentDto {
  paymentId: string;
  transactionReference: string;
}

export interface ReleasePaymentDto {
  paymentId: string;
  clientNotes?: string;
}

export interface RefundPaymentDto {
  paymentId: string;
  refundReason: string;
}

export interface ResolveDisputeDto {
  paymentId: string;
  action: 'RELEASE_TO_GIG' | 'REFUND_CLIENT' | 'SPLIT';
  auditReason: string;
}

