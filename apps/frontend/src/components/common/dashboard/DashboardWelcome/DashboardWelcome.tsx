import React from 'react';

export interface DashboardWelcomeProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  titleId?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Greeting banner at the top of a dashboard: big title, description, and action buttons on the right. */
export const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({ title, titleId, description, actions, children, className = '', ...props }) =>
  <section className={`dashboard-welcome ${className}`.trim()} {...props}><div className="dashboard-welcome__copy"><h1 id={titleId}>{title}</h1>{description && <p>{description}</p>}{children}</div>{actions && <div className="dashboard-welcome__actions">{actions}</div>}</section>;

export default DashboardWelcome;
