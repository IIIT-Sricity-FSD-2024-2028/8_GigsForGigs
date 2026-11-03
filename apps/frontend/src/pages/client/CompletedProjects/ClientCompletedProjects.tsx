/**
 * @file ClientCompletedProjects.tsx
 * @description
 * Completed projects view for the Client Portal.
 * Displays the Client's genuinely completed projects/contracts, two-sided review
 * feedback (Client's rating & Professional's rating), financial totals, and review actions.
 */

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useClient, type Contract } from '../../../context/ClientContext';
import { PageHeader } from '../../../components/common/PageHeader';
import { ClientReviewModal } from '../../../components/client/modals/ClientReviewModal';
import { TaskReviewsModal } from '../../../components/client/modals/TaskReviewsModal';
import { Button } from '../../../components/common';

export interface ClientCompletedProjectsProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
}

export const ClientCompletedProjects: React.FC<ClientCompletedProjectsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { contracts } = useClient();
  const [reviewingContract, setReviewingContract] = useState<Contract | null>(null);
  const [viewReviewsContract, setViewReviewsContract] = useState<Contract | null>(null);

  // A task can have several hires; each one is completed once its own payment settles.
  const allCompletedProjects: Contract[] = contracts.filter((c) => c.status === 'COMPLETED');

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <PageHeader
        title="Completed Projects"
        description="History of your successfully finished contracts, verified professional feedback, and completed payments."
      />

      {/* Summary KPI Banner */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
            Completed Contracts Portfolio
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: '4px 0 0 0' }}>
            All finished projects where deliverables were approved and payments released.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
            Total Finished
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0D568D' }}>
            {allCompletedProjects.length}
          </span>
        </div>
      </div>

      {allCompletedProjects.length === 0 ? (
        <div
          className="admin-card"
          style={{
            padding: 'var(--spacing-xxl)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>📁</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
            No Completed Projects Found
          </h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto var(--spacing-lg) auto' }}>
            When tasks are completed and payments are released to gig professionals, they will appear here along with mutual ratings and reviews.
          </p>
          <Button size="sm" type="button" onClick={() => onNavigate('my-gigs')}>
            View Active Task
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))',
            gap: 'var(--spacing-lg)',
            width: '100%',
            minWidth: 0,
          }}
        >
          {allCompletedProjects.map((contract) => {
            const displayTotal = contract.total_amount;

            const reviews = contract.reviews || [];
            const clientReview = user?.userId
              ? reviews.find((r) => r.reviewerId === user.userId)
              : undefined;
            const gigReview = user?.userId
              ? reviews.find((r) => r.reviewerId !== user.userId && r.revieweeId === user.userId)
              : undefined;

            return (
              <div
                key={contract.contract_id}
                className="admin-card"
                style={{
                  padding: 'var(--spacing-xl)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--spacing-md)',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  minWidth: 0,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-dark)', margin: 0, wordBreak: 'break-word' }}>
                      {contract.task_title}
                    </h3>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#e6f4ea',
                        color: '#137333',
                        flexShrink: 0,
                      }}
                    >
                      ● Completed
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0D568D', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                        {contract.gig_pro_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span>Professional: <strong style={{ color: 'var(--color-text-dark)' }}>{contract.gig_pro_name}</strong></span>
                    </div>
                    {contract.createdAt && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Finished: {formatDate(contract.createdAt)}</span>
                    )}
                  </div>

                  {/* Financial Details */}
                  <div style={{ backgroundColor: 'var(--color-bg-light)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Total Payment Released:</span>
                    <strong style={{ color: '#0D568D', fontSize: '0.95rem' }}>{formatCurrency(displayTotal)}</strong>
                  </div>

                  {/* Two-Sided Reviews Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {/* Client's review of Professional */}
                    <div
                      style={{
                        padding: '10px 12px',
                        backgroundColor: clientReview ? '#FEF7E0' : 'var(--color-bg-light)',
                        borderRadius: '6px',
                        border: clientReview ? '1px solid #FEEFC3' : '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: clientReview ? '#B06000' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Your Rating for Professional
                        </span>
                        {clientReview && (
                          <span style={{ color: '#B06000', fontSize: '0.8rem', fontWeight: 700 }}>
                            ★ {clientReview.rating}.0
                          </span>
                        )}
                      </div>
                      {clientReview ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dark)', fontStyle: 'italic', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                          "{clientReview.comment || 'No written comment provided.'}"
                        </p>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          Review pending submission
                        </div>
                      )}
                    </div>

                    {/* Professional's review of Client */}
                    <div
                      style={{
                        padding: '10px 12px',
                        backgroundColor: gigReview ? '#F0FDF4' : 'var(--color-bg-light)',
                        borderRadius: '6px',
                        border: gigReview ? '1px solid #BBF7D0' : '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: gigReview ? '#15803D' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Professional's Feedback
                        </span>
                        {gigReview && (
                          <span style={{ color: '#15803D', fontSize: '0.8rem', fontWeight: 700 }}>
                            ★ {gigReview.rating}.0
                          </span>
                        )}
                      </div>
                      {gigReview ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dark)', fontStyle: 'italic', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                          "{gigReview.comment || 'No written comment provided.'}"
                        </p>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          Professional has not submitted feedback yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <Button variant="outline" size="sm" type="button" onClick={() => onNavigate('review-deliverables', { taskId: contract.task_id, gigProfileId: contract.gig_profile_id })}>
                    View Deliverables
                  </Button>

                  {!clientReview ? (
                    <Button size="sm" type="button" onClick={() => setReviewingContract(contract)}>
                      ★ Rate &amp; Review
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" type="button" onClick={() => setViewReviewsContract(contract)}>
                      Reviews ({reviews.length})
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rate & Review Modal */}
      {reviewingContract && (
        <ClientReviewModal
          isOpen={Boolean(reviewingContract)}
          onClose={() => setReviewingContract(null)}
          taskId={Number(reviewingContract.task_id)}
          gigProfileId={Number(reviewingContract.gig_profile_id)}
          taskTitle={reviewingContract.task_title}
          gigProName={reviewingContract.gig_pro_name}
        />
      )}

      {/* Task Two-Sided Reviews Modal */}
      {viewReviewsContract && (
        <TaskReviewsModal
          isOpen={Boolean(viewReviewsContract)}
          onClose={() => setViewReviewsContract(null)}
          contract={contracts.find((c) => c.contract_id === viewReviewsContract.contract_id) || viewReviewsContract}
          currentUserId={user?.userId}
          onOpenRateReview={() => {
            const current = contracts.find((c) => c.contract_id === viewReviewsContract.contract_id) || viewReviewsContract;
            setReviewingContract(current);
          }}
        />
      )}
    </div>
  );
};

export default ClientCompletedProjects;
