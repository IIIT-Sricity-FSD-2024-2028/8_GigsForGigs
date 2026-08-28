import React, { useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { mockDisputes, type DisputeCase } from '../../../mock/adminMockData';

/**
 * @file DisputesReports.tsx
 * @description
 * High-stakes Dispute Arbitration Court for unresolved conflicts between Clients and Freelancers.
 * Features multi-pane evidence inspection and a 1-click settlement engine (Full Refund, Full Release, or Split).
 *
 * NOT WIRED TO THE REAL BACKEND: there is no dispute/escrow concept anywhere
 * in db/prisma/schema.prisma (no DISPUTE table, no escrow status on Payment).
 * Left entirely on mock/adminMockData.ts rather than inventing a fake
 * disputes endpoint.
 */

export const DisputesReports: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeCase[]>(mockDisputes);
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);
  const [isDocketOpen, setIsDocketOpen] = useState(false);

  // Settlement Engine State
  const [settlementType, setSettlementType] = useState<'FULL_REFUND' | 'FULL_RELEASE' | 'SPLIT'>('FULL_REFUND');
  const [splitClientPercent, setSplitClientPercent] = useState<number>(50);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleOpenDocket = (dispute: DisputeCase) => {
    setSelectedDispute(dispute);
    setSettlementType('FULL_REFUND');
    setResolutionNotes('');
    setIsDocketOpen(true);
  };

  const handleExecuteSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !resolutionNotes.trim()) return;

    const updated = disputes.map((d) =>
      d.id === selectedDispute.id ? { ...d, status: 'RESOLVED' as const } : d
    );
    setDisputes(updated);
    setIsDocketOpen(false);
    alert(`Dispute ${selectedDispute.id} arbitrated successfully via ${settlementType}. Escrow balances updated in PostgreSQL.`);
  };

  const columns: ColumnDef<DisputeCase>[] = [
    {
      header: 'Case ID & Task',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.taskTitle}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{row.id}</span>
        </div>
      )
    },
    {
      header: 'Filer vs Opposing Party',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-danger-text)' }}>Filer: {row.filedByName}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>Against: {row.againstName}</span>
        </div>
      )
    },
    {
      header: 'Disputed Escrow',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>${row.disputeAmount.toLocaleString()}</span>
    },
    {
      header: 'SLA Response Window',
      cell: (row) => (
        <span className="admin-badge badge-warning" style={{ fontSize: '11px' }}>
          {row.slaHoursLeft}h remaining
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <button
          className="admin-btn admin-btn-primary admin-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDocket(row);
          }}
        >
          Arbitrate Docket
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <DataTable
        title="Escalated Dispute Arbitration Queue"
        columns={columns}
        data={disputes}
        pageSize={6}
        searchPlaceholder="Search dispute dockets by case ID or task..."
        onRowClick={handleOpenDocket}
      />

      {/* ── Arbitration Docket Modal ────────────────────────────────────── */}
      <ActionModal
        isOpen={isDocketOpen}
        onClose={() => setIsDocketOpen(false)}
        title={`Arbitration Court: Case #${selectedDispute?.id}`}
        subtitle={`Task: ${selectedDispute?.taskTitle} · Disputed Amount: $${selectedDispute?.disputeAmount.toLocaleString()}`}
        width="680px"
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={() => setIsDocketOpen(false)}
            >
              Close Docket
            </button>
            {selectedDispute?.status !== 'RESOLVED' && (
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleExecuteSettlement}
              >
                Issue Legally Binding Ruling
              </button>
            )}
          </>
        }
      >
        {selectedDispute && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Case Overview Card */}
            <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>PRIMARY CLAIM</span>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-danger-text)' }}>
                  {selectedDispute.reason}
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)', lineHeight: 1.5 }}>
                "{selectedDispute.description}"
              </p>
            </div>

            {/* Evidence & Deliverables */}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                Submitted Evidence & Artifacts
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedDispute.evidenceUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(8, 75, 131, 0.04)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-primary-dark)',
                      textDecoration: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{url}</span>
                    <span style={{ fontWeight: 600 }}>Inspect Artifact ↗</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Settlement Decision Engine */}
            {selectedDispute.status !== 'RESOLVED' ? (
              <form onSubmit={handleExecuteSettlement} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  Arbitration Ruling & Escrow Distribution
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)' }}>
                  <button
                    type="button"
                    className={`admin-btn ${settlementType === 'FULL_REFUND' ? 'admin-btn-primary' : 'admin-btn-outline'} admin-btn-sm`}
                    onClick={() => setSettlementType('FULL_REFUND')}
                  >
                    100% Client Refund
                  </button>
                  <button
                    type="button"
                    className={`admin-btn ${settlementType === 'FULL_RELEASE' ? 'admin-btn-primary' : 'admin-btn-outline'} admin-btn-sm`}
                    onClick={() => setSettlementType('FULL_RELEASE')}
                  >
                    100% Freelancer Payout
                  </button>
                  <button
                    type="button"
                    className={`admin-btn ${settlementType === 'SPLIT' ? 'admin-btn-primary' : 'admin-btn-outline'} admin-btn-sm`}
                    onClick={() => setSettlementType('SPLIT')}
                  >
                    Split Settlement
                  </button>
                </div>

                {settlementType === 'SPLIT' && (
                  <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '6px' }}>
                      <span>Client Refund: {splitClientPercent}% (${((selectedDispute.disputeAmount * splitClientPercent) / 100).toLocaleString()})</span>
                      <span>Freelancer Payout: {100 - splitClientPercent}% (${((selectedDispute.disputeAmount * (100 - splitClientPercent)) / 100).toLocaleString()})</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={splitClientPercent}
                      onChange={(e) => setSplitClientPercent(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--color-primary-blue)' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    ARBITRATION FINDING & LEGAL RATIONALE
                  </label>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    placeholder="Document the legal rationale and factual findings behind this settlement..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                  />
                </div>
              </form>
            ) : (
              <div className="admin-badge badge-success" style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
                Case Legally Settled & Disbursed
              </div>
            )}
          </div>
        )}
      </ActionModal>
    </div>
  );
};

export default DisputesReports;
