import React from 'react';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
}

/** Metric tile: small title + icon on top, big value, optional description/trend underneath. */
export const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, trend, className = '', ...props }) =>
  <article className={`ui-card ui-card--md ui-stat-card ${className}`.trim()} {...props}>
    <div className="ui-stat-card__top"><span>{title}</span>{icon && <span className="ui-stat-card__icon" aria-hidden="true">{icon}</span>}</div>
    <div className="ui-stat-card__value">{value}</div>
    {(description || trend) && <div className="ui-stat-card__footer">{description && <span>{description}</span>}{trend}</div>}
  </article>;

export default StatCard;
