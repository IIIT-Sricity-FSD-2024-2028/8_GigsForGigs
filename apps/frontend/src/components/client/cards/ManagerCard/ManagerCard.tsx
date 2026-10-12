import React from 'react';
import type { RawManager } from '../../../../services/api/client/clientApi';
import { UserCard } from '../../../common/cards/UserCard/UserCard';

export interface ManagerCardProps { manager: RawManager; actions?: React.ReactNode; }
export const ManagerCard: React.FC<ManagerCardProps> = ({ manager, actions }) =>
  <UserCard name={manager.user.name} subtitle={manager.user.email} details={<small>Manager since {new Date(manager.createdAt).toLocaleDateString('en-IN')}</small>} actions={actions} />;
export default ManagerCard;
