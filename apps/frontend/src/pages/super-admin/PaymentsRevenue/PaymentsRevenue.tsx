<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> origin/main
import { KPICard } from '../../../components/super-admin/KPICard';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { PaymentIcon } from '../../../components/super-admin/Icons';
<<<<<<< HEAD
import { adminApi } from '../../../services/api/super-admin/adminApi';
import { ApiError } from '../../../services/api/httpClient';
import type { AdminPayment, PaymentStatus } from '../../../types/super-admin';

/**
 * @file PaymentsRevenue.tsx
 * @description
 * Financial ledger backed by real `/api/admin/payments` data.
 *
 * The real `Payment` model has a flat pending/completed/failed status — there
 * is no escrow concept anywhere in the schema (no HELD_IN_ESCROW/RELEASED/
 * REFUNDED/DISPUTED states, no platformRake/netPayout split, no escrow-held
 * or disbursed-to-freelancers aggregates). The "Escrow Held"/"Disbursed"/
 * "Commission Rake"/"Dispute Refunds" KPI tiles and the release/refund
 * override modal have been dropped rather than faked; what's real here is
 * the payment ledger itself plus a status edit (pending/completed/failed).
 */

export const PaymentsRevenue: React.FC = () => {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const completed = payments.filter((p) => p.status === 'completed');
    const pending = payments.filter((p) => p.status === 'pending');
    const failed = payments.filter((p) => p.status === 'failed');
    const sum = (list: AdminPayment[]) => list.reduce((acc, p) => acc + Number(p.amount), 0);
    return {
      completedTotal: sum(completed),
      pendingTotal: sum(pending),
      failedTotal: sum(failed)
    };
  }, [payments]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.listPayments();
        if (!cancelled) setPayments(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load payments.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdateStatus = async (payment: AdminPayment, status: PaymentStatus) => {
    setActionError(null);
    try {
      const updated = await adminApi.updatePayment(payment.paymentId, { status });
      setPayments((prev) => prev.map((p) => (p.paymentId === updated.paymentId ? { ...p, ...updated } : p)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update payment.');
    }
  };

  const columns: ColumnDef<AdminPayment>[] = [
=======
import { useToast } from '../../../components/super-admin/Toast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface PaymentLedgerItem {
  id: string;
  taskId: string;
  taskTitle: string;
  clientName: string;
  gigProName: string;
  grossAmount: number;
  platformRake: number;
  netPayout: number;
  escrowStatus: 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  createdAt: string;
}

export const PaymentsRevenue: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState<PaymentLedgerItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentLedgerItem | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideAction, setOverrideAction] = useState<'RELEASE' | 'REFUND'>('RELEASE');
  const [auditReason, setAuditReason] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadPayments() {
      const data = await adminApi.getPayments();
      if (isMounted) {
        setPayments(data);
      }
    }
    loadPayments();
    return () => { isMounted = false; };
  }, []);

  const totalGross = payments.reduce((sum, p) => sum + p.grossAmount, 0);
  const totalRake = payments.reduce((sum, p) => sum + p.platformRake, 0);
  const totalInEscrow = payments
    .filter((p) => p.escrowStatus === 'HELD_IN_ESCROW')
    .reduce((sum, p) => sum + p.grossAmount, 0);

  const handleOpenOverride = (payment: PaymentLedgerItem, action: 'RELEASE' | 'REFUND') => {
    setSelectedPayment(payment);
    setOverrideAction(action);
    setAuditReason('');
    setIsOverrideModalOpen(true);
  };

  const handleExecuteOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !auditReason.trim()) return;

    await adminApi.overrideEscrow(selectedPayment.id, overrideAction, auditReason);
    const newStatus = overrideAction === 'RELEASE' ? 'RELEASED' : 'REFUNDED';
    const updated = payments.map((p) =>
      p.id === selectedPayment.id ? { ...p, escrowStatus: newStatus as any } : p
    );
    setPayments(updated);
    setIsOverrideModalOpen(false);
    toast.success(
      `Escrow ${overrideAction === 'RELEASE' ? 'Released' : 'Refunded'}`,
      `Successfully updated ${selectedPayment.id} ($${selectedPayment.grossAmount.toLocaleString()})`
    );
  };

  const columns: ColumnDef<PaymentLedgerItem>[] = [
>>>>>>> origin/main
    {
      header: 'Task',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.task.title}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>#{row.paymentId}</span>
        </div>
      )
    },
    {
      header: 'Amount',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>${Number(row.amount).toLocaleString()}</span>
    },
    {
<<<<<<< HEAD
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Created',
      cell: (row) => new Date(row.createdAt).toLocaleDateString()
=======
      header: 'Gross Amount',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>${row.grossAmount.toLocaleString()}</span>
    },
    {
      header: 'Platform Rake',
      cell: (row) => <span style={{ fontWeight: 600, color: 'var(--color-success-text)' }}>+${row.platformRake.toLocaleString()}</span>
    },
    {
      header: 'Net Payout',
      cell: (row) => <span style={{ color: 'var(--color-text-muted)' }}>${row.netPayout.toLocaleString()}</span>
    },
    {
      header: 'Escrow Status',
      cell: (row) => <StatusBadge status={row.escrowStatus} />
>>>>>>> origin/main
    },
    {
      header: 'Actions',
      cell: (row) => (
<<<<<<< HEAD
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          {row.status !== 'completed' && (
            <button
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(row, 'completed');
              }}
            >
              Mark Completed
            </button>
          )}
          {row.status !== 'failed' && (
            <button
              className="admin-btn admin-btn-outline admin-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(row, 'failed');
              }}
            >
              Mark Failed
            </button>
