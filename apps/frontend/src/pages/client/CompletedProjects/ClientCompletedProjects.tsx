/**
 * @file ClientCompletedProjects.tsx
 * @description
 * Completed projects view for the Client Portal.
 * Displays the Client's genuinely completed projects/contracts, two-sided review
 * feedback (Client's rating & Professional's rating), financial totals, and review actions.
 * Migrated to Redux Toolkit (clientSlice).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import type { Contract, ContractReview } from '../../../context/ClientContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchClientContracts } from '../../../store/client/clientSlice';
import {
  selectClientContracts,
  selectClientContractsRequest,
} from '../../../store/client/selectors';
import { PageHeader } from '../../../components/common/PageHeader';
import { ClientReviewModal } from '../../../components/client/modals/ClientReviewModal';
import { TaskReviewsModal } from '../../../components/client/modals/TaskReviewsModal';
import { Button } from '../../../components/common';

export interface ClientCompletedProjectsProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
}

export const ClientCompletedProjects: React.FC<ClientCompletedProjectsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const rawContracts = useAppSelector(selectClientContracts);
  const contractsRequest = useAppSelector(selectClientContractsRequest);

  const [reviewingContract, setReviewingContract] = useState<Contract | null>(null);
  const [viewReviewsContract, setViewReviewsContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (contractsRequest.status === 'idle') {
      dispatch(fetchClientContracts());
    }
  }, [dispatch, contractsRequest.status]);

  // A task can have several hires; each one is completed once its own payment settles.
  const allCompletedProjects: Contract[] = useMemo(() => {
    return rawContracts
      .filter((c) => c.status === 'completed' || (c.status as string) === 'COMPLETED')
      .map((found) => ({
        contract_id: `${found.taskId}-${found.gigProfileId}`,
        task_id: String(found.taskId),
        gig_profile_id: String(found.gigProfileId),
        task_title: found.taskTitle,
        gig_pro_name: found.gigProfessionalName,
        status: 'COMPLETED' as const,
        progress: found.progress,
        budget: Number(found.budget),
        payment_id: found.paymentId,
        platform_fee: Number(found.platformFee),
        total_amount: Number(found.totalAmount),
        payment_status: found.paymentStatus,
        manager_id: found.managerId,
        submission_count: found.submissionCount ?? 0,
        work_status: found.workStatus,
        has_open_dispute: found.hasOpenDispute ?? false,
        createdAt: found.createdAt,
        reviews: (found.reviews as ContractReview[]) || [],
      }));
  }, [rawContracts]);

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
          <p style={{ fontSize: 'var(--font-size-sm)', maxWidth: '440px', margin: '0 auto var(--spacing-lg) auto' }}>
            You haven't completed any hired tasks yet. Finished tasks will show up here along with their review records once payments are settled.
          </p>
          <Button onClick={() => onNavigate('dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)' }}>
          {allCompletedProjects.map((contract) => {
            const clientReview = user?.userId
              ? contract.reviews?.find((r) => r.reviewerId === user.userId)
              : undefined;

            const gigReview = user?.userId
              ? contract.reviews?.find((r) => r.reviewerId !== user.userId && r.revieweeId === user.userId)
              : undefined;

            return (
              <div
                key={contract.contract_id}
                className="admin-card"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  padding: 'var(--spacing-xl)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-md)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#475764', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Task #{contract.task_id} &middot; Contract #{contract.contract_id}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '4px 0' }}>
                      {contract.task_title}
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                      Gig Professional: <strong>{contract.gig_pro_name}</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0D568D', display: 'block' }}>
                      {formatCurrency(contract.budget)}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#DEF7EC',
                        color: '#03543F',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        marginTop: '4px',
                      }}
                    >
                      ✓ COMPLETED &amp; PAID
                    </span>
                  </div>
                </div>

                {/* Submissions & Completion progress info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'var(--color-bg-light)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    Approved Deliverables: <strong>{contract.submission_count} item(s)</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Contract Progress: <strong>{contract.progress}%</strong>
                  </span>
                  {contract.createdAt && (
                    <>
                      <span>&bull;</span>
                      <span>Hired on: {formatDate(contract.createdAt)}</span>
                    </>
                  )}
                </div>

                {/* Review Snippets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '6px' }}>
                  {/* Client's Review of Professional */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: clientReview ? '#F0FDF4' : '#FFF9F2',
                      border: `1px solid ${clientReview ? '#BBF7D0' : '#FFE8D1'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: clientReview ? '#15803D' : '#B45F00', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Your Feedback
                        </span>
                        {clientReview && (
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#EAB308' }}>
                            {'★'.repeat(clientReview.rating)}{'☆'.repeat(5 - clientReview.rating)} ({clientReview.rating}.0)
                          </span>
                        )}
                      </div>
                      {clientReview ? (
                        <p style={{ fontSize: '13px', color: '#1F2937', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                          "{clientReview.comment || 'No comment provided.'}"
                        </p>
                      ) : (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                          You have not rated {contract.gig_pro_name} yet.
                        </p>
                      )}
                    </div>

                    {!clientReview && (
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => setReviewingContract(contract)}
                        style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                      >
                        ★ Rate {contract.gig_pro_name}
                      </Button>
                    )}
                  </div>

                  {/* Gig Professional's Review of Client */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: gigReview ? '#FDF4FF' : '#F9FAFB',
                      border: `1px solid ${gigReview ? '#F5D0FE' : '#E5E7EB'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: gigReview ? '#86198F' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {contract.gig_pro_name}'s Review
                      </span>
                      {gigReview && (
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#EAB308' }}>
                          {'★'.repeat(gigReview.rating)}{'☆'.repeat(5 - gigReview.rating)} ({gigReview.rating}.0)
                        </span>
                      )}
                    </div>
                    {gigReview ? (
                      <p style={{ fontSize: '13px', color: '#1F2937', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{gigReview.comment || 'No comment provided.'}"
                      </p>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                        Professional hasn't submitted a client review yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Links */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => onNavigate('review-deliverables', { taskId: String(contract.task_id), gigProfileId: String(contract.gig_profile_id) })}
                  >
                    View Project Details &amp; History &rarr;
                  </Button>

                  {contract.reviews && contract.reviews.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setViewReviewsContract(contract)}
                    >
                      View All Reviews ({contract.reviews.length})
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
          onSuccess={() => {
            setReviewingContract(null);
            dispatch(fetchClientContracts());
          }}
        />
      )}

      {/* Task Two-Sided Reviews Modal */}
      {viewReviewsContract && (
        <TaskReviewsModal
          isOpen={Boolean(viewReviewsContract)}
          onClose={() => setViewReviewsContract(null)}
          contract={allCompletedProjects.find((c) => c.contract_id === viewReviewsContract.contract_id) || viewReviewsContract}
          currentUserId={user?.userId}
          onOpenRateReview={() => {
            const current = allCompletedProjects.find((c) => c.contract_id === viewReviewsContract.contract_id) || viewReviewsContract;
            setReviewingContract(current);
          }}
        />
      )}
    </div>
  );
};

export default ClientCompletedProjects;
