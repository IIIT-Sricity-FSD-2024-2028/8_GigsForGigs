/**
 * @file paymentSlice.ts
 * @description Redux slice for Payments & Escrow, mapped 1:1 onto `paymentApi`.
 *
 * Evaluation Rules:
 * - 1:1 mapping with repository (paymentApi <-> paymentSlice).
 * - Full CRUD capability over escrow lifecycle (Create: pay, Read: fetch, Update: override, Delete/Close: release).
 * - State updates strictly after confirmed backend/DB response in `fulfilled`.
 * - Zero direct apiFetch/paymentApi calls in UI components.
 */

import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  paymentApi,
  type EscrowPayment,
  type OverridePaymentResult,
} from '../../services/api/payment/paymentApi';
import type { PaymentState, RequestState } from './types';
import { clearSession } from '../auth/authSlice';

const idle: RequestState = { status: 'idle', error: null };

export const initialPaymentState: PaymentState = {
  payments: [],
  paymentsRequest: idle,
  overrideRequest: idle,
  clientPayRequest: idle,
  clientReleaseRequest: idle,
};

type ThunkConfig = { rejectValue: string; state: { payment: PaymentState } };

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const dateOnly = (iso?: string | null) =>
  (iso ? String(iso) : new Date().toISOString()).split('T')[0];

interface SettledDisputePayload {
  disputeId: string;
  taskId?: string;
  settlementType: string;
  outcome?: {
    refundToClient: number;
    payoutToPro: number;
    platformFee: number;
  };
}

// ============================================================================
// ASYNC THUNKS (Full CRUD Operations)
// ============================================================================

/**
 * READ: Fetch all platform payments and escrow entries (Admin Ledger).
 */
export const fetchPayments = createAsyncThunk<EscrowPayment[], void, ThunkConfig>(
  'payment/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      return await paymentApi.getPayments();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to fetch transaction ledger.'));
    }
  },
);

/**
 * CREATE: Client funds task escrow after accepting hire.
 */
export const payEscrowTask = createAsyncThunk<
  { taskId: number; gigProfileId: number },
  { taskId: number; gigProfileId: number },
  ThunkConfig
>('payment/payEscrowTask', async ({ taskId, gigProfileId }, { rejectWithValue }) => {
  try {
    await paymentApi.payTask(taskId, gigProfileId);
    return { taskId, gigProfileId };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Payment checkout failed.'));
  }
});

/**
 * DELETE / CLOSE: Client releases escrow to gig worker after deliverable approval.
 */
export const releaseEscrowPayment = createAsyncThunk<
  { taskId: number; gigProfileId: number },
  { taskId: number; gigProfileId: number },
  ThunkConfig
>('payment/releaseEscrowPayment', async ({ taskId, gigProfileId }, { rejectWithValue }) => {
  try {
    await paymentApi.releasePayment(taskId, gigProfileId);
    return { taskId, gigProfileId };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Escrow release failed.'));
  }
});

/**
 * UPDATE: Super Admin overrides escrow (RELEASE or REFUND) with audit trail.
 */
export const overrideEscrowPayment = createAsyncThunk<
  {
    paymentId: string | number;
    action: 'RELEASE' | 'REFUND';
    auditReason: string;
    updatedPayment: OverridePaymentResult;
  },
  { paymentId: string | number; action: 'RELEASE' | 'REFUND'; auditReason: string },
  ThunkConfig
>('payment/overrideEscrowPayment', async ({ paymentId, action, auditReason }, { rejectWithValue }) => {
  try {
    const res = await paymentApi.overridePayment(paymentId, action, auditReason);
    return { paymentId, action, auditReason, updatedPayment: res };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Escrow override failed.'));
  }
});

// ============================================================================
// SLICE DEFINITION
// ============================================================================

