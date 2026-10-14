import React from 'react';
import '../../pages/client/client.css';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout, type DashboardNavItem } from '../common/DashboardLayout/DashboardLayout';
import { DashboardIcon, SearchIcon, ProjectIcon, ManagerIcon } from '../../components/super-admin/Icons';

export interface ClientLayoutProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  children: React.ReactNode;
}

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
  { id: 'search-talent', label: 'Search Talent', icon: <SearchIcon size={18} /> },
  { id: 'my-gigs', label: 'Active Task/Contracts', icon: <ProjectIcon size={18} />, aliases: ['review-deliverables', 'review-shortlist'] },
  { id: 'profile-selection', label: 'Supervise Manager', icon: <ManagerIcon size={18} /> }
];

export const ClientLayout: React.FC<ClientLayoutProps> = ({ currentView, onNavigate, children }) => {
  const { user, logout } = useAuth();
  const fullscreen = ['profile-completion', 'profile-selection', 'add-manager', 'add-manager-flow'].includes(currentView);
  if (fullscreen) return <div className="profile-chooser" style={{ minHeight: '100vh', width: '100%' }}>{children}</div>;

  return <DashboardLayout roleLabel="Client Portal" userName={user?.name || 'Client'} activeView={currentView}
    navItems={navItems} onNavigate={onNavigate} onLogout={logout} headerTitle="Client Workspace"
    headerActions={<button type="button" className="ui-button ui-button--primary ui-button--sm" onClick={() => onNavigate('post-gig')}>＋ Post a Task</button>}>
    {children}
  </DashboardLayout>;
};

export default ClientLayout;
