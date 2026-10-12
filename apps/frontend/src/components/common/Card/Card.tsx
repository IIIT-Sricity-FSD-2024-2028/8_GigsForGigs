import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className = '', padding = 'md', interactive = false, ...props }, ref
) {
  return <div ref={ref} className={`ui-card ui-card--${padding}${interactive ? ' ui-card--interactive' : ''} ${className}`.trim()} {...props}>{children}</div>;
});

export default Card;
