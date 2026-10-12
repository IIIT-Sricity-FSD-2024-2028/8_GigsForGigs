import React from 'react';

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> { brand?: React.ReactNode; footer?: React.ReactNode; }
export const Sidebar: React.FC<SidebarProps> = ({ brand, footer, children, className = '', ...props }) =>
  <aside className={`ui-sidebar ${className}`.trim()} {...props}>{brand && <div className="ui-sidebar__brand">{brand}</div>}<nav aria-label="Sidebar navigation" className="ui-sidebar__nav">{children}</nav>{footer && <footer className="ui-sidebar__footer">{footer}</footer>}</aside>;
export default Sidebar;
