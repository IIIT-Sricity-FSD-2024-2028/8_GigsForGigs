import React from 'react';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again', className = '', children, ...props }) =>
  <div role="alert" className={`ui-feedback ui-error-state ${className}`.trim()} {...props}>
    <h3>{title}</h3>{message && <p>{message}</p>}{children}
    {onRetry && <button type="button" className="ui-button ui-button--outline ui-button--sm" onClick={onRetry}>{retryLabel}</button>}
  </div>;

export default ErrorState;
