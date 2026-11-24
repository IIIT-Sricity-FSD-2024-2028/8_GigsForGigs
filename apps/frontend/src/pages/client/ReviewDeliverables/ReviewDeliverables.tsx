import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import type { Contract, ContractReview } from '../../../types/client';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchClientContracts,
  fetchClientTasks,
  fetchTaskDeliverableDefinitions,
  createTaskDeliverable,
  updateTaskDeliverable,
  deleteTaskDeliverable,
  fetchTaskSubmittedDeliverables,
  reviewSubmittedDeliverable,
  releaseClientPayment,
} from '../../../store/client/clientSlice';
import {
  selectClientContracts,
  selectClientContractsRequest,
  selectClientTasks,
  selectClientTasksRequest,
  selectDeliverableDefinitionsByTask,
  selectDeliverableDefinitionsRequest,
  selectDefinitionMutation,
  selectSubmittedDeliverablesByTask,
  selectSubmittedDeliverablesRequest,
} from '../../../store/client/selectors';
import { FundTaskCard } from '../../../components/client/cards/FundTaskCard';
import { TaskDeliverablesManager } from '../../../components/client/sections/TaskDeliverablesManager';
import { PAYMENT_STATUS_UI } from '../../../utils/paymentStatus';
import { Loader } from '../../../components/common/Loader';
import { safeHttpUrl } from '../../../utils/safeUrl';
import { ClientReviewModal, TaskReviewsModal } from '../../../components/client';
import { Button, TextArea, useToast } from '../../../components/common';

export interface ReviewDeliverablesProps {
  onNavigate: (viewId: string) => void;
  params?: Record<string, string>;
}

