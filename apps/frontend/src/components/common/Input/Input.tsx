import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', error, helperText, label, id, required, ...props }, ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  const descriptionId = inputId ? `${inputId}-description` : undefined;
  return <div className="ui-field">
    {label && <label className="ui-label" htmlFor={inputId}>{label}{required && <span aria-hidden="true"> *</span>}</label>}
    <input ref={ref} id={inputId} required={required} aria-invalid={!!error || undefined}
      aria-describedby={error || helperText ? descriptionId : undefined}
      className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`.trim()} {...props} />
    {(error || helperText) && <span id={descriptionId} className={error ? 'ui-validation' : 'ui-helper'}>{error || helperText}</span>}
  </div>;
});

export default Input;
