import React from 'react';
import type { TalentProfile } from '../../../../types/manager';
import { UserCard } from '../../../common/cards/UserCard/UserCard';
import { Badge } from '../../../common/Badge/Badge';

export interface ManagerTalentCardProps { talent: TalentProfile; actions?: React.ReactNode; }
export const TalentCard: React.FC<ManagerTalentCardProps> = ({ talent, actions }) =>
  <UserCard name={talent.name} subtitle={talent.status} details={<><p>{talent.bio}</p><div className="talent-card__skills">{talent.skills.map(skill => <Badge key={skill} variant="info">{skill}</Badge>)}</div>{talent.price !== undefined && <strong>₹{talent.price.toLocaleString('en-IN')}</strong>}</>} actions={actions} />;
export default TalentCard;
