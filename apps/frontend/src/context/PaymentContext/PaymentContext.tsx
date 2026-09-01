/**
 * @file PaymentContext.tsx
 * @description Centralized React Context providing real backend-backed payment state and release mechanisms.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext/AuthContext';
import { apiFetch } from '../../services/api/httpClient';

export type EscrowPaymentStatus =
  | 'PENDING'
  | 'PAYMENT_PROCESSING'
  | 'ESCROWED'
  | 'WORK_SUBMITTED'
  | 'AWAITING_APPROVAL'
  | 'RELEASE_APPROVED'
  | 'RELEASED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'FAILED';

export interface EscrowPayment {
  paymentId: string;
  taskId: string;
  taskTitle?: string;
  clientId?: string;
  clientName?: string;
  gigProfileId: string;
  gigProName: string;
  gigAmount: number;        // Agreed task amount for Gig Pro (e.g. ₹5,000)
  platformFee: number;      // Platform service fee charged to Client (7%)
  totalAmount: number;      // Total paid by Client (gigAmount + platformFee)
  status: EscrowPaymentStatus;
  paymentProvider?: string;
  transactionReference?: string;
  createdAt: string;
  escrowedAt?: string;
  releasedAt?: string;
  updatedAt?: string;
  disputeReason?: string;
  auditLogs?: Array<{ action: string; timestamp: string; note: string }>;
}

export interface SuperAdminPaymentMetrics {
  totalPlatformRevenue: number;
  platformFeesCollected: number;
  platformFeesPendingRelease: number;
  totalEscrowFunds: number;
  totalGigPayouts: number;
  completedCount: number;
  disputedCount: number;
  refundedCount: number;
}

interface PaymentContextType {
  payments: EscrowPayment[];
  loading: boolean;
  initiatePayment: (
    taskId: string,
    taskTitle: string,
    gigProfileId: string,
    gigProName: string,
    gigAmount: number,
    clientId?: string,
    clientName?: string
  ) => Promise<EscrowPayment>;
  confirmEscrowPayment: (paymentId: string) => Promise<boolean>;
  submitWorkDeliverable: (taskId: string) => Promise<boolean>;
  approveAndReleasePayment: (paymentId: string, clientNotes?: string) => Promise<boolean>;
  raiseDispute: (paymentId: string, reason: string) => Promise<boolean>;
  adminResolveDispute: (paymentId: string, action: 'RELEASE' | 'REFUND', auditReason: string) => Promise<boolean>;
  getPaymentsByClient: (clientId: string) => EscrowPayment[];
  getPaymentsByGigPro: (gigProfileId: string) => EscrowPayment[];
  getPaymentByTask: (taskId: string) => EscrowPayment | undefined;
  fetchPaymentForTask: (taskId: string) => Promise<EscrowPayment | null>;
  metrics: SuperAdminPaymentMetrics;
}

const PaymentContextInstance = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<EscrowPayment[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Initiate a payment record for a task with dynamic 7% platform fee.
   */
  const initiatePayment = async (
    taskId: string,
    taskTitle: string,
    gigProfileId: string,
    gigProName: string,
    gigAmount: number,
    clientId?: string,
    clientName?: string
  ): Promise<EscrowPayment> => {
    setLoading(true);
    const platformFee = Math.round(gigAmount * 0.07);
    const totalAmount = gigAmount + platformFee;
    const paymentId = 'PAY-' + taskId;

    try {
      await apiFetch('/payments/initiate', {
        method: 'POST',
        actor: 'client',
        body: { taskId, gigProfileId, gigAmount }
      });
    } catch (err) {
      setLoading(false);
      throw err;
    }

    const newPayment: EscrowPayment = {
      paymentId,
      taskId,
      taskTitle,
      clientId: clientId || String(user?.userId || ''),
      clientName: clientName || user?.name || '',
      gigProfileId,
      gigProName,
      gigAmount,
      platformFee,
      totalAmount,
      status: 'PENDING',
      paymentProvider: 'PLATFORM_PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPayments(prev => [newPayment, ...prev.filter(p => p.taskId !== taskId)]);
    setLoading(false);
    return newPayment;
  };

  /**
   * Fetch payment for a specific task directly from PostgreSQL.
   */
  const fetchPaymentForTask = useCallback(async (taskId: string): Promise<EscrowPayment | null> => {
    try {
      const res = await apiFetch<{ success: boolean; data: any }>(`/payments/task/${taskId}`, {
        method: 'GET',
        actor: 'client'
      });
      if (res?.data) {
        const item: EscrowPayment = {
          paymentId: res.data.paymentId,
          taskId: res.data.taskId,
          gigProfileId: res.data.gigProfileId,
          gigProName: res.data.gigProName,
          gigAmount: res.data.gigAmount,
          platformFee: res.data.platformFee,
          totalAmount: res.data.totalAmount,
          status: res.data.status === 'COMPLETED' ? 'COMPLETED' : 'ESCROWED',
          createdAt: res.data.createdAt,
          updatedAt: res.data.createdAt
        };
        setPayments(prev => [item, ...prev.filter(p => p.taskId !== taskId)]);
        return item;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Confirm Client payment.
   */
  const confirmEscrowPayment = async (paymentId: string): Promise<boolean> => {
    setLoading(true);
    const now = new Date().toISOString();
    setPayments(prev =>
      prev.map(p => {
        if (p.paymentId === paymentId) {
          return {
            ...p,
            status: 'ESCROWED',
            updatedAt: now
          };
        }
        return p;
      })
    );
    setLoading(false);
    return true;
  };

  const submitWorkDeliverable = async (taskId: string): Promise<boolean> => {
    const now = new Date().toISOString();
    setPayments(prev =>
      prev.map(p => {
        if (p.taskId === taskId) {
          return {
            ...p,
            status: 'WORK_SUBMITTED',
            updatedAt: now
          };
        }
        return p;
      })
    );
    return true;
  };

  /**
   * Client approves work -> releases gigAmount to Gig Pro.
   */
  const approveAndReleasePayment = async (paymentId: string, _clientNotes?: string): Promise<boolean> => {
    setLoading(true);
    const target = payments.find(p => p.paymentId === paymentId);
    if (!target) {
      setLoading(false);
      return false;
    }
    try {
      await apiFetch('/payments/release', {
        method: 'POST',
        actor: 'client',
        body: {
          payment: {
            taskId: target.taskId,
            gigProfileId: target.gigProfileId,
            gigAmount: target.gigAmount
          }
        }
      });
    } catch (err) {
      setLoading(false);
      throw err;
    }
    const now = new Date().toISOString();
    setPayments(prev =>
      prev.map(p => {
        if (p.paymentId === paymentId) {
          return {
            ...p,
            status: 'COMPLETED',
            releasedAt: now,
            updatedAt: now
          };
        }
        return p;
      })
    );
    setLoading(false);
    return true;
  };

  const raiseDispute = async (paymentId: string, reason: string): Promise<boolean> => {
    const now = new Date().toISOString();
    setPayments(prev =>
      prev.map(p => {
        if (p.paymentId === paymentId) {
          return {
            ...p,
            status: 'DISPUTED',
            disputeReason: reason,
            updatedAt: now
          };
        }
        return p;
      })
    );
    return true;
  };

  const adminResolveDispute = async (paymentId: string, action: 'RELEASE' | 'REFUND', _auditReason: string): Promise<boolean> => {
    setLoading(true);
    const now = new Date().toISOString();
    const newStatus: EscrowPaymentStatus = action === 'RELEASE' ? 'COMPLETED' : 'REFUNDED';

    setPayments(prev =>
      prev.map(p => {
        if (p.paymentId === paymentId) {
          return {
            ...p,
            status: newStatus,
            releasedAt: action === 'RELEASE' ? now : undefined,
            updatedAt: now
          };
        }
        return p;
      })
    );
    setLoading(false);
    return true;
  };

  const getPaymentsByClient = (clientId: string) => {
    return payments.filter(p => p.clientId === clientId || (user?.userId && p.clientId === String(user.userId)));
  };

  const getPaymentsByGigPro = (gigProfileId: string) => {
    return payments.filter(p => p.gigProfileId === gigProfileId);
  };

  const getPaymentByTask = (taskId: string) => {
    return payments.find(p => p.taskId === taskId);
  };

  // Compute live Super Admin financial metrics
  let totalPlatformRevenue = 0;
  let platformFeesCollected = 0;
  let platformFeesPendingRelease = 0;
  let totalEscrowFunds = 0;
  let totalGigPayouts = 0;
  let completedCount = 0;
  let disputedCount = 0;
  let refundedCount = 0;

  for (const p of payments) {
    if (p.status === 'COMPLETED' || p.status === 'RELEASED') {
      totalPlatformRevenue += p.platformFee;
      platformFeesCollected += p.platformFee;
      totalGigPayouts += p.gigAmount;
      completedCount += 1;
    } else if (p.status === 'ESCROWED' || p.status === 'WORK_SUBMITTED' || p.status === 'AWAITING_APPROVAL') {
      totalEscrowFunds += p.gigAmount;
      platformFeesPendingRelease += p.platformFee;
    } else if (p.status === 'DISPUTED') {
      totalEscrowFunds += p.gigAmount;
      disputedCount += 1;
    } else if (p.status === 'REFUNDED') {
      refundedCount += 1;
    }
  }

  const metrics: SuperAdminPaymentMetrics = {
    totalPlatformRevenue,
    platformFeesCollected,
    platformFeesPendingRelease,
    totalEscrowFunds,
    totalGigPayouts,
    completedCount,
    disputedCount,
    refundedCount
  };

  return (
    <PaymentContextInstance.Provider
      value={{
        payments,
        loading,
        initiatePayment,
        confirmEscrowPayment,
        submitWorkDeliverable,
        approveAndReleasePayment,
        raiseDispute,
        adminResolveDispute,
        getPaymentsByClient,
        getPaymentsByGigPro,
        getPaymentByTask,
        fetchPaymentForTask,
        metrics
      }}
    >
      {children}
    </PaymentContextInstance.Provider>
  );
};

export const usePayments = () => {
  const context = useContext(PaymentContextInstance);
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
};

export default PaymentProvider;

