import React, { useState, useEffect, useMemo } from 'react';
import { KPICard } from '../../../components/super-admin/KPICard';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { PaymentIcon } from '../../../components/super-admin/Icons';
import { useToast } from '../../../components/super-admin/Toast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface EscrowPayment {
  paymentId: string;
  taskId: string;
  taskTitle: string;
  clientName: string;
  gigProName: string;
  gigAmount: number;
  platformFee: number;
  totalAmount: number;
  grossAmount?: number;
  status: 'AWAITING_FUNDING' | 'ESCROWED' | 'RELEASED' | 'REFUNDED';
  createdAt?: string;
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

        if (isMounted) {
          const normalizeStatus = (raw: string): EscrowPayment['status'] => {
            const s = (raw || '').toUpperCase();
            if (s.includes('RELEASED')) return 'RELEASED';
            if (s.includes('REFUND')) return 'REFUNDED';
            if (s.includes('ESCROW')) return 'ESCROWED';
            return 'AWAITING_FUNDING';
          };

          const list: EscrowPayment[] = Array.isArray(data) ? data.map((p: any) => {
            const gigAmount = Number(p.amount);
            const platformFee = Number(p.platformFee);
            const totalAmount = gigAmount + platformFee;
            return {
              paymentId: p.paymentId || p.id || `PAY-${p.taskId || '1'}`,
              taskId: p.taskId || 'tsk-01',
              taskTitle: p.taskTitle || 'Task Engagement',
              clientName: p.clientName || 'Client',
              gigProName: p.gigProName || 'Gig Professional',
              gigAmount,
              platformFee,
              totalAmount,
              status: normalizeStatus(p.status || p.escrowStatus || ''),
              createdAt: p.createdAt || new Date().toISOString().split('T')[0]
            };
          }) : [];

          setPayments(list);
        }
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

  const metrics = useMemo(() => {
    const totalVolume = payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalEscrowFunds = payments.filter(p => p.status === 'ESCROWED').reduce((sum, p) => sum + (p.gigAmount || 0), 0);
    const platformFeesPendingRelease = payments.filter(p => p.status === 'ESCROWED').reduce((sum, p) => sum + (p.platformFee || 0), 0);
    const totalGigPayouts = payments.filter(p => p.status === 'RELEASED').reduce((sum, p) => sum + (p.gigAmount || 0), 0);
    const totalPlatformRevenue = payments.filter(p => p.status === 'RELEASED').reduce((sum, p) => sum + (p.platformFee || 0), 0);
    const completedCount = payments.filter(p => p.status === 'RELEASED').length;

    return {
      totalVolume,
      totalEscrowFunds,
      platformFeesPendingRelease,
      totalGigPayouts,
      totalPlatformRevenue,
      completedCount
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

  const totalClientPayments = safePayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

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
      `Successfully processed ${selectedPayment.paymentId} (${formatCurrency(selectedPayment.totalAmount)})`
    );
  };

  const columns: ColumnDef<EscrowPayment>[] = [
    {
      header: 'Payment / Task',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.taskTitle}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{row.paymentId}</span>
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
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>{formatCurrency(row.gigAmount)}</span>
    },
    {
      header: 'Platform Profit (10%)',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-success-text)' }}>+{formatCurrency(row.platformFee)}</span>
    },
    {
      header: 'Total Client Paid',
      cell: (row) => <span style={{ fontWeight: 800, color: '#084b83' }}>{formatCurrency(row.totalAmount)}</span>
    },
    {
      header: 'Payment Status',
      cell: (row) => (
        <span style={{
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: row.status === 'RELEASED' ? '#e6f4ea' : row.status === 'ESCROWED' ? '#e8f0fe' : row.status === 'AWAITING_FUNDING' ? '#fef7e0' : '#fce8e6',
          color: row.status === 'RELEASED' ? '#137333' : row.status === 'ESCROWED' ? '#1a73e8' : row.status === 'AWAITING_FUNDING' ? '#b06000' : '#c5221f'
        }}>
          {row.status === 'ESCROWED' ? 'Held in Escrow' : row.status === 'AWAITING_FUNDING' ? 'Awaiting Funding' : row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {row.status === 'ESCROWED' && (
            hasPermission('payments:release') ? (
              <>
                <button
                  onClick={() => handleOpenOverride(row, 'RELEASE')}
                  className="admin-btn admin-btn-primary"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Release Payment
                </button>
                <button
                  onClick={() => handleOpenOverride(row, 'REFUND')}
                  className="admin-btn admin-btn-danger"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Refund Client
                </button>
              </>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Read Only (Auditor)</span>
            )
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>Loading financial ledger…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Super Admin Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Total Client Payments"
          value={formatCurrency(totalClientPayments)}
          deltaText={`${payments.length} Transactions`}
          isPositive={true}
          subtitle="Cumulative platform volume"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Payments Secured"
          value={formatCurrency(metrics.totalEscrowFunds)}
          deltaText="Active Project Payments"
          isPositive={true}
          subtitle="Secured project payments"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-secondary)"
        />
        <KPICard
          title="Pending Approval"
          value={formatCurrency(metrics.platformFeesPendingRelease + (metrics.totalEscrowFunds / 2))}
          deltaText="Work Submitted"
          isPositive={true}
          subtitle="Awaiting client work approval"
          icon={<PaymentIcon size={20} />}
          accentColor="#519e8a"
        />
        <KPICard
          title="Released to Gig Professionals"
          value={formatCurrency(metrics.totalGigPayouts)}
          deltaText={`${metrics.completedCount} Payouts Completed`}
          isPositive={true}
          subtitle="Total released earnings"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-success-text)"
        />
        <KPICard
          title="Platform Profit (10% Fee)"
          value={formatCurrency(metrics.totalPlatformRevenue)}
          deltaText={`${metrics.completedCount} Fees Retained`}
          isPositive={true}
          subtitle="Total profit earned for Super Admin"
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
              <option value="ESCROWED">Held in Escrow</option>
              <option value="RELEASED">Released</option>
              <option value="REFUNDED">Refunded</option>
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
                <div><strong>Gig Payout:</strong> {formatCurrency(selectedPayment.gigAmount)}</div>
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
                Confirm {overrideAction === 'RELEASE' ? `Release ${formatCurrency(selectedPayment.gigAmount)}` : `Refund ${formatCurrency(selectedPayment.totalAmount)}`}
              </button>
            </div>
          </form>
        )}
      </ActionModal>
    </div>
  );
};

export default PaymentsRevenue;
