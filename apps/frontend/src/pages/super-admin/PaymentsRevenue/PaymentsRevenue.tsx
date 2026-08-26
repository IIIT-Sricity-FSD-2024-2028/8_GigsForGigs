import React, { useState } from 'react';
import { KPICard } from '../../../components/super-admin/KPICard';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { PaymentIcon } from '../../../components/super-admin/Icons';
import { mockPayments, type PaymentLedgerItem } from '../../../mock/adminMockData';

/**
 * @file PaymentsRevenue.tsx
 * @description
 * Marketplace financial ledger, escrow security supervisor, and platform commission tracker.
 * Provides emergency escrow release and refund override capabilities with mandatory audit notes.
 */

import { useToast } from '../../../components/super-admin/Toast';

export const PaymentsRevenue: React.FC = () => {
  const toast = useToast();
  const [payments, setPayments] = useState<PaymentLedgerItem[]>(mockPayments);
  const [selectedPayment, setSelectedPayment] = useState<PaymentLedgerItem | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideAction, setOverrideAction] = useState<'RELEASE' | 'REFUND'>('RELEASE');
  const [auditReason, setAuditReason] = useState('');

  const handleOpenOverride = (payment: PaymentLedgerItem, action: 'RELEASE' | 'REFUND') => {
    setSelectedPayment(payment);
    setOverrideAction(action);
    setAuditReason('');
    setIsOverrideModalOpen(true);
  };

  const handleExecuteOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !auditReason.trim()) return;

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
      header: 'Gross Volume',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>${row.grossAmount.toLocaleString()}</span>
    },
    {
      header: 'Platform Rake (10%)',
      cell: (row) => <span style={{ color: 'var(--color-primary-blue)', fontWeight: 600 }}>+${row.platformRake.toLocaleString()}</span>
    },
    {
      header: 'Net Payout',
      cell: (row) => <span>${row.netPayout.toLocaleString()}</span>
    },
    {
      header: 'Escrow Status',
      cell: (row) => <StatusBadge status={row.escrowStatus} />
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        row.escrowStatus === 'HELD_IN_ESCROW' ? (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenOverride(row, 'RELEASE');
              }}
            >
              Release
            </button>
            <button
              className="admin-btn admin-btn-outline admin-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenOverride(row, 'REFUND');
              }}
            >
              Refund
            </button>
          </div>
        ) : (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Settled
          </span>
        )
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* ── Financial Ledger KPI Tiles ─────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}
      >
        <KPICard
          title="Escrow Held in Trust"
          value="$118,400"
          deltaText="Protected"
          subtitle="Milestones in progress"
          accentColor="var(--color-primary-blue)"
          icon={<PaymentIcon size={20} />}
        />
        <KPICard
          title="Disbursed to Freelancers"
          value="$310,500"
          deltaText="+16.4%"
          subtitle="Released upon completion"
          accentColor="var(--color-secondary)"
          icon={<PaymentIcon size={20} />}
        />
        <KPICard
          title="Commission Rake Earned"
          value="$42,890"
          deltaText="+22.0%"
          subtitle="Net platform revenue (10%)"
          accentColor="var(--color-primary-dark)"
          icon={<PaymentIcon size={20} />}
        />
        <KPICard
          title="Dispute Refunds Issued"
          value="$8,200"
          subtitle="Arbitrated client returns"
          accentColor="var(--color-danger-text)"
          icon={<PaymentIcon size={20} />}
        />
      </div>

      {/* ── Transactions & Escrow Table ────────────────────────────────── */}
      <DataTable
        title="Marketplace Financial Ledger & Escrow Registry"
        columns={columns}
        data={payments}
        pageSize={6}
        searchPlaceholder="Search by transaction ID, task, or party..."
      />

      {/* ── Escrow Action Override Modal ────────────────────────────────── */}
      <ActionModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title={`Manual Escrow ${overrideAction === 'RELEASE' ? 'Release' : 'Refund'} Override`}
        subtitle={`Task: ${selectedPayment?.taskTitle} · Amount: $${selectedPayment?.grossAmount.toLocaleString()}`}
        width="500px"
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={() => setIsOverrideModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`admin-btn ${overrideAction === 'RELEASE' ? 'admin-btn-primary' : 'admin-btn-danger'}`}
              onClick={handleExecuteOverride}
            >
              Execute {overrideAction}
            </button>
          </>
        }
      >
        <form onSubmit={handleExecuteOverride} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Net Payout to Freelancer:</span>
              <span style={{ fontWeight: 700 }}>${selectedPayment?.netPayout.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Platform Commission Retained:</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary-blue)' }}>${selectedPayment?.platformRake.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              MANDATORY ADMINISTRATIVE JUSTIFICATION NOTE
            </label>
            <textarea
              className="admin-textarea"
              rows={3}
              placeholder="Provide clear audit justification for this manual escrow disbursement..."
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              required
            />
          </div>
        </form>
      </ActionModal>
    </div>
  );
};

export default PaymentsRevenue;
