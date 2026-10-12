import React from 'react';

export interface ErrorMessageProps extends React.HTMLAttributes<HTMLParagraphElement> { message?: React.ReactNode; }
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, children, className = '', ...props }) =>
  <p role="alert" className={`ui-validation ${className}`.trim()} {...props}>{message || children}</p>;
export default ErrorMessage;
