import React, { useEffect, useMemo, useState } from 'react';
import { KPICard } from '../../../components/super-admin/KPICard';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { PaymentIcon } from '../../../components/super-admin/Icons';
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
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Created',
      cell: (row) => new Date(row.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
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
          icon={<PaymentIcon size={20} />}
        />
      </div>

      <DataTable
        title="Marketplace Payment Ledger"
        columns={columns}
        data={payments}
        pageSize={6}
        searchPlaceholder="Search by task title..."
      />
    </div>
  );
};

export default PaymentsRevenue;
