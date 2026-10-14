import React, { useState } from 'react';
import type { TaskDto } from '../../../../services/api/client/clientApi';
import { FormContainer } from '../../../common/forms/FormContainer/FormContainer';
import { Input } from '../../../common/Input/Input';
import { TextArea } from '../../../common/TextArea/TextArea';
import { Button } from '../../../common/Button/Button';
import { FormActions } from '../../../common/forms/FormActions/FormActions';

export interface PostGigFormProps { onSubmit: (values: TaskDto) => void | Promise<void>; submitting?: boolean; }
const initial: TaskDto = { title: '', description: '', category: '', duration: '', skills: [], budget: 0, dueDate: '' };
export const PostGigForm: React.FC<PostGigFormProps> = ({ onSubmit, submitting = false }) => {
  const [values, setValues] = useState(initial);
  return <FormContainer title="Post a task" onSubmit={event => { event.preventDefault(); void onSubmit(values); }}>
    <Input maxLength={255} label="Task title" required value={values.title} onChange={event => setValues({ ...values, title: event.target.value })} />
    <TextArea maxLength={5000} label="Description" required value={values.description} onChange={event => setValues({ ...values, description: event.target.value })} />
    <Input maxLength={50} label="Category" value={values.category} onChange={event => setValues({ ...values, category: event.target.value })} />
    <Input max="99999999.99" step="0.01" label="Budget (INR)" type="number" min={0} required value={values.budget || ''} onChange={event => setValues({ ...values, budget: Number(event.target.value) })} />
    <FormActions><Button type="submit" loading={submitting}>Continue</Button></FormActions>
  </FormContainer>;
};
export default PostGigForm;
