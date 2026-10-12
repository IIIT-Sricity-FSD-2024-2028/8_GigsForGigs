import React from 'react';
import { Avatar } from '../../../components/common/Avatar';
import { MobileNavigation } from '../../../components/common/navigation/MobileNavigation';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badgeCount?: number;
  aliases?: string[];
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  roleLabel: string;
  userName: string;
  activeView: string;
  navItems: DashboardNavItem[];
  onNavigate: (viewId: string) => void;
  onLogout: () => void;
  headerActions?: React.ReactNode;
  headerTitle?: string;
  sidebarContent?: React.ReactNode;
  onBrandClick?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children, className = '', roleLabel, userName, activeView, navItems, onNavigate, onLogout,
  headerActions, headerTitle, sidebarContent, onBrandClick
}) => {
  const activeNavItem = navItems.find(item => item.id === activeView || item.aliases?.includes(activeView));

  return <div className={`dashboard-shell ${className}`.trim()}>
    <aside className="dashboard-shell__sidebar">
      <button type="button" className="dashboard-shell__brand" onClick={onBrandClick} disabled={!onBrandClick}>
        <span className="dashboard-shell__brand-mark">G</span>
        <span><strong>GigsForGigs</strong><small>{roleLabel}</small></span>
      </button>
      {sidebarContent}
      <nav className="dashboard-shell__nav" aria-label={`${roleLabel} navigation`}>
        {navItems.map((item) => {
          const active = item.id === activeView || item.aliases?.includes(activeView) || false;
          return <button key={item.id} type="button" className={`dashboard-shell__nav-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => onNavigate(item.id)}>
            {item.icon && <span className="dashboard-shell__nav-icon" aria-hidden="true">{item.icon}</span>}
            <span>{item.label}</span>
            {!!item.badgeCount && <span className="dashboard-shell__nav-count">{item.badgeCount}</span>}
          </button>;
        })}
      </nav>
      <div className="dashboard-shell__profile">
        <Avatar name={userName} size={38} className="dashboard-shell__avatar" />
        <div className="dashboard-shell__profile-copy"><strong title={userName}>{userName}</strong><span>{roleLabel}</span></div>
        <button type="button" className="dashboard-shell__logout" onClick={onLogout}>Logout</button>
      </div>
    </aside>
    <div className="dashboard-shell__workspace">
      <header className="dashboard-shell__header">
        <div className="dashboard-shell__header-title">{headerTitle || roleLabel}</div>
        <div className="dashboard-shell__header-actions">{headerActions}</div>
      </header>
      <main className="dashboard-shell__content">{children}</main>
    </div>
    <MobileNavigation className="dashboard-shell__mobile-nav" items={navItems} activeId={activeNavItem?.id || activeView} onNavigate={onNavigate} />
  </div>;
};

export default DashboardLayout;
