import React, { useState, useEffect, useMemo } from 'react';
import { Loader } from '../../../components/common/Loader';
import { KPICard } from '../../../components/super-admin/KPICard';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { PaymentIcon } from '../../../components/super-admin/Icons';
import { useToast } from '../../../components/super-admin/Toast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface EscrowPayment {
  id: string;
  paymentId: number;
  taskId: string;
  taskTitle: string;
  clientName: string;
  gigProName: string;
  amount: number;
  platformFee: number;
  totalAmount: number;
  status: 'AWAITING_FUNDING' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';
  createdAt: string;
  settledAt: string | null;
}

export const PaymentsRevenue: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [payments, setPayments] = useState<EscrowPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<EscrowPayment | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideAction, setOverrideAction] = useState<'RELEASE' | 'REFUND'>('RELEASE');
  const [auditReason, setAuditReason] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadPayments() {
      try {
        setLoading(true);
        const data = await adminApi.getPayments();
        if (isMounted) setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load admin payments:', err);
        if (isMounted) {
          toast.error('Failed to load payments from database.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPayments();
    return () => { isMounted = false; };
  }, [toast]);

  /**
   * Ledger totals for this page. Volume counts only committed money (held or
   * released), so unfunded, refunded and failed rows don't inflate it.
   */
  const metrics = useMemo(() => {
    const sum = (status: EscrowPayment['status'], pick: (p: EscrowPayment) => number) =>
      payments.filter((p) => p.status === status).reduce((total, p) => total + pick(p), 0);
    const total = (p: EscrowPayment) => p.totalAmount;
    return {
      totalVolume: sum('RELEASED', total) + sum('HELD_IN_ESCROW', total),
      totalEscrowFunds: sum('HELD_IN_ESCROW', total),
      totalRefunded: sum('REFUNDED', total),
      totalGigPayouts: sum('RELEASED', (p) => p.amount),
      totalPlatformRevenue: sum('RELEASED', (p) => p.platformFee),
      completedCount: payments.filter((p) => p.status === 'RELEASED').length
    };
  }, [payments]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const safePayments = Array.isArray(payments) ? payments : [];

  const filteredPayments = safePayments.filter(p => {
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
      await adminApi.overrideEscrow(selectedPayment.paymentId, overrideAction, auditReason);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Override failed.');
      return;
    }

    setPayments(prev => prev.map(p => 
      p.paymentId === selectedPayment.paymentId ? { ...p, status: overrideAction === 'RELEASE' ? 'RELEASED' : 'REFUNDED' } : p
    ));

    setIsOverrideModalOpen(false);
    toast.success(
      `Payment ${overrideAction === 'RELEASE' ? 'Released' : 'Refunded'}`,
      `Processed ${selectedPayment.id} (${formatCurrency(selectedPayment.totalAmount)})`
    );
  };

  const columns: ColumnDef<EscrowPayment>[] = [
    {
      header: 'Payment / Task',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.taskTitle}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{row.id}</span>
        </div>
      )
    },
    {
      header: 'Client',
      cell: (row) => <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.clientName}</span>
    },
    {
      header: 'Gig Professional',
      cell: (row) => <span style={{ color: 'var(--color-text-dark)' }}>{row.gigProName}</span>
    },
    {
      header: 'Gig Amount',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>{formatCurrency(row.amount)}</span>
    },
    {
      header: 'Platform Fee',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-success-text)' }}>+{formatCurrency(row.platformFee)}</span>
    },
    {
      header: 'Total Client Paid',
      cell: (row) => <span style={{ fontWeight: 800, color: '#084875' }}>{formatCurrency(row.totalAmount)}</span>
    },
    {
      header: 'Payment Status',
      cell: (row) => (
        <span style={{
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: row.status === 'RELEASED' ? '#e6f4ea' : row.status === 'HELD_IN_ESCROW' ? '#e8f0fe' : row.status === 'AWAITING_FUNDING' ? '#fef7e0' : '#fce8e6',
          color: row.status === 'RELEASED' ? '#137333' : row.status === 'HELD_IN_ESCROW' ? '#1a73e8' : row.status === 'AWAITING_FUNDING' ? '#b06000' : '#c5221f'
        }}>
          {row.status.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => {
        if (row.status === 'HELD_IN_ESCROW') {
          if (!hasPermission('payments:release') && !hasPermission('payments:refund')) {
            return <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Read Only (Auditor)</span>;
          }
          return (
            <div style={{ display: 'flex', gap: '6px' }}>
              {hasPermission('payments:release') && (
                <button
                  onClick={() => handleOpenOverride(row, 'RELEASE')}
                  className="admin-btn admin-btn-primary"
                  style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                >
                  Release Payment
                </button>
              )}
              {hasPermission('payments:refund') && (
                <button
                  onClick={() => handleOpenOverride(row, 'REFUND')}
                  className="admin-btn admin-btn-danger"
                  style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                >
                  Refund Client
                </button>
              )}
            </div>
          );
        }
        if (row.status === 'RELEASED') {
          return <span style={{ fontSize: '11px', color: 'var(--color-success-text)', fontWeight: 600 }}>✓ Settled (Paid)</span>;
        }
        if (row.status === 'REFUNDED') {
          return <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Settled (Refunded)</span>;
        }
        if (row.status === 'AWAITING_FUNDING') {
          return <span style={{ fontSize: '11px', color: '#b06000' }}>Awaiting Deposit</span>;
        }
        return <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>Failed Transaction</span>;
      }
    }
  ];

  if (loading) {
    return <Loader label="Loading financial ledger..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Super Admin Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
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
          subtitle="Gig amount and fee, awaiting release"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-secondary)"
        />
        <KPICard
          title="Refunded to Clients"
          value={formatCurrency(metrics.totalRefunded)}
          subtitle="Returned from escrow"
          icon={<PaymentIcon size={20} />}
          accentColor="#519e8a"
        />
        <KPICard
          title="Released to Gig Professionals"
          value={formatCurrency(metrics.totalGigPayouts)}
          subtitle={`${metrics.completedCount} payouts completed`}
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-success-text)"
        />
        <KPICard
          title="Platform Fee Revenue"
          value={formatCurrency(metrics.totalPlatformRevenue)}
          subtitle="Fees on released payments"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-dark)"
        />
      </div>

      {/* Filter Bar & Ledger Table */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            Financial Management &amp; Transaction Ledger
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
              style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}
            >
              <option value="ALL">All Transactions</option>
              <option value="AWAITING_FUNDING">Awaiting Funding</option>
              <option value="HELD_IN_ESCROW">Held in Escrow</option>
              <option value="RELEASED">Released</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <DataTable
          data={filteredPayments}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Search financial ledger by task, client, gig pro, or ID..."
        />
      </div>

      {/* Super Admin Payment Override Modal */}
      <ActionModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title={`Transaction Override: ${overrideAction === 'RELEASE' ? 'Release Payment to Gig Pro' : 'Refund Payment to Client'}`}
      >
        {selectedPayment && (
          <form onSubmit={handleExecuteOverride} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', fontSize: '13px', lineHeight: 1.6 }}>
              <div><strong>Task Title:</strong> {selectedPayment.taskTitle}</div>
              <div><strong>Payment ID:</strong> {selectedPayment.paymentId}</div>
              <div><strong>Client:</strong> {selectedPayment.clientName}</div>
              <div><strong>Gig Professional:</strong> {selectedPayment.gigProName}</div>
              <div style={{ marginTop: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                <div><strong>Gig Payout:</strong> {formatCurrency(selectedPayment.amount)}</div>
                <div><strong>Platform Fee:</strong> {formatCurrency(selectedPayment.platformFee)}</div>
                <div><strong>Total Client Payment:</strong> {formatCurrency(selectedPayment.totalAmount)}</div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
                Administrative Override Reason (Logged in Audit Log)
              </label>
              <textarea
                className="admin-textarea"
                rows={3}
                required
                placeholder="State the audit justification for manual transaction override..."
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
                Confirm {overrideAction === 'RELEASE' ? `Release ${formatCurrency(selectedPayment.amount)}` : `Refund ${formatCurrency(selectedPayment.totalAmount)}`}
              </button>
            </div>
          </form>
        )}
      </ActionModal>
    </div>
  );
};

export default PaymentsRevenue;
