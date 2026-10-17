import React from 'react';

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

/** Spinner with a text label, announced politely to screen readers. */
export const Loader: React.FC<LoaderProps> = ({ label = 'Loading', size = 'md', className = '', ...props }) =>
  <div role="status" aria-live="polite" className={`ui-loading ${className}`.trim()} {...props}>
    <span className={`ui-spinner ui-spinner--${size}`} aria-hidden="true" />{label && <span>{label}</span>}
  </div>;

export default Loader;
