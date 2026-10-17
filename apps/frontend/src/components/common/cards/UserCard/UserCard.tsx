import React from 'react';
import { Avatar } from '../../Avatar/Avatar';
import { BaseCard } from '../BaseCard/BaseCard';

export interface UserCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  details?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Card showing a person: avatar, name, subtitle, extra details and actions. */
export const UserCard: React.FC<UserCardProps> = ({ name, subtitle, avatarUrl, details, actions, className = '', ...props }) =>
  <BaseCard className={`user-card ${className}`.trim()} {...props}>
    <div className="user-card__content"><Avatar name={name} src={avatarUrl} size={44} /><div className="user-card__identity"><strong>{name}</strong>{subtitle && <span>{subtitle}</span>}{details}</div>{actions}</div>
  </BaseCard>;

export default UserCard;
