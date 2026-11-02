import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons have no visible text for screen readers. */
  label: string;
  size?: 'sm' | 'md';
}

/** Square icon-only button; `label` becomes aria-label and tooltip. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', className = '', type = 'button', children, ...props }, ref
) {
  return <button ref={ref} type={type} aria-label={label} title={label} className={`ui-icon-button ui-icon-button--${size} ${className}`.trim()} {...props}>{children}</button>;
});

export default IconButton;
