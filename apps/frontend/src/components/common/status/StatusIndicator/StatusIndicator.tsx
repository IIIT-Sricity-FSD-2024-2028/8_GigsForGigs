import React from 'react';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> { status: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string; pulse?: boolean; }
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, pulse = false, className = '', ...props }) =>
  <span className={`ui-status-indicator ui-status-indicator--${status} ${pulse ? 'is-pulsing' : ''} ${className}`.trim()} {...props}><span className="ui-status-indicator__dot" aria-hidden="true" />{label}</span>;
export default StatusIndicator;
