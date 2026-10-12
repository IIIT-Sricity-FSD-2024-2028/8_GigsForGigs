import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'pending' | 'active' | 'success' | 'warning' | 'error' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '', ...props }) =>
  <span className={`ui-badge ui-badge--${variant} ${className}`.trim()} {...props}>{children}</span>;

export default Badge;
