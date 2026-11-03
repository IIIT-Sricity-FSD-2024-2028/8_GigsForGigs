/**
 * @file GigLayout.tsx
 * @description Shell for the gig professional portal: sidebar nav, page title,
 * search box and "Post Service" button.
 */
import React from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useGig, type GigViewTab } from '../../context/GigContext/GigContext';
import { DashboardLayout, type DashboardNavItem } from '../common/DashboardLayout/DashboardLayout';
import { DashboardIcon, SearchIcon, ProjectIcon, UsersIcon, PaymentIcon } from '../../components/super-admin/Icons';
import { SearchBar } from '../../components/common/SearchBar';
import { Button } from '../../components/common';

export type GigNavItem = DashboardNavItem;
export interface GigLayoutProps { children: React.ReactNode; }

/** Header title for each gig page. */
const GIG_PAGE_TITLES: Partial<Record<GigViewTab, string>> = {
  dashboard: 'Gig Dashboard', explore: 'Marketplace Tasks', 'my-services': 'My Posted Services',
  'active-tasks': 'Active Task', 'applied-tasks': 'Applied Tasks', 'service-requests': 'Service Requests',
  'completed-projects': 'Completed Projects Portfolio', earnings: 'Financial Overview & Payouts',
  'submit-deliverables': 'Submit Task Deliverable', 'submission-success': 'Deliverable Submitted',
  'post-service': 'Publish Service Offering', 'service-published': 'Service Published',
  'project-detail': 'Task Specification Details', profile: 'Professional Identity & Portfolio',
  'profile-completion': 'Edit Gig Profile & Skills'
};

export const GigLayout: React.FC<GigLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { activeTab, setActiveTab, taskSearch, setTaskSearch } = useGig();

  const navItems: GigNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
    { id: 'explore', label: 'Explore Tasks', icon: <SearchIcon size={18} /> },
    { id: 'applied-tasks', label: 'Applied Tasks', icon: <ProjectIcon size={18} /> },
    { id: 'my-services', label: 'My Services', icon: <ProjectIcon size={18} /> },
    { id: 'active-tasks', label: 'Active Task', icon: <ProjectIcon size={18} /> },
    { id: 'completed-projects', label: 'Completed Projects', icon: <ProjectIcon size={18} /> },
    { id: 'earnings', label: 'Total Earnings', icon: <PaymentIcon size={18} /> },
    { id: 'profile', label: 'My Gig Profile', icon: <UsersIcon size={18} /> }
  ];

  return (
    <DashboardLayout
      className="dashboard-shell--gig"
      roleLabel="Gig Professional Hub"
      userName={user?.name || 'Gig Professional'}
      activeView={activeTab}
      navItems={navItems}
      onNavigate={(view) => setActiveTab(view as GigViewTab)}
      onLogout={logout}
      onBrandClick={() => setActiveTab('dashboard')}
      headerTitle={GIG_PAGE_TITLES[activeTab] || 'Gig Portal'}
      headerActions={<>
        {/* Only the Explore page has something to search; elsewhere the box would do nothing. */}
        {activeTab === 'explore' && <SearchBar aria-label="Search marketplace tasks" placeholder="Search by keyword, client, or topic..." value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} />}
        <Button size="sm" onClick={() => setActiveTab('post-service')}>＋ Post Service</Button>
      </>}
    >
      {children}
    </DashboardLayout>
  );
};

export default GigLayout;
