/**
 * @file GigLayout.tsx
 * @description
 * Main application shell for the Gig Professional portal.
 * Features a 280px fixed navigation sidebar (Yale Blue #084b83 theme),
 * sticky header with dynamic view breadcrumbs, quick global search, logout modal controls,
 * active indicator pills, badge counters, and mini user profile card.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useGig } from '../../context/GigContext/GigContext';
import type { GigViewTab } from '../../context/GigContext/GigContext';
import gigApi from '../../services/api/gig/gigApi';
import {
  DashboardIcon,
  SearchIcon,
  ProjectIcon,
  UsersIcon,
  PaymentIcon,
  BellIcon
} from '../../components/super-admin/Icons';

export interface GigNavItem {
  id: GigViewTab;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

export interface GigLayoutProps {
  children: React.ReactNode;
}

export const GigLayout: React.FC<GigLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { activeTab, setActiveTab, refreshTrigger } = useGig();
  const [globalSearch, setGlobalSearch] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    gigApi.getPendingRequests().then((requests) => {
      if (mounted) {
        setPendingCount(requests.length);
      }
    });
    return () => {
      mounted = false;
    };
  }, [refreshTrigger, activeTab]);

  const navItems: GigNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
    { id: 'explore', label: 'Explore Tasks', icon: <SearchIcon size={18} /> },
    { id: 'active-tasks', label: 'Active Tasks', icon: <ProjectIcon size={18} /> },
    { id: 'pending-requests', label: 'Pending Requests', icon: <BellIcon size={18} />, badgeCount: pendingCount },
    { id: 'completed-projects', label: 'Completed Projects', icon: <ProjectIcon size={18} /> },
    { id: 'earnings', label: 'Total Earnings', icon: <PaymentIcon size={18} /> },
    { id: 'post-service', label: 'Post a Service', icon: <ProjectIcon size={18} /> },
    { id: 'profile', label: 'My Gig Profile', icon: <UsersIcon size={18} /> }
  ];

  const userDisplayName = user?.name || 'Elena Rodriguez';
  const userInitials = userDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'GP';

  const formatBreadcrumb = (tab: GigViewTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Gig Dashboard';
      case 'explore':
        return 'Marketplace Tasks';
      case 'active-tasks':
        return 'Active Engagements';
      case 'pending-requests':
        return 'Pending Client Requests';
      case 'completed-projects':
        return 'Completed Projects Portfolio';
      case 'earnings':
        return 'Financial Overview & Payouts';
      case 'submit-deliverables':
        return 'Submit Task Deliverable';
      case 'submission-success':
        return 'Deliverable Submitted';
      case 'post-service':
        return 'Publish Service Offering';
      case 'service-published':
        return 'Service Published';
      case 'project-detail':
        return 'Task Specification Details';
      case 'profile':
        return 'Professional Identity & Portfolio';
      case 'profile-completion':
        return 'Edit Gig Profile & Skills';
      default:
        return 'Gig Portal';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--color-bg-light)' }}>
      {/* ── Fixed Yale Blue Navigation Sidebar ───────────────────────────── */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--color-primary-dark)',
          color: 'var(--color-text-light)',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Brand Logo Header */}
        <div
          style={{
            padding: 'var(--spacing-lg) var(--spacing-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: '#ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            G
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
              GigsForGigs
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.65)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Gig Professional Hub
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--spacing-md) var(--spacing-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--color-primary-dark-active)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.78)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Active left pill highlight */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      bottom: '20%',
                      width: '3.5px',
                      backgroundColor: 'var(--color-secondary)',
                      borderRadius: '0 3px 3px 0'
                    }}
                  />
                )}
                <span style={{ color: isActive ? 'var(--color-secondary)' : 'inherit', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    style={{
                      backgroundColor: 'var(--color-primary-blue)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-pill)'
                    }}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Mini Profile */}
        <div
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(5, 54, 97, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-secondary)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 'var(--font-size-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
          >
            {userInitials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {userDisplayName}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', fontWeight: 600, letterSpacing: '0.02em' }}>
              GIG PROFESSIONAL
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.8)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-danger-border)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Workspace Canvas ────────────────────────────────────────── */}
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Sticky Top Header */}
        <header
          style={{
            height: 'var(--header-height)',
            backgroundColor: 'var(--color-bg-white)',
            borderBottom: '1px solid var(--color-border)',
            padding: '0 var(--spacing-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          {/* Breadcrumb path */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              GIG PROFESSIONAL /
            </span>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              {formatBreadcrumb(activeTab)}
            </span>
          </div>

          {/* Quick Search & Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <div style={{ position: 'absolute', left: '10px', top: '10px' }}>
                <SearchIcon size={16} color="var(--color-text-muted)" />
              </div>
              <input
                type="text"
                className="admin-input"
                style={{ paddingLeft: '2.2rem', fontSize: 'var(--font-size-xs)', height: '36px' }}
                placeholder="Search tasks, projects, skills..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>

            {/* Post Service Quick Button */}
            <button
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={() => setActiveTab('post-service')}
            >
              + Post Service
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main style={{ padding: 'var(--spacing-xl)', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default GigLayout;
