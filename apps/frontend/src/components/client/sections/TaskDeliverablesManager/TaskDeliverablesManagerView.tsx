import React, { useState } from 'react';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';
import { Card } from '../../../common/Card';
import { EmptyState } from '../../../common/EmptyState';
import { Loader } from '../../../common/Loader';
import { Input } from '../../../common/Input';
import { TextArea } from '../../../common/TextArea';
import type { TaskDeliverableDefinition } from '../../../../services/api/client/clientApi';

/** Callbacks resolve to an error message on failure, or null on success. */
export type DefinitionActionResult = Promise<string | null>;

/**
 * Presentation-only, role-agnostic deliverables list. It owns only unsaved form
 * drafts and transient feedback; data, request status and API calls come from
 * the role page container (client or manager slice).
 */
export interface TaskDeliverablesManagerViewProps {
  definitions: TaskDeliverableDefinition[];
  loading: boolean;
  loadError?: string | null;
  /** A create/update/delete for this task is in flight. */
  busy?: boolean;
  readOnly?: boolean;
  onCreate: (values: { title: string; description?: string }) => DefinitionActionResult;
  onUpdate: (definitionId: number, values: { title: string; description: string }) => DefinitionActionResult;
  onDelete: (definitionId: number) => DefinitionActionResult;
}

/** Badge for a definition, based on its most recent submission (submissions[0]). */
function submissionBadge(definition: TaskDeliverableDefinition) {
  const latest = definition.submissions[0];
  if (!latest) return { label: 'Not submitted', variant: 'neutral' as const };
  if (latest.status === 'approved') return { label: 'Approved', variant: 'success' as const };
  if (latest.status === 'revision_requested') return { label: 'Revision requested', variant: 'warning' as const };
  if (latest.status === 'closed') return { label: 'Closed', variant: 'neutral' as const };
  return { label: 'Pending review', variant: 'pending' as const };
}

export const TaskDeliverablesManagerView: React.FC<TaskDeliverablesManagerViewProps> = ({
  definitions, loading, loadError = null, busy = false, readOnly = false, onCreate, onUpdate, onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const saving = busy || submitting;

  const run = async (action: () => DefinitionActionResult, successMessage: string) => {
    setSubmitting(true);
    setFeedback(null);
    const error = await action();
    setSubmitting(false);
    setFeedback(error ? { kind: 'error', message: error } : { kind: 'success', message: successMessage });
    return !error;
  };

  const addDefinition = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) { setTitleError('Enter a deliverable title.'); return; }
    setTitleError('');
    const ok = await run(() => onCreate({ title: cleanTitle, description: description.trim() || undefined }), 'Deliverable added.');
    if (ok) { setTitle(''); setDescription(''); }
  };

  const saveEdit = async (definitionId: number) => {
    if (saving) return;
    const cleanTitle = editTitle.trim();
    if (!cleanTitle) { setFeedback({ kind: 'error', message: 'Deliverable title cannot be blank.' }); return; }
    const ok = await run(() => onUpdate(definitionId, { title: cleanTitle, description: editDescription.trim() }), 'Deliverable updated.');
    if (ok) setEditingId(null);
  };

  const removeDefinition = async (definitionId: number) => {
    if (saving) return;
    await run(() => onDelete(definitionId), 'Deliverable removed.');
  };

  const shownFeedback = feedback ?? (loadError ? { kind: 'error' as const, message: loadError } : null);

  return <Card padding="lg" className="task-deliverables-manager">
    <div className="component-card__header">
      <div><h3>{readOnly ? 'Task Deliverables' : 'Manage Deliverables'}</h3><p>{readOnly ? 'Review the work items and their submission status.' : 'Define the pieces of work expected for this active task.'}</p></div>
    </div>
    {shownFeedback && <p className={`deliverable-feedback deliverable-feedback--${shownFeedback.kind}`} role={shownFeedback.kind === 'error' ? 'alert' : 'status'}>{shownFeedback.message}</p>}

    {!readOnly && <form className="task-deliverables-manager__form" onSubmit={addDefinition} noValidate>
      <Input label="Deliverable title" required maxLength={255} value={title} onChange={event => { setTitle(event.target.value); if (event.target.value.trim()) setTitleError(''); }} error={titleError} placeholder="e.g. Responsive frontend implemented" />
      <TextArea label="Description (optional)" maxLength={2000} rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe the expected outcome" />
      <Button type="submit" loading={saving}>Add deliverable</Button>
    </form>}

    <div className="task-deliverables-manager__list" aria-live="polite">
      {loading ? <Loader label="Loading deliverables..." /> : definitions.length === 0 ?
        <EmptyState title="No deliverables defined" description={readOnly ? 'No work items were defined for this task.' : 'Add the work items your professional should complete for this task.'} /> :
        definitions.map(definition => {
          const submitted = definition.submissions.length > 0;
          const badge = submissionBadge(definition);
          return <article key={definition.definitionId} className="task-deliverable-item">
            {editingId === definition.definitionId ? <div className="task-deliverable-item__edit">
              <Input label="Deliverable title" required maxLength={255} value={editTitle} onChange={event => setEditTitle(event.target.value)} />
              <TextArea label="Description (optional)" maxLength={2000} rows={2} value={editDescription} onChange={event => setEditDescription(event.target.value)} />
              <div className="task-deliverable-item__actions"><Button size="sm" loading={saving} onClick={() => void saveEdit(definition.definitionId)}>Save</Button><Button size="sm" variant="outline" disabled={saving} onClick={() => setEditingId(null)}>Cancel</Button></div>
            </div> : <>
              <div className="task-deliverable-item__copy"><strong>{definition.title}</strong>{definition.description && <p>{definition.description}</p>}
                <div className="task-deliverable-item__meta"><Badge variant={badge.variant}>{badge.label}</Badge>{submitted && <span>Included in {definition.submissions.length} submission{definition.submissions.length === 1 ? '' : 's'}</span>}</div>
              </div>
              {!submitted && !readOnly && <div className="task-deliverable-item__actions"><Button size="sm" variant="outline" disabled={saving} onClick={() => { setEditingId(definition.definitionId); setEditTitle(definition.title); setEditDescription(definition.description || ''); }}>Edit</Button><Button size="sm" variant="ghost" disabled={saving} onClick={() => void removeDefinition(definition.definitionId)}>Remove</Button></div>}
            </>}
          </article>;
        })}
    </div>
  </Card>;
};

export default TaskDeliverablesManagerView;
