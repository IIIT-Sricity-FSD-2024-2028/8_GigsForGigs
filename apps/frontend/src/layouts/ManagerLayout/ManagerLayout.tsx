/**
 * @file ManagerLayout.tsx
 * @description Shell for the manager portal: sidebar nav plus a box showing which
 * client organisation this manager works for.
 */
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutManager } from '../../store/auth/authSlice';
import { selectManagerProfile } from '../../store/manager/selectors';
import '../../pages/client/client.css';
import { DashboardLayout, type DashboardNavItem } from '../common/DashboardLayout/DashboardLayout';
import { DashboardIcon, ProjectIcon, UsersIcon } from '../../components/super-admin/Icons';

export interface ManagerLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'tasks' | 'completed' | 'task-detail' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'completed' | 'task-detail' | 'profile') => void;
}

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
  // The task-detail page counts as "Active Tasks" in the sidebar.
  { id: 'tasks', label: 'Active Tasks', icon: <ProjectIcon size={18} />, aliases: ['task-detail'] },
  { id: 'completed', label: 'Completed Projects', icon: <ProjectIcon size={18} /> },
  { id: 'profile', label: 'My Profile', icon: <UsersIcon size={18} /> }
];

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const profile = useAppSelector(selectManagerProfile);
  const name = user?.name || profile?.user?.name || 'Manager';

  return (
    <DashboardLayout
      className="dashboard-shell--manager"
      roleLabel="Manager Portal"
      userName={name}
      activeView={activeTab}
      navItems={navItems}
      onNavigate={(view) => setActiveTab(view as ManagerLayoutProps['activeTab'])}
      onLogout={() => { void dispatch(logoutManager()); }}
      onBrandClick={() => setActiveTab('dashboard')}
      headerTitle="Manager Workspace"
      sidebarContent={
        <div className="dashboard-shell__context">
          <small>Assigned Client</small>
          <strong title={profile?.client?.clientName || undefined}>{profile?.client?.clientName || 'Client Organization'}</strong>
          {profile?.client?.domain && <span>{profile.client.domain}</span>}
        </div>
      }
    >
      {children}
    </DashboardLayout>
  );
};

export default ManagerLayout;
