import React from 'react';

export interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { active?: boolean; icon?: React.ReactNode; badge?: React.ReactNode; }
export const SidebarItem: React.FC<SidebarItemProps> = ({ active = false, icon, badge, children, className = '', type = 'button', ...props }) =>
  <button type={type} className={`ui-sidebar-item${active ? ' is-active' : ''} ${className}`.trim()} aria-current={active ? 'page' : undefined} {...props}>{icon && <span className="ui-sidebar-item__icon" aria-hidden="true">{icon}</span>}<span>{children}</span>{badge && <span className="ui-sidebar-item__badge">{badge}</span>}</button>;
export default SidebarItem;
