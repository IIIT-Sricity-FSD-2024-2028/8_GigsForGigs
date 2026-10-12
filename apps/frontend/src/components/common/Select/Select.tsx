import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  helperText?: string;
  label?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { children, options, className = '', error, helperText, label, id, required, ...props }, ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  const descriptionId = selectId ? `${selectId}-description` : undefined;
  return <div className="ui-field">
    {label && <label className="ui-label" htmlFor={selectId}>{label}{required && <span aria-hidden="true"> *</span>}</label>}
    <select ref={ref} id={selectId} required={required} aria-invalid={!!error || undefined}
      aria-describedby={error || helperText ? descriptionId : undefined} className={`ui-input ui-select ${error ? 'ui-input--error' : ''} ${className}`.trim()} {...props}>
      {options ? options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>) : children}
    </select>
    {(error || helperText) && <span id={descriptionId} className={error ? 'ui-validation' : 'ui-helper'}>{error || helperText}</span>}
  </div>;
});

export default Select;
