import React, { useState } from 'react';
import {
  DashboardIcon,
  AnalyticsIcon,
  UsersIcon,
  ClientIcon,
  GigProIcon,
  ManagerIcon,
  PaymentIcon,
  ProjectIcon,
  ReviewIcon,
  DisputeIcon,
  SettingsIcon,
  ShieldIcon,
  SearchIcon,
  BellIcon
} from '../components/super-admin/Icons';

/**
 * @file AdminLayout.tsx
 * @description
 * Primary application shell for the GigsForGigs Super Admin portal.
 * Features a 280px fixed navigation sidebar matching the original `#084b83` theme,
 * dynamic breadcrumb headers, global search, and notification bell alerts.
 */

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

export interface AdminLayoutProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  headerActions?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentView,
  onNavigate,
  children,
  pageTitle,
  pageSubtitle,
  headerActions
}) => {
  const [globalSearch, setGlobalSearch] = useState('');

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
    { id: 'analytics', label: 'Analytics & Trends', icon: <AnalyticsIcon size={18} /> },
    { id: 'clients', label: 'Client Management', icon: <ClientIcon size={18} /> },
    { id: 'gig-pros', label: 'Gig Professionals', icon: <GigProIcon size={18} /> },
    { id: 'managers', label: 'Manager Oversight', icon: <ManagerIcon size={18} /> },
    { id: 'projects', label: 'Projects & Tasks', icon: <ProjectIcon size={18} /> },
    { id: 'payments', label: 'Payments & Revenue', icon: <PaymentIcon size={18} /> },
    { id: 'reviews', label: 'Reviews & Feedback', icon: <ReviewIcon size={18} /> },
    { id: 'disputes', label: 'Disputes & Arbitration', icon: <DisputeIcon size={18} />, badgeCount: 5 },
    { id: 'admin-staff', label: 'Admin Staff & Roles', icon: <ShieldIcon size={18} /> },
    { id: 'profile', label: 'Admin Profile & 2FA', icon: <UsersIcon size={18} /> },
    { id: 'settings', label: 'Platform Settings', icon: <SettingsIcon size={18} /> }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--color-bg-light)' }}>
      {/* ── Fixed Sidebar ────────────────────────────────────────────────── */}
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
        {/* Brand Header */}
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
              Super Admin Suite
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--spacing-md) var(--spacing-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--color-primary-dark-active)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
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
                {/* Active left indicator pill */}
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
                {item.badgeCount && (
                  <span
                    style={{
                      backgroundColor: 'var(--color-danger-text)',
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

        {/* Sidebar Footer User Card */}
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
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-blue)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 'var(--font-size-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
          >
            CA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              Chaitanya Anand
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', fontWeight: 600, letterSpacing: '0.02em' }}>
              PLATFORM OWNER
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Canvas ─────────────────────────────────────────────────── */}
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
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
          {/* Breadcrumb / Page context */}
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              SUPER ADMIN / {currentView.toUpperCase().replace('-', ' ')}
            </span>
          </div>

          {/* Search & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <SearchIcon
                size={16}
                color="var(--color-text-muted)"
                className=""
              />
              <input
                type="text"
                className="admin-input"
                style={{ paddingLeft: '2.2rem', fontSize: 'var(--font-size-xs)', height: '36px' }}
                placeholder="Global platform search..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>

            {/* Notification Bell */}
            <button
              style={{
                position: 'relative',
                background: 'var(--color-bg-light)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px',
                cursor: 'pointer',
                color: 'var(--color-text-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="5 Unresolved Operational Alerts"
            >
              <BellIcon size={18} />
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-danger-text)'
                }}
              />
            </button>

            {headerActions}
          </div>
        </header>

        {/* Page Content Body */}
        <main style={{ padding: 'var(--spacing-xl)', flex: 1 }}>
          {pageTitle && (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary-dark)', letterSpacing: '-0.02em' }}>
                {pageTitle}
              </h1>
              {pageSubtitle && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
