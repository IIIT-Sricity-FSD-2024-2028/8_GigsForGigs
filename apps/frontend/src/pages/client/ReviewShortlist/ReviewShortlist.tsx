import React from 'react';
import { useClient } from '../../../context/ClientContext';
import { PageHeader } from '../../../components/common/PageHeader';
import { Avatar, Badge, Button, Card, EmptyState, useToast } from '../../../components/common';

export interface ReviewShortlistProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
  params?: Record<string, string>;
}

export const ReviewShortlist: React.FC<ReviewShortlistProps> = ({ onNavigate, params }) => {
  const toast = useToast();
  const { applications, tasks, hireCandidate, rejectCandidate } = useClient();
  const taskId = params?.taskId;

  const filterTask = taskId ? tasks.find(t => String(t.task_id) === String(taskId)) : null;

  const isUndecided = (a: typeof applications[number]) =>
    (a.status === 'PENDING' || a.status === 'SHORTLISTED') && !a.is_service_request;

  // Undecided marketplace applicants for the selected task; manager-shortlisted ones first.
  const currentApplications = applications
    .filter(isUndecided)
    .filter(a => !taskId || String(a.task_id) === String(taskId))
    .sort((a, b) => Number(b.status === 'SHORTLISTED') - Number(a.status === 'SHORTLISTED'));

  // Tasks that still have undecided applicants — the "pending tasks" list.
  const pendingTasks = tasks
    .map(t => ({ task: t, count: applications.filter(a => isUndecided(a) && String(a.task_id) === String(t.task_id)).length }))
    .filter(({ count }) => count > 0);

  const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  const handleApprove = async (appId: string) => {
    try {
      await hireCandidate(appId);
      toast.success('Candidate hired! Pay the escrow amount (task budget + 10% platform fee) so they can start work.');
      onNavigate('my-gigs');
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

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  // No task selected: show the list of tasks that have pending applicants.
  if (!filterTask) {
    return (
      <div>
        <PageHeader
          title="Pending Tasks"
          description="Tasks awaiting applicant review. Open one to see its applicants, edit the task, or view its details."
        />

        {pendingTasks.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon="📋"
              title="No pending tasks"
              description="None of your posted tasks have applicants awaiting review right now."
              action={<Button size="sm" type="button" onClick={() => onNavigate('search-talent')}>Search Gigs</Button>}
            />
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {pendingTasks.map(({ task, count }) => (
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
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <Button size="sm" style={{ flex: 1 }} onClick={() => onNavigate('review-shortlist', { taskId: task.task_id })}>
                    View Applicants
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onNavigate('post-gig', { editId: task.task_id })}>
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // A task is selected: show its details, an edit action, and its applicants.
  return (
    <div>
      <PageHeader title={filterTask.title} description="Review applicants for this task." />

      <Button variant="ghost" size="sm" type="button" onClick={() => onNavigate('review-shortlist', {})} style={{ marginBottom: 'var(--space-4)', paddingLeft: 0 }}>
        ← Back to Pending Tasks
      </Button>

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
    </div>
  );
};

export default ReviewShortlist;
