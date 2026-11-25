import React, { useState, useEffect, useMemo } from 'react';
import { Loader } from '../../../components/common/Loader';
import { KPICard } from '../../../components/super-admin/KPICard';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { PaymentIcon } from '../../../components/super-admin/Icons';
import { useToast } from '../../../components/super-admin/useToast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPayments, overrideEscrowPayment } from '../../../store/payment/paymentSlice';
import { selectPayments, selectPaymentsRequest, selectPaymentOverrideRequest } from '../../../store/payment/selectors';
import { fetchKPIs, fetchAuditLogs } from '../../../store/admin/adminSlice';
import type { EscrowPayment } from '../../../services/api/payment/paymentApi';
import { formatCurrency } from '../../../utils/format';
import { extractErrorMessage } from '../../../utils/adminAccess';

export type { EscrowPayment };

const STATUS_FILTERS: Array<'ALL' | EscrowPayment['status']> = [
  'ALL',
  'AWAITING_FUNDING',
  'HELD_IN_ESCROW',
  'RELEASED',
  'REFUNDED',
  'FAILED',
];

export const PaymentsRevenue: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const payments = useAppSelector(selectPayments);
  const paymentsRequest = useAppSelector(selectPaymentsRequest);
  const overrideRequest = useAppSelector(selectPaymentOverrideRequest);
  const overriding = overrideRequest.status === 'loading';

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<EscrowPayment | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideAction, setOverrideAction] = useState<'RELEASE' | 'REFUND'>('RELEASE');
  const [auditReason, setAuditReason] = useState('');

  useEffect(() => {
    void dispatch(fetchPayments());
  }, [dispatch]);

  /**
   * Ledger totals for this page. Volume counts only committed money (held or
   * released), so unfunded, refunded and failed rows don't inflate it.
   */
  const metrics = useMemo(() => {
    const sum = (status: EscrowPayment['status'], pick: (p: EscrowPayment) => number) =>
      payments.filter((p) => p.status === status).reduce((total, p) => total + pick(p), 0);
    const total = (p: EscrowPayment) => p.totalAmount;
    const totalEscrowFunds = sum('HELD_IN_ESCROW', total);
    const totalRefunded = sum('REFUNDED', total);
    const totalReleased = sum('RELEASED', total);
    const totalAwaitingFunding = sum('AWAITING_FUNDING', total);
    const totalFailed = sum('FAILED', total);
    const totalLedgerGross = totalReleased + totalEscrowFunds + totalAwaitingFunding + totalRefunded + totalFailed;
    const statusCounts: Record<string, number> = {
      ALL: payments.length,
      AWAITING_FUNDING: payments.filter((p) => p.status === 'AWAITING_FUNDING').length,
      HELD_IN_ESCROW: payments.filter((p) => p.status === 'HELD_IN_ESCROW').length,
      RELEASED: payments.filter((p) => p.status === 'RELEASED').length,
      REFUNDED: payments.filter((p) => p.status === 'REFUNDED').length,
      FAILED: payments.filter((p) => p.status === 'FAILED').length,
    };
    const allocationSegments = [
      { key: 'RELEASED', label: 'Released', amount: totalReleased, color: '#059669' },
      { key: 'HELD_IN_ESCROW', label: 'Held in Escrow', amount: totalEscrowFunds, color: '#0D568D' },
      { key: 'AWAITING_FUNDING', label: 'Awaiting Funding', amount: totalAwaitingFunding, color: '#D97706' },
      { key: 'REFUNDED', label: 'Refunded', amount: totalRefunded, color: '#C5221F' },
      { key: 'FAILED', label: 'Failed', amount: totalFailed, color: '#94A3B8' },
    ].map((seg) => ({
      ...seg,
      sharePct: totalLedgerGross > 0 ? Math.round((seg.amount / totalLedgerGross) * 1000) / 10 : 0,
    }));

    return {
      totalVolume: totalReleased + totalEscrowFunds,
      totalEscrowFunds,
      totalRefunded,
      totalGigPayouts: sum('RELEASED', (p) => p.amount),
      totalPlatformRevenue: sum('RELEASED', (p) => p.platformFee),
      completedCount: statusCounts.RELEASED,
      totalLedgerGross,
      statusCounts,
      allocationSegments,
    };
  }, [payments]);

  const safePayments = Array.isArray(payments) ? payments : [];

  const filteredPayments = safePayments.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  const handleOpenOverride = (payment: EscrowPayment, action: 'RELEASE' | 'REFUND') => {
    setSelectedPayment(payment);
    setOverrideAction(action);
    setAuditReason('');
    setIsOverrideModalOpen(true);
  };

  const handleExecuteOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !auditReason.trim()) return;

    try {
      await dispatch(
        overrideEscrowPayment({
          paymentId: selectedPayment.paymentId,
          action: overrideAction,
          auditReason: auditReason.trim(),
        }),
      ).unwrap();
      void dispatch(fetchKPIs());
      if (hasPermission('admins:invite')) {
        void dispatch(fetchAuditLogs());
      }
      setIsOverrideModalOpen(false);
      toast.success(
        'Escrow Override Applied',
        `Payment #${selectedPayment.paymentId} was manually ${overrideAction === 'RELEASE' ? 'released to the pro' : 'refunded to the client'}.`,
      );
    } catch (err: unknown) {
      toast.error('Override Refused', extractErrorMessage(err, 'Could not override escrow status.'));
    }
  };

  const columns: ColumnDef<EscrowPayment>[] = [
    {
      header: 'Tx / Task ID',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.id}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{row.taskId}</span>
        </div>
      )
    },
    {
      header: 'Task Title',
      accessorKey: 'taskTitle'
    },
    {
      header: 'Client & Freelancer',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>{row.clientName}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>→ {row.gigProName}</span>
        </div>
      )
    },
    {
      header: 'Gross Volume',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>{formatCurrency(row.totalAmount)}</span>
    },
    {
      header: 'Net Pro Payout',
      cell: (row) => <span>{formatCurrency(row.amount)}</span>
    },
    {
      header: 'Platform Fee',
      cell: (row) => <span style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>{formatCurrency(row.platformFee)}</span>
    },
    {
      header: 'Escrow Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Settled Date',
      cell: (row) => <span>{row.status === 'HELD_IN_ESCROW' ? 'Pending Delivery' : row.settledAt || '—'}</span>
    },
    {
      header: 'Actions',
      cell: (row) => {
        if (row.status !== 'HELD_IN_ESCROW') {
          return <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Settled</span>;
        }

        const canRelease = hasPermission('payments:release');
        const canRefund = hasPermission('payments:refund');

        if (!canRelease && !canRefund) {
          return <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Read-only</span>;
        }

        return (
          <div style={{ display: 'flex', gap: '6px' }}>
            {canRelease && (
              <button
                onClick={() => handleOpenOverride(row, 'RELEASE')}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '2px 8px', fontSize: '11px' }}
              >
                Release
              </button>
            )}
            {canRefund && (
              <button
                onClick={() => handleOpenOverride(row, 'REFUND')}
                className="admin-btn admin-btn-danger"
                style={{ padding: '2px 8px', fontSize: '11px' }}
              >
                Refund
              </button>
            )}
          </div>
        );
      }
    }
  ];

  if (paymentsRequest.status === 'loading' && payments.length === 0) {
    return <Loader label="Loading escrow accounting ledgers..." />;
  }

  if (paymentsRequest.status === 'failed' && payments.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-danger-text)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Escrow Ledger Load Error</h3>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
          {paymentsRequest.error || 'Could not load escrow payments.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Financial Overview KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Committed Volume"
          value={formatCurrency(metrics.totalVolume)}
          subtitle="Held in escrow plus released"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Held in Escrow"
          value={formatCurrency(metrics.totalEscrowFunds)}
          subtitle="Awaiting work approval or arbitration"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-secondary)"
        />
        <KPICard
          title="Released to Gig Professionals"
          value={formatCurrency(metrics.totalGigPayouts)}
          subtitle={`${metrics.completedCount} settled payouts`}
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Platform Fee Revenue"
          value={formatCurrency(metrics.totalPlatformRevenue)}
          subtitle="Net fees on released escrow"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Refunded to Clients"
          value={formatCurrency(metrics.totalRefunded)}
          subtitle="Returned via arbitration or override"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-danger-text)"
        />
      </div>

      {/* Escrow Capital Allocation Breakdown */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
              Escrow Capital Allocation
            </h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Share of total gross ledger volume across escrow lifecycle states
            </span>
          </div>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--color-text-dark)' }}>
            Total Ledger: {formatCurrency(metrics.totalLedgerGross)}
          </span>
        </div>

        <div
          style={{
            height: '12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--color-bg-light)',
            overflow: 'hidden',
            display: 'flex',
            gap: '2px',
          }}
        >
          {metrics.allocationSegments
            .filter((seg) => seg.amount > 0)
            .map((seg) => (
              <div
                key={seg.key}
                title={`${seg.label}: ${formatCurrency(seg.amount)} (${seg.sharePct}%)`}
                style={{
                  width: `${Math.max(1.5, seg.sharePct)}%`,
                  backgroundColor: seg.color,
                  height: '100%',
                  transition: 'width 0.35s ease',
                }}
              />
            ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', fontSize: 'var(--font-size-xs)' }}>
          {metrics.allocationSegments.map((seg) => (
            <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: seg.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{seg.label}:</span>
              <strong style={{ color: 'var(--color-text-dark)' }}>{formatCurrency(seg.amount)}</strong>
              <span style={{ color: 'var(--color-text-muted)' }}>({seg.sharePct}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table Card with Filter Pills */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                style={{
                  padding: '6px 12px',
                  border: `1px solid ${statusFilter === filter ? 'var(--color-primary-dark)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: statusFilter === filter ? 'var(--color-primary-dark)' : 'var(--color-bg-white)',
                  color: statusFilter === filter ? '#ffffff' : 'var(--color-text-muted)',
                  fontWeight: statusFilter === filter ? 700 : 600,
                  fontSize: 'var(--font-size-xs)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {filter === 'ALL' ? 'All Statuses' : filter.replace(/_/g, ' ')} ({metrics.statusCounts[filter] ?? 0})
              </button>
            ))}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Showing {filteredPayments.length} of {safePayments.length} transactions
          </span>
        </div>

        <DataTable
          data={filteredPayments}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Search transactions by ID, task, or user name..."
        />
      </div>

      {/* Escrow Manual Override Modal */}
      <ActionModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title={`Manual Escrow Override: ${overrideAction === 'RELEASE' ? 'Release Funds to Pro' : 'Refund Escrow to Client'}`}
      >
        {selectedPayment && (
          <form onSubmit={handleExecuteOverride} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)' }}>
              {overrideAction === 'RELEASE'
                ? 'Are you sure you want to bypass pending milestone sign-off and release escrowed funds to the Gig Professional?'
                : 'Are you sure you want to forcibly terminate escrow and refund 100% of the escrowed balance to the Client?'}
            </p>
            <div style={{ backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong>Transaction / Task:</strong> {selectedPayment.id} · {selectedPayment.taskTitle}</div>
              <div><strong>Client Organization:</strong> {selectedPayment.clientName}</div>
              <div><strong>Gig Professional:</strong> {selectedPayment.gigProName}</div>
              <div><strong>Total Escrowed Amount:</strong> {formatCurrency(selectedPayment.totalAmount)}</div>
              <div><strong>Freelancer Net Payout:</strong> {formatCurrency(selectedPayment.amount)}</div>
              <div><strong>Platform Retained Fee:</strong> {formatCurrency(selectedPayment.platformFee)}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
                Reason for Administrative Override (Recorded in System Audit Log)
              </label>
              <textarea
                className="admin-textarea"
                rows={3}
                required
                disabled={overriding}
                placeholder="Detail the justification for this manual ledger override..."
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
              <button
                type="button"
                disabled={overriding}
                onClick={() => setIsOverrideModalOpen(false)}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={overriding}
                className="admin-btn admin-btn-primary"
                style={{
                  backgroundColor: overrideAction === 'REFUND' ? 'var(--color-danger-text)' : 'var(--color-primary-dark)'
                }}
              >
                {overriding
                  ? 'Applying...'
                  : overrideAction === 'RELEASE'
                  ? `Confirm Release ${formatCurrency(selectedPayment.amount)}`
                  : `Confirm Refund ${formatCurrency(selectedPayment.totalAmount)}`}
              </button>
            </div>
          </form>
        )}
      </ActionModal>
    </div>
  );
};

export default PaymentsRevenue;
