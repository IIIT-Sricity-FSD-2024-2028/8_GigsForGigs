import React from 'react';
import { Card } from '../../Card/Card';

export interface BaseCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/** Card with an optional header (title, description, actions on the right). Other cards build on this. */
export const BaseCard: React.FC<BaseCardProps> = ({ title, description, actions, children, className = '', padding = 'md', ...props }) =>
  <Card padding={padding} className={`component-card ${className}`.trim()} {...props}>
    {(title || description || actions) && <header className="component-card__header"><div>{title && <h3>{title}</h3>}{description && <p>{description}</p>}</div>{actions}</header>}
    {children}
  </Card>;

export default BaseCard;
