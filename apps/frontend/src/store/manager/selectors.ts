/**
 * @file selectors.ts
 * @description Read-side of managerSlice. Derived lists are memoized so
 * components re-render only when the underlying server data changes.
 */
import { createSelector } from '@reduxjs/toolkit';
import type { TaskDeliverableDefinition } from '../../services/api/client/clientApi';
import type { Deliverable, ManagerApplication } from '../../types/manager';
import type { ManagerState } from './managerSlice';

type State = { manager: ManagerState };

const EMPTY_DELIVERABLES: Deliverable[] = [];
const EMPTY_APPLICATIONS: ManagerApplication[] = [];
const EMPTY_DEFINITIONS: TaskDeliverableDefinition[] = [];

export const selectManagerProfile = (state: State) => state.manager.profile;
export const selectManagerProfileSave = (state: State) => state.manager.profileSave;
export const selectManagerTasks = (state: State) => state.manager.tasks;
export const selectManagerTasksRequest = (state: State) => state.manager.tasksRequest;

export const selectActiveManagerTasks = createSelector([selectManagerTasks], (tasks) =>
  tasks.filter((task) => task.status !== 'completed'));
export const selectCompletedManagerTasks = createSelector([selectManagerTasks], (tasks) =>
  tasks.filter((task) => task.status === 'completed'));

export const selectManagerTaskDetail = (state: State, taskId: number) => state.manager.taskDetails[taskId];
export const selectManagerTaskDetailRequest = (state: State, taskId: number) => state.manager.taskDetailRequests[taskId];
export const selectManagerTaskDeliverables = (state: State, taskId: number) =>
  state.manager.deliverablesByTask[taskId] ?? EMPTY_DELIVERABLES;
export const selectManagerTaskApplications = (state: State, taskId: number) =>
  state.manager.applicationsByTask[taskId] ?? EMPTY_APPLICATIONS;
export const selectManagerTaskDefinitions = (state: State, taskId: number) =>
  state.manager.definitionsByTask[taskId] ?? EMPTY_DEFINITIONS;
export const selectManagerDefinitionsRequest = (state: State, taskId: number) => state.manager.definitionsRequests[taskId];
export const selectManagerDefinitionsBusy = (state: State, taskId: number) => (state.manager.definitionMutations[taskId] ?? 0) > 0;
export const selectManagerTaskBusy = (state: State, taskId: number) => (state.manager.taskMutations[taskId] ?? 0) > 0;
export const selectManagerTaskActionError = (state: State, taskId: number) => state.manager.taskActionErrors[taskId] ?? null;

/** Submitted (awaiting review) deliverables across the manager's in-progress tasks. */
export const selectPendingManagerDeliverables = createSelector(
  [selectManagerTasks, (state: State) => state.manager.deliverablesByTask],
  (tasks, deliverablesByTask) => tasks
    .filter((task) => task.status === 'in_progress')
    .flatMap((task) => (deliverablesByTask[task.taskId] ?? EMPTY_DELIVERABLES).filter((d) => d.status === 'submitted')),
);
