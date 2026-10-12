import React from 'react';

export interface FormSectionProps extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'title'> { title?: React.ReactNode; description?: React.ReactNode; }
export const FormSection: React.FC<FormSectionProps> = ({ title, description, children, className = '', ...props }) =>
  <fieldset className={`ui-form-section ${className}`.trim()} {...props}>{title && <legend>{title}</legend>}{description && <p>{description}</p>}{children}</fieldset>;
export default FormSection;
