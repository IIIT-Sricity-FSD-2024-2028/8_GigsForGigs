import React from 'react';

export interface FormContainerProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'title'> { title?: React.ReactNode; description?: React.ReactNode; }
/** <form> wrapper with an optional title/description header. */
export const FormContainer: React.FC<FormContainerProps> = ({ title, description, children, className = '', ...props }) =>
  <form className={`ui-form ${className}`.trim()} {...props}>{(title || description) && <header className="ui-form__header">{title && <h2>{title}</h2>}{description && <p>{description}</p>}</header>}{children}</form>;
export default FormContainer;
