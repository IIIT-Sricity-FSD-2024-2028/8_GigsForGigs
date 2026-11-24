/**
 * @file ApplicantProfileModal.tsx
 * @description
 * "View Profile" on the client's applicants page: the profile of the gig
 * professional behind ONE application.
 *
 * Migrated to Redux Toolkit (clientSlice). Keyed by applicationId so concurrent
 * lookups never overwrite each other, and switching between applicants immediately
 * clears stale profile data and fetches the correct applicant profile.
 */
import React, { useCallback, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { ErrorState } from '../../common/ErrorState';
import {
  ProfileChips, ProfileFacts, ProfileHeader, ProfileLinks, ProfileSection, ProfileText, RatingSummary, ReviewList,
} from '../../common/ProfileDetails';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchApplicantProfile } from '../../../store/client/clientSlice';
import {
  selectApplicantProfile,
  selectApplicantProfileRequest,
} from '../../../store/client/selectors';
import { APPLICATION_STATUS } from '../../../utils/applicationStatus';
import { formatCurrency, formatDate, formatMonthYear } from '../../../utils/format';
import type { ApplicantProfileResponse, ApplicationStatus } from '../../../types/profile';

export interface ApplicantProfileModalProps {
  /** Application whose applicant to show; null keeps the modal closed. */
  applicationId: number | null;
  /** Must be stable (useCallback): the modal re-focuses itself whenever it changes. */
  onClose: () => void;
}

const BADGE_LABELS: Record<string, string> = { VERIFIED_PRO: 'Verified Pro', TOP_RATED: 'Top Rated' };

const ApplicantProfileBody: React.FC<{ result: ApplicantProfileResponse }> = ({ result: { application, profile } }) => {
  const normalizedStatus = (application.status?.toLowerCase() || 'pending') as ApplicationStatus;
  const status = APPLICATION_STATUS[normalizedStatus] || APPLICATION_STATUS.pending;

  return (
    <div className="profile-body">
      <ProfileHeader
        name={profile.name}
        subtitle={
          <>
            {profile.email ? (
              <>
                <a href={`mailto:${profile.email}`}>{profile.email}</a> ·{' '}
              </>
            ) : null}
            Member since {formatMonthYear(profile.memberSince)}
          </>
        }
        badges={
          <>
            {profile.badge && <Badge variant="success">{BADGE_LABELS[profile.badge] ?? profile.badge}</Badge>}
            <Badge variant={status.variant}>{status.label}</Badge>
          </>
        }
      />

      <p className="profile-context">
        Applied for <strong>{application.taskTitle}</strong> on {formatDate(application.appliedAt)}.
      </p>

      <ProfileFacts items={[
        { label: 'Rating', value: <RatingSummary rating={profile.rating} /> },
        { label: 'Completed projects', value: profile.stats.completedProjects },
        { label: 'Active services', value: profile.services.length },
      ]} />

      <ProfileSection title="About">
        <ProfileText text={profile.bio} emptyText="This professional hasn't added a bio yet." />
      </ProfileSection>
      <ProfileSection title="Skills">
        <ProfileChips items={profile.skills} emptyText="No skills listed." />
      </ProfileSection>
      <ProfileSection title="Tools">
        <ProfileChips items={profile.tools} emptyText="No tools listed." />
      </ProfileSection>
      <ProfileSection title="Portfolio">
        <ProfileLinks urls={profile.portfolio} emptyText="No portfolio links added." />
      </ProfileSection>
      <ProfileSection title="Services offered">
        {profile.services.length === 0 ? <p className="profile-muted">No active services.</p> : (
          <ul className="profile-list">
            {profile.services.map((service) => (
              <li key={service.serviceId} className="profile-service">
                <strong>{service.title}</strong>
                <span>{formatCurrency(service.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </ProfileSection>
      <ProfileSection title="Recent reviews">
        <ReviewList reviews={profile.recentReviews} emptyText="No reviews from clients yet." />
      </ProfileSection>
    </div>
  );
};

export const ApplicantProfileModal: React.FC<ApplicantProfileModalProps> = ({ applicationId, onClose }) => {
  const dispatch = useAppDispatch();

  // Select profile data and request status keyed strictly by the selected applicationId
  const profileData = useAppSelector((state) =>
    applicationId !== null ? selectApplicantProfile(state, applicationId) : null,
  );
  const requestState = useAppSelector((state) =>
    applicationId !== null ? selectApplicantProfileRequest(state, applicationId) : null,
  );

  useEffect(() => {
    if (applicationId !== null) {
      if (!profileData && (!requestState || requestState.status === 'idle')) {
        void dispatch(fetchApplicantProfile(applicationId));
      }
    }
  }, [dispatch, applicationId, profileData, requestState]);

  const handleRetry = useCallback(() => {
    if (applicationId !== null) {
      void dispatch(fetchApplicantProfile(applicationId));
    }
  }, [dispatch, applicationId]);

  const isLoading = applicationId !== null && !profileData && requestState?.status === 'loading';
  const hasError = applicationId !== null && !profileData && requestState?.status === 'failed';
  const errorMessage = hasError ? requestState?.error ?? "Could not load this applicant's profile." : undefined;

  return (
    <Modal open={applicationId !== null} onClose={onClose} title="Applicant Profile" className="profile-modal">
      {isLoading ? (
        <Loader label="Loading profile..." />
      ) : profileData ? (
        <ApplicantProfileBody result={profileData} />
      ) : (
        <ErrorState title="Profile unavailable" message={errorMessage} onRetry={handleRetry} />
      )}
      <div className="profile-actions" style={{ marginTop: 20 }}>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default ApplicantProfileModal;
