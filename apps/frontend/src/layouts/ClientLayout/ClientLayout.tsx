import React from 'react';
import '../../pages/client/client.css';
import { useAuth } from '../../context/AuthContext';

export interface ClientLayoutProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({
  currentView,
  onNavigate,
  children,
}) => {
  const { user, logout } = useAuth();

  // Onboarding/Chooser screens that do NOT have the dashboard sidebar
  const isFullScreenView = [
    'profile-completion',
    'profile-selection',
    'add-manager',
    'add-manager-flow'
  ].includes(currentView);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    onNavigate('profile-selection');
  };

  if (isFullScreenView) {
    return (
      <div className="profile-chooser" style={{ minHeight: '100vh', width: '100%' }}>
        {children}
      </div>
    );
  }

  // Get initials for Avatar
  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'CL';
    return nameStr.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--color-bg-light)' }}>
      {/* ── Sidebar Navigation ────────────────────────────────────────── */}
      <aside className="dashboard-sidebar" style={{ width: '280px', position: 'fixed', top: 0, left: 0, bottom: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <a href="#dashboard" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }} className="client-sidebar-brand">
          <div className="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 12l3 3 5-5"></path>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">GigFlow</span>
            <span className="brand-sub">Client Portal</span>
          </div>
        </a>

        <nav className="sidebar-nav">
          <a
            href="#dashboard"
            onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </a>
          <a
            href="#search-talent"
            onClick={(e) => { e.preventDefault(); onNavigate('search-talent'); }}
            className={`nav-item ${currentView === 'search-talent' ? 'active' : ''}`}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Search Talent
          </a>
          <a
            href="#my-gigs"
            onClick={(e) => { e.preventDefault(); onNavigate('my-gigs'); }}
            className={`nav-item ${currentView === 'my-gigs' || currentView === 'review-deliverables' ? 'active' : ''}`}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Active Contracts
          </a>
          <a
            href="#total-spent"
            onClick={(e) => { e.preventDefault(); onNavigate('total-spent'); }}
            className={`nav-item ${currentView === 'total-spent' ? 'active' : ''}`}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Total Spent
          </a>
          <a
            href="#supervise-manager"
            onClick={(e) => { e.preventDefault(); onNavigate('profile-selection'); }}
            className="nav-item"
          >
            <svg fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Supervise Manager
          </a>
        </nav>

        <div className="sidebar-user-info">
          <div className="user-avatar user-avatar-seagrass">
            {getInitials(user?.name || 'Aditya')}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'Aditya'}</div>
            <div className="user-role">Premium Account</div>
          </div>
          <div className="online-dot"></div>
        </div>
      </aside>

      {/* ── Main Application Content ──────────────────────────────────── */}
      <main className="dashboard-main" style={{ flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column', minHeight: '100vh', width: 'calc(100% - 280px)' }}>
        <header className="dashboard-topbar">
          <div style={{ flex: 1 }}></div>
          <div className="topbar-actions">
            <a
              href="#post-gig"
              onClick={(e) => { e.preventDefault(); onNavigate('post-gig'); }}
              className="btn-post-gig"
            >
              <svg fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Post a Task
            </a>
            <button
              onClick={handleLogout}
              className="btn-logout"
              style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="dashboard-content" style={{ padding: 'var(--spacing-xl)', flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default ClientLayout;
