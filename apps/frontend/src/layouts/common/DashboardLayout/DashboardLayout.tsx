/**
 * @file DashboardLayout.tsx
 * @description Shared page shell used by the client, manager and gig portals:
 * left sidebar (brand, nav, user + logout), top header, main content area,
 * and a bottom nav bar on small screens.
 */
import React from 'react';
import { Avatar } from '../../../components/common/Avatar';
import { MobileNavigation } from '../../../components/common/navigation/MobileNavigation';

/** One sidebar link. */
export interface DashboardNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Small number bubble (hidden when 0/undefined). */
  badgeCount?: number;
  /** Other view ids that should also highlight this item. */
  aliases?: string[];
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  /** e.g. "Client Portal" — shown under the brand and next to the user name. */
  roleLabel: string;
  userName: string;
  /** Current page id, used to highlight the active nav item. */
  activeView: string;
  navItems: DashboardNavItem[];
  onNavigate: (viewId: string) => void;
  onLogout: () => void;
  /** Buttons/inputs on the right of the header. */
  headerActions?: React.ReactNode;
  /** Header text; falls back to roleLabel. */
  headerTitle?: string;
  /** Extra block rendered between the brand and the nav. */
  sidebarContent?: React.ReactNode;
  /** Makes the brand clickable when provided. */
  onBrandClick?: () => void;
}

/** True when `item` is the current page (directly or via an alias). */
const isItemActive = (item: DashboardNavItem, activeView: string) =>
  item.id === activeView || item.aliases?.includes(activeView) || false;

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children, className = '', roleLabel, userName, activeView, navItems, onNavigate, onLogout,
  headerActions, headerTitle, sidebarContent, onBrandClick
}) => {
  const activeNavItem = navItems.find((item) => isItemActive(item, activeView));

  return (
    <div className={`dashboard-shell ${className}`.trim()}>
      <aside className="dashboard-shell__sidebar">
        <button type="button" className="dashboard-shell__brand" onClick={onBrandClick} disabled={!onBrandClick}>
          <span className="dashboard-shell__brand-mark">G</span>
          <span><strong>GigsForGigs</strong><small>{roleLabel}</small></span>
        </button>

        {sidebarContent}

        <nav className="dashboard-shell__nav" aria-label={`${roleLabel} navigation`}>
          {navItems.map((item) => {
            const active = isItemActive(item, activeView);
            return (
              <button key={item.id} type="button" className={`dashboard-shell__nav-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => onNavigate(item.id)}>
                {item.icon && <span className="dashboard-shell__nav-icon" aria-hidden="true">{item.icon}</span>}
                <span>{item.label}</span>
                {!!item.badgeCount && <span className="dashboard-shell__nav-count">{item.badgeCount}</span>}
              </button>
            );
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

      {/* Bottom tab bar, only visible on narrow screens (via CSS). */}
      <MobileNavigation className="dashboard-shell__mobile-nav" items={navItems} activeId={activeNavItem?.id || activeView} onNavigate={onNavigate} />
    </div>
  );
};

export default DashboardLayout;
