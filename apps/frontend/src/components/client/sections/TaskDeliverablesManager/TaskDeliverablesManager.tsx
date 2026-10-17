import React, { useEffect, useState } from 'react';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';
import { Card } from '../../../common/Card';
import { EmptyState } from '../../../common/EmptyState';
import { Input } from '../../../common/Input';
import { TextArea } from '../../../common/TextArea';
import { ApiError } from '../../../../services/api/httpClient';
import { clientApi, type TaskDeliverableDefinition } from '../../../../services/api/client/clientApi';

type DefinitionsApi = Pick<typeof clientApi, 'getTaskDeliverableDefinitions' | 'createTaskDeliverableDefinition' | 'updateTaskDeliverableDefinition' | 'deleteTaskDeliverableDefinition'>;

/** `api` defaults to the client's endpoints; the manager view passes managerApi. */
export interface TaskDeliverablesManagerProps { taskId: number; readOnly?: boolean; api?: DefinitionsApi; }

/** Badge for a definition, based on its most recent submission (submissions[0]). */
function submissionBadge(definition: TaskDeliverableDefinition) {
  const latest = definition.submissions[0];
  if (!latest) return { label: 'Not submitted', variant: 'neutral' as const };
  if (latest.status === 'approved') return { label: 'Approved', variant: 'success' as const };
  if (latest.status === 'revision_requested') return { label: 'Revision requested', variant: 'warning' as const };
  if (latest.status === 'closed') return { label: 'Closed', variant: 'neutral' as const };
  return { label: 'Pending review', variant: 'pending' as const };
}

/**
 * Lists a task's expected deliverables and lets the client/manager add, edit or remove them.
 * Items that already have a submission are locked. `readOnly` hides all editing controls.
 */
export const TaskDeliverablesManager: React.FC<TaskDeliverablesManagerProps> = ({ taskId, readOnly = false, api = clientApi }) => {
  const [definitions, setDefinitions] = useState<TaskDeliverableDefinition[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getTaskDeliverableDefinitions(taskId)
      .then(items => {
        if (!mounted) return;
        setDefinitions(items);
        setFeedback(null);
      })
      .catch(error => {
        if (!mounted) return;
        setDefinitions([]);
        setFeedback({ kind: 'error', message: error instanceof ApiError ? error.message : 'Could not load task deliverables.' });
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [taskId, api]);

  const addDefinition = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) { setTitleError('Enter a deliverable title.'); return; }
    setTitleError('');
    setSaving(true);
    setFeedback(null);
    try {
      const created = await api.createTaskDeliverableDefinition(taskId, { title: cleanTitle, description: description.trim() || undefined });
      setDefinitions(previous => [...previous, created]);
      setTitle('');
      setDescription('');
      setFeedback({ kind: 'success', message: 'Deliverable added.' });
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof ApiError ? error.message : 'Could not add the deliverable.' });
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (definitionId: number) => {
    if (saving) return;
    const cleanTitle = editTitle.trim();
    if (!cleanTitle) { setFeedback({ kind: 'error', message: 'Deliverable title cannot be blank.' }); return; }
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await api.updateTaskDeliverableDefinition(taskId, definitionId, { title: cleanTitle, description: editDescription.trim() });
      setDefinitions(previous => previous.map(item => item.definitionId === definitionId ? updated : item));
      setEditingId(null);
      setFeedback({ kind: 'success', message: 'Deliverable updated.' });
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof ApiError ? error.message : 'Could not update the deliverable.' });
    } finally {
      setSaving(false);
    }
  };

  const removeDefinition = async (definitionId: number) => {
    if (saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      await api.deleteTaskDeliverableDefinition(taskId, definitionId);
      setDefinitions(previous => previous.filter(item => item.definitionId !== definitionId));
      setFeedback({ kind: 'success', message: 'Deliverable removed.' });
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof ApiError ? error.message : 'Could not remove the deliverable.' });
    } finally {
      setSaving(false);
    }
  };

  return <Card padding="lg" className="task-deliverables-manager">
    <div className="component-card__header">
      <div><h3>{readOnly ? 'Task Deliverables' : 'Manage Deliverables'}</h3><p>{readOnly ? 'Review the work items and their submission status.' : 'Define the pieces of work expected for this active task.'}</p></div>
    </div>
    {feedback && <p className={`deliverable-feedback deliverable-feedback--${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}

    {!readOnly && <form className="task-deliverables-manager__form" onSubmit={addDefinition} noValidate>
      <Input label="Deliverable title" required maxLength={255} value={title} onChange={event => { setTitle(event.target.value); if (event.target.value.trim()) setTitleError(''); }} error={titleError} placeholder="e.g. Responsive frontend implemented" />
      <TextArea label="Description (optional)" maxLength={2000} rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe the expected outcome" />
      <Button type="submit" loading={saving}>Add deliverable</Button>
    </form>}

    <div className="task-deliverables-manager__list" aria-live="polite">
      {loading ? <p className="ui-helper">Loading deliverables…</p> : definitions.length === 0 ?
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

export default TaskDeliverablesManager;
