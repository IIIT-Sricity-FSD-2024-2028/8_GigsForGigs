import React, { useState } from 'react';
import { useClient, type Contract, type PaymentStatus } from '../../../context/ClientContext';
import { PAYMENT_STATUS_UI } from '../../../utils/helpers/paymentStatus';
import { FundTaskCard } from '../../../components/client/cards/FundTaskCard';
import { PageHeader } from '../../../components/common/PageHeader';
import { TaskDeliverablesManager } from '../../../components/client/sections/TaskDeliverablesManager';

export interface MyGigsProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
}

export const MyGigs: React.FC<MyGigsProps> = ({ onNavigate }) => {
  const { contracts, tasks, deleteTask, managers, assignTaskManager } = useClient();
  const [savingManager, setSavingManager] = useState(false);
  const [selectedTaskPayment, setSelectedTaskPayment] = useState<Contract | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'REVIEWING' | 'SCHEDULED'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentStatus>('ALL');

  // Filter out any completed contracts — completed projects appear exclusively on Completed Projects
  const activeContracts = contracts.filter((c) => {
    const isCompleted = c.status === 'COMPLETED' || tasks.find((t) => t.task_id === c.task_id)?.status === 'COMPLETED';
    return !isCompleted;
  });

  const activeFiltersCount =
    (searchKeyword.trim() ? 1 : 0) +
    (statusFilter !== 'ALL' ? 1 : 0) +
    (paymentFilter !== 'ALL' ? 1 : 0);

  const resetFilters = () => {
    setSearchKeyword('');
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
  };

  const filteredContracts = activeContracts.filter((c) => {
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchTitle = (c.task_title || '').toLowerCase().includes(q);
      const matchPro = (c.gig_pro_name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchPro) return false;
    }
    if (statusFilter !== 'ALL' && c.status !== statusFilter) {
      return false;
    }
    if (paymentFilter !== 'ALL' && c.payment_status !== paymentFilter) {
      return false;
    }
    return true;
  });

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete / cancel this contract task?')) {
      try {
        await deleteTask(taskId);
        alert('Project contract deleted successfully!');
      } catch (err) {
        console.error('Delete task failed:', err);
        alert(err instanceof Error && err.message ? err.message : 'Failed to delete this task. Please try again.');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <PageHeader title="Active Task/Contracts" description="Track ongoing work, view deliverables, and manage project payments." />

      {activeContracts.filter(c => c.payment_status === 'pending').map(c => (
        // After funding, open the task so the client decides who manages it.
        <FundTaskCard key={c.task_id} contract={c} onPaid={() => setSelectedTaskPayment({ ...c, payment_status: 'held' })} />
      ))}

      <div className="activity-section" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
        <div className="activity-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="activity-title" style={{ margin: 0 }}>
              All Active Task/Contracts
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, marginLeft: '8px' }}>
                ({filteredContracts.length}{filteredContracts.length !== activeContracts.length ? ` of ${activeContracts.length}` : ''})
              </span>
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              fontSize: '0.875rem',
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isFilterOpen || activeFiltersCount > 0 ? '#0D568D' : 'transparent',
              color: isFilterOpen || activeFiltersCount > 0 ? '#FFFFFF' : 'var(--color-primary-dark)',
              borderColor: '#0D568D',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out'
            }}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            title="Toggle contract filter options"
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" viewBox="0 0 24 24">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </button>
        </div>

        {/* Expandable Filter Toolbar */}
        {isFilterOpen && (
          <div
            style={{
              backgroundColor: 'var(--color-bg-light)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 'var(--spacing-lg)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
              <div style={{ minWidth: '180px', flex: '1 1 200px' }}>
                <input
                  type="text"
                  placeholder="Search project or talent name..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ minWidth: '150px' }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="ALL">All Active Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEWING">Reviewing</option>
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </div>

              <div style={{ minWidth: '160px' }}>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="pending">{PAYMENT_STATUS_UI.pending.label}</option>
                  <option value="held">{PAYMENT_STATUS_UI.held.label}</option>
                </select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#c5221f',
                  backgroundColor: '#FFF0F0',
                  border: '1px solid #FFD0D0',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                Clear Filters ({activeFiltersCount})
              </button>
            )}
          </div>
        )}

        {/* Table Container constrained to scroll horizontally inside its card container */}
        <div style={{ width: '100%', minWidth: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF' }}>
          <table className="activity-table" id="active-contracts-table" style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', minWidth: '220px' }}>Project Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', minWidth: '160px' }}>Professional</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', minWidth: '130px' }}>Task Status</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', minWidth: '160px' }}>Payment Status</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', minWidth: '120px' }}>Total Payment</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', minWidth: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    {activeContracts.length === 0 ? (
                      <div>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                          No active tasks or contracts in progress.
                        </p>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => onNavigate('completed-projects')}
                          style={{
                            fontSize: '13px',
                            color: '#0D568D',
                            background: '#EFF6F7',
                            border: '1px solid #0D568D',
                            padding: '6px 14px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          View Completed Projects
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                          No active contracts match your selected filters.
                        </p>
                        <button
                          type="button"
                          onClick={resetFilters}
                          style={{
                            fontSize: '13px',
                            color: '#0D568D',
                            background: '#EFF6F7',
                            border: '1px solid #0D568D',
                            padding: '6px 14px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredContracts.map(c => {
                  const ps = c.payment_status ? PAYMENT_STATUS_UI[c.payment_status] : null;

                  return (
                    <tr key={c.contract_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="task-name-cell" style={{ fontWeight: 600, color: 'var(--color-text-dark)', wordBreak: 'break-word', maxWidth: '280px' }}>{c.task_title}</div>
                        <div className="task-category" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Software Development</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="pro-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="pro-photo" style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0D568D', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                            {c.gig_pro_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </div>
                          <span style={{ wordBreak: 'break-word' }}>{c.gig_pro_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span className={`status-badge ${
                          c.status === 'REVIEWING' ? 'status-review-needed' : 'status-in-progress'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {ps && (
                          <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, backgroundColor: ps.bg, color: ps.fg }}>
                            {ps.label}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0D568D' }}>
                        {formatCurrency(c.total_amount)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div className="actions-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            className="btn-review-proposal"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--color-primary-blue)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary-blue)', backgroundColor: 'transparent', cursor: 'pointer' }}
                            onClick={() => setSelectedTaskPayment(c)}
                          >
                            View Task
                          </button>
                          <button
                            className="btn-review-proposal"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none', borderRadius: 'var(--radius-sm)', color: '#FFFFFF', backgroundColor: '#0D568D', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => onNavigate('review-deliverables', { taskId: c.task_id })}
                          >
                            Deliverables
                          </button>
                          <button
                            className="btn-icon-action"
                            title="Delete task"
                            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                            onClick={() => handleDeleteTask(c.task_id)}
                          >
                            <svg className="manager-delete-icon" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details & Payment Modal */}
      {selectedTaskPayment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '760px', width: 'min(92vw, 760px)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0D568D', margin: '0 0 8px 0' }}>
              {selectedTaskPayment.task_title}
            </h3>
            <p style={{ fontSize: '13px', color: '#502419', marginBottom: '16px' }}>
              Gig Professional: <strong>{selectedTaskPayment.gig_pro_name}</strong>
            </p>

            <div style={{ backgroundColor: '#F0F6F6', borderRadius: '8px', padding: '16px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Agreed Project Amount:</span>
                <strong>{formatCurrency(selectedTaskPayment.budget)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Platform Fee (10%):</span>
                <strong>{formatCurrency(selectedTaskPayment.platform_fee)}</strong>
              </div>
              <div style={{ borderTop: '1px solid #DBDFDF', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                <span>Total Payment:</span>
                <span style={{ color: '#0D568D' }}>{formatCurrency(selectedTaskPayment.total_amount)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '13px', color: '#502419' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Payment Status:</div>
              {selectedTaskPayment.payment_status && (
                <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, backgroundColor: PAYMENT_STATUS_UI[selectedTaskPayment.payment_status].bg, color: PAYMENT_STATUS_UI[selectedTaskPayment.payment_status].fg }}>
                  {PAYMENT_STATUS_UI[selectedTaskPayment.payment_status].label}
                </span>
              )}
            </div>

            {selectedTaskPayment.payment_status === 'held' && selectedTaskPayment.status === 'IN_PROGRESS' && (
              <div style={{ marginBottom: '20px', fontSize: '13px', color: '#502419' }}>
                <label htmlFor="task-manager" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Managed by:</label>
                <select
                  id="task-manager"
                  className="form-input"
                  disabled={savingManager}
                  value={selectedTaskPayment.manager_id ?? ''}
                  onChange={async (e) => {
                    const managerId = e.target.value ? Number(e.target.value) : null;
                    setSavingManager(true);
                    try {
                      await assignTaskManager(selectedTaskPayment.task_id, managerId);
                      setSelectedTaskPayment({ ...selectedTaskPayment, manager_id: managerId });
                    } catch (err) {
                      alert(err instanceof Error && err.message ? err.message : 'Could not change the manager.');
                    } finally {
                      setSavingManager(false);
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="">Me (I'll manage this task)</option>
                  {managers.filter(m => m.kind === 'manager').map(m => (
                    <option key={m.invite_id} value={m.invite_id}>{m.name || m.email}</option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: '#805C54', margin: '4px 0 0' }}>
                  The manager can define and review deliverables. Only you can release payment.
                </p>
              </div>
            )}

            <p style={{ fontSize: '12px', color: '#805C54', marginBottom: '20px', lineHeight: 1.4 }}>
              "Deliverables must be reviewed and approved before payment authorization is enabled."
            </p>

            <TaskDeliverablesManager key={selectedTaskPayment.task_id} taskId={Number(selectedTaskPayment.task_id)} readOnly={selectedTaskPayment.status !== 'IN_PROGRESS'} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedTaskPayment(null)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #DBDFDF', backgroundColor: '#FFFFFF', color: '#502419', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const tid = selectedTaskPayment.task_id;
                  setSelectedTaskPayment(null);
                  onNavigate('review-deliverables', { taskId: tid });
                }}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0D568D', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                Review Deliverables &amp; Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyGigs;

