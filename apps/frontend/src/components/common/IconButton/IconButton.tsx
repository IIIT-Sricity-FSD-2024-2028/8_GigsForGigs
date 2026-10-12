import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { label: string; }
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, children, className = '', type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} aria-label={label} title={label} className={`ui-icon-button ${className}`.trim()} {...props}>{children}</button>;
});
export default IconButton;
