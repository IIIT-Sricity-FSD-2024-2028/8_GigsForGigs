import React, { useState } from 'react';
import { useClient } from '../../../context/ClientContext';
import { PageHeader } from '../../../components/common/PageHeader';
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, useToast } from '../../../components/common';

export interface ReviewShortlistProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
  params?: Record<string, string>;
}

export const ReviewShortlist: React.FC<ReviewShortlistProps> = ({ onNavigate, params }) => {
  const toast = useToast();
  const { applications, contracts, tasks, hireCandidate, rejectCandidate, deleteTask } = useClient();
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const taskId = params?.taskId;

  const filterTask = taskId ? tasks.find(t => String(t.task_id) === String(taskId)) : null;

  const isUndecided = (a: typeof applications[number]) =>
    (a.status === 'PENDING' || a.status === 'SHORTLISTED') && !a.is_service_request;

  // Undecided marketplace applicants for the selected task; manager-shortlisted ones first.
  const currentApplications = applications
    .filter(isUndecided)
    .filter(a => !taskId || String(a.task_id) === String(taskId))
    .sort((a, b) => Number(b.status === 'SHORTLISTED') - Number(a.status === 'SHORTLISTED'));

  // Every open marketplace posting, from the moment it's posted until the client deletes it.
  // Hiring doesn't close it: the client can keep hiring as many professionals as they want.
  const postedTasks = tasks
    .filter(t => t.status === 'OPEN' && !t.skills?.includes('Service Hire'))
    .map(t => ({
      task: t,
      count: applications.filter(a => isUndecided(a) && String(a.task_id) === String(t.task_id)).length,
      hired: contracts.filter(c => c.task_id === t.task_id).length,
    }));

  const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  const handleApprove = async (appId: string) => {
    try {
      await hireCandidate(appId);
      toast.success('Candidate hired! Fund their escrow from Active Task so they can start work. You can keep hiring for this task.');
    } catch (err) {
      console.error('Approve hire failed:', err);
      toast.error(errorMessage(err, 'Failed to approve this candidate. Please try again.'));
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await rejectCandidate(appId);
      toast.success('Candidate application discarded.');
    } catch (err) {
      console.error('Reject hire failed:', err);
      toast.error(errorMessage(err, 'Failed to reject this candidate. Please try again.'));
    }
  };

  const handleDelete = async () => {
    const id = taskToDelete;
    setTaskToDelete(null);
    if (!id) return;
    try {
      await deleteTask(id);
      toast.success('Task removed from Posted Tasks.');
      if (taskId) onNavigate('review-shortlist', {});
    } catch (err) {
      console.error('Delete task failed:', err);
      toast.error(errorMessage(err, 'Failed to delete this task. Please try again.'));
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
            {postedTasks.map(({ task, count, hired }) => (
              <Card key={task.task_id} padding="md" interactive style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
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
                  {formatCurrency(task.budget)} &middot; {task.category || 'General'}
                  {hired > 0 && <> &middot; {hired} hired</>}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <Button size="sm" style={{ flex: 1 }} onClick={() => onNavigate('review-shortlist', { taskId: task.task_id })}>
                    View Applicants
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onNavigate('post-gig', { editId: task.task_id })}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setTaskToDelete(task.task_id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        {deleteDialog}
      </div>
    );
  }

  // A task is selected: show its details, an edit action, and its applicants.
  return (
    <div>
      <PageHeader title={filterTask.title} description="Review applicants for this task." />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <Button variant="ghost" size="sm" type="button" onClick={() => onNavigate('review-shortlist', {})} style={{ paddingLeft: 0 }}>
          ← Back to Posted Tasks
        </Button>
        {filterTask.status === 'OPEN' && (
          <Button variant="danger" size="sm" type="button" onClick={() => setTaskToDelete(filterTask.task_id)}>
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
          {currentApplications.map(a => (
            <Card key={a.application_id} padding="md" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Avatar name={a.candidate_name} size={40} />

              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{a.candidate_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {a.status === 'SHORTLISTED' && <Badge variant="active" style={{ marginRight: '6px' }}>Shortlisted</Badge>}
                  {a.candidate_role}
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <div>Rating: {a.rating ? `${a.rating} / 5` : '—'}</div>
                <div>Hourly: {a.hourlyRate ? formatCurrency(a.hourlyRate) : '—'}</div>
              </div>

              <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)', minWidth: '90px' }}>
                {formatCurrency(a.rate)}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <Button variant="outline" size="sm" onClick={() => handleApprove(a.application_id)}>
                  Approve
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReject(a.application_id)}>
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {deleteDialog}
    </div>
  );
};

export default ReviewShortlist;
