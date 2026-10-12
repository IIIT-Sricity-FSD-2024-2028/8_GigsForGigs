import React from 'react';

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> { brand?: React.ReactNode; actions?: React.ReactNode; }
export const Navbar: React.FC<NavbarProps> = ({ brand, actions, children, className = '', ...props }) =>
  <header className={`ui-navbar ${className}`.trim()} {...props}><div className="ui-navbar__brand">{brand}</div><nav className="ui-navbar__links">{children}</nav><div className="ui-navbar__actions">{actions}</div></header>;
export default Navbar;
