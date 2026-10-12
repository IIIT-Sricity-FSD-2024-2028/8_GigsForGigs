import React from 'react';

export interface BreadcrumbItem { label: string; href?: string; current?: boolean; }
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items = [], separator = '/', children, className = '', ...props }) =>
  <nav aria-label="Breadcrumb" className={`ui-breadcrumb ${className}`.trim()} {...props}>
    {children || <ol>{items.map((item, index) => <li key={`${item.label}-${index}`} aria-current={item.current ? 'page' : undefined}>
      {index > 0 && <span aria-hidden="true" className="ui-breadcrumb__separator">{separator}</span>}
      {item.href && !item.current ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
    </li>)}</ol>}
  </nav>;

export default Breadcrumb;
