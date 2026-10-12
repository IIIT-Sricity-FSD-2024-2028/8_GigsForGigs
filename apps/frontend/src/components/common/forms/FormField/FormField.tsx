import React from 'react';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, required, helperText, error, children, className = '', ...props }) => {
  const description = error || helperText;
  return <div className={`ui-field ${className}`.trim()} {...props}>
    {label && <label className="ui-label" htmlFor={htmlFor}>{label}{required && <span aria-hidden="true"> *</span>}</label>}
    {children}
    {description && <span className={error ? 'ui-validation' : 'ui-helper'}>{description}</span>}
  </div>;
};

export default FormField;
