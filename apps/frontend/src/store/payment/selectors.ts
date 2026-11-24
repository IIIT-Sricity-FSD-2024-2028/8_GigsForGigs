/**
 * @file selectors.ts
 * @description Memoized and typed selectors for the Payment Redux domain.
 */

import type { RootState } from '../store';

const selectPaymentState = (state: RootState) => state.payment;

export const selectPayments = (state: RootState) => selectPaymentState(state).payments;
export const selectPaymentsRequest = (state: RootState) => selectPaymentState(state).paymentsRequest;
export const selectPaymentOverrideRequest = (state: RootState) => selectPaymentState(state).overrideRequest;
export const selectClientPayRequest = (state: RootState) => selectPaymentState(state).clientPayRequest;
export const selectClientReleaseRequest = (state: RootState) => selectPaymentState(state).clientReleaseRequest;

export const selectPaymentById = (state: RootState, paymentId: number | string) => {
  const numId = Number(String(paymentId).replace(/\D/g, ''));
  return selectPaymentState(state).payments.find((p) => p.paymentId === numId || p.id === String(paymentId)) ?? null;
};
