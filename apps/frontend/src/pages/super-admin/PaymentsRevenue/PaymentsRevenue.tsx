import React, { useState, useEffect } from 'react';
import { KPICard } from '../../../components/super-admin/KPICard';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { PaymentIcon } from '../../../components/super-admin/Icons';
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
    {
      header: 'Transaction & Task',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.taskTitle}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{row.id}</span>
        </div>
      )
    },
    {
      header: 'Client $\\rightarrow$ Freelancer',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>{row.clientName}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>$\\rightarrow$ {row.gigProName}</span>
        </div>
      )
    },
    {
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
    },
    {
      header: 'Actions',
      cell: (row) => (
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
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
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
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-secondary)"
        />
      </div>

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
    </div>
  );
};

export default PaymentsRevenue;
