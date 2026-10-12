import React from 'react';
import type { AdminUser } from '../../../../types/super-admin';
import { DashboardSection } from '../../../common/dashboard/DashboardSection/DashboardSection';
import { Table } from '../../../common/Table/Table';
import { StatusBadge } from '../../../common/status/StatusBadge/StatusBadge';

export interface UserManagementProps { users: AdminUser[]; actions?: (user: AdminUser) => React.ReactNode; }
export const UserManagement: React.FC<UserManagementProps> = ({ users, actions }) =>
  <DashboardSection title="Users" description={`${users.length} accounts`}><Table>
    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th>{actions && <th>Actions</th>}</tr></thead>
    <tbody>{users.map(user => <tr key={user.userId}><td>{user.name}</td><td>{user.email}</td><td><StatusBadge status={user.role} /></td><td>{new Date(user.createdAt).toLocaleDateString()}</td>{actions && <td>{actions(user)}</td>}</tr>)}</tbody>
  </Table></DashboardSection>;
export default UserManagement;
