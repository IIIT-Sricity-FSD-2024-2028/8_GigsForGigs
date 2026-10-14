import React, { useState } from 'react';
// Unused: managers no longer create submissions on a professional's behalf. Safe to delete.
interface CreateDeliverableDto { gigProfileId: number; description: string; submissionPath: string; }
import { FormContainer } from '../../../common/forms/FormContainer/FormContainer';
import { Input } from '../../../common/Input/Input';
import { TextArea } from '../../../common/TextArea/TextArea';
import { Button } from '../../../common/Button/Button';
import { FormActions } from '../../../common/forms/FormActions/FormActions';

export interface DeliverableFormProps { taskId: number; defaultGigProfileId: number; onSubmit: (value: CreateDeliverableDto) => void | Promise<void>; submitting?: boolean; }
export const DeliverableForm: React.FC<DeliverableFormProps> = ({ taskId, defaultGigProfileId, onSubmit, submitting = false }) => {
  const [description, setDescription] = useState(''); const [submissionPath, setSubmissionPath] = useState('');
  return <FormContainer title="Add deliverable" onSubmit={event => { event.preventDefault(); void onSubmit({ gigProfileId: defaultGigProfileId, description, submissionPath }); }}>
    <TextArea maxLength={5000} label="Description" required value={description} onChange={event => setDescription(event.target.value)} />
    <Input maxLength={500} label="Deliverable link" type="url" required value={submissionPath} onChange={event => setSubmissionPath(event.target.value)} />
    <input type="hidden" name="taskId" value={taskId} />
    <FormActions><Button type="submit" loading={submitting}>Add deliverable</Button></FormActions>
  </FormContainer>;
};
export default DeliverableForm;
