import React from 'react';
import type { AdminUser } from '../../../../types/super-admin';
import { UserCard as SharedUserCard } from '../../../common/cards/UserCard/UserCard';

export interface AdminUserCardProps { user: AdminUser; actions?: React.ReactNode; }
export const UserCard: React.FC<AdminUserCardProps> = ({ user, actions }) =>
  <SharedUserCard name={user.name} subtitle={user.email} details={<small>{user.role.replace('_', ' ')} · Joined {new Date(user.createdAt).toLocaleDateString()}</small>} actions={actions} />;
export default UserCard;
