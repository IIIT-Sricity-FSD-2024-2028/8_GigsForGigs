import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, breadcrumbs, actions, className = '' }) =>
  <header className={`ui-page-header ${className}`.trim()}>
    {breadcrumbs && <div className="ui-page-header__breadcrumbs">{breadcrumbs}</div>}
    <div className="ui-page-header__row"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="ui-page-header__actions">{actions}</div>}</div>
  </header>;

export default PageHeader;
