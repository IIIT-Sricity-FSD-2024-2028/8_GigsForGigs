import React, { useState } from 'react';
import { useClient, type Contract } from '../../../context/ClientContext';
import { useAuth } from '../../../context/AuthContext';
import { usePayments, type EscrowPayment } from '../../../context/PaymentContext/PaymentContext';
import { Table } from '../../../components/common/Table';
import { PageHeader } from '../../../components/common/PageHeader';
import { TaskDeliverablesManager } from '../../../components/client/sections/TaskDeliverablesManager';
import { ClientReviewModal } from '../../../components/client/modals/ClientReviewModal';
import { TaskReviewsModal } from '../../../components/client/modals/TaskReviewsModal';

export interface MyGigsProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
}

export const MyGigs: React.FC<MyGigsProps> = ({ onNavigate }) => {
  const { contracts, deleteTask } = useClient();
  const { user } = useAuth();
  const { payments } = usePayments();
  const [selectedTaskPayment, setSelectedTaskPayment] = useState<EscrowPayment | null>(null);
  const [reviewingContract, setReviewingContract] = useState<Contract | null>(null);
  const [viewReviewsContract, setViewReviewsContract] = useState<Contract | null>(null);

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
    <div>
      <PageHeader title="Active Task/Contracts" description="Track ongoing work, view deliverables, and manage project payments." />

      <div className="activity-section">
        <div className="activity-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h2 className="activity-title">All Active Task/Contracts</h2>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.875rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'transparent', cursor: 'pointer' }}
            onClick={() => alert('Filter applied')}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" viewBox="0 0 24 24">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter
          </button>
        </div>

        <Table className="activity-table" id="active-contracts-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Project Name</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Professional</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Task Status</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Payment Status</th>
              <th style={{ textAlign: 'right', padding: '12px 16px' }}>Total Payment</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  No active contracts found.
                </td>
              </tr>
            ) : (
              contracts.map(c => {
                const gigAmt = c.budget || 5000;
                const platformFee = Math.round(gigAmt * 0.07);
                const totalAmt = gigAmt + platformFee;
                const p = payments.find(pay => pay.taskId === c.task_id) || {
                  paymentId: 'PAY-' + c.task_id,
                  taskId: c.task_id,
                  taskTitle: c.task_title,
                  clientId: '',
                  clientName: '',
                  gigProfileId: '',
                  gigProName: c.gig_pro_name,
                  gigAmount: gigAmt,
                  platformFee,
                  totalAmount: totalAmt,
                  status: c.status === 'COMPLETED' ? 'COMPLETED' : 'ESCROWED',
                  paymentProvider: 'PLATFORM_PAYMENT',
                  createdAt: c.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                } as EscrowPayment;

                const reviews = c.reviews || [];
                const clientReview = reviews.find(r =>
                  user?.userId ? r.reviewerId === user.userId : r.revieweeName === c.gig_pro_name
                );
                const gigReview = reviews.find(r =>
                  user?.userId
                    ? r.reviewerId !== user.userId && (r.revieweeId === user.userId || r.reviewerName === c.gig_pro_name)
                    : r.reviewerName === c.gig_pro_name
                );
                const isCompleted = c.status === 'COMPLETED' || p.status === 'COMPLETED' || p.status === 'RELEASED';

                return (
                  <tr key={c.contract_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="task-name-cell" style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{c.task_title}</div>
                      <div className="task-category" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Software Development</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="pro-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="pro-photo" style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0D568D', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {c.gig_pro_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        {c.gig_pro_name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span className={`status-badge ${
                        c.status === 'COMPLETED' ? 'status-completed' : c.status === 'REVIEWING' ? 'status-review-needed' : 'status-in-progress'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                      {isCompleted && (
                        <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          {clientReview ? (
                            <span
                              title={clientReview.comment ? `"${clientReview.comment}"` : 'Review submitted'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: '#FEF7E0',
                                color: '#B06000',
                                border: '1px solid #FEEFC3',
                              }}
                            >
                              ★ {clientReview.rating}.0 Reviewed
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: '#E8F0FE',
                                color: '#1A73E8',
                                border: '1px solid #D2E3FC',
                              }}
                            >
                              ● Review Pending
                            </span>
                          )}
                          {gigReview && (
                            <span
                              title={gigReview.comment ? `"${gigReview.comment}"` : 'Professional submitted feedback'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                fontSize: '10px',
                                fontWeight: 600,
                                backgroundColor: '#E6F4EA',
                                color: '#137333',
                              }}
                            >
                              ✓ Pro Reviewed ({gigReview.rating}★)
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: p.status === 'COMPLETED' || p.status === 'RELEASED' ? '#e6f4ea' : p.status === 'ESCROWED' || p.status === 'WORK_SUBMITTED' ? '#e8f0fe' : '#fff0f0',
                        color: p.status === 'COMPLETED' || p.status === 'RELEASED' ? '#137333' : p.status === 'ESCROWED' || p.status === 'WORK_SUBMITTED' ? '#1a73e8' : '#c5221f'
                      }}>
                        {p.status === 'PENDING' ? 'Payment Required' : p.status === 'ESCROWED' ? 'Payment Secured' : p.status === 'WORK_SUBMITTED' ? 'Awaiting Your Approval' : p.status === 'COMPLETED' || p.status === 'RELEASED' ? 'Payment Completed' : p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0D568D' }}>
                      {formatCurrency(p.totalAmount)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div className="actions-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          className="btn-review-proposal"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--color-primary-blue)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary-blue)', backgroundColor: 'transparent', cursor: 'pointer' }}
                          onClick={() => setSelectedTaskPayment(p)}
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
                        {isCompleted && !clientReview && (
                          <button
                            className="btn-review-proposal"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              color: '#FFFFFF',
                              backgroundColor: '#D47700',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            onClick={() => setReviewingContract(c)}
                            title={`Rate & review ${c.gig_pro_name}`}
                          >
                            ★ Rate &amp; Review
                          </button>
                        )}
                        {isCompleted && reviews.length > 0 && (
                          <button
                            className="btn-review-proposal"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              border: '1px solid #0D568D',
                              borderRadius: 'var(--radius-sm)',
                              color: '#0D568D',
                              backgroundColor: '#EFF6F7',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            onClick={() => setViewReviewsContract(c)}
                            title="View two-sided reviews for this contract"
                          >
                            Reviews ({reviews.length})
                          </button>
                        )}
                        {!isCompleted && (
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
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>

      {/* Task Details & Payment Modal */}
      {selectedTaskPayment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '760px', width: 'min(92vw, 760px)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0D568D', margin: '0 0 8px 0' }}>
              {selectedTaskPayment.taskTitle}
            </h3>
            <p style={{ fontSize: '13px', color: '#502419', marginBottom: '16px' }}>
              Gig Professional: <strong>{selectedTaskPayment.gigProName}</strong>
            </p>

            <div style={{ backgroundColor: '#F0F6F6', borderRadius: '8px', padding: '16px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Agreed Project Amount:</span>
                <strong>{formatCurrency(selectedTaskPayment.gigAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Platform Fee (7%):</span>
                <strong>{formatCurrency(selectedTaskPayment.platformFee)}</strong>
              </div>
              <div style={{ borderTop: '1px solid #DBDFDF', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                <span>Total Payment:</span>
                <span style={{ color: '#0D568D' }}>{formatCurrency(selectedTaskPayment.totalAmount)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '13px', color: '#502419' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Payment Status:</div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: selectedTaskPayment.status === 'COMPLETED' || selectedTaskPayment.status === 'RELEASED' ? '#e6f4ea' : '#e8f0fe',
                color: selectedTaskPayment.status === 'COMPLETED' || selectedTaskPayment.status === 'RELEASED' ? '#137333' : '#1a73e8'
              }}>
                {selectedTaskPayment.status === 'PENDING' ? 'Payment Required' : selectedTaskPayment.status === 'ESCROWED' ? 'Payment Secured' : selectedTaskPayment.status === 'WORK_SUBMITTED' ? 'Awaiting Your Approval' : selectedTaskPayment.status === 'COMPLETED' || selectedTaskPayment.status === 'RELEASED' ? 'Payment Completed' : selectedTaskPayment.status.replace('_', ' ')}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: '#805C54', marginBottom: '20px', lineHeight: 1.4 }}>
              "Deliverables must be reviewed and approved before payment authorization is enabled."
            </p>

            <TaskDeliverablesManager key={selectedTaskPayment.taskId} taskId={Number(selectedTaskPayment.taskId)} readOnly={contracts.find(contract => contract.task_id === selectedTaskPayment.taskId)?.status !== 'IN_PROGRESS'} />

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
                  const tid = selectedTaskPayment.taskId;
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

      {/* Rate & Review Modal */}
      {reviewingContract && (
        <ClientReviewModal
          isOpen={Boolean(reviewingContract)}
          onClose={() => setReviewingContract(null)}
          taskId={Number(reviewingContract.task_id)}
          taskTitle={reviewingContract.task_title}
          gigProName={reviewingContract.gig_pro_name}
        />
      )}

      {/* Task Two-Sided Reviews Modal */}
      {viewReviewsContract && (
        <TaskReviewsModal
          isOpen={Boolean(viewReviewsContract)}
          onClose={() => setViewReviewsContract(null)}
          contract={contracts.find(c => c.task_id === viewReviewsContract.task_id) || viewReviewsContract}
          currentUserId={user?.userId}
          onOpenRateReview={() => {
            const current = contracts.find(c => c.task_id === viewReviewsContract.task_id) || viewReviewsContract;
            setReviewingContract(current);
          }}
        />
      )}
    </div>
  );
};

export default MyGigs;

