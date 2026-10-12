import React from 'react';

export interface SummaryGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number;
  minCardWidth?: string;
}

export const SummaryGrid: React.FC<SummaryGridProps> = ({ children, className = '', columns, minCardWidth = '220px', style, ...props }) =>
  <div className={`summary-grid ${className}`.trim()} style={{ display: 'grid', gridTemplateColumns: columns ? `repeat(${columns}, minmax(0, 1fr))` : `repeat(auto-fit, minmax(min(100%, ${minCardWidth}), 1fr))`, gap: 'var(--space-4)', ...style }} {...props}>{children}</div>;

export default SummaryGrid;
