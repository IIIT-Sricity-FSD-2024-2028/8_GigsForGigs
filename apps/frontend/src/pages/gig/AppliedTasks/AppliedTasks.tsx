/**
 * @file AppliedTasks.tsx
 * @description Marketplace applications of the gig professional with their
 * decision: pending/shortlisted (can withdraw), accepted (jump to Active Task)
 * or rejected. Accepted applications are hidden (they move to Active Task).
 * Each application opens a details section with the task's specification and
 * a Client Details card, and links to the full profile of the posting client.
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { PendingRequest } from '../../../types/gig';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { Loader } from '../../../components/common/Loader';
import { Button, ProfileChips, ProfileFacts, ProfileSection, ProfileText, useToast } from '../../../components/common';
import { ClientDetailsCard } from '../../../components/gig/profile/ClientDetailsCard';
import { APPLICATION_STATUS } from '../../../utils/applicationStatus';
import { formatCurrency, formatDate } from '../../../utils/format';

/** The applied task details section: the task's specification plus the posting client's details. */
const AppliedTaskDetails: React.FC<{ application: PendingRequest; onViewClientProfile: () => void }> = ({ application, onViewClientProfile }) => {
  const [showClient, setShowClient] = useState(false);
  const task = application.task;
  const cardId = `client-details-${application.applicationId}`;

  return (
    <div id={`applied-task-${application.applicationId}`} className="applied-task__details">
      <ProfileSection title="Task description">
        <ProfileText text={task?.description} emptyText="No description provided." />
      </ProfileSection>
      <ProfileFacts items={[
        { label: 'Budget', value: task ? formatCurrency(task.budget) : '—' },
        { label: 'Category', value: task?.category || 'General' },
        { label: 'Duration', value: task?.duration || 'Not specified' },
        { label: 'Due date', value: formatDate(task?.dueDate, 'Flexible') },
        { label: 'Posted on', value: formatDate(task?.createdAt) },
        { label: 'Applied on', value: formatDate(application.createdAt) },
      ]} />
      <ProfileSection title="Required skills">
        <ProfileChips items={task?.skills ?? []} emptyText="No specific skills listed." />
      </ProfileSection>
      <ProfileSection title="Client">
        <div className="applied-task__client">
          <span className="profile-text"><strong>{task?.client?.clientName || 'Client'}</strong></span>
          <Button size="sm" variant="outline" aria-expanded={showClient} aria-controls={cardId} onClick={() => setShowClient((open) => !open)}>
            {showClient ? 'Hide Client Details' : 'Client Details'}
          </Button>
        </div>
        {showClient && <ClientDetailsCard id={cardId} taskId={application.taskId} onViewProfile={onViewClientProfile} />}
      </ProfileSection>
    </div>
  );
};

export const AppliedTasks: React.FC = () => {
  const { refreshTrigger, triggerRefresh, navigateToClientProfile } = useGig();
  const [apps, setApps] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const toast = useToast();
  const { user, updateUserSession } = useAuth();

  useEffect(() => {
    gigApi.getMyApplications()
      .then((all) => setApps(all.filter((a) => a.status !== 'accepted'))) // accepted ones live in Active Task now
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load applications.'))
      .finally(() => setLoading(false));
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const withdraw = async (id: number, taskId: number) => {
    try {
      await gigApi.withdrawApplication(id);
      updateUserSession({ appliedTaskIds: (user?.appliedTaskIds || []).filter((t) => t !== String(taskId)) }); // lets Explore offer it again
      triggerRefresh();
    }
    catch (err) { toast.error(err instanceof ApiError ? err.message : 'Could not withdraw.'); }
  };

  if (loading) return <Loader label="Loading applied tasks..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <PageHeader title="Applied Tasks" description="Track your applications, review each task's details and see who posted it." />
      {apps.length === 0 ? <EmptyState title="No applications yet" description="Apply to tasks from Explore Tasks." /> : apps.map((a) => {
        const expanded = expandedId === a.applicationId;
        const openClientProfile = () => navigateToClientProfile(String(a.taskId), 'applied-tasks');
        return (
          <article key={a.applicationId} className="admin-card applied-task">
            <div className="applied-task__summary">
              <div>
                <strong>{a.task?.title ?? `Task #${a.taskId}`}</strong>
                <div className="applied-task__meta">
                  {a.task?.client?.clientName} · Applied {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''} · <b>{a.task?.status === 'cancelled' ? 'Task cancelled' : APPLICATION_STATUS[a.status].label}</b>
                </div>
              </div>
              <div className="applied-task__actions">
                <Button size="sm" variant="ghost" aria-expanded={expanded} aria-controls={`applied-task-${a.applicationId}`} onClick={() => setExpandedId(expanded ? null : a.applicationId)}>
                  {expanded ? 'Hide Details' : 'View Details'}
                </Button>
                <Button size="sm" variant="outline" onClick={openClientProfile}>View Client Profile</Button>
                {(a.status === 'pending' || a.status === 'shortlisted') && <Button size="sm" variant="secondary" onClick={() => withdraw(a.applicationId, a.taskId)}>Withdraw</Button>}
              </div>
            </div>
            {expanded && <AppliedTaskDetails application={a} onViewClientProfile={openClientProfile} />}
          </article>
        );
      })}
    </div>
  );
};

export default AppliedTasks;
