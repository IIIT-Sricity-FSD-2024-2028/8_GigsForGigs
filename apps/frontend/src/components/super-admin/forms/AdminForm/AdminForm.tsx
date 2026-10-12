import React, { useState } from 'react';
import type { BackendRole, CreateUserDto } from '../../../../types/super-admin';
import { FormContainer } from '../../../common/forms/FormContainer/FormContainer';
import { Input } from '../../../common/Input/Input';
import { Select } from '../../../common/Select/Select';
import { Button } from '../../../common/Button/Button';
import { FormActions } from '../../../common/forms/FormActions/FormActions';

export interface AdminFormProps { onSubmit: (values: CreateUserDto) => void | Promise<void>; submitting?: boolean; initialRole?: BackendRole; }
export const AdminForm: React.FC<AdminFormProps> = ({ onSubmit, submitting = false, initialRole = 'admin' }) => {
  const [values, setValues] = useState<CreateUserDto>({ name: '', email: '', password: '', role: initialRole });
  return <FormContainer title="Create administrator" onSubmit={event => { event.preventDefault(); void onSubmit(values); }}>
    <Input label="Name" required value={values.name} onChange={event => setValues({ ...values, name: event.target.value })} />
    <Input label="Email" type="email" required value={values.email} onChange={event => setValues({ ...values, email: event.target.value })} />
    <Input label="Temporary password" type="password" autoComplete="new-password" required value={values.password} onChange={event => setValues({ ...values, password: event.target.value })} />
    <Select label="Role" value={values.role} onChange={event => setValues({ ...values, role: event.target.value as BackendRole })} options={[
      { value: 'admin', label: 'Administrator' }, { value: 'client', label: 'Client' }, { value: 'manager', label: 'Manager' }, { value: 'gig_professional', label: 'Gig professional' }
    ]} />
    <FormActions><Button type="submit" loading={submitting}>Create account</Button></FormActions>
  </FormContainer>;
};
export default AdminForm;
