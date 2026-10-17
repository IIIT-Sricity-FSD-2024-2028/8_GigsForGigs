import React from 'react';
import type { RawApplication } from '../../../../services/api/client/clientApi';
import { UserCard } from '../../../common/cards/UserCard/UserCard';
import { StatusBadge } from '../../../common/status/StatusBadge/StatusBadge';

export interface TalentCardProps { application: RawApplication; actions?: React.ReactNode; }
/** UserCard for an applicant: rating, hourly rate and application status. Not rendered anywhere yet. */
export const TalentCard: React.FC<TalentCardProps> = ({ application, actions }) =>
  <UserCard name={application.gigProfile.user.name} subtitle={application.gigProfile.user.email}
    details={<div className="talent-card__details">{application.rating !== null && <span>★ {application.rating.toFixed(1)}</span>}{application.hourlyRate !== null && <span>₹{application.hourlyRate}/hr</span>}<StatusBadge status={application.status} /></div>} actions={actions} />;
export default TalentCard;
