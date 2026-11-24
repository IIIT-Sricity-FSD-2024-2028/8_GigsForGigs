/**
 * @file ClientProfileView.tsx
 * @description
 * Full profile of the client who posted a task, for the gig professional who
 * applied to (or was hired on) it. Route: /gig/tasks/:taskId/client. The
 * client is resolved server-side from the task, never chosen by the browser.
 */
import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { ClientProfileOrigin } from '../../../hooks/useGigNavigation';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTaskClientProfile } from '../../../store/gig/gigSlice';
import { selectTaskClientProfile } from '../../../store/gig/selectors';
import { PageHeader } from '../../../components/common/PageHeader';
import { Loader } from '../../../components/common/Loader';
import { ErrorState } from '../../../components/common/ErrorState';
import { Badge, Button, ProfileFacts, ProfileSection, RatingSummary, ReviewList } from '../../../components/common';
import { ClientContactLine, ClientIdentityHeader } from '../../../components/gig/profile/ClientProfileParts';
import { APPLICATION_STATUS } from '../../../utils/applicationStatus';
import { formatDate, formatMonthYear } from '../../../utils/format';
import type { TaskClientProfileResponse } from '../../../types/profile';

const ClientProfileBody: React.FC<{ result: TaskClientProfileResponse }> = ({ result: { task, application, hiredOnTask, profile } }) => {
  const status = application ? APPLICATION_STATUS[application.status] : hiredOnTask ? { label: 'Hired', variant: 'success' as const } : null;
  return (
    <div className="admin-card profile-page__card">
      <ClientIdentityHeader profile={profile} avatarSize={64} />

      <ProfileSection title="Contact">
        <ClientContactLine profile={profile} />
      </ProfileSection>

      <ProfileSection title="Activity on GigsForGigs">
        <ProfileFacts items={[
          { label: 'Rating', value: <RatingSummary rating={profile.rating} /> },
          { label: 'Member since', value: formatMonthYear(profile.memberSince) },
          { label: 'Tasks posted', value: profile.stats.tasksPosted },
          { label: 'Open tasks', value: profile.stats.openTasks },
          { label: 'Professionals hired', value: profile.stats.professionalsHired },
        ]} />
      </ProfileSection>

      <ProfileSection title="Your engagement">
        <p className="profile-text">
          <strong>{task.title}</strong>
          {status && <> · <Badge variant={status.variant}>{status.label}</Badge></>}
        </p>
        {application && <p className="profile-muted">Applied on {formatDate(application.appliedAt)}</p>}
      </ProfileSection>

      <ProfileSection title="What professionals say">
        <ReviewList reviews={profile.recentReviews} emptyText="No reviews from professionals yet." />
      </ProfileSection>
    </div>
  );
};

export const ClientProfileView: React.FC = () => {
  const { taskId: rawTaskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const parsed = Number(rawTaskId);
  const taskId = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  const dispatch = useAppDispatch();
  const res = useAppSelector((state) => selectTaskClientProfile(state, taskId));
  const data = res?.data ?? null;
  const error = res?.error ?? null;
  const loading = !data && res?.status !== 'failed';
  const reload = () => { if (taskId !== null) void dispatch(fetchTaskClientProfile(taskId)); };
  useEffect(() => { if (taskId !== null) void dispatch(fetchTaskClientProfile(taskId)); }, [dispatch, taskId]);

  const from = (location.state as { from?: ClientProfileOrigin } | null)?.from;
  const back = from === 'project-detail' && taskId !== null
    ? { label: '← Back to Task Details', go: () => navigate(`/gig/tasks/${taskId}`) }
    : { label: '← Back to Applied Tasks', go: () => navigate('/gig/tasks/applied') };

  return (
    <div className="profile-page">
      <div>
        <Button variant="ghost" size="sm" onClick={back.go}>{back.label}</Button>
      </div>
      <PageHeader
        title="Client Profile"
        description={data ? `The client who posted “${data.task.title}”.` : 'The client who posted this task.'}
      />
      {taskId === null ? <ErrorState title="Invalid task" message="This link doesn't point to a valid task." />
        : loading ? <Loader label="Loading client profile..." />
          : data ? <ClientProfileBody result={data} />
            : <ErrorState title="Client profile unavailable" message={error ?? undefined} onRetry={reload} />}
    </div>
  );
};

export default ClientProfileView;
