import React, { useState } from 'react';
import type { SubmitDeliverableDto } from '../../../../types/gig';
import { FormContainer } from '../../../common/forms/FormContainer/FormContainer';
import { Input } from '../../../common/Input/Input';
import { TextArea } from '../../../common/TextArea/TextArea';
import { Button } from '../../../common/Button/Button';
import { FormActions } from '../../../common/forms/FormActions/FormActions';

export interface DeliverableSubmissionFormProps { taskId: number; onSubmit: (values: SubmitDeliverableDto) => void | Promise<void>; submitting?: boolean; }
export const DeliverableSubmissionForm: React.FC<DeliverableSubmissionFormProps> = ({ taskId, onSubmit, submitting = false }) => {
  const [content, setContent] = useState(''); const [notes, setNotes] = useState('');
  return <FormContainer title="Submit deliverable" onSubmit={event => { event.preventDefault(); void onSubmit({ taskId, content, notes: notes || undefined }); }}>
    <TextArea label="Work completed" required value={content} onChange={event => setContent(event.target.value)} />
    <Input label="Reference link or attachment URL" value={notes} onChange={event => setNotes(event.target.value)} />
    <FormActions><Button type="submit" loading={submitting}>Submit for review</Button></FormActions>
  </FormContainer>;
};
export default DeliverableSubmissionForm;
