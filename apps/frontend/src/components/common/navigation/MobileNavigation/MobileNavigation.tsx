import React from 'react';

export interface MobileNavigationItem { id: string; label: string; icon?: React.ReactNode; }
export interface MobileNavigationProps extends React.HTMLAttributes<HTMLElement> { items: MobileNavigationItem[]; activeId: string; onNavigate: (id: string) => void; }
/** Bottom tab bar for small screens; highlights the item whose id is `activeId`. */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({ items, activeId, onNavigate, className = '', ...props }) =>
  <nav aria-label="Mobile navigation" className={`mobile-navigation ${className}`.trim()} {...props}>{items.map(item => <button key={item.id} type="button" aria-current={activeId === item.id ? 'page' : undefined} className={activeId === item.id ? 'is-active' : ''} onClick={() => onNavigate(item.id)}>{item.icon}<span>{item.label}</span></button>)}</nav>;
export default MobileNavigation;
