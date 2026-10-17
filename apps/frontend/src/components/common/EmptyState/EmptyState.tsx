import React from 'react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/** Friendly "nothing here" message with optional icon and action button. */
export const EmptyState: React.FC<EmptyStateProps> = ({ title = 'Nothing here yet', description, icon, action, children, className = '', ...props }) =>
  <div role="status" className={`ui-feedback ui-empty ${className}`.trim()} {...props}>
    {icon && <div className="ui-empty__icon">{icon}</div>}
    <h3>{title}</h3>{description && <p>{description}</p>}{children}{action}
  </div>;

export default EmptyState;
