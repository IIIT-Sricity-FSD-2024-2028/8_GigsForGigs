import React from 'react';
export interface DashboardSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  as?: 'section' | 'div';
}

/** A titled block on a dashboard page. Renders as <section> (default) or <div> via `as`. */
export const DashboardSection: React.FC<DashboardSectionProps> = ({ title, description, actions, children, className = '', as = 'section', ...props }) => {
  const content = <>{(title || description || actions) && <header className="dashboard-section__header"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{actions}</header>}{children}</>;
  return as === 'section' ? <section className={`dashboard-section ${className}`.trim()} {...props}>{content}</section> : <div className={`dashboard-section ${className}`.trim()} {...props}>{content}</div>;
};
export default DashboardSection;
