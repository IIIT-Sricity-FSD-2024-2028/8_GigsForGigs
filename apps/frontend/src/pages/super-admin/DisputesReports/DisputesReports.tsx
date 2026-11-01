import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { useToast } from '../../../components/super-admin/Toast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { adminApi } from '../../../services/api/admin/adminApi';
import { safeHttpUrl } from '../../../utils/helpers/safeUrl';

export interface DisputeCase {
  id: string;
  taskId: string;
  taskTitle: string;
  filedByName: string;
  filedByRole: 'CLIENT' | 'GIG_PROFESSIONAL';
  againstName: string;
  disputeAmount: number;
  escrowHeld: number;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  /** Derived by the server from createdAt. Negative once breached, null when closed. */
  slaHoursLeft: number | null;
  resolutionNotes: string | null;
  settlementType: string | null;
  splitPercent: number | null;
  createdAt: string;
}

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
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDisputes() {
      try {
        const data = await adminApi.getDisputes();
        if (isMounted) setDisputes(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (isMounted) setLoadError(err?.message || 'Failed to load the dispute docket.');
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

    // Only claim success if the server moved the money: a failed ruling must stay visibly open.
    try {
      const outcome = await adminApi.settleDispute(
        selectedDispute.id,
        settlementType,
        resolutionNotes,
        settlementType === 'SPLIT' ? splitClientPercent : undefined
      );
      setDisputes(disputes.map((d) =>
        d.id === selectedDispute.id
          ? { ...d, status: 'RESOLVED' as const, escrowHeld: 0, slaHoursLeft: null, settlementType, resolutionNotes }
          : d
      ));
      setIsDocketOpen(false);
      const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
      toast.success(
        'Ruling Executed',
        `Client ${inr(outcome.refundToClient)} · Pro ${inr(outcome.payoutToPro)} · Platform ${inr(outcome.platformFee)}`
      );
    } catch (err: any) {
      toast.error('Ruling Failed', err?.message || 'The ruling was not applied. No money moved.');
    }
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
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>₹{row.disputeAmount.toLocaleString('en-IN')}</span>
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
            color: row.slaHoursLeft === null ? 'var(--color-text-muted)' : row.slaHoursLeft < 24 ? 'var(--color-danger-text)' : 'var(--color-warning-text)'
          }}
        >
          {row.slaHoursLeft === null ? 'Closed' : row.slaHoursLeft < 0 ? `⚠ Breached by ${-row.slaHoursLeft}h` : `⏱ ${row.slaHoursLeft}h remaining`}
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
          {row.status === 'RESOLVED' || row.status === 'DISMISSED' ? 'View Ruling' : 'Arbitrate Docket'}
        </button>
      )
    }
  ];

  if (loadError) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {loadError}
      </div>
    );
  }

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
              <div><strong>Claimed Amount:</strong> ₹{selectedDispute.disputeAmount.toLocaleString('en-IN')}</div>
              <div><strong>Held in Escrow:</strong> ₹{selectedDispute.escrowHeld.toLocaleString('en-IN')} (a ruling applies to this whole amount)</div>
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
                {(selectedDispute.evidenceUrls ?? []).length === 0 && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>No evidence submitted</span>
                )}
                {(selectedDispute.evidenceUrls ?? []).map((url, i) => (
                  <a
                    key={i}
                    href={safeHttpUrl(url)}
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
            {selectedDispute.status === 'RESOLVED' || selectedDispute.status === 'DISMISSED' ? (
              <div style={{ backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                <div>
                  <strong>Ruling:</strong> {(selectedDispute.settlementType ?? 'None recorded').replace(/_/g, ' ')}
                  {selectedDispute.splitPercent != null && ` (${selectedDispute.splitPercent}% to client)`}
                </div>
                <div style={{ marginTop: '6px' }}><strong>Notes:</strong> {selectedDispute.resolutionNotes || '—'}</div>
              </div>
            ) : hasPermission('disputes:resolve') ? (
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
                      min="5"
                      max="95"
                      step="5"
                      value={splitClientPercent}
                      onChange={(e) => setSplitClientPercent(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
                    Arbitration Notes (Recorded on the docket)
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
                    disabled={selectedDispute.escrowHeld <= 0}
                    title={selectedDispute.escrowHeld <= 0 ? 'No funds are held in escrow for this task' : undefined}
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
