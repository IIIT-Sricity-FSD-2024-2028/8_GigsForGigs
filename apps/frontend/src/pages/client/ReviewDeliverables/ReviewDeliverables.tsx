import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useClient, type Contract, type ContractReview } from '../../../context/ClientContext';
import { usePayments } from '../../../context/PaymentContext/PaymentContext';
import { clientApi, type RawDeliverable } from '../../../services/api/client/clientApi';
import { Badge } from '../../../components/common/Badge';
import { safeHttpUrl } from '../../../utils/helpers/safeUrl';
import { ClientReviewModal, TaskReviewsModal } from '../../../components/client';

export interface ReviewDeliverablesProps {
  onNavigate: (viewId: string) => void;
  params?: Record<string, string>;
}

export const ReviewDeliverables: React.FC<ReviewDeliverablesProps> = ({ onNavigate, params }) => {
  const { user } = useAuth();
  const { contracts: clientContracts, approveDeliverable, rejectDeliverable, refreshContracts } = useClient();
  const { payments, approveAndReleasePayment, raiseDispute, getPaymentByTask, fetchPaymentForTask } = usePayments();
  const taskId = params?.taskId;
  const numericTaskId = Number(String(taskId).replace(/[^0-9]/g, '')) || 1;

  // Retrieve the specific dynamic contract for the clicked task
  const contract = useMemo(() => {
    const foundInClient = clientContracts.find((c) => c.task_id === taskId || c.contract_id === taskId);
    if (foundInClient) {
      return {
        contract_id: foundInClient.contract_id,
        task_id: foundInClient.task_id,
        task_title: foundInClient.task_title,
        client_name: 'Client',
        gig_pro_name: foundInClient.gig_pro_name,
        budget: foundInClient.budget || 5000,
        platform_fee: Math.round((foundInClient.budget || 5000) * 0.07),
        total_paid: Math.round((foundInClient.budget || 5000) * 1.07),
        payment_status: 'PAYMENT_REQUIRED',
        progress: foundInClient.status === 'REVIEWING' ? 70 : 30,
        status: foundInClient.status,
        reviews: foundInClient.reviews || ([] as ContractReview[]),
      };
    }

    return {
      contract_id: String(taskId || '1'),
      task_id: String(taskId || '1'),
      task_title: 'Active Task Deliverables',
      client_name: 'Client',
      gig_pro_name: 'Gig Professional',
      budget: 5000,
      platform_fee: 350,
      total_paid: 5350,
      payment_status: 'PAYMENT_REQUIRED',
      progress: 50,
      status: 'IN_PROGRESS',
      reviews: [] as ContractReview[],
    };
  }, [taskId, clientContracts]);

  const [deliverablesList, setDeliverablesList] = useState<RawDeliverable[]>([]);
  const [selectedDeliverableIndex, setSelectedDeliverableIndex] = useState<number>(0);

  const fetchDeliverables = useCallback(async () => {
    if (!taskId) return;
    try {
      const dels = await clientApi.getTaskDeliverables(numericTaskId);
      setDeliverablesList(dels || []);
      if (dels && dels.length > 0) {
        setSelectedDeliverableIndex(dels.length - 1);
      }
    } catch {
      setDeliverablesList([]);
    }
  }, [taskId, numericTaskId]);

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  useEffect(() => {
    if (taskId) fetchPaymentForTask(taskId);
  }, [taskId, fetchPaymentForTask]);

  const hasDeliverables = deliverablesList.length > 0;
  const currentDeliverable = hasDeliverables
    ? deliverablesList[selectedDeliverableIndex] || deliverablesList[deliverablesList.length - 1]
    : null;

  // Modals & form state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReviewsViewModalOpen, setIsReviewsViewModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const [changesFeedback, setChangesFeedback] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  // Current stage: 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'PAYMENT_COMPLETED'
  const [reviewStage, setReviewStage] = useState<'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'PAYMENT_COMPLETED'>(() => {
    if (contract.status === 'COMPLETED') return 'PAYMENT_COMPLETED';
    if (currentDeliverable?.status === 'approved') return 'APPROVED';
    if (currentDeliverable?.status === 'revision_requested') return 'CHANGES_REQUESTED';
    return 'UNDER_REVIEW';
  });

  useEffect(() => {
    if (contract.status === 'COMPLETED') setReviewStage('PAYMENT_COMPLETED');
    else if (currentDeliverable?.status === 'approved') setReviewStage('APPROVED');
    else if (currentDeliverable?.status === 'revision_requested') setReviewStage('CHANGES_REQUESTED');
    else setReviewStage('UNDER_REVIEW');
  }, [currentDeliverable, contract.status]);

  const effectiveTaskId = Number(contract.task_id) || numericTaskId;

  const clientReview = useMemo(() => {
    if (!contract.reviews || !user) return undefined;
    return contract.reviews.find((r) => r.reviewerId === user.userId);
  }, [contract.reviews, user]);

  const gigReview = useMemo(() => {
    if (!contract.reviews || !user) return undefined;
    return contract.reviews.find((r) => r.reviewerId !== user.userId && r.revieweeId === user.userId);
  }, [contract.reviews, user]);

  const taskPayment = taskId ? getPaymentByTask(taskId) : payments[0];
  const gigAmount = contract.budget || 5000;
  const platformFee = Math.round(gigAmount * 0.07);
  const totalAmount = gigAmount + platformFee;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Step 1: Approve Deliverable (Unlocks Payment Section)
  const handleApproveDeliverable = async () => {
    if (!currentDeliverable || !taskId) return;
    try {
      await approveDeliverable(String(numericTaskId), currentDeliverable.deliverableNo);
      setReviewStage('APPROVED');
      setIsApproveModalOpen(false);
      await fetchDeliverables();
      alert('Deliverable approved! Payment authorization is now enabled below.');
    } catch (err) {
      alert(err instanceof Error && err.message ? err.message : 'Failed to approve deliverable.');
    }
  };

  // Step 1 Alternative: Request Changes (Keeps Payment Hidden)
  const handleConfirmRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeliverable || !taskId) return;
    try {
      await rejectDeliverable(String(numericTaskId), currentDeliverable.deliverableNo, changesFeedback);
      setReviewStage('CHANGES_REQUESTED');
      setIsChangesModalOpen(false);
      await fetchDeliverables();
      alert(`Changes requested. Feedback sent to ${contract.gig_pro_name}. Payment remains on hold.`);
    } catch (err) {
      alert(err instanceof Error && err.message ? err.message : 'Failed to submit revision request.');
    }
  };

  // Step 2: Proceed to Payment (Authorized only after Deliverable Approval)
  const handleProcessPayment = async () => {
    if (!taskPayment) {
      alert('No payment record found for this task.');
      return;
    }
    try {
      await approveAndReleasePayment(taskPayment.paymentId, 'Deliverable verified & approved by client');
      setReviewStage('PAYMENT_COMPLETED');
      setIsPaymentModalOpen(false);
      await refreshContracts();
      alert(`Payment of ${formatCurrency(totalAmount)} completed successfully!\n\n• ${formatCurrency(gigAmount)} released to ${contract.gig_pro_name}\n• ${formatCurrency(platformFee)} recorded as Platform Revenue.`);
    } catch (err) {
      alert(err instanceof Error && err.message ? err.message : 'Payment release failed. Please try again.');
    }
  };

  const handleConfirmDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    if (taskPayment) {
      await raiseDispute(taskPayment.paymentId, disputeReason);
    }
    setIsDisputeModalOpen(false);
    alert('Issue flagged for Super Admin moderation.');
    onNavigate('my-gigs');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Page Header */}
      <div className="page-header">
        <a
          href="#my-gigs"
          onClick={(e) => { e.preventDefault(); onNavigate('my-gigs'); }}
          className="back-link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--color-secondary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)' }}
        >
          ← Back to Active Task/Contracts
        </a>
        <h1 className="page-title">Review Submitted Deliverables</h1>
        <p className="page-subtitle">
          Inspect dynamic work deliverables submitted by <strong>{contract.gig_pro_name}</strong> for task <strong>{contract.task_title}</strong>.
        </p>
      </div>

      {!hasDeliverables ? (
        /* Empty State when Gig Pro has not yet submitted deliverables for this specific task */
        <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>⏳</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-sm)' }}>
            No Deliverables Submitted Yet for this Task
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto var(--spacing-lg) auto', lineHeight: 1.5 }}>
            <strong>{contract.gig_pro_name}</strong> is currently working on <strong>{contract.task_title}</strong>. Once they submit their deliverable files or pull request links, they will appear here for your review and approval.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={() => onNavigate('my-gigs')}>
            Return to Active Task/Contracts
          </button>
        </div>
      ) : (
        /* Deliverable Review Interface for the specific task */
        <>
          {/* Deliverable Versions Tab Header if multiple submissions exist */}
          {deliverablesList.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--color-border)', paddingBottom: '8px' }}>
              {deliverablesList.map((del, idx) => (
                <button
                  key={idx}
                  className={`admin-btn ${selectedDeliverableIndex === idx ? 'admin-btn-primary' : 'admin-btn-outline'} admin-btn-sm`}
                  onClick={() => setSelectedDeliverableIndex(idx)}
                >
                  Deliverable Version #{del.deliverableNo} ({formatDate(del.createdAt)})
                </button>
              ))}
            </div>
          )}

          {/* Main Review Layout Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--spacing-xl)' }}>
            
            {/* Left Column: Dynamic Deliverable Content & Live Artifact Link */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              <div className="admin-card" style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Dynamic Deliverable Submission #{currentDeliverable?.deliverableNo}
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '4px 0 0 0' }}>
                      {contract.task_title}
                    </h2>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor:
                        reviewStage === 'PAYMENT_COMPLETED' || reviewStage === 'APPROVED' ? '#e6f4ea' :
                        reviewStage === 'CHANGES_REQUESTED' ? '#fff0f0' : '#e8f0fe',
                      color:
                        reviewStage === 'PAYMENT_COMPLETED' || reviewStage === 'APPROVED' ? '#137333' :
                        reviewStage === 'CHANGES_REQUESTED' ? '#c5221f' : '#1a73e8'
                    }}
                  >
                    {reviewStage === 'UNDER_REVIEW' && '● SUBMITTED – UNDER REVIEW'}
                    {reviewStage === 'CHANGES_REQUESTED' && '● CHANGES REQUESTED'}
                    {reviewStage === 'APPROVED' && '✓ APPROVED – READY FOR PAYMENT'}
                    {reviewStage === 'PAYMENT_COMPLETED' && '✓ PAYMENT COMPLETED'}
                  </span>
                </div>

                {/* Dynamic Submission Content */}
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Gig Professional Work Submission &amp; Notes:
                  </div>
                  <div style={{ backgroundColor: 'var(--color-bg-light)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem', color: 'var(--color-text-dark)', lineHeight: 1.6 }}>
                    {currentDeliverable?.description}
                  </div>
                </div>

                {currentDeliverable?.claimedDefinitions && currentDeliverable.claimedDefinitions.length > 0 && <div className="submission-definition__claims">
                  <strong>This submission claims:</strong>
                  <div className="submission-definition__claim-list">{currentDeliverable.claimedDefinitions.map(item => <Badge key={item.definitionId} variant="info">{item.title}</Badge>)}</div>
                </div>}

                {/* Submission Path / URL Artifact */}
                <div style={{ backgroundColor: '#F0F6F6', padding: '16px', borderRadius: '8px', border: '1px solid #D5DDE0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase' }}>
                      Submitted Resource / Artifact URL:
                    </div>
                    {safeHttpUrl(currentDeliverable?.submissionPath) ? (
                      <a
                        href={safeHttpUrl(currentDeliverable?.submissionPath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.85rem', color: 'var(--color-primary-blue)', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}
                      >
                        {currentDeliverable?.submissionPath}
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{currentDeliverable?.submissionPath || 'No link provided'}</span>
                    )}
                  </div>
                  {safeHttpUrl(currentDeliverable?.submissionPath) && <a
                    href={safeHttpUrl(currentDeliverable?.submissionPath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    style={{ backgroundColor: '#FFFFFF' }}
                  >
                    🔗 Open Deliverable Artifact
                  </a>}
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Review & Approval Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              <div className="admin-card" style={{ padding: 'var(--spacing-lg)', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)' }}>
                
                {/* Submitter Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-primary-blue)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {contract.gig_pro_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{contract.gig_pro_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Submitted on {formatDate(currentDeliverable?.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div style={{ backgroundColor: 'var(--color-bg-light)', padding: '14px', borderRadius: '8px', marginBottom: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Agreed Project Amount:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(gigAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Platform Fee (7%):</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(platformFee)}</span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800 }}>
                    <span>Total Payment:</span>
                    <span style={{ color: '#0D568D' }}>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* ── STEP 1: ACTIONS BEFORE APPROVAL (Payment is HIDDEN) ── */}
                {(reviewStage === 'UNDER_REVIEW' || reviewStage === 'CHANGES_REQUESTED') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Inspect the submitted content and link above. You must approve the work before payment authorization is enabled.
                    </p>
                    <button
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 700, backgroundColor: '#55A99A' }}
                      onClick={() => setIsApproveModalOpen(true)}
                    >
                      Approve Deliverable
                    </button>
                    <button
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '10px', fontSize: '0.85rem' }}
                      onClick={() => setIsChangesModalOpen(true)}
                    >
                      Request Changes
                    </button>
                    <button
                      style={{ padding: '6px', fontSize: '0.75rem', border: 'none', background: 'none', color: '#c5221f', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setIsDisputeModalOpen(true)}
                    >
                      Raise Dispute / Issue
                    </button>
                  </div>
                )}

                {/* ── STEP 2: PAYMENT BUTTON (ONLY VISIBLE AFTER DELIVERABLE APPROVAL) ── */}
                {reviewStage === 'APPROVED' && (
                  <div style={{ borderTop: '2px solid #55A99A', paddingTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: '#E4F2EF', padding: '12px', borderRadius: '8px', border: '1px solid #55A99A' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#438F82', marginBottom: '2px' }}>
                        ✓ Deliverable Approved
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#3A1F16' }}>
                        The submitted deliverable meets requirements. Authorize payment to complete this task.
                      </div>
                    </div>

                    <button
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '14px', fontSize: '1rem', fontWeight: 800, backgroundColor: '#D47700' }}
                      onClick={() => setIsPaymentModalOpen(true)}
                    >
                      Proceed to Payment: {formatCurrency(totalAmount)}
                    </button>
                  </div>
                )}

                {/* ── STEP 3: COMPLETED STATE & REVIEW PROMPT ── */}
                {reviewStage === 'PAYMENT_COMPLETED' && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: '#e6f4ea', padding: '12px', borderRadius: '8px', border: '1px solid #137333', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#137333', marginBottom: '2px' }}>
                        ✓ Payment Completed
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#137333' }}>
                        {formatCurrency(gigAmount)} released to {contract.gig_pro_name}.
                      </div>
                    </div>

                    {/* Client Review Section */}
                    {clientReview ? (
                      <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            ✓ Your Review Submitted
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#eab308' }}>
                            {'★'.repeat(clientReview.rating)}{'☆'.repeat(5 - clientReview.rating)} ({clientReview.rating}.0)
                          </span>
                        </div>
                        {clientReview.comment && (
                          <p style={{ fontSize: '0.82rem', color: '#1f2937', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                            "{clientReview.comment}"
                          </p>
                        )}
                        {clientReview.createdAt && (
                          <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '6px', textAlign: 'right' }}>
                            {new Date(clientReview.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        className="admin-btn admin-btn-outline"
                        style={{ padding: '10px', fontSize: '0.85rem', fontWeight: 700, borderColor: '#0D568D', color: '#0D568D' }}
                        onClick={() => setIsReviewModalOpen(true)}
                      >
                        ★ Rate &amp; Review Gig Professional
                      </button>
                    )}

                    {/* Gig Professional Review Section */}
                    {gigReview && (
                      <div style={{ backgroundColor: '#fdf4ff', padding: '12px', borderRadius: '8px', border: '1px solid #f5d0fe' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#86198f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {contract.gig_pro_name}'s Review of You
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#eab308' }}>
                            {'★'.repeat(gigReview.rating)}{'☆'.repeat(5 - gigReview.rating)} ({gigReview.rating}.0)
                          </span>
                        </div>
                        {gigReview.comment && (
                          <p style={{ fontSize: '0.82rem', color: '#1f2937', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                            "{gigReview.comment}"
                          </p>
                        )}
                        {gigReview.createdAt && (
                          <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '6px', textAlign: 'right' }}>
                            {new Date(gigReview.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </div>
                        )}
                      </div>
                    )}

                    {contract.reviews && contract.reviews.length > 0 && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{ fontSize: '0.8rem' }}
                        onClick={() => setIsReviewsViewModalOpen(true)}
                      >
                        View Two-Sided Project Reviews ({contract.reviews.length})
                      </button>
                    )}

                    <button
                      className="admin-btn admin-btn-primary admin-btn-sm"
                      onClick={() => onNavigate('my-gigs')}
                    >
                      Return to Active Task/Contracts
                    </button>
                  </div>
                )}

              </div>
            </div>

          </div>
        </>
      )}

      {/* Modal 1: Approve Deliverable Confirmation */}
      {isApproveModalOpen && currentDeliverable && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '460px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0D568D', margin: '0 0 12px 0' }}>
              Approve Submitted Deliverable?
            </h3>
            <p style={{ fontSize: '14px', color: '#502419', lineHeight: 1.5, marginBottom: '20px' }}>
              You are approving Deliverable #{currentDeliverable.deliverableNo} submitted by <strong>{contract.gig_pro_name}</strong> for <strong>{contract.task_title}</strong>. After approval, you can authorize payment.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #DBDFDF', backgroundColor: '#FFFFFF', color: '#502419', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveDeliverable}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#55A99A', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Request Changes */}
      {isChangesModalOpen && currentDeliverable && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleConfirmRequestChanges} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '460px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#3A1F16', margin: '0 0 12px 0' }}>
              Request Changes / Revisions
            </h3>
            <p style={{ fontSize: '13px', color: '#76594F', marginBottom: '16px' }}>
              Provide specific revision feedback for <strong>{contract.gig_pro_name}</strong>. Payment remains on hold.
            </p>
            <textarea maxLength={500}
              required
              rows={4}
              placeholder="e.g. Please update the navigation responsiveness and add unit test coverage..."
              value={changesFeedback}
              onChange={(e) => setChangesFeedback(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5DDE0', fontSize: '13px', boxSizing: 'border-box', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsChangesModalOpen(false)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #DBDFDF', backgroundColor: '#FFFFFF', color: '#502419', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#D47700', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                Send Revision Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Payment Release */}
      {isPaymentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0D568D', margin: '0 0 12px 0' }}>
              Authorize Payment Release
            </h3>
            <p style={{ fontSize: '14px', color: '#502419', lineHeight: 1.5, marginBottom: '20px' }}>
              Releasing payment for <strong>{contract.task_title}</strong>:
            </p>
            <div style={{ backgroundColor: '#F0F6F6', borderRadius: '8px', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Gig Professional ({contract.gig_pro_name}):</span>
                <strong>{formatCurrency(gigAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Platform Fee (7%):</span>
                <strong>{formatCurrency(platformFee)}</strong>
              </div>
              <div style={{ borderTop: '1px solid #DBDFDF', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                <span>Total Payment:</span>
                <span style={{ color: '#0D568D' }}>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #DBDFDF', backgroundColor: '#FFFFFF', color: '#502419', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#D47700', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                Pay {formatCurrency(totalAmount)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Client Review Modal */}
      <ClientReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        taskId={effectiveTaskId}
        taskTitle={contract.task_title}
        gigProName={contract.gig_pro_name}
        onSuccess={() => {
          setIsReviewModalOpen(false);
        }}
      />

      {/* Modal 5: Task Reviews View Modal */}
      <TaskReviewsModal
        isOpen={isReviewsViewModalOpen}
        onClose={() => setIsReviewsViewModalOpen(false)}
        contract={
          clientContracts.find((c) => c.task_id === taskId || c.contract_id === taskId) || {
            contract_id: contract.contract_id,
            task_id: contract.task_id,
            task_title: contract.task_title,
            gig_pro_name: contract.gig_pro_name,
            budget: contract.budget,
            progress: contract.progress,
            status: contract.status as Contract['status'],
            createdAt: '',
            reviews: contract.reviews,
          }
        }
        currentUserId={user?.userId}
        onOpenRateReview={() => {
          setIsReviewsViewModalOpen(false);
          setIsReviewModalOpen(true);
        }}
      />

      {/* Modal 5: Raise Dispute */}
      {isDisputeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleConfirmDispute} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#c5221f', margin: '0 0 12px 0' }}>
              Raise Payment Issue / Dispute
            </h3>
            <p style={{ fontSize: '13px', color: '#502419', lineHeight: 1.5, marginBottom: '16px' }}>
              Flags this deliverable for administrative review.
            </p>
            <textarea maxLength={1000}
              required
              rows={3}
              placeholder="Explain the issue with this deliverable..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DBDFDF', fontSize: '13px', boxSizing: 'border-box', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsDisputeModalOpen(false)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #DBDFDF', backgroundColor: '#FFFFFF', color: '#502419', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#c5221f', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                Submit Dispute
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default ReviewDeliverables;
