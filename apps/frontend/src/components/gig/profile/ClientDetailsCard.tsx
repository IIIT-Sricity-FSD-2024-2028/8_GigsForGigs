/**
 * @file ClientDetailsCard.tsx
 * @description
 * "Client Details" card shown inside a task's details on the gig side: a
 * summary of the client who posted that task. Loaded by task id, so the
 * server resolves the client from the task itself, and only answers when
 * this professional applied to (or was hired on) the task.
 */
import React from 'react';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { ErrorState } from '../../common/ErrorState';
import { ProfileFacts, RatingSummary } from '../../common/ProfileDetails';
import gigApi from '../../../services/api/gig/gigApi';
import { useApiResource } from '../../../hooks/useApiResource';
import { formatMonthYear } from '../../../utils/format';
import { ClientContactLine, ClientIdentityHeader } from './ClientProfileParts';

export interface ClientDetailsCardProps {
  taskId: number;
  /** Opens the full Client Profile page. */
  onViewProfile?: () => void;
  /** id for aria-controls on the button that toggles this card. */
  id?: string;
}

export const ClientDetailsCard: React.FC<ClientDetailsCardProps> = ({ taskId, onViewProfile, id }) => {
  const { data, loading, error, reload } = useApiResource(gigApi.getTaskClientProfile, taskId, 'Could not load client details.');

  return (
    <section id={id} className="client-details-card" aria-label="Client details" aria-busy={loading || undefined}>
      {loading ? <Loader label="Loading client details..." size="sm" />
        : !data ? <ErrorState title="Client details unavailable" message={error ?? undefined} onRetry={reload} />
          : <>
            <ClientIdentityHeader profile={data.profile} avatarSize={44} />
            <ProfileFacts items={[
              { label: 'Rating', value: <RatingSummary rating={data.profile.rating} /> },
              { label: 'Tasks posted', value: data.profile.stats.tasksPosted },
              { label: 'Professionals hired', value: data.profile.stats.professionalsHired },
              { label: 'Member since', value: formatMonthYear(data.profile.memberSince) },
            ]} />
            <ClientContactLine profile={data.profile} />
            {onViewProfile && (
              <div className="profile-actions">
                <Button variant="outline" size="sm" onClick={onViewProfile}>View Full Client Profile</Button>
              </div>
            )}
          </>}
    </section>
  );
};

export default ClientDetailsCard;
