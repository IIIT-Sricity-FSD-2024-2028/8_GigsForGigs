import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Page title block: optional breadcrumbs, h1 title, description, and actions on the right. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, breadcrumbs, actions, className = '' }) =>
  <header className={`ui-page-header ${className}`.trim()}>
    {breadcrumbs && <div className="ui-page-header__breadcrumbs">{breadcrumbs}</div>}
    <div className="ui-page-header__row"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="ui-page-header__actions">{actions}</div>}</div>
  </header>;

export default PageHeader;
