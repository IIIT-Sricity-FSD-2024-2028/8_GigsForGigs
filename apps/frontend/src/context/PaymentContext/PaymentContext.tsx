/**
 * @file PaymentContext.tsx
 * @description Centralized React Context providing shared escrow payment state, status machine transitions, deliverable approval, and Super Admin revenue analytics across Client, Gig Professional, and Super Admin portals.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../AuthContext/AuthContext';

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
  taskTitle: string;
  clientId: string;
  clientName: string;
  gigProfileId: string;
  gigProName: string;
  gigAmount: number;        // Agreed task amount for Gig Pro (e.g. ₹5,000)
  platformFee: number;      // Platform service fee charged to Client (e.g. ₹100)
  totalAmount: number;      // Total paid by Client (gigAmount + platformFee = ₹5,100)
  status: EscrowPaymentStatus;
  paymentProvider: string;
  transactionReference?: string;
  createdAt: string;
  escrowedAt?: string;
  releasedAt?: string;
  updatedAt: string;
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
  metrics: SuperAdminPaymentMetrics;
}

const PaymentContextInstance = createContext<PaymentContextType | undefined>(undefined);

const INITIAL_MOCK_PAYMENTS: EscrowPayment[] = [
  {
    paymentId: 'PAY-1001',
    taskId: 'task-1',
    taskTitle: 'Brand Identity Redesign',
    clientId: 'cli-01',
    clientName: 'Aditya Deshmukh',
    gigProfileId: 'gig-01',
    gigProName: 'Elena Rodriguez',
    gigAmount: 5000,
    platformFee: 100,
    totalAmount: 5100,
    status: 'ESCROWED',
    paymentProvider: 'PLATFORM_ESCROW',
    transactionReference: 'TXN_ESCROW_8849',
    createdAt: '2026-08-20T10:00:00Z',
    escrowedAt: '2026-08-20T10:05:00Z',
    updatedAt: '2026-08-20T10:05:00Z',
    auditLogs: [{ action: 'ESCROW_LOCKED', timestamp: '2026-08-20T10:05:00Z', note: 'Client paid ₹5,100 (₹5,000 Gig + ₹100 Fee)' }]
  },
  {
    paymentId: 'PAY-1002',
    taskId: 'task-3',
    taskTitle: 'Mobile App Development',
    clientId: 'cli-01',
    clientName: 'Aditya Deshmukh',
    gigProfileId: 'gig-03',
    gigProName: 'Arham Kansal',
    gigAmount: 12000,
    platformFee: 100,
    totalAmount: 12100,
    status: 'WORK_SUBMITTED',
    paymentProvider: 'PLATFORM_ESCROW',
    transactionReference: 'TXN_ESCROW_9102',
    createdAt: '2026-08-21T14:30:00Z',
    escrowedAt: '2026-08-21T14:35:00Z',
    updatedAt: '2026-08-25T11:20:00Z',
    auditLogs: [{ action: 'WORK_SUBMITTED', timestamp: '2026-08-25T11:20:00Z', note: 'Deliverables submitted by Gig Professional' }]
  },
  {
    paymentId: 'PAY-1003',
    taskId: 'task-srv-2',
    taskTitle: 'Full Stack Dashboard & API',
    clientId: 'u6',
    clientName: 'Priya Sharma',
    gigProfileId: 'gig-01',
    gigProName: 'Vikram Joshi',
    gigAmount: 25000,
    platformFee: 100,
    totalAmount: 25100,
    status: 'COMPLETED',
    paymentProvider: 'RAZORPAY',
    transactionReference: 'TXN_RZP_448102',
    createdAt: '2026-08-10T09:00:00Z',
    escrowedAt: '2026-08-10T09:02:00Z',
    releasedAt: '2026-08-18T16:45:00Z',
    updatedAt: '2026-08-18T16:45:00Z',
    auditLogs: [
      { action: 'ESCROW_LOCKED', timestamp: '2026-08-10T09:02:00Z', note: '₹25,100 deposited to escrow' },
      { action: 'RELEASED', timestamp: '2026-08-18T16:45:00Z', note: '₹25,000 released to Vikram Joshi, ₹100 retained as Platform Revenue' }
    ]
  },
  {
    paymentId: 'PAY-1004',
    taskId: 'task-2',
    taskTitle: 'Q3 Marketing Strategy',
    clientId: 'u6',
    clientName: 'Priya Sharma',
    gigProfileId: 'gig-02',
    gigProName: 'Sarah Jenkins',
    gigAmount: 8500,
    platformFee: 100,
    totalAmount: 8600,
    status: 'DISPUTED',
    paymentProvider: 'STRIPE',
    transactionReference: 'TXN_ST_77192',
    createdAt: '2026-08-15T12:00:00Z',
    escrowedAt: '2026-08-15T12:05:00Z',
    updatedAt: '2026-08-24T15:10:00Z',
    disputeReason: 'Deliverable missing requested search advertising projections.',
    auditLogs: [{ action: 'DISPUTE_RAISED', timestamp: '2026-08-24T15:10:00Z', note: 'Client flagged deliverables for Super Admin review' }]
  }
];

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<EscrowPayment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gfg_escrow_payments');
      if (saved) {
        try { return JSON.parse(saved); } catch (_) {}
      }
    }
    return INITIAL_MOCK_PAYMENTS;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gfg_escrow_payments', JSON.stringify(payments));
    }
  }, [payments]);

  // Zero out payments for newly registered accounts
  useEffect(() => {
    if (user?.isNewAccount) {
      setPayments(prev => prev.filter(p => !p.paymentId.startsWith('PAY-NEW-')));
    }
  }, [user]);

  /**
   * Initiate a payment record for a task.
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
    const platformFee = 100;
    const totalAmount = gigAmount + platformFee;
    const paymentId = 'PAY-' + Math.floor(1000 + Math.random() * 9000);

    const newPayment: EscrowPayment = {
      paymentId,
      taskId,
      taskTitle,
      clientId: clientId || user?.userId || 'u1',
      clientName: clientName || user?.name || 'Aditya Deshmukh',
      gigProfileId,
      gigProName,
      gigAmount,
      platformFee,
      totalAmount,
      status: 'PENDING',
      paymentProvider: 'PLATFORM_ESCROW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [{ action: 'CREATED', timestamp: new Date().toISOString(), note: `Initiated payment total ₹${totalAmount}` }]
    };

    setPayments(prev => [newPayment, ...prev]);
    setLoading(false);
    return newPayment;
  };

  /**
   * Confirm Client payment & lock funds in escrow.
   */
  const confirmEscrowPayment = async (paymentId: string): Promise<boolean> => {
    setLoading(true);
    const now = new Date().toISOString();
    const txnRef = 'TXN_ESCROW_' + Math.floor(100000 + Math.random() * 900000);

    setPayments(prev =>
      prev.map(p => {
        if (p.paymentId === paymentId) {
          return {
            ...p,
            status: 'ESCROWED',
            transactionReference: txnRef,
            escrowedAt: now,
            updatedAt: now,
            auditLogs: [
              ...(p.auditLogs || []),
              { action: 'ESCROW_LOCKED', timestamp: now, note: `Client paid ₹${p.totalAmount}. ₹${p.gigAmount} locked in escrow, ₹${p.platformFee} reserved as platform fee.` }
            ]
          };
        }
        return p;
      })
    );
    setLoading(false);
    return true;
  };

  /**
   * Gig Professional submits work -> updates payment status to WORK_SUBMITTED / AWAITING_APPROVAL.
   */
  const submitWorkDeliverable = async (taskId: string): Promise<boolean> => {
    const now = new Date().toISOString();
    setPayments(prev =>
      prev.map(p => {
        if (p.taskId === taskId && (p.status === 'ESCROWED' || p.status === 'PENDING')) {
          return {
            ...p,
            status: 'WORK_SUBMITTED',
            updatedAt: now,
            auditLogs: [
              ...(p.auditLogs || []),
              { action: 'WORK_SUBMITTED', timestamp: now, note: 'Gig Professional submitted work deliverables for Client review.' }
            ]
          };
        }
        return p;
      })
    );
    return true;
  };

  /**
   * Client approves work -> releases gigAmount (₹5000) to Gig Pro, retains platformFee (₹100) as Platform Revenue.
   */
  const approveAndReleasePayment = async (paymentId: string, clientNotes?: string): Promise<boolean> => {
    setLoading(true);
    const now = new Date().toISOString();
    setPayments(prev =>
      prev.map(p => {
        if (p.paymentId === paymentId) {
          return {
            ...p,
            status: 'COMPLETED',
            releasedAt: now,
            updatedAt: now,
            auditLogs: [
              ...(p.auditLogs || []),
              { action: 'RELEASED', timestamp: now, note: `Client approved work. ₹${p.gigAmount} released to ${p.gigProName}. ₹${p.platformFee} retained as Platform Revenue. ${clientNotes || ''}` }
            ]
          };
        }
        return p;
      })
    );
    setLoading(false);
    return true;
  };

  /**
   * Client or Gig Pro raises a dispute.
   */
  const raiseDispute = async (paymentId: string, reason: string): Promise<boolean> => {
    const now = new Date().toISOString();
    setPayments(prev =>
      prev.map(p => {
        if (p.paymentId === paymentId) {
          return {
            ...p,
            status: 'DISPUTED',
            disputeReason: reason,
            updatedAt: now,
            auditLogs: [
              ...(p.auditLogs || []),
              { action: 'DISPUTED', timestamp: now, note: `Dispute raised: ${reason}` }
            ]
          };
        }
        return p;
      })
    );
    return true;
  };

  /**
   * Super Admin arbitration override (Release vs. Refund).
   */
  const adminResolveDispute = async (paymentId: string, action: 'RELEASE' | 'REFUND', auditReason: string): Promise<boolean> => {
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
            updatedAt: now,
            auditLogs: [
              ...(p.auditLogs || []),
              { action: `ADMIN_${action}`, timestamp: now, note: `Super Admin decision: ${auditReason}` }
            ]
          };
        }
        return p;
      })
    );
    setLoading(false);
    return true;
  };

  const getPaymentsByClient = (clientId: string) => {
    return payments.filter(p => p.clientId === clientId || p.clientName.toLowerCase().includes(user?.name?.toLowerCase() || 'aditya'));
  };

  const getPaymentsByGigPro = (gigProfileId: string) => {
    return payments.filter(p => p.gigProfileId === gigProfileId || p.gigProName.toLowerCase().includes(user?.name?.toLowerCase() || 'elena'));
  };

  const getPaymentByTask = (taskId: string) => {
    return payments.find(p => p.taskId === taskId);
  };

  // Compute live Super Admin financial & escrow revenue metrics
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

