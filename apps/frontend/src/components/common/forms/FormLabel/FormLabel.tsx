import React from 'react';

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { required?: boolean; }
export const FormLabel: React.FC<FormLabelProps> = ({ children, required, className = '', ...props }) =>
  <label className={`ui-label ${className}`.trim()} {...props}>{children}{required && <span aria-hidden="true"> *</span>}</label>;
export default FormLabel;
