import React from 'react';

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> { align?: 'start' | 'center' | 'end' | 'between'; }
/** Row of form buttons; `align` controls their horizontal position. */
export const FormActions: React.FC<FormActionsProps> = ({ children, className = '', align = 'end', ...props }) =>
  <div className={`ui-form-actions ui-form-actions--${align} ${className}`.trim()} {...props}>{children}</div>;
export default FormActions;
