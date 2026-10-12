import React from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useManager } from '../../context/ManagerContext/ManagerContext';
import '../../pages/client/client.css';
import { DashboardLayout, type DashboardNavItem } from '../common/DashboardLayout/DashboardLayout';
import { DashboardIcon, SearchIcon, ProjectIcon, UsersIcon } from '../../components/super-admin/Icons';

export interface ManagerLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile') => void;
}

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
  { id: 'talent', label: 'Search Talent', icon: <SearchIcon size={18} /> },
  { id: 'tasks', label: 'Assigned Tasks', icon: <ProjectIcon size={18} />, aliases: ['task-detail'] },
  { id: 'profile', label: 'My Profile', icon: <UsersIcon size={18} /> }
];

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logoutManager } = useAuth();
  const { profile } = useManager();
  const name = user?.name || profile?.user?.name || 'Manager';
  return <DashboardLayout className="dashboard-shell--manager" roleLabel="Manager Portal" userName={name}
    activeView={activeTab} navItems={navItems} onNavigate={(view) => setActiveTab(view as ManagerLayoutProps['activeTab'])}
    onLogout={logoutManager} headerTitle="Manager Workspace" sidebarContent={<div className="dashboard-shell__context">
      <small>Assigned Client</small><strong title={profile?.client?.clientName || undefined}>{profile?.client?.clientName || 'Client Organization'}</strong>
      {profile?.client?.domain && <span>{profile.client.domain}</span>}
    </div>}>{children}</DashboardLayout>;
};

export default ManagerLayout;
