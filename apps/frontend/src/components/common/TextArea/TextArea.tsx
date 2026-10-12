import React from 'react';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
  label?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className = '', error, helperText, label, id, required, ...props }, ref
) {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  const descriptionId = textareaId ? `${textareaId}-description` : undefined;
  return <div className="ui-field">
    {label && <label className="ui-label" htmlFor={textareaId}>{label}{required && <span aria-hidden="true"> *</span>}</label>}
    <textarea ref={ref} id={textareaId} required={required} aria-invalid={!!error || undefined}
      aria-describedby={error || helperText ? descriptionId : undefined} className={`ui-input ui-textarea ${error ? 'ui-input--error' : ''} ${className}`.trim()} {...props} />
    {(error || helperText) && <span id={descriptionId} className={error ? 'ui-validation' : 'ui-helper'}>{error || helperText}</span>}
  </div>;
});

export default TextArea;
