import React from 'react';
import { Avatar } from '../../Avatar/Avatar';

export interface UserProfileProps extends React.HTMLAttributes<HTMLDivElement> { name: string; subtitle?: string; avatarUrl?: string; actions?: React.ReactNode; }
export const UserProfile: React.FC<UserProfileProps> = ({ name, subtitle, avatarUrl, actions, className = '', ...props }) =>
  <div className={`ui-user-profile ${className}`.trim()} {...props}><Avatar name={name} src={avatarUrl} size={40} /><div className="ui-user-profile__identity"><strong>{name}</strong>{subtitle && <span>{subtitle}</span>}</div>{actions}</div>;
export default UserProfile;
