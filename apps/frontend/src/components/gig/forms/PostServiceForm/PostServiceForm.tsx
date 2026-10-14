import React, { useState } from 'react';
import type { CreateServiceDto } from '../../../../types/gig';
import { FormContainer } from '../../../common/forms/FormContainer/FormContainer';
import { Input } from '../../../common/Input/Input';
import { TextArea } from '../../../common/TextArea/TextArea';
import { Button } from '../../../common/Button/Button';
import { FormActions } from '../../../common/forms/FormActions/FormActions';

export interface PostServiceFormProps { onSubmit: (values: CreateServiceDto) => void | Promise<void>; submitting?: boolean; }
export const PostServiceForm: React.FC<PostServiceFormProps> = ({ onSubmit, submitting = false }) => {
  const [values, setValues] = useState<CreateServiceDto>({ title: '', description: '', price: 0, tags: [] });
  return <FormContainer title="Post a service" onSubmit={event => { event.preventDefault(); void onSubmit(values); }}>
    <Input maxLength={255} label="Service title" required value={values.title} onChange={event => setValues({ ...values, title: event.target.value })} />
    <TextArea maxLength={5000} label="Description" required value={values.description} onChange={event => setValues({ ...values, description: event.target.value })} />
    <Input max="99999999.99" step="0.01" label="Price (INR)" type="number" min={0} required value={values.price || ''} onChange={event => setValues({ ...values, price: Number(event.target.value) })} />
    <Input label="Tags" helperText="Separate tags with commas" value={values.tags.join(', ')} onChange={event => setValues({ ...values, tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })} />
    <FormActions><Button type="submit" loading={submitting}>Publish service</Button></FormActions>
  </FormContainer>;
};
export default PostServiceForm;
