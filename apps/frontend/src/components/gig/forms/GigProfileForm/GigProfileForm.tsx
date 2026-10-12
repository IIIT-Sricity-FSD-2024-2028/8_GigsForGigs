import React, { useState } from 'react';
import type { GigProfile } from '../../../../types/gig';
import { FormContainer } from '../../../common/forms/FormContainer/FormContainer';
import { Input } from '../../../common/Input/Input';
import { TextArea } from '../../../common/TextArea/TextArea';
import { Button } from '../../../common/Button/Button';
import { FormActions } from '../../../common/forms/FormActions/FormActions';

export type GigProfileValues = Pick<GigProfile, 'name' | 'email' | 'bio' | 'skills'>;
export interface GigProfileFormProps { initialValues: GigProfileValues; onSubmit: (values: GigProfileValues) => void | Promise<void>; submitting?: boolean; }
export const GigProfileForm: React.FC<GigProfileFormProps> = ({ initialValues, onSubmit, submitting = false }) => {
  const [values, setValues] = useState(initialValues);
  return <FormContainer title="Professional profile" onSubmit={event => { event.preventDefault(); void onSubmit(values); }}>
    <Input label="Name" required value={values.name} onChange={event => setValues({ ...values, name: event.target.value })} />
    <Input label="Email" type="email" required value={values.email} onChange={event => setValues({ ...values, email: event.target.value })} />
    <TextArea label="Professional bio" value={values.bio || ''} onChange={event => setValues({ ...values, bio: event.target.value })} />
    <Input label="Skills" helperText="Separate skills with commas" value={values.skills.join(', ')} onChange={event => setValues({ ...values, skills: event.target.value.split(',').map(skill => skill.trim()).filter(Boolean) })} />
    <FormActions><Button type="submit" loading={submitting}>Save profile</Button></FormActions>
  </FormContainer>;
};
export default GigProfileForm;
