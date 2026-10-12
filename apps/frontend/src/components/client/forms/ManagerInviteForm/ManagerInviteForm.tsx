import React, { useState } from 'react';
import { FormContainer } from '../../../common/forms/FormContainer/FormContainer';
import { Input } from '../../../common/Input/Input';
import { Button } from '../../../common/Button/Button';
import { FormActions } from '../../../common/forms/FormActions/FormActions';

export interface ManagerInviteValues { name: string; email: string; }
export interface ManagerInviteFormProps { onSubmit: (values: ManagerInviteValues) => void | Promise<void>; submitting?: boolean; }
export const ManagerInviteForm: React.FC<ManagerInviteFormProps> = ({ onSubmit, submitting = false }) => {
  const [values, setValues] = useState<ManagerInviteValues>({ name: '', email: '' });
  return <FormContainer title="Invite a manager" onSubmit={event => { event.preventDefault(); void onSubmit(values); }}>
    <Input label="Manager name" required value={values.name} onChange={event => setValues({ ...values, name: event.target.value })} />
    <Input label="Email address" type="email" required value={values.email} onChange={event => setValues({ ...values, email: event.target.value })} />
    <FormActions><Button type="submit" loading={submitting}>Send invitation</Button></FormActions>
  </FormContainer>;
};
export default ManagerInviteForm;
