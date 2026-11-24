/**
 * @file TaskDeliverablesManager.tsx
 * @description
 * Shared, presentation-only, and role-agnostic deliverables management component.
 *
 * Rules:
 * - Purely presentational and role-agnostic.
 * - Does not independently fetch server data.
 * - Does NOT import clientApi, managerApi, or Redux slices.
 * - Both Client and Manager portals pass in domain state and callbacks.
 */

import React from 'react';
import type { TaskDeliverableDefinition, RawDeliverable } from '../../../../types/client';
import { TaskDeliverablesManagerView, type DefinitionActionResult } from './TaskDeliverablesManagerView';

export type { DefinitionActionResult };

export interface TaskDeliverablesManagerProps {
  /** Deliverable definitions for the task. Supports both deliverableDefinitions and definitions. */
  deliverableDefinitions?: TaskDeliverableDefinition[];
  definitions?: TaskDeliverableDefinition[];
  submittedDeliverables?: RawDeliverable[];
  loading?: boolean;
  error?: string | null;
  loadError?: string | null;
  busy?: boolean;
  readOnly?: boolean;
  onCreate?: (values: { title: string; description?: string }) => DefinitionActionResult;
  onUpdate?: (definitionId: number, values: { title: string; description: string }) => DefinitionActionResult;
  onDelete?: (definitionId: number) => DefinitionActionResult;
  onReview?: (deliverableNo: number, status: 'approved' | 'revision_requested', feedback?: string) => DefinitionActionResult;
}

export const TaskDeliverablesManager: React.FC<TaskDeliverablesManagerProps> = ({
  deliverableDefinitions,
  definitions: defsProp,
  loading = false,
  error,
  loadError: loadErrProp,
  busy = false,
  readOnly = false,
  onCreate = async () => null,
  onUpdate = async () => null,
  onDelete = async () => null,
}) => {
  const definitions = deliverableDefinitions ?? defsProp ?? [];
  const loadError = error ?? loadErrProp ?? null;

  return (
    <TaskDeliverablesManagerView
      definitions={definitions}
      loading={loading}
      loadError={loadError}
      busy={busy}
      readOnly={readOnly}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  );
};

export default TaskDeliverablesManager;
