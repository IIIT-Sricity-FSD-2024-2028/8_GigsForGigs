/**
 * @file AppliedTasks.tsx
 * @description Marketplace applications of the gig professional with their
 * decision: pending/shortlisted (can withdraw), accepted (jump to Active Task)
 * or rejected. Accepted applications are hidden (they move to Active Task).
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
import { Button, useToast } from '../../../components/common';

const STATUS_LABEL: Record<PendingRequest['status'], string> = {
  pending: 'Applied', shortlisted: 'Shortlisted', accepted: 'Accepted', declined: 'Rejected'
};

export const AppliedTasks: React.FC = () => {
  const { refreshTrigger, triggerRefresh } = useGig();
  const [apps, setApps] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
      <PageHeader title="Applied Tasks" subtitle="Track your applications and see the client's decision." />
      {apps.length === 0 ? <EmptyState title="No applications yet" description="Apply to tasks from Explore Tasks." /> : apps.map((a) => (
        <div key={a.applicationId} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: 16 }}>
          <div>
            <strong>{a.task?.title ?? `Task #${a.taskId}`}</strong>
            <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>
              {a.task?.client?.clientName} · Applied {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''} · <b>{STATUS_LABEL[a.status]}</b>
            </div>
          </div>
          {(a.status === 'pending' || a.status === 'shortlisted') && <Button size="sm" variant="secondary" onClick={() => withdraw(a.applicationId, a.taskId)}>Withdraw</Button>}
        </div>
      ))}
    </div>
  );
};

export default AppliedTasks;
