import React, { useEffect, useState } from 'react';
import { ApiError } from '../../../../services/api/httpClient';
import { clientApi, type TaskDeliverableDefinition } from '../../../../services/api/client/clientApi';
import { TaskDeliverablesManagerView } from './TaskDeliverablesManagerView';

/**
 * Transitional client container for the shared deliverables UI. Rendering lives in
 * the presentational TaskDeliverablesManagerView; the manager portal already
 * feeds that view from managerSlice. The client portal keeps this wrapper until
 * clientSlice owns definitions (Shekhar's part of the Redux migration).
 */
export interface TaskDeliverablesManagerProps { taskId: number; readOnly?: boolean; }

const failure = (error: unknown, fallback: string) => (error instanceof ApiError ? error.message : fallback);

export const TaskDeliverablesManager: React.FC<TaskDeliverablesManagerProps> = ({ taskId, readOnly = false }) => {
  const [definitions, setDefinitions] = useState<TaskDeliverableDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    clientApi.getTaskDeliverableDefinitions(taskId)
      .then(items => { if (mounted) { setDefinitions(items); setLoadError(null); } })
      .catch(error => { if (mounted) { setDefinitions([]); setLoadError(failure(error, 'Could not load task deliverables.')); } })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [taskId]);

  return <TaskDeliverablesManagerView
    definitions={definitions}
    loading={loading}
    loadError={loadError}
    readOnly={readOnly}
    onCreate={async values => {
      try {
        const created = await clientApi.createTaskDeliverableDefinition(taskId, values);
        setDefinitions(previous => [...previous, created]);
        return null;
      } catch (error) { return failure(error, 'Could not add the deliverable.'); }
    }}
    onUpdate={async (definitionId, values) => {
      try {
        const updated = await clientApi.updateTaskDeliverableDefinition(taskId, definitionId, values);
        setDefinitions(previous => previous.map(item => item.definitionId === definitionId ? updated : item));
        return null;
      } catch (error) { return failure(error, 'Could not update the deliverable.'); }
    }}
    onDelete={async definitionId => {
      try {
        await clientApi.deleteTaskDeliverableDefinition(taskId, definitionId);
        setDefinitions(previous => previous.filter(item => item.definitionId !== definitionId));
        return null;
      } catch (error) { return failure(error, 'Could not remove the deliverable.'); }
    }}
  />;
};

export default TaskDeliverablesManager;
