import React from 'react';

export interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> { message?: React.ReactNode; }
export const FormError: React.FC<FormErrorProps> = ({ message, children, className = '', ...props }) =>
  <div role="alert" className={`ui-form-error ${className}`.trim()} {...props}>{message || children}</div>;
export default FormError;
