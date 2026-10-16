import React, { useState } from 'react';
import type { ClientProfileData } from '../../../../services/api/client/clientApi';
import { FormContainer } from '../../../common/forms/FormContainer/FormContainer';
import { Input } from '../../../common/Input/Input';
import { Button } from '../../../common/Button/Button';
import { FormActions } from '../../../common/forms/FormActions/FormActions';

export type ClientProfileFormValues = Pick<ClientProfileData, 'clientName'> & { domain: string };
export interface ClientProfileFormProps { initialValues: ClientProfileFormValues; onSubmit: (values: ClientProfileFormValues) => void | Promise<void>; submitting?: boolean; }
export const ClientProfileForm: React.FC<ClientProfileFormProps> = ({ initialValues, onSubmit, submitting = false }) => {
  const [values, setValues] = useState(initialValues);
  return <FormContainer title="Client profile" onSubmit={event => { event.preventDefault(); void onSubmit(values); }}>
    <Input maxLength={100} label="Organization name" required value={values.clientName} onChange={event => setValues({ ...values, clientName: event.target.value })} />
    <Input maxLength={100} label="Domain" value={values.domain} onChange={event => setValues({ ...values, domain: event.target.value })} />
    <FormActions><Button type="submit" loading={submitting}>Save profile</Button></FormActions>
  </FormContainer>;
};
export default ClientProfileForm;
