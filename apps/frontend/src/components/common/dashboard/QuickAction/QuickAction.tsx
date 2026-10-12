import React from 'react';
import { Button } from '../../Button/Button';

export interface QuickActionProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

export const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon, className = '', ...props }) =>
  <Button variant="outline" className={`quick-action ${className}`.trim()} {...props}>{icon && <span aria-hidden="true">{icon}</span>}<span className="quick-action__copy"><strong>{title}</strong>{description && <small>{description}</small>}</span></Button>;

export default QuickAction;
