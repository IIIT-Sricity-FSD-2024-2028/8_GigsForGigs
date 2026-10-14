import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useGig, type GigViewTab } from '../../context/GigContext/GigContext';
import gigApi from '../../services/api/gig/gigApi';
import { DashboardLayout, type DashboardNavItem } from '../common/DashboardLayout/DashboardLayout';
import { DashboardIcon, SearchIcon, ProjectIcon, UsersIcon, PaymentIcon, BellIcon } from '../../components/super-admin/Icons';
import { SearchBar } from '../../components/common/SearchBar';

export type GigNavItem = DashboardNavItem;
export interface GigLayoutProps { children: React.ReactNode; }

const formatBreadcrumb = (tab: GigViewTab) => ({
  dashboard: 'Gig Dashboard', explore: 'Marketplace Tasks', 'my-services': 'My Posted Services',
  'active-tasks': 'Active Task/Contracts', 'pending-requests': 'Pending Client Requests',
  'completed-projects': 'Completed Projects Portfolio', earnings: 'Financial Overview & Payouts',
  'submit-deliverables': 'Submit Task Deliverable', 'submission-success': 'Deliverable Submitted',
  'post-service': 'Publish Service Offering', 'service-published': 'Service Published',
  'project-detail': 'Task Specification Details', profile: 'Professional Identity & Portfolio',
  'profile-completion': 'Edit Gig Profile & Skills'
} as Partial<Record<GigViewTab, string>>)[tab] || 'Gig Portal';

export const GigLayout: React.FC<GigLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { activeTab, setActiveTab, refreshTrigger } = useGig();
  const [pendingCount, setPendingCount] = useState(0);
  const [globalSearch, setGlobalSearch] = useState('');
  useEffect(() => {
    let mounted = true;
    gigApi.getPendingRequests().then((requests) => { if (mounted) setPendingCount(requests.length); }).catch(() => { if (mounted) setPendingCount(0); });
    return () => { mounted = false; };
  }, [refreshTrigger, activeTab]);

  const navItems: GigNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
    { id: 'explore', label: 'Explore Tasks', icon: <SearchIcon size={18} /> },
    { id: 'my-services', label: 'My Services', icon: <ProjectIcon size={18} /> },
    { id: 'pending-requests', label: 'Pending Requests', icon: <BellIcon size={18} />, badgeCount: pendingCount },
    { id: 'active-tasks', label: 'Active Task/Contracts', icon: <ProjectIcon size={18} /> },
    { id: 'completed-projects', label: 'Completed Projects', icon: <ProjectIcon size={18} /> },
    { id: 'earnings', label: 'Total Earnings', icon: <PaymentIcon size={18} /> },
    { id: 'profile', label: 'My Gig Profile', icon: <UsersIcon size={18} /> }
  ];
  return <DashboardLayout className="dashboard-shell--gig" roleLabel="Gig Professional Hub" userName={user?.name || 'Gig Professional'}
    activeView={activeTab} navItems={navItems} onNavigate={(view) => setActiveTab(view as GigViewTab)} onLogout={logout}
    headerTitle={formatBreadcrumb(activeTab)} headerActions={<>
      <SearchBar aria-label="Search tasks, projects, skills" placeholder="Search tasks, projects, skills..." value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} />
      <button type="button" className="ui-button ui-button--primary ui-button--sm" onClick={() => setActiveTab('post-service')}>＋ Post Service</button>
    </>}>
    {children}
  </DashboardLayout>;
};

export default GigLayout;
