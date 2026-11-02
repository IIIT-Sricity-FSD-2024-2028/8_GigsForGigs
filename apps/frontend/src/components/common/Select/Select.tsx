import React from 'react';

export interface SelectOption { value: string; label: string; disabled?: boolean; }
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  helperText?: string;
  label?: string;
  options?: SelectOption[];
  placeholder?: string;
}

/** Dropdown with label/helper/error, like Input. Pass `options`, or <option> children for custom markup. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = '', error, helperText, label, id, required, options, placeholder, children, ...props }, ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  const descriptionId = selectId ? `${selectId}-description` : undefined;
  return <div className="ui-field">
    {label && <label className="ui-label" htmlFor={selectId}>{label}{required && <span aria-hidden="true"> *</span>}</label>}
    <select ref={ref} id={selectId} required={required} aria-invalid={!!error || undefined}
      aria-describedby={error || helperText ? descriptionId : undefined}
      className={`ui-input ui-select ${error ? 'ui-input--error' : ''} ${className}`.trim()} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options?.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      {children}
    </select>
    {(error || helperText) && <span id={descriptionId} className={error ? 'ui-validation' : 'ui-helper'}>{error || helperText}</span>}
  </div>;
});

export default Select;