=======
        <div style={{ display: 'flex', gap: '6px' }}>
          {row.escrowStatus === 'HELD_IN_ESCROW' && (
            hasPermission('payments:release') ? (
              <>
                <button
                  onClick={() => handleOpenOverride(row, 'RELEASE')}
                  className="admin-btn admin-btn-primary"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Force Release
                </button>
                <button
                  onClick={() => handleOpenOverride(row, 'REFUND')}
                  className="admin-btn admin-btn-danger"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Force Refund
                </button>
              </>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Read Only (Auditor)</span>
            )
>>>>>>> origin/main
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>Loading payments…</div>;
  }

  if (error) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
<<<<<<< HEAD
      {actionError && (
        <div className="admin-badge badge-danger" style={{ width: '100%', padding: '8px 12px' }}>
          {actionError}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}
      >
        <KPICard
          title="Completed Payments"
          value={`$${totals.completedTotal.toLocaleString()}`}
          subtitle="Sum of completed transactions"
          accentColor="var(--color-secondary)"
          icon={<PaymentIcon size={20} />}
        />
        <KPICard
          title="Pending Payments"
          value={`$${totals.pendingTotal.toLocaleString()}`}
          subtitle="Awaiting settlement"
          accentColor="var(--color-primary-blue)"
          icon={<PaymentIcon size={20} />}
        />
        <KPICard
          title="Failed Payments"
          value={`$${totals.failedTotal.toLocaleString()}`}
          subtitle="Did not settle"
          accentColor="var(--color-danger-text)"
=======
      {/* Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Total Gross Transacted"
          value={`$${totalGross.toLocaleString()}`}
          deltaText="100% Verified Ledger"
          isPositive={true}
          subtitle="Cumulative platform volume"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Retained Platform Take"
          value={`$${totalRake.toLocaleString()}`}
          deltaText="10.0% Avg Rake"
          isPositive={true}
          subtitle="Net platform fee earnings"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Total Escrow Held"
          value={`$${totalInEscrow.toLocaleString()}`}
          deltaText="Active Contracts"
          isPositive={true}
          subtitle="Protected funds in escrow"
>>>>>>> origin/main
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-secondary)"
        />
      </div>

<<<<<<< HEAD
      <DataTable
        title="Marketplace Payment Ledger"
        columns={columns}
        data={payments}
        pageSize={6}
        searchPlaceholder="Search by task title..."
      />
=======
      {/* Ledger Table */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <DataTable
          data={payments}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Search financial ledger by task, client, or ID..."
        />
      </div>

      {/* Escrow Override Modal */}
      <ActionModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title={`Escrow Override: ${overrideAction === 'RELEASE' ? 'Release to Freelancer' : 'Refund to Client'}`}
      >
        {selectedPayment && (
          <form onSubmit={handleExecuteOverride} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
              <div><strong>Task:</strong> {selectedPayment.taskTitle}</div>
              <div><strong>Transaction ID:</strong> {selectedPayment.id}</div>
              <div><strong>Amount:</strong> ${selectedPayment.grossAmount.toLocaleString()}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
                Administrative Override Reason (Logged in SOC-2 Audit Trail)
              </label>
              <textarea
                className="admin-textarea"
                rows={3}
                required
                placeholder="State the reason for manual escrow balance override..."
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`admin-btn ${overrideAction === 'RELEASE' ? 'admin-btn-primary' : 'admin-btn-danger'}`}
              >
                Confirm {overrideAction === 'RELEASE' ? 'Escrow Release' : 'Escrow Refund'}
              </button>
            </div>
          </form>
        )}
      </ActionModal>
>>>>>>> origin/main
    </div>
  );
};

export default PaymentsRevenue;
