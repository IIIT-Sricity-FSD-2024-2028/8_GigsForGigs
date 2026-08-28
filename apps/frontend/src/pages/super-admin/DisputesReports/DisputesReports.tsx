import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { useToast } from '../../../components/super-admin/Toast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { adminApi } from '../../../services/api/admin/adminApi';

<<<<<<< HEAD
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
=======
export interface DisputeCase {
  id: string;
  taskId: string;
  taskTitle: string;
  filedByName: string;
  filedByRole: 'CLIENT' | 'GIG_PROFESSIONAL';
  againstName: string;
  disputeAmount: number;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  slaHoursLeft: number;
  createdAt: string;
}
>>>>>>> origin/main

export const DisputesReports: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);
  const [isDocketOpen, setIsDocketOpen] = useState(false);

  // Settlement Engine State
  const [settlementType, setSettlementType] = useState<'FULL_REFUND' | 'FULL_RELEASE' | 'SPLIT'>('FULL_REFUND');
  const [splitClientPercent, setSplitClientPercent] = useState<number>(50);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadDisputes() {
      const data = await adminApi.getDisputes();
      if (isMounted) {
        setDisputes(data);
      }
    }
    loadDisputes();
    return () => { isMounted = false; };
  }, []);

  const handleOpenDocket = (dispute: DisputeCase) => {
    setSelectedDispute(dispute);
    setSettlementType('FULL_REFUND');
    setResolutionNotes('');
    setIsDocketOpen(true);
  };

  const handleExecuteSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !resolutionNotes.trim()) return;

    await adminApi.settleDispute(selectedDispute.id, settlementType, resolutionNotes, splitClientPercent);
    const updated = disputes.map((d) =>
      d.id === selectedDispute.id ? { ...d, status: 'RESOLVED' as const } : d
    );
    setDisputes(updated);
    setIsDocketOpen(false);
    toast.success('Dispute Case Settled', `Ruling executed for ${selectedDispute.id} via ${settlementType.replace('_', ' ')}.`);
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
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>${row.disputeAmount.toLocaleString()}</span>
    },
    {
      header: 'Reason',
      cell: (row) => <span style={{ fontSize: 'var(--font-size-xs)' }}>{row.reason}</span>
    },
    {
      header: 'SLA Status',
      cell: (row) => (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: row.slaHoursLeft < 24 ? 'var(--color-danger-text)' : 'var(--color-warning-text)'
          }}
        >
          ⏱ {row.slaHoursLeft}h remaining
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => handleOpenDocket(row)}
          className="admin-btn admin-btn-primary"
          style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
        >
          Arbitrate Docket
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <DataTable
          data={disputes}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Search dispute dockets by case ID, task, or filer..."
        />
      </div>

      {/* Arbitration Docket Modal */}
      <ActionModal
        isOpen={isDocketOpen}
        onClose={() => setIsDocketOpen(false)}
        title={`Arbitration Court Docket: Case #${selectedDispute?.id}`}
        maxWidth="760px"
      >
        {selectedDispute && (
          <form onSubmit={handleExecuteSettlement} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{ backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
              <div><strong>Task:</strong> {selectedDispute.taskTitle}</div>
              <div><strong>Disputed Escrow:</strong> ${selectedDispute.disputeAmount.toLocaleString()}</div>
              <div><strong>Filer:</strong> {selectedDispute.filedByName} ({selectedDispute.filedByRole})</div>
              <div><strong>Against:</strong> {selectedDispute.againstName}</div>
              <div style={{ marginTop: '8px' }}><strong>Filer Description:</strong> {selectedDispute.description}</div>
            </div>

            {/* Evidence Inspector */}
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Evidence Documents & Artifact Logs
              </span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {selectedDispute.evidenceUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-info-bg)',
                      color: 'var(--color-info-text)',
                      textDecoration: 'none',
                      fontWeight: 600
                    }}
                  >
                    📄 Evidence File #{i + 1}
                  </a>
                ))}
              </div>
            </div>

            {/* Settlement Ruling Controls */}
            {hasPermission('disputes:resolve') ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                    Arbitration Ruling
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)' }}>
                    {(['FULL_REFUND', 'FULL_RELEASE', 'SPLIT'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSettlementType(type)}
                        style={{
                          padding: '10px',
                          borderRadius: 'var(--radius-md)',
                          border: settlementType === type ? '2px solid var(--color-primary-dark)' : '1px solid var(--color-border)',
                          backgroundColor: settlementType === type ? 'rgba(8, 75, 131, 0.08)' : 'var(--color-bg-white)',
                          fontWeight: 700,
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-primary-dark)',
                          cursor: 'pointer'
                        }}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {settlementType === 'SPLIT' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
                      Client Split %: {splitClientPercent}% | Freelancer Split %: {100 - splitClientPercent}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={splitClientPercent}
                      onChange={(e) => setSplitClientPercent(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
                    Legal & Operational Arbitration Notes (Sent to both parties)
                  </label>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    required
                    placeholder="Explain the binding ruling and evidence analysis..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                  <button
                    type="button"
                    onClick={() => setIsDocketOpen(false)}
                    className="admin-btn admin-btn-secondary"
                  >
                    Close Docket
                  </button>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                  >
                    Execute Final Arbitration Ruling
                  </button>
                </div>
              </>
            ) : (
              <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📋 Read-Only Mode: Auditors may inspect case evidence, but cannot execute arbitration rulings.</span>
                <button
                  type="button"
                  onClick={() => setIsDocketOpen(false)}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Close
                </button>
              </div>
            )}
          </form>
        )}
      </ActionModal>
    </div>
  );
};

export default DisputesReports;
