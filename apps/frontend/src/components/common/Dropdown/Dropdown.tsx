import React from 'react';

export interface DropdownProps extends React.DetailsHTMLAttributes<HTMLDetailsElement> {
  label: React.ReactNode;
  align?: 'start' | 'end';
}

export const Dropdown: React.FC<DropdownProps> = ({ label, children, className = '', align = 'end', ...props }) =>
  <details className={`ui-dropdown ui-dropdown--${align} ${className}`.trim()} {...props}><summary>{label}</summary><div className="ui-dropdown__panel">{children}</div></details>;

export default Dropdown;
