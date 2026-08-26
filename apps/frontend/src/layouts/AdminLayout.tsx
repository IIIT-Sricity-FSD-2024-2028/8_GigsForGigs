import React, { useState, useEffect } from 'react';
import { useAuth, type AdminTier } from '../context/AuthContext/AuthContext';
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
  SearchIcon
} from '../components/super-admin/Icons';
import { CommandPalette } from '../components/super-admin/CommandPalette';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
  requiredTier?: AdminTier[];
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
  const { user, logout } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
    { id: 'analytics', label: 'Analytics & Trends', icon: <AnalyticsIcon size={18} /> },
    { id: 'clients', label: 'Client Management', icon: <ClientIcon size={18} /> },
    { id: 'gig-pros', label: 'Gig Professionals', icon: <GigProIcon size={18} /> },
    { id: 'managers', label: 'Manager Oversight', icon: <ManagerIcon size={18} /> },
    { id: 'projects', label: 'Projects & Tasks', icon: <ProjectIcon size={18} /> },
    { id: 'payments', label: 'Payments & Revenue', icon: <PaymentIcon size={18} /> },
    { id: 'reviews', label: 'Reviews & Feedback', icon: <ReviewIcon size={18} /> },
    { id: 'disputes', label: 'Disputes & Arbitration', icon: <DisputeIcon size={18} />, badgeCount: 2 },
    { id: 'admin-staff', label: 'Admin Staff & Roles', icon: <ShieldIcon size={18} /> },
    { id: 'profile', label: 'Admin Profile & 2FA', icon: <UsersIcon size={18} /> },
    { id: 'settings', label: 'Platform Settings', icon: <SettingsIcon size={18} /> }
  ];

  // Granular Dynamic RBAC Navigation Filtering
  const userTier: AdminTier = user?.adminTier || 'OWNER';
  const filteredNavItems = allNavItems.filter((item) => {
    if (userTier === 'OWNER' || userTier === 'SUPER_ADMIN') return true;
    if (userTier === 'FINANCIAL_ADMIN') {
      return ['dashboard', 'analytics', 'payments', 'projects', 'settings', 'profile'].includes(item.id);
    }
    if (userTier === 'SUPPORT_ADMIN') {
      return ['dashboard', 'disputes', 'reviews', 'clients', 'gig-pros', 'projects', 'profile'].includes(item.id);
    }
    if (userTier === 'CONTENT_MODERATOR') {
      return ['reviews', 'gig-pros', 'clients', 'projects', 'profile'].includes(item.id);
    }
    if (userTier === 'AUDITOR') {
      // Auditors can inspect all data except modifying platform settings
      return item.id !== 'settings';
    }
    return true;
  });

  const tierBadgeLabels: Record<AdminTier, { text: string; bg: string; color: string }> = {
    OWNER: { text: '👑 Platform Owner', bg: 'rgba(191, 105, 0, 0.15)', color: '#bf6900' },
    SUPER_ADMIN: { text: '⚡ Super Admin', bg: 'rgba(8, 75, 131, 0.15)', color: '#084b83' },
    FINANCIAL_ADMIN: { text: '💳 Financial Admin', bg: 'rgba(81, 158, 138, 0.15)', color: '#519e8a' },
    SUPPORT_ADMIN: { text: '🎧 Support Admin', bg: 'rgba(30, 64, 175, 0.15)', color: '#1e40af' },
    CONTENT_MODERATOR: { text: '🛡️ Moderator', bg: 'rgba(126, 34, 206, 0.15)', color: '#7e22ce' },
    AUDITOR: { text: '📋 Auditor (Read-Only)', bg: 'rgba(80, 36, 25, 0.15)', color: '#502419' }
  };

  const badgeInfo = tierBadgeLabels[userTier] || tierBadgeLabels.OWNER;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--color-bg-light)' }}>
      {/* Fixed Sidebar */}
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
        {/* Brand / Logo */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--spacing-lg)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            gap: 'var(--spacing-sm)'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#ffffff'
            }}
          >
            G
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: 'var(--font-size-base)', letterSpacing: '-0.02em', color: '#ffffff' }}>
              GigsForGigs
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, textTransform: 'uppercase' }}>
              Admin Vertical
            </span>
          </div>
        </div>

        {/* User Role Badge in Sidebar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Active Session</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: userTier === 'AUDITOR' ? '#bf6900' : '#519e8a' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{badgeInfo.text}</span>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav style={{ flex: 1, padding: 'var(--spacing-md) var(--spacing-sm)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filteredNavItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s, color 0.15s'
                }}
              >
                <div style={{ color: isActive ? 'var(--color-primary-blue)' : 'inherit', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </div>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badgeCount && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'var(--color-primary-blue)',
                      color: '#ffffff',
                      padding: '2px 6px',
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

        {/* Bottom User Roster */}
        <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                color: '#ffffff'
              }}
            >
              {(user?.name || 'A').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.name || 'Admin User'}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.email || 'admin@gigsforgigs.internal'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '6px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.8)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: 'var(--header-height)',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--spacing-xl)',
            position: 'sticky',
            top: 0,
            zIndex: 90
          }}
        >
          {/* Breadcrumb / Title */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {pageTitle || 'Super Admin Platform Overview'}
            </h1>
            {pageSubtitle && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {pageSubtitle}
              </span>
            )}
          </div>

          {/* Header Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            {/* Active Tier Pill */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: badgeInfo.bg,
                color: badgeInfo.color,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)'
              }}
            >
              {badgeInfo.text}
            </div>

            {/* Global Search Button */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: 'var(--color-bg-light)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer'
              }}
            >
              <SearchIcon size={14} />
              <span>Search platform...</span>
              <kbd style={{ backgroundColor: '#ffffff', padding: '1px 4px', borderRadius: '3px', border: '1px solid var(--color-border)', fontSize: '10px', fontWeight: 600 }}>Ctrl+K</kbd>
            </button>

            {headerActions}
          </div>
        </header>

        {/* Read-Only Compliance Banner for AUDITOR Tier */}
        {userTier === 'AUDITOR' && (
          <div
            style={{
              backgroundColor: '#FEF3C7',
              borderBottom: '1px solid #F59E0B',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: '#92400E',
              fontWeight: 600
            }}
          >
            <span>📋</span>
            <span>
              <strong>Auditor Compliance Mode:</strong> You are signed in with read-only audit permissions. All ledger, project, and dispute data is viewable, but mutation actions (settlements, overrides, invites) are restricted.
            </span>
          </div>
        )}

        {/* View Body */}
        <main style={{ padding: 'var(--spacing-xl)', flex: 1 }}>
          {children}
        </main>
      </div>

      {/* Global Spotlight Search Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default AdminLayout;
