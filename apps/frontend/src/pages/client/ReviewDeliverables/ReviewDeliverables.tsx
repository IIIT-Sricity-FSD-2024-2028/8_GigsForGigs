import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useClient, type Contract, type ContractReview } from '../../../context/ClientContext';
import { usePayments } from '../../../context/PaymentContext/PaymentContext';
import { clientApi, type RawDeliverable } from '../../../services/api/client/clientApi';
import { Badge } from '../../../components/common/Badge';
import { Loader } from '../../../components/common/Loader';
import { safeHttpUrl } from '../../../utils/helpers/safeUrl';
import { ClientReviewModal, TaskReviewsModal } from '../../../components/client';

export interface ReviewDeliverablesProps {
  onNavigate: (viewId: string) => void;
  params?: Record<string, string>;
}

export const ReviewDeliverables: React.FC<ReviewDeliverablesProps> = ({ onNavigate, params }) => {
  const { user } = useAuth();
  const { contracts: clientContracts, tasks, approveDeliverable, rejectDeliverable, refreshContracts } = useClient();
  const { payments, approveAndReleasePayment, raiseDispute, getPaymentByTask, fetchPaymentForTask } = usePayments();
  const taskId = params?.taskId;
  const numericTaskId = Number(String(taskId).replace(/[^0-9]/g, '')) || 1;

  // Retrieve the specific dynamic contract for the clicked task
  const contract = useMemo(() => {
    if (!taskId) return null;
    const foundInClient = clientContracts.find((c) => c.task_id === taskId || c.contract_id === taskId);
    if (foundInClient) {
      return {
        contract_id: foundInClient.contract_id,
        task_id: foundInClient.task_id,
        task_title: foundInClient.task_title,
        client_name: 'Client',
        gig_pro_name: foundInClient.gig_pro_name,
        budget: foundInClient.budget,
        platform_fee: Math.round(foundInClient.budget * 0.07),
        total_paid: Math.round(foundInClient.budget * 1.07),
        payment_status: 'PAYMENT_REQUIRED',
        progress: foundInClient.progress,
        status: foundInClient.status,
        reviews: foundInClient.reviews || ([] as ContractReview[]),
      };
    }
    return null;
  }, [taskId, clientContracts]);

  // Lookup matching task info (for description, deadline, category)
  const taskInfo = useMemo(() => {
    if (!taskId) return null;
    return tasks.find((t) => t.task_id === taskId || String(t.task_id) === String(numericTaskId)) || null;
  }, [taskId, numericTaskId, tasks]);

  const [deliverablesList, setDeliverablesList] = useState<RawDeliverable[]>([]);
  const [selectedDeliverableIndex, setSelectedDeliverableIndex] = useState<number>(0);
  const [loadingDeliverables, setLoadingDeliverables] = useState<boolean>(true);

  // Notifications & error states
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReviewsViewModalOpen, setIsReviewsViewModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  // Approval process state
  const [isApprovingDeliverable, setIsApprovingDeliverable] = useState(false);
  const [approveApiError, setApproveApiError] = useState<string | null>(null);

  // Revision request form state
  const [changesFeedback, setChangesFeedback] = useState('');
  const [revisionFieldError, setRevisionFieldError] = useState<string | null>(null);
  const [revisionApiError, setRevisionApiError] = useState<string | null>(null);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Dispute form state
  const [disputeReason, setDisputeReason] = useState('');

  const fetchDeliverables = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoadingDeliverables(true);
      const dels = await clientApi.getTaskDeliverables(numericTaskId);
      setDeliverablesList(dels || []);
      if (dels && dels.length > 0) {
        setSelectedDeliverableIndex(dels.length - 1);
      }
    } catch (err) {
      setPageError(err instanceof Error && err.message ? err.message : 'Could not fetch deliverable history.');
      setDeliverablesList([]);
    } finally {
      setLoadingDeliverables(false);
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

  const effectiveTaskId = Number(contract?.task_id) || numericTaskId;

  const clientReview = useMemo(() => {
    if (!contract?.reviews || !user) return undefined;
    return contract.reviews.find((r) => r.reviewerId === user.userId);
  }, [contract?.reviews, user]);

  const gigReview = useMemo(() => {
    if (!contract?.reviews || !user) return undefined;
    return contract.reviews.find((r) => r.reviewerId !== user.userId && r.revieweeId === user.userId);
  }, [contract?.reviews, user]);

  const taskPayment = taskId ? getPaymentByTask(taskId) : payments[0];
  const gigAmount = contract?.budget || (taskInfo?.budget ?? 0);
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

  // Step 1: Approve Deliverable
  const handleApproveDeliverable = async () => {
    if (!currentDeliverable || !taskId) return;
    setIsApprovingDeliverable(true);
    setApproveApiError(null);
    try {
      await approveDeliverable(String(numericTaskId), currentDeliverable.deliverableNo);
      setIsApproveModalOpen(false);
      setSuccessNotification(`Deliverable #${currentDeliverable.deliverableNo} approved successfully!`);
      await fetchDeliverables();
      await refreshContracts();
    } catch (err) {
      setApproveApiError(err instanceof Error && err.message ? err.message : 'Failed to approve deliverable.');
    } finally {
      setIsApprovingDeliverable(false);
    }
  };

  // Step 1 Alternative: Request Changes
  const handleConfirmRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeliverable || !taskId) return;
    const trimmed = changesFeedback.trim();
    if (!trimmed) {
      setRevisionFieldError('Revision feedback cannot be empty. Please provide actionable details.');
      return;
    }
    if (trimmed.length > 500) {
      setRevisionFieldError('Revision feedback must not exceed 500 characters.');
      return;
    }
    setIsSubmittingRevision(true);
    setRevisionApiError(null);
    setRevisionFieldError(null);
    try {
      await rejectDeliverable(String(numericTaskId), currentDeliverable.deliverableNo, trimmed);
      setIsChangesModalOpen(false);
      setChangesFeedback('');
      setSuccessNotification(`Revision requested for Deliverable #${currentDeliverable.deliverableNo}. Feedback has been saved and sent to ${contract?.gig_pro_name || 'the professional'}.`);
      await fetchDeliverables();
      await refreshContracts();
    } catch (err) {
      setRevisionApiError(err instanceof Error && err.message ? err.message : 'Failed to submit revision request.');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  // Step 2: Proceed to Payment (Authorized only after Deliverable Approval)
  const handleProcessPayment = async () => {
    if (!taskPayment) {
      setPageError('No payment record found for this task.');
      return;
    }
    try {
      await approveAndReleasePayment(taskPayment.paymentId, 'Deliverable verified & approved by client');
      setIsPaymentModalOpen(false);
      setSuccessNotification(`Payment of ${formatCurrency(totalAmount)} completed successfully!\n${formatCurrency(gigAmount)} released to ${contract?.gig_pro_name || 'the professional'}.`);
      await refreshContracts();
      await fetchDeliverables();
    } catch (err) {
      setPageError(err instanceof Error && err.message ? err.message : 'Payment release failed. Please try again.');
    }
  };

  const handleConfirmDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    if (taskPayment) {
      await raiseDispute(taskPayment.paymentId, disputeReason);
    }
    setIsDisputeModalOpen(false);
    setSuccessNotification('Issue flagged for administrative moderation.');
    onNavigate('my-gigs');
  };

  // Contract not found state
  if (!contract) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        <div className="page-header">
          <button
            type="button"
            onClick={() => onNavigate('my-gigs')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--color-primary-blue)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            ← Back to Active Task/Contracts
          </button>
          <h1 className="page-title">Active Task / Contract Details</h1>
        </div>
        <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-sm)' }}>
            Task / Contract Not Found
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto var(--spacing-lg) auto', lineHeight: 1.5 }}>
            The requested contract or deliverable record could not be found among your active engagements.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={() => onNavigate('my-gigs')}>
            Return to Active Task/Contracts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Page Header */}
      <div className="page-header" style={{ width: '100%', minWidth: 0 }}>
        <button
          type="button"
          onClick={() => onNavigate('my-gigs')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--color-primary-blue)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          ← Back to Active Task/Contracts
        </button>
        <h1 className="page-title" style={{ wordBreak: 'break-word' }}>Review Submitted Deliverables</h1>
        <p className="page-subtitle" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          Inspect work deliverables submitted by <strong>{contract.gig_pro_name}</strong> for task <strong>{contract.task_title}</strong>.
        </p>
      </div>

      {/* Success Notification Banner */}
      {successNotification && (
        <div
          role="status"
          style={{
            backgroundColor: '#DEF7EC',
            color: '#03543F',
            border: '1px solid #BCF0DA',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✓ {successNotification}</span>
          <button
            type="button"
            onClick={() => setSuccessNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#03543F',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Error Banner */}
      {pageError && (
        <div
          role="alert"
          style={{
            backgroundColor: '#FDE8E8',
            color: '#9B1C1C',
            border: '1px solid #F8B4B4',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✕ {pageError}</span>
          <button
            type="button"
            onClick={() => setPageError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9B1C1C',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {loadingDeliverables ? (
        <Loader label="Loading deliverables from PostgreSQL..." />
      ) : !hasDeliverables ? (
        /* Empty State when Gig Pro has not yet submitted deliverables for this specific task */
        <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>⏳</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-sm)' }}>
            No Deliverables Submitted Yet for this Task
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto var(--spacing-lg) auto', lineHeight: 1.5 }}>
            <strong>{contract.gig_pro_name}</strong> is currently working on <strong>{contract.task_title}</strong>. Once they submit work details or artifact links, they will appear here for your review and approval.
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
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--color-border)', paddingBottom: '8px', flexWrap: 'wrap', width: '100%', minWidth: 0 }}>
              {deliverablesList.map((del, idx) => {
                const versionBadge =
                  del.status === 'approved' ? '✓ Approved' :
                  del.status === 'revision_requested' ? '● Revision' :
                  del.status === 'closed' ? 'Closed' : 'Awaiting Review';

                return (
                  <button
                    key={del.deliverableNo}
                    type="button"
                    className={`admin-btn ${selectedDeliverableIndex === idx ? 'admin-btn-primary' : 'admin-btn-outline'} admin-btn-sm`}
                    onClick={() => setSelectedDeliverableIndex(idx)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Version #{del.deliverableNo}</span>
                    <span style={{ fontSize: '10px', opacity: 0.85 }}>({versionBadge})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Review Layout Grid: Responsive Flex Stack */}
          <div
            className="review-deliverables-grid"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--spacing-xl)',
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
          >
            {/* Left Column: Task Info, Submission Info, & Review Information */}
            <div
              style={{
                flex: '1 1 500px',
                minWidth: 0,
                maxWidth: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-lg)',
                boxSizing: 'border-box'
              }}
            >
              {/* Section A: Task Information */}
              <div
                className="admin-card"
                style={{
                  padding: 'var(--spacing-xl)',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: 'var(--spacing-sm)' }}>
                  <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Task Information
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '4px 0 0 0', wordBreak: 'break-word' }}>
                      {contract.task_title}
                    </h2>
                  </div>
                  <span
                    className={`status-badge ${
                      contract.status === 'COMPLETED' ? 'status-completed' :
                      contract.status === 'REVIEWING' ? 'status-review-needed' : 'status-in-progress'
                    }`}
                  >
                    {contract.status.replace('_', ' ')}
                  </span>
                </div>

                {taskInfo?.description && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-dark)', lineHeight: 1.5, margin: '8px 0 12px 0', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {taskInfo.description}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                  <div>
                    <strong>Assigned Professional:</strong> <span style={{ color: 'var(--color-text-dark)', wordBreak: 'break-word' }}>{contract.gig_pro_name}</span>
                  </div>
                  <div>
                    <strong>Contract Value:</strong> <span style={{ color: '#0D568D', fontWeight: 700 }}>{formatCurrency(gigAmount)}</span>
                  </div>
                  {taskInfo?.dueDate && (
                    <div>
                      <strong>Deadline:</strong> <span style={{ color: 'var(--color-text-dark)' }}>{new Date(taskInfo.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section B: Submission Information */}
              <div
                className="admin-card"
                style={{
                  padding: 'var(--spacing-xl)',
                  backgroundColor: 'var(--color-white)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Submission Information — Deliverable #{currentDeliverable?.deliverableNo}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Submitted on {formatDate(currentDeliverable?.createdAt)}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor:
                        currentDeliverable?.status === 'approved' ? '#e6f4ea' :
                        currentDeliverable?.status === 'revision_requested' ? '#fff0f0' :
                        currentDeliverable?.status === 'closed' ? '#f1f3f4' : '#e8f0fe',
                      color:
                        currentDeliverable?.status === 'approved' ? '#137333' :
                        currentDeliverable?.status === 'revision_requested' ? '#c5221f' :
                        currentDeliverable?.status === 'closed' ? '#5f6368' : '#1a73e8'
                    }}
                  >
                    {currentDeliverable?.status === 'submitted' && '● Awaiting Review'}
                    {currentDeliverable?.status === 'revision_requested' && '● Revision Requested'}
                    {currentDeliverable?.status === 'approved' && '✓ Approved'}
                    {currentDeliverable?.status === 'closed' && '✓ Closed'}
                  </span>
                </div>

                {/* Submission claimed deliverable definitions */}
                {currentDeliverable?.claimedDefinitions && currentDeliverable.claimedDefinitions.length > 0 && (
                  <div className="submission-definition__claims" style={{ marginBottom: 'var(--spacing-md)', width: '100%', minWidth: 0 }}>
                    <strong style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Claimed Deliverable Scope:
                    </strong>
                    <div className="submission-definition__claim-list" style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {currentDeliverable.claimedDefinitions.map(item => (
                        <Badge key={item.definitionId} variant="info">{item.title}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission Description */}
                <div style={{ marginBottom: 'var(--spacing-lg)', width: '100%', minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Submission Description &amp; Notes:
                  </div>
                  <div style={{ backgroundColor: 'var(--color-bg-light)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem', color: 'var(--color-text-dark)', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {currentDeliverable?.description}
                  </div>
                </div>

                {/* Submission Path / URL Artifact */}
                <div style={{ backgroundColor: '#F0F6F6', padding: '16px', borderRadius: '8px', border: '1px solid #D5DDE0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <div style={{ minWidth: 0, flex: '1 1 200px', maxWidth: '100%' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Submitted Resource / Artifact URL:
                    </div>
                    {safeHttpUrl(currentDeliverable?.submissionPath) ? (
                      <a
                        href={safeHttpUrl(currentDeliverable?.submissionPath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.85rem', color: 'var(--color-primary-blue)', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all', overflowWrap: 'anywhere', display: 'inline-block', maxWidth: '100%' }}
                      >
                        {currentDeliverable?.submissionPath}
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{currentDeliverable?.submissionPath || 'No link provided'}</span>
                    )}
                  </div>
                  {safeHttpUrl(currentDeliverable?.submissionPath) && (
                    <a
                      href={safeHttpUrl(currentDeliverable?.submissionPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-outline admin-btn-sm"
                      style={{ backgroundColor: '#FFFFFF', flexShrink: 0 }}
                    >
                      🔗 Open Deliverable Artifact
                    </a>
                  )}
                </div>

                {/* Section C: Review Information (Latest Feedback) */}
                {currentDeliverable?.feedback && (
                  <div
                    style={{
                      marginTop: 'var(--spacing-lg)',
                      padding: '14px 16px',
                      borderRadius: '8px',
                      backgroundColor: currentDeliverable.status === 'revision_requested' ? '#FFF5F5' : '#F0F9FF',
                      border: currentDeliverable.status === 'revision_requested' ? '1px solid #FED7D7' : '1px solid #BAE6FD',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: currentDeliverable.status === 'revision_requested' ? '#C53030' : '#0369A1' }}>
                        {currentDeliverable.status === 'revision_requested' ? 'Revision Feedback Sent to Professional' : 'Review Feedback'}
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-dark)', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {currentDeliverable.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Financial Summary & Section D Available Actions */}
            <div
              style={{
                flex: '1 1 340px',
                minWidth: 0,
                maxWidth: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-lg)',
                boxSizing: 'border-box'
              }}
            >
              <div
                className="admin-card"
                style={{
                  padding: 'var(--spacing-lg)',
                  backgroundColor: 'var(--color-white)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
              >
                
                {/* Submitter Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-primary-blue)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {contract.gig_pro_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{contract.gig_pro_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Deliverable #{currentDeliverable?.deliverableNo} • {currentDeliverable?.status === 'submitted' ? 'Awaiting Review' : currentDeliverable?.status?.replace('_', ' ')}
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

                {/* ── Section D: Available Actions ── */}

                {/* Action State 1: Awaiting Review (status === 'submitted') */}
                {currentDeliverable?.status === 'submitted' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Inspect the submitted work and link above. You can approve this deliverable or request specific revisions.
                    </p>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 700, backgroundColor: '#55A99A' }}
                      onClick={() => {
                        setApproveApiError(null);
                        setIsApproveModalOpen(true);
                      }}
                    >
                      Approve Deliverable
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '10px', fontSize: '0.85rem' }}
                      onClick={() => {
                        setRevisionFieldError(null);
                        setRevisionApiError(null);
                        setIsChangesModalOpen(true);
                      }}
                    >
                      Request Revision
                    </button>
                    <button
                      type="button"
                      style={{ padding: '6px', fontSize: '0.75rem', border: 'none', background: 'none', color: '#c5221f', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setIsDisputeModalOpen(true)}
                    >
                      Raise Dispute / Issue
                    </button>
                  </div>
                )}

                {/* Action State 2: Revision Requested (status === 'revision_requested') */}
                {currentDeliverable?.status === 'revision_requested' && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ backgroundColor: '#FFF5F5', padding: '12px', borderRadius: '8px', border: '1px solid #FED7D7' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#C53030', marginBottom: '2px' }}>
                        ● Revision Requested
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#742A2A', lineHeight: 1.4 }}>
                        You requested changes for this deliverable. The Gig Professional has been notified and can submit updated work. Payment remains secured in escrow.
                      </div>
                    </div>
                  </div>
                )}

                {/* Action State 3: Deliverable Approved, task in progress */}
                {currentDeliverable?.status === 'approved' && contract.status !== 'COMPLETED' && (
                  <div style={{ borderTop: '2px solid #55A99A', paddingTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: '#E4F2EF', padding: '12px', borderRadius: '8px', border: '1px solid #55A99A' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#438F82', marginBottom: '2px' }}>
                        ✓ Deliverable Approved
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#3A1F16' }}>
                        This deliverable has been accepted. Authorize payment to complete this task and release funds to the professional.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '14px', fontSize: '1rem', fontWeight: 800, backgroundColor: '#D47700' }}
                      onClick={() => setIsPaymentModalOpen(true)}
                    >
                      Proceed to Payment: {formatCurrency(totalAmount)}
                    </button>
                  </div>
                )}

                {/* Action State 4: Task Completed */}
                {contract.status === 'COMPLETED' && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: '#e6f4ea', padding: '12px', borderRadius: '8px', border: '1px solid #137333', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#137333', marginBottom: '2px' }}>
                        ✓ Task Completed &amp; Paid
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
                            ✓ Your Review of {contract.gig_pro_name}
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
                            {formatDate(clientReview.createdAt)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
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
                            {formatDate(gigReview.createdAt)}
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
                  </div>
                )}

                <button
                  type="button"
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  style={{ marginTop: '12px', width: '100%' }}
                  onClick={() => onNavigate('my-gigs')}
                >
                  Return to Active Task/Contracts
                </button>
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
            <p style={{ fontSize: '14px', color: '#502419', lineHeight: 1.5, marginBottom: '14px' }}>
              You are approving Deliverable #{currentDeliverable.deliverableNo} submitted by <strong>{contract.gig_pro_name}</strong> for <strong>{contract.task_title}</strong>.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.4, marginBottom: '20px', backgroundColor: '#F0F9FF', padding: '10px 12px', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
              Approval accepts this specific deliverable. Approval does not automatically release payment or complete the task.
            </p>
            {approveApiError && (
              <div role="alert" style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#FDE8E8', color: '#9B1C1C', border: '1px solid #F8B4B4', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                {approveApiError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  if (!isApprovingDeliverable) {
                    setIsApproveModalOpen(false);
                    setApproveApiError(null);
                  }
                }}
                disabled={isApprovingDeliverable}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #DBDFDF', backgroundColor: '#FFFFFF', color: '#502419', fontWeight: 600, cursor: isApprovingDeliverable ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveDeliverable}
                disabled={isApprovingDeliverable}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#55A99A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: isApprovingDeliverable ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isApprovingDeliverable ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Request Changes */}
      {isChangesModalOpen && currentDeliverable && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form
            onSubmit={handleConfirmRequestChanges}
            style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#3A1F16', margin: '0 0 8px 0' }}>
              Request Changes / Revisions
            </h3>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0D568D', marginBottom: '8px' }}>
              Deliverable #{currentDeliverable.deliverableNo}
              {currentDeliverable.claimedDefinitions && currentDeliverable.claimedDefinitions.length > 0 &&
                ` (${currentDeliverable.claimedDefinitions.map(d => d.title).join(', ')})`}
            </div>
            <p style={{ fontSize: '13px', color: '#76594F', marginBottom: '16px', lineHeight: 1.4 }}>
              Provide specific revision feedback for <strong>{contract.gig_pro_name}</strong>. The deliverable will be marked for revision and payment remains on hold.
            </p>

            {revisionApiError && (
              <div role="alert" style={{ marginBottom: '12px', padding: '10px 14px', backgroundColor: '#FDE8E8', color: '#9B1C1C', border: '1px solid #F8B4B4', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                {revisionApiError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-dark)', textTransform: 'uppercase' }}>
                  Revision Feedback *
                </label>
                <span style={{ fontSize: '11px', color: changesFeedback.length > 450 ? '#c5221f' : 'var(--color-text-muted)' }}>
                  {changesFeedback.length}/500
                </span>
              </div>
              <textarea
                maxLength={500}
                rows={4}
                placeholder="Explain what revisions or improvements are required (e.g. Please update responsiveness and fix styling on mobile view)..."
                value={changesFeedback}
                onChange={(e) => {
                  setChangesFeedback(e.target.value);
                  if (revisionFieldError) setRevisionFieldError(null);
                }}
                disabled={isSubmittingRevision}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: revisionFieldError ? '1px solid #c5221f' : '1px solid #D5DDE0',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
              {revisionFieldError && (
                <div style={{ color: '#c5221f', fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>
                  {revisionFieldError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingRevision) {
                    setIsChangesModalOpen(false);
                    setRevisionFieldError(null);
                    setRevisionApiError(null);
                  }
                }}
                disabled={isSubmittingRevision}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #DBDFDF', backgroundColor: '#FFFFFF', color: '#502419', fontWeight: 600, cursor: isSubmittingRevision ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRevision}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#D47700',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: isSubmittingRevision ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isSubmittingRevision ? 'Submitting...' : 'Request Revision'}
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
          setSuccessNotification(`Review for ${contract.gig_pro_name} submitted successfully!`);
          refreshContracts();
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

      {/* Modal 6: Raise Dispute */}
      {isDisputeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleConfirmDispute} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#c5221f', margin: '0 0 12px 0' }}>
              Raise Payment Issue / Dispute
            </h3>
            <p style={{ fontSize: '13px', color: '#502419', lineHeight: 1.5, marginBottom: '16px' }}>
              Flags this deliverable for administrative review.
            </p>
            <textarea
              maxLength={1000}
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