export const paymentSlice = createSlice({
  name: 'payment',
  initialState: initialPaymentState,
  reducers: {
    clearPaymentErrors(state) {
      state.paymentsRequest.error = null;
      state.overrideRequest.error = null;
      state.clientPayRequest.error = null;
      state.clientReleaseRequest.error = null;
    },
  },
  extraReducers: (builder) => {
    // Session reset
    builder.addCase(clearSession, () => initialPaymentState);

    // fetchPayments (READ)
    builder
      .addCase(fetchPayments.pending, (state, action) => {
        state.paymentsRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        if (state.paymentsRequest.requestId === action.meta.requestId) {
          state.paymentsRequest = { status: 'succeeded', error: null };
          state.payments = action.payload;
        }
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        if (state.paymentsRequest.requestId === action.meta.requestId) {
          state.paymentsRequest = { status: 'failed', error: action.payload || 'Failed to load payments.' };
        }
      });

    // payEscrowTask (CREATE)
    builder
      .addCase(payEscrowTask.pending, (state, action) => {
        state.clientPayRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(payEscrowTask.fulfilled, (state, action) => {
        if (state.clientPayRequest.requestId === action.meta.requestId) {
          state.clientPayRequest = { status: 'succeeded', error: null };
        }
      })
      .addCase(payEscrowTask.rejected, (state, action) => {
        if (state.clientPayRequest.requestId === action.meta.requestId) {
          state.clientPayRequest = { status: 'failed', error: action.payload || 'Payment failed.' };
        }
      });

    // releaseEscrowPayment (DELETE / CLOSE)
    builder
      .addCase(releaseEscrowPayment.pending, (state, action) => {
        state.clientReleaseRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(releaseEscrowPayment.fulfilled, (state, action) => {
        if (state.clientReleaseRequest.requestId === action.meta.requestId) {
          state.clientReleaseRequest = { status: 'succeeded', error: null };
        }
      })
      .addCase(releaseEscrowPayment.rejected, (state, action) => {
        if (state.clientReleaseRequest.requestId === action.meta.requestId) {
          state.clientReleaseRequest = { status: 'failed', error: action.payload || 'Escrow release failed.' };
        }
      });

    // overrideEscrowPayment (UPDATE)
    builder
      .addCase(overrideEscrowPayment.pending, (state, action) => {
        state.overrideRequest = { status: 'loading', error: null, requestId: action.meta.requestId };
      })
      .addCase(overrideEscrowPayment.fulfilled, (state, action) => {
        if (state.overrideRequest.requestId === action.meta.requestId) {
          state.overrideRequest = { status: 'succeeded', error: null };
          const { paymentId, action: overrideAction, updatedPayment } = action.payload;
          const numId = Number(String(paymentId).replace(/\D/g, ''));
          const target = state.payments.find((p) => p.paymentId === numId || p.id === String(paymentId));
          if (target) {
            target.status = overrideAction === 'RELEASE' ? 'RELEASED' : 'REFUNDED';
            target.settledAt = dateOnly(updatedPayment?.settledAt);
          }
        }
      })
      .addCase(overrideEscrowPayment.rejected, (state, action) => {
        if (state.overrideRequest.requestId === action.meta.requestId) {
          state.overrideRequest = { status: 'failed', error: action.payload || 'Override failed.' };
        }
      });

    // Cross-slice sync: reflect arbitration settlement rulings in cached admin ledger immediately
    builder.addMatcher(
      (action): action is PayloadAction<SettledDisputePayload> => action.type === 'admin/settleDispute/fulfilled',
      (state, action) => {
        const { taskId, settlementType, outcome } = action.payload || {};
        if (!taskId) return;
        const target = state.payments.find((p) => p.taskId === taskId && p.status === 'HELD_IN_ESCROW');
        if (target) {
          target.status = settlementType === 'FULL_REFUND' ? 'REFUNDED' : 'RELEASED';
          target.settledAt = dateOnly();
          if (settlementType === 'SPLIT' && outcome) {
            target.amount = outcome.payoutToPro;
            target.platformFee = outcome.platformFee;
            target.totalAmount = outcome.payoutToPro + outcome.platformFee;
          }
        }
      },
    );
  },
});

export const { clearPaymentErrors } = paymentSlice.actions;

export default paymentSlice.reducer;
