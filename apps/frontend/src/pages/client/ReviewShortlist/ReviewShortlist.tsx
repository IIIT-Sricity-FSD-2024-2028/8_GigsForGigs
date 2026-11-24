import React, { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  approveApplication,
  deleteClientTask,
  fetchClientApplications,
  fetchClientContracts,
  fetchClientTasks,
  rejectApplication,
} from '../../../store/client/clientSlice';
import {
  selectClientApplicationsRequest,
  selectClientContracts,
  selectClientContractsRequest,
  selectClientTasks,
  selectClientTasksRequest,
  selectUndecidedApplications,
} from '../../../store/client/selectors';
import { PageHeader } from '../../../components/common/PageHeader';
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, Loader, useToast } from '../../../components/common';
import { ApplicantProfileModal } from '../../../components/client/modals/ApplicantProfileModal';

export interface ReviewShortlistProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
  params?: Record<string, string>;
}

export const ReviewShortlist: React.FC<ReviewShortlistProps> = ({ onNavigate, params }) => {
  const toast = useToast();
  const dispatch = useAppDispatch();

  const tasks = useAppSelector(selectClientTasks);
  const tasksRequest = useAppSelector(selectClientTasksRequest);
  const applicationsRequest = useAppSelector(selectClientApplicationsRequest);
  const undecidedApplications = useAppSelector(selectUndecidedApplications);
  const contracts = useAppSelector(selectClientContracts);
  const contractsRequest = useAppSelector(selectClientContractsRequest);

  const [actingAppId, setActingAppId] = useState<number | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  // Application whose applicant profile is open (keyed by application, not candidate, so it's always the right person).
  const [profileApplicationId, setProfileApplicationId] = useState<number | null>(null);
  const closeProfile = useCallback(() => setProfileApplicationId(null), []);
  const taskId = params?.taskId;

  useEffect(() => {
    if (tasksRequest.status === 'idle') {
      dispatch(fetchClientTasks());
    }
    if (applicationsRequest.status === 'idle') {
      dispatch(fetchClientApplications());
    }
    if (contractsRequest.status === 'idle') {
      dispatch(fetchClientContracts());
    }
  }, [dispatch, tasksRequest.status, applicationsRequest.status, contractsRequest.status]);

  const filterTask = taskId ? tasks.find((t) => String(t.taskId) === String(taskId)) : null;

  // Undecided marketplace applicants for the selected task; manager-shortlisted ones first.
  const currentApplications = undecidedApplications
    .filter((a) => !taskId || String(a.taskId) === String(taskId))
    .sort((a, b) => Number(b.status === 'shortlisted' || (b.status as string) === 'SHORTLISTED') - Number(a.status === 'shortlisted' || (a.status as string) === 'SHORTLISTED'));

  // Every open marketplace posting, from the moment it's posted until the client deletes it.
  // Hiring doesn't close it: the client can keep hiring as many professionals as they want.
  const postedTasks = tasks
    .filter((t) => (t.status === 'open' || (t.status as string) === 'OPEN') && !t.skills?.includes('Service Hire'))
    .map((t) => ({
      task: t,
      count: undecidedApplications.filter((a) => a.taskId === t.taskId).length,
      hired: contracts.filter((c) => c.taskId === t.taskId).length,
    }));

  const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  const handleApprove = async (appId: number) => {
    try {
      setActingAppId(appId);
      await dispatch(approveApplication(appId)).unwrap();
      toast.success('Candidate hired! Fund their escrow from Active Task so they can start work. You can keep hiring for this task.');
    } catch (err) {
      console.error('Approve hire failed:', err);
      toast.error(typeof err === 'string' ? err : errorMessage(err, 'Failed to approve this candidate. Please try again.'));
    } finally {
      setActingAppId(null);
    }
  };

  const handleReject = async (appId: number) => {
    try {
      setActingAppId(appId);
      await dispatch(rejectApplication(appId)).unwrap();
      toast.success('Candidate application discarded.');
    } catch (err) {
      console.error('Reject hire failed:', err);
      toast.error(typeof err === 'string' ? err : errorMessage(err, 'Failed to reject this candidate. Please try again.'));
    } finally {
      setActingAppId(null);
    }
  };

  const handleDelete = async () => {
    const id = taskToDelete;
    setTaskToDelete(null);
    if (id === null) return;
    try {
      await dispatch(deleteClientTask(id)).unwrap();
      toast.success('Task removed from Posted Tasks.');
      if (taskId) onNavigate('review-shortlist', {});
    } catch (err) {
      console.error('Delete task failed:', err);
      toast.error(typeof err === 'string' ? err : errorMessage(err, 'Failed to delete this task. Please try again.'));
    }
  };

  const deleteDialog = (
    <ConfirmDialog
      open={taskToDelete !== null}
      danger
      title="Delete task"
      message="Remove this task from Posted Tasks and the marketplace? Undecided applicants are declined. Professionals you've already hired keep working and stay in Active Task."
      confirmLabel="Delete"
      onConfirm={handleDelete}
      onCancel={() => setTaskToDelete(null)}
    />
  );

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  // No task selected: show every posted task.
  if (!filterTask) {
    if (tasksRequest.status === 'loading' && tasks.length === 0) {
      return <Loader label="Loading posted tasks..." />;
    }

    return (
      <div>
        <PageHeader
          title="Posted Tasks"
          description="Your tasks stay posted until you delete them. Open one to review applicants and hire as many professionals as you need."
        />

        {postedTasks.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon="📋"
              title="No posted tasks"
              description="Post a task and it will appear here right away."
              action={<Button size="sm" type="button" onClick={() => onNavigate('post-gig')}>Post a Task</Button>}
            />
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {postedTasks.map(({ task, count, hired }) => {
              const taskIdNum = task.taskId;
              return (
                <Card key={taskIdNum} padding="md" interactive style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{task.title}</h3>
                    <Badge variant="pending">{count} applicant{count === 1 ? '' : 's'}</Badge>
                  </div>

                  <p style={{
                    margin: 0, fontSize: '0.85rem', color: 'var(--color-text-subtle)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {task.description || 'No description provided.'}
                  </p>

                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {formatCurrency(Number(task.budget))} &middot; {task.category || 'General'}
                    {hired > 0 && <> &middot; {hired} hired</>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <Button size="sm" style={{ flex: 1 }} onClick={() => onNavigate('review-shortlist', { taskId: String(taskIdNum) })}>
                      View Applicants
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onNavigate('post-gig', { editId: String(taskIdNum) })}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setTaskToDelete(taskIdNum)}>
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        {deleteDialog}
      </div>
    );
  }

  // A task is selected: show its details, an edit action, and its applicants.
  const filterTaskIdNum = filterTask.taskId;
  const isOpen = filterTask.status === 'open' || (filterTask.status as string) === 'OPEN';

  return (
    <div>
      <PageHeader title={filterTask.title} description="Review applicants for this task." />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <Button variant="ghost" size="sm" type="button" onClick={() => onNavigate('review-shortlist', {})} style={{ paddingLeft: 0 }}>
          ← Back to Posted Tasks
        </Button>
        {isOpen && (
          <Button variant="danger" size="sm" type="button" onClick={() => setTaskToDelete(filterTaskIdNum)}>
            Delete Task
          </Button>
        )}
      </div>

      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
        Candidates {currentApplications.length > 0 ? `(${currentApplications.length})` : ''}
      </h2>

      {currentApplications.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon="👥"
            title={`No candidates for "${filterTask.title}" yet`}
            description="No gig professionals have applied or been shortlisted for this task yet. It is currently open and visible on the marketplace."
            action={<Button size="sm" type="button" onClick={() => onNavigate('search-talent')}>Browse Talent &amp; Hire</Button>}
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentApplications.map((a) => {
            const candidateName = a.gigProfile?.user?.name ?? 'Unknown Candidate';
            const candidateRole = a.gigProfile?.bio || 'Gig Professional';
            const reviewAverage = a.reviewRating?.average ?? null;
            const reviewCount = a.reviewRating?.count ?? 0;
            const hourlyRate = a.hourlyRate ? Number(a.hourlyRate) : null;
            const rate = a.task?.budget ? Number(a.task.budget) : 0;
            const isShortlisted = a.status === 'shortlisted' || (a.status as string) === 'SHORTLISTED';

            return (
              <Card key={a.applicationId} padding="md" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Avatar name={candidateName} size={40} />

                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{candidateName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {isShortlisted && <Badge variant="active" style={{ marginRight: '6px' }}>Shortlisted</Badge>}
                    {candidateRole}
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {reviewAverage !== null ? (
                    <div aria-label={`Average rating ${reviewAverage} out of 5 from ${reviewCount} review${reviewCount === 1 ? '' : 's'}`}>
                      <span aria-hidden="true" style={{ color: '#f5a623', letterSpacing: '1px' }}>
                        {'★'.repeat(Math.round(reviewAverage))}{'☆'.repeat(5 - Math.round(reviewAverage))}
                      </span>{' '}
                      <strong>{reviewAverage.toFixed(1)}</strong> / 5 ({reviewCount} review{reviewCount === 1 ? '' : 's'})
                    </div>
                  ) : (
                    <div>No ratings yet</div>
                  )}
                  {a.rating ? <div>Manager score: {a.rating} / 5</div> : null}
                  <div>Hourly: {hourlyRate ? formatCurrency(hourlyRate) : '—'}</div>
                </div>

                <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)', minWidth: '90px' }}>
                  {formatCurrency(rate)}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Button variant="ghost" size="sm" onClick={() => setProfileApplicationId(a.applicationId)} aria-label={`View profile of ${candidateName}`}>
                    View Profile
                  </Button>
                  <Button variant="outline" size="sm" disabled={actingAppId === a.applicationId} onClick={() => handleApprove(a.applicationId)}>
                    {actingAppId === a.applicationId ? 'Hiring...' : 'Approve'}
                  </Button>
                  <Button variant="outline" size="sm" disabled={actingAppId === a.applicationId} onClick={() => handleReject(a.applicationId)}>
                    Reject
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {deleteDialog}
      <ApplicantProfileModal applicationId={profileApplicationId} onClose={closeProfile} />
    </div>
  );
};

export default ReviewShortlist;
