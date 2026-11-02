import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> { label?: React.ReactNode; }

/** Checkbox with an inline label. */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, className = '', ...props }, ref) {
  return <label className={`ui-checkbox ${className}`.trim()}><input ref={ref} type="checkbox" {...props} />{label && <span>{label}</span>}</label>;
});

export default Checkbox;
