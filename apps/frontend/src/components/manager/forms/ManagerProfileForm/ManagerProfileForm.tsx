import React, { useState } from 'react';
import type { UpdateManagerProfileDto } from '../../../../types/manager';
import { FormContainer } from '../../../common/forms/FormContainer/FormContainer';
import { Input } from '../../../common/Input/Input';
import { Button } from '../../../common/Button/Button';
import { FormActions } from '../../../common/forms/FormActions/FormActions';

export interface ManagerProfileFormProps { initialValues: Required<Pick<UpdateManagerProfileDto, 'name' | 'email'>>; onSubmit: (values: UpdateManagerProfileDto) => void | Promise<void>; submitting?: boolean; }
export const ManagerProfileForm: React.FC<ManagerProfileFormProps> = ({ initialValues, onSubmit, submitting = false }) => {
  const [name, setName] = useState(initialValues.name); const [email, setEmail] = useState(initialValues.email); const [password, setPassword] = useState('');
  return <FormContainer title="Manager profile" onSubmit={event => { event.preventDefault(); void onSubmit({ name, email, ...(password ? { password } : {}) }); }}>
    <Input maxLength={100} label="Name" required value={name} onChange={event => setName(event.target.value)} />
    <Input maxLength={100} label="Email" type="email" required value={email} onChange={event => setEmail(event.target.value)} />
    <Input maxLength={72} label="New password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} />
    <FormActions><Button type="submit" loading={submitting}>Save profile</Button></FormActions>
  </FormContainer>;
};
export default ManagerProfileForm;