export const ReviewDeliverables: React.FC<ReviewDeliverablesProps> = ({ onNavigate, params }) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const taskId = params?.taskId;
  const gigProfileId = params?.gigProfileId;
  const numericTaskId = Number(String(taskId).replace(/[^0-9]/g, '')) || 1;

  const clientContracts = useAppSelector(selectClientContracts);
  const contractsRequest = useAppSelector(selectClientContractsRequest);
  const tasks = useAppSelector(selectClientTasks);
  const tasksRequest = useAppSelector(selectClientTasksRequest);

  const definitions = useAppSelector((state) => selectDeliverableDefinitionsByTask(state, numericTaskId));
  const definitionsRequest = useAppSelector((state) => selectDeliverableDefinitionsRequest(state, numericTaskId));
  const definitionsBusy = useAppSelector((state) => selectDefinitionMutation(state, numericTaskId));

  const allDeliverables = useAppSelector((state) => selectSubmittedDeliverablesByTask(state, numericTaskId));
  const deliverablesRequest = useAppSelector((state) => selectSubmittedDeliverablesRequest(state, numericTaskId));

  // Retrieve the specific dynamic contract for the clicked task
  const contract = useMemo((): Contract | null => {
    if (!numericTaskId) return null;
    const found = clientContracts.find(
      (c) => c.taskId === numericTaskId && (!gigProfileId || String(c.gigProfileId) === String(gigProfileId)),
    );
    if (!found) return null;

    return {
      contract_id: `${found.taskId}-${found.gigProfileId}`,
      task_id: String(found.taskId),
      gig_profile_id: String(found.gigProfileId),
      task_title: found.taskTitle,
      gig_pro_name: found.gigProfessionalName,
      status: (found.status === 'completed' ? 'COMPLETED' : 'IN_PROGRESS') as 'IN_PROGRESS' | 'COMPLETED',
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
    };
  }, [numericTaskId, gigProfileId, clientContracts]);

  // Lookup matching task info (for description, deadline, category)
  const taskInfo = useMemo(() => {
    if (!numericTaskId) return null;
    return tasks.find((t) => t.taskId === numericTaskId) || null;
  }, [numericTaskId, tasks]);

  useEffect(() => {
    if (contractsRequest.status === 'idle') {
      dispatch(fetchClientContracts());
    }
    if (tasksRequest.status === 'idle') {
      dispatch(fetchClientTasks());
    }
    if (numericTaskId) {
      dispatch(fetchTaskDeliverableDefinitions(numericTaskId));
      dispatch(fetchTaskSubmittedDeliverables(numericTaskId));
    }
  }, [dispatch, contractsRequest.status, tasksRequest.status, numericTaskId]);

  // The task endpoint returns every hire's submissions; this page is for one professional.
  const deliverablesList = useMemo(
    () => (contract ? allDeliverables.filter((d) => String(d.gigProfileId) === contract.gig_profile_id) : allDeliverables),
    [allDeliverables, contract],
  );
  const [selectedDeliverableIndex, setSelectedDeliverableIndex] = useState<number>(0);

  // Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReviewsViewModalOpen, setIsReviewsViewModalOpen] = useState(false);

  // Approval process state
  const [isApprovingDeliverable, setIsApprovingDeliverable] = useState(false);
  const [approveApiError, setApproveApiError] = useState<string | null>(null);

  // Revision request form state
  const [changesFeedback, setChangesFeedback] = useState('');
  const [revisionFieldError, setRevisionFieldError] = useState<string | null>(null);
  const [revisionApiError, setRevisionApiError] = useState<string | null>(null);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const hasDeliverables = deliverablesList.length > 0;
  const currentDeliverable = hasDeliverables
    ? deliverablesList[selectedDeliverableIndex] || deliverablesList[deliverablesList.length - 1]
    : null;

  const effectiveTaskId = Number(contract?.task_id) || numericTaskId;

  const clientReview = useMemo(() => {
    if (!contract?.reviews || !user) return undefined;
    return contract.reviews.find((r) => r.reviewerId === user.userId);
  }, [contract, user]);

  const gigReview = useMemo(() => {
    if (!contract?.reviews || !user) return undefined;
    return contract.reviews.find((r) => r.reviewerId !== user.userId && r.revieweeId === user.userId);
  }, [contract, user]);

  // Amounts come from the stored payment row (via the contract), never recomputed here.
  const gigAmount = contract?.budget ?? (taskInfo?.budget ? Number(taskInfo.budget) : 0);
  const platformFee = contract?.platform_fee ?? 0;
  const totalAmount = contract?.total_amount ?? gigAmount;
  // Release unlocks only once the client has funded the task and every deliverable is approved.
  const canRelease = contract?.payment_status === 'held' && contract.progress === 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
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
      await dispatch(
        reviewSubmittedDeliverable({
          taskId: numericTaskId,
          deliverableNo: currentDeliverable.deliverableNo,
          status: 'approved',
        }),
      ).unwrap();
      setIsApproveModalOpen(false);
      toast.success(`Deliverable #${currentDeliverable.deliverableNo} approved successfully!`);
    } catch (err) {
      setApproveApiError(typeof err === 'string' ? err : 'Failed to approve deliverable.');
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
      await dispatch(
        reviewSubmittedDeliverable({
          taskId: numericTaskId,
          deliverableNo: currentDeliverable.deliverableNo,
          status: 'revision_requested',
          feedback: trimmed,
        }),
      ).unwrap();
      setIsChangesModalOpen(false);
      setChangesFeedback('');
      toast.success(
        `Revision requested for Deliverable #${currentDeliverable.deliverableNo}. Feedback has been saved and sent to ${
          contract?.gig_pro_name || 'the professional'
        }.`,
      );
    } catch (err) {
      setRevisionApiError(typeof err === 'string' ? err : 'Failed to submit revision request.');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  // Step 2: Proceed to Payment (Authorized only after Deliverable Approval)
  const handleProcessPayment = async () => {
    if (!contract) return;
    try {
      await dispatch(
        releaseClientPayment({
          taskId: Number(contract.task_id),
          gigProfileId: Number(contract.gig_profile_id),
        }),
      ).unwrap();
      setIsPaymentModalOpen(false);
      toast.success(`Payment released! ${formatCurrency(gigAmount)} sent to ${contract.gig_pro_name}; ${formatCurrency(platformFee)} kept as platform fee.`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Payment release failed. Please try again.');
    }
  };

  // Deliverable definitions CRUD handlers passed to presentational TaskDeliverablesManager
  const handleCreateDefinition = async (values: { title: string; description?: string }) => {
    try {
      await dispatch(createTaskDeliverable({ taskId: numericTaskId, values })).unwrap();
      return null;
    } catch (err) {
      return typeof err === 'string' ? err : 'Could not add the deliverable.';
    }
  };

  const handleUpdateDefinition = async (definitionId: number, values: { title: string; description: string }) => {
    try {
      await dispatch(updateTaskDeliverable({ taskId: numericTaskId, definitionId, values })).unwrap();
      return null;
    } catch (err) {
      return typeof err === 'string' ? err : 'Could not update the deliverable.';
    }
  };

  const handleDeleteDefinition = async (definitionId: number) => {
    try {
      await dispatch(deleteTaskDeliverable({ taskId: numericTaskId, definitionId })).unwrap();
      return null;
    } catch (err) {
      return typeof err === 'string' ? err : 'Could not remove the deliverable.';
    }
  };

  // Contract not found state
  if (!contract) {
    if (contractsRequest.status === 'loading') {
      return <Loader label="Loading task details..." />;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        <div className="page-header">
          <Button variant="ghost" size="sm" type="button" onClick={() => onNavigate('my-gigs')} style={{ marginBottom: 'var(--spacing-sm)' }}>
            ← Back to Active Task
          </Button>
          <h1 className="page-title">Active Task Details</h1>
        </div>
        <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-sm)' }}>
            Task / Contract Not Found
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto var(--spacing-lg) auto', lineHeight: 1.5 }}>
            The requested contract or deliverable record could not be found among your active engagements.
          </p>
          <Button onClick={() => onNavigate('my-gigs')}>
            Return to Active Task
          </Button>
        </div>
      </div>
    );
  }

  const loadingDeliverables = deliverablesRequest.status === 'loading' && deliverablesList.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Page Header */}
      <div className="page-header" style={{ width: '100%', minWidth: 0 }}>
        <Button variant="ghost" size="sm" type="button" onClick={() => onNavigate('my-gigs')} style={{ marginBottom: 'var(--spacing-sm)' }}>
          ← Back to Active Task
        </Button>
      </div>

      {contract.payment_status === 'pending' && (
        <FundTaskCard
          contract={contract}
          onPaid={() => {
            dispatch(fetchClientContracts());
          }}
        />
      )}

      {loadingDeliverables ? (
        <Loader label="Loading deliverables..." />
      ) : (
        <>
          {/* Task summary */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '28px', border: '1px solid #DCE3E8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475764', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Task #{contract.task_id}</span>
                <h1 style={{ fontSize: '24px', color: '#0D568D', margin: '4px 0 8px 0', fontWeight: 700 }}>{contract.task_title}</h1>
              </div>
              <span className={`status-badge ${contract.status === 'COMPLETED' ? 'status-completed' : 'status-in-progress'}`}>{contract.status.replace('_', ' ')}</span>
            </div>
            {taskInfo?.description && <p style={{ color: '#1B2A36', fontSize: '15px', lineHeight: 1.6, marginTop: '12px' }}>{taskInfo.description}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #F0F4F6' }}>
              <div><div style={{ fontSize: '12px', color: '#475764' }}>Gig Professional</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#1B2A36', marginTop: '2px' }}>{contract.gig_pro_name}</div></div>
              <div><div style={{ fontSize: '12px', color: '#475764' }}>Task Budget</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#1B2A36', marginTop: '2px' }}>{formatCurrency(gigAmount)}</div></div>
              <div><div style={{ fontSize: '12px', color: '#475764' }}>Payment</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#1B2A36', marginTop: '2px' }}>{contract.payment_status ? PAYMENT_STATUS_UI[contract.payment_status].label : '-'}</div></div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475764', marginBottom: '6px' }}>
                <span>Overall Deliverables Progress</span><span>{contract.progress ?? 0}% Completed</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#DCE3E8', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${contract.progress ?? 0}%`, backgroundColor: contract.status === 'COMPLETED' ? '#367D6F' : '#0D568D', borderRadius: '4px' }} />
              </div>
            </div>
          </div>

          {/* Payment card: only the client can release */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #DCE3E8', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '20px', color: '#0D568D', margin: 0, fontWeight: 700 }}>Payment</h2>
            <div style={{ backgroundColor: 'var(--color-bg-light)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span>Agreed Project Amount:</span><strong>{formatCurrency(gigAmount)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span>Platform Fee:</span><strong>{formatCurrency(platformFee)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}><span>Total Payment:</span><span style={{ color: '#0D568D' }}>{formatCurrency(totalAmount)}</span></div>
            </div>
            {contract.status !== 'COMPLETED' && (
              <>
                <p style={{ fontSize: '0.8rem', color: '#475764', margin: 0 }}>
                  {canRelease
                    ? 'All deliverables are approved. Release the payment to complete this task.'
                    : contract.payment_status === 'pending'
                      ? 'Fund this task first; release unlocks once the payment is held in escrow.'
                      : `Payment can be released once every deliverable is approved (${contract.progress ?? 0}% done).`}
                </p>
                <Button type="button" disabled={!canRelease} onClick={() => setIsPaymentModalOpen(true)}>
                  Release {formatCurrency(gigAmount)} to {contract.gig_pro_name}
                </Button>
              </>
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
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsReviewModalOpen(true)}>
                    ★ Rate &amp; Review Gig Professional
                  </Button>
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
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsReviewsViewModalOpen(true)}>
                    View Two-Sided Project Reviews ({contract.reviews.length})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Scope: the work items the client (or manager) defined */}
          <TaskDeliverablesManager
            key={numericTaskId}
            deliverableDefinitions={definitions}
            loading={definitionsRequest.status === 'loading' && definitions.length === 0}
            loadError={definitionsRequest.status === 'failed' ? definitionsRequest.error : null}
            busy={definitionsBusy}
            readOnly={contract.status !== 'IN_PROGRESS'}
            onCreate={handleCreateDefinition}
            onUpdate={handleUpdateDefinition}
            onDelete={handleDeleteDefinition}
          />

          {/* Submitted work */}
          <div>
            <h2 style={{ fontSize: '20px', color: '#0D568D', margin: 0, fontWeight: 700 }}>Submitted Deliverables</h2>
            <p style={{ fontSize: '13px', color: '#475764', margin: '4px 0 0 0' }}>Review work {contract.gig_pro_name} submits. Approving work never completes the task; releasing payment does.</p>
          </div>
          {!hasDeliverables ? (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1px solid #DCE3E8' }}>
              <p style={{ color: '#475764', margin: 0 }}>No work has been submitted for this task yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {deliverablesList.map((del, idx) => (
                <div key={del.deliverableNo} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px 24px', border: '1px solid #DCE3E8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0D568D', backgroundColor: '#E4EEF5', padding: '4px 10px', borderRadius: '6px' }}>Deliverable #{del.deliverableNo}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', backgroundColor: del.status === 'approved' || del.status === 'closed' ? '#E4F2EF' : del.status === 'submitted' ? '#F8EBD9' : '#F8E8E8', color: del.status === 'approved' || del.status === 'closed' ? '#2E6E62' : del.status === 'submitted' ? '#9A5100' : '#C94C4C' }}>
                        {del.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1B2A36', marginTop: '8px', wordBreak: 'break-word' }}>{del.description}</div>
                    {del.claimedDefinitions && del.claimedDefinitions.length > 0 && (
                      <div className="submission-definition__claims"><strong>Client-defined deliverables:</strong><ul>{del.claimedDefinitions.map(item => <li key={item.definitionId}>{item.title}</li>)}</ul></div>
                    )}
                    <div style={{ fontSize: '13px', color: '#475764', marginTop: '4px' }}>
                      Submission Path:{' '}
                      {safeHttpUrl(del.submissionPath) ? (
                        <a href={safeHttpUrl(del.submissionPath)} target="_blank" rel="noopener noreferrer" style={{ color: '#0D568D', fontWeight: 600 }}>{del.submissionPath}</a>
                      ) : <span style={{ whiteSpace: 'pre-wrap' }}>{del.submissionPath}</span>}
                    </div>
                    {del.feedback && <div style={{ fontSize: '13px', color: '#475764', marginTop: '6px' }}><strong>Feedback:</strong> {del.feedback}</div>}
                  </div>
                  {del.status === 'submitted' && contract.status === 'IN_PROGRESS' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Button size="sm" onClick={() => { setSelectedDeliverableIndex(idx); setApproveApiError(null); setIsApproveModalOpen(true); }}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedDeliverableIndex(idx); setRevisionFieldError(null); setRevisionApiError(null); setIsChangesModalOpen(true); }}>Request Revision</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal 1: Approve Deliverable Confirmation */}
      {isApproveModalOpen && currentDeliverable && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '460px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0D568D', margin: '0 0 12px 0' }}>
              Approve Submitted Deliverable?
            </h3>
            <p style={{ fontSize: '14px', color: '#1B2A36', lineHeight: 1.5, marginBottom: '14px' }}>
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
              <Button variant="outline" type="button" onClick={() => {
                  if (!isApprovingDeliverable) {
                    setIsApproveModalOpen(false);
                    setApproveApiError(null);
                  }
                }} disabled={isApprovingDeliverable}>
                Cancel
              </Button>
              <Button type="button" onClick={handleApproveDeliverable} disabled={isApprovingDeliverable}>
                {isApprovingDeliverable ? 'Approving...' : 'Confirm Approval'}
              </Button>
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
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1B2A36', margin: '0 0 8px 0' }}>
              Request Changes / Revisions
            </h3>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0D568D', marginBottom: '8px' }}>
              Deliverable #{currentDeliverable.deliverableNo}
              {currentDeliverable.claimedDefinitions && currentDeliverable.claimedDefinitions.length > 0 &&
                ` (${currentDeliverable.claimedDefinitions.map(d => d.title).join(', ')})`}
            </div>
            <p style={{ fontSize: '13px', color: '#475764', marginBottom: '16px', lineHeight: 1.4 }}>
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
              <TextArea maxLength={500} rows={4} placeholder="Explain what revisions or improvements are required (e.g. Please update responsiveness and fix styling on mobile view)..." value={changesFeedback} onChange={(e) => {
                  setChangesFeedback(e.target.value);
                  if (revisionFieldError) setRevisionFieldError(null);
                }} disabled={isSubmittingRevision} style={{ width: '100%' }} />
              {revisionFieldError && (
                <div style={{ color: '#c5221f', fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>
                  {revisionFieldError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="outline" type="button" onClick={() => {
                  if (!isSubmittingRevision) {
                    setIsChangesModalOpen(false);
                    setRevisionFieldError(null);
                    setRevisionApiError(null);
                  }
                }} disabled={isSubmittingRevision}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingRevision}>
                {isSubmittingRevision ? 'Submitting...' : 'Request Revision'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Payment Release */}
      {isPaymentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0D568D', margin: '0 0 12px 0' }}>
              Release Payment
            </h3>
            <p style={{ fontSize: '14px', color: '#1B2A36', lineHeight: 1.5, marginBottom: '20px' }}>
              Releasing payment for <strong>{contract.task_title}</strong>:
            </p>
            <div style={{ backgroundColor: '#F2F6F8', borderRadius: '8px', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Gig Professional ({contract.gig_pro_name}):</span>
                <strong>{formatCurrency(gigAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Platform Fee:</span>
                <strong>{formatCurrency(platformFee)}</strong>
              </div>
              <div style={{ borderTop: '1px solid #DCE3E8', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                <span>Total you paid:</span>
                <span style={{ color: '#0D568D' }}>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="outline" type="button" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleProcessPayment}>
                Release {formatCurrency(gigAmount)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Client Review Modal */}
      <ClientReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        taskId={effectiveTaskId}
        gigProfileId={Number(contract.gig_profile_id)}
        taskTitle={contract.task_title}
        gigProName={contract.gig_pro_name}
        onSuccess={() => {
          setIsReviewModalOpen(false);
          toast.success(`Review for ${contract.gig_pro_name} submitted successfully!`);
          dispatch(fetchClientContracts());
        }}
      />

      {/* Modal 5: Task Reviews View Modal */}
      <TaskReviewsModal
        isOpen={isReviewsViewModalOpen}
        onClose={() => setIsReviewsViewModalOpen(false)}
        contract={contract}
        currentUserId={user?.userId}
        onOpenRateReview={() => {
          setIsReviewsViewModalOpen(false);
          setIsReviewModalOpen(true);
        }}
      />
    </div>
  );
};

export default ReviewDeliverables;
