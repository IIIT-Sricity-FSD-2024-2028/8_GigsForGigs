/**
 * @file managerSlice.ts
 * @description Redux state for the Manager portal, mapped 1:1 onto `managerApi`.
 *
 * Rules (see REDUX_MIGRATION_TEAM_PLAN.md):
 * - Every request is a `createAsyncThunk`; components only dispatch and select.
 * - Server data changes only in `fulfilled`, from the backend response.
 * - Per-task state is keyed by taskId, and each keyed request remembers its
 *   latest requestId, so a slow response for task A can never overwrite task B
 *   (or a newer request for A).
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { managerApi } from '../../services/api/manager/managerApi';
import type { TaskDeliverableDefinition } from '../../services/api/client/clientApi';
import type {
  Deliverable,
  ManagerApplication,
  ManagerProfile,
  ManagerTask,
  ReviewDeliverableDto,
  ShortlistApplicationDto,
  UpdateManagerProfileDto,
} from '../../types/manager';
import { acceptManagerInvite, login } from '../auth/authSlice';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
export interface RequestState { status: RequestStatus; error: string | null; requestId?: string }

export interface ManagerState {
  profile: ManagerProfile | null;
  profileRequest: RequestState;
  profileSave: RequestState;
  tasks: ManagerTask[];
  tasksRequest: RequestState;
  /** Task currently opened on the task-detail route. */
  selectedTaskId: number | null;
  taskDetails: Record<number, ManagerTask>;
  taskDetailRequests: Record<number, RequestState>;
  deliverablesByTask: Record<number, Deliverable[]>;
  deliverablesRequests: Record<number, RequestState>;
  applicationsByTask: Record<number, ManagerApplication[]>;
  definitionsByTask: Record<number, TaskDeliverableDefinition[]>;
  definitionsRequests: Record<number, RequestState>;
  /** In-flight shortlist/review/close count per task (counter, so one request never clears another's flag). */
  taskMutations: Record<number, number>;
  taskActionErrors: Record<number, string | null>;
  /** In-flight definition create/update/delete count per task. */
  definitionMutations: Record<number, number>;
  definitionErrors: Record<number, string | null>;
}

const idle: RequestState = { status: 'idle', error: null };

export const initialManagerState: ManagerState = {
  profile: null,
  profileRequest: idle,
  profileSave: idle,
  tasks: [],
  tasksRequest: idle,
  selectedTaskId: null,
  taskDetails: {},
  taskDetailRequests: {},
  deliverablesByTask: {},
  deliverablesRequests: {},
  applicationsByTask: {},
  definitionsByTask: {},
  definitionsRequests: {},
  taskMutations: {},
  taskActionErrors: {},
  definitionMutations: {},
  definitionErrors: {},
};

type ThunkConfig = { rejectValue: string; state: { manager: ManagerState } };

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const fetchManagerProfile = createAsyncThunk<ManagerProfile, void, ThunkConfig>(
  'manager/fetchProfile',
  async (_, { rejectWithValue }) => {
    try { return await managerApi.getProfile(); }
    catch (error) { return rejectWithValue(messageOf(error, 'Failed to load manager profile')); }
  },
  { condition: (_, { getState }) => getState().manager.profileRequest.status !== 'loading' },
);

export const updateManagerProfile = createAsyncThunk<ManagerProfile, UpdateManagerProfileDto, ThunkConfig>(
  'manager/updateProfile',
  async (dto, { rejectWithValue }) => {
    try { return await managerApi.updateProfile(dto); }
    catch (error) { return rejectWithValue(messageOf(error, 'Failed to update profile')); }
  },
);

// ---------------------------------------------------------------------------
// Assigned tasks
// ---------------------------------------------------------------------------

export const fetchAssignedTasks = createAsyncThunk<ManagerTask[], void, ThunkConfig>(
  'manager/fetchAssignedTasks',
  async (_, { rejectWithValue }) => {
    try { return await managerApi.getAssignedTasks(); }
    catch (error) { return rejectWithValue(messageOf(error, 'Failed to load assigned tasks')); }
  },
);

/** Task detail page: the task, its submitted deliverables and its applications. */
export const fetchManagerTaskDetail = createAsyncThunk<
  { task: ManagerTask; deliverables: Deliverable[]; applications: ManagerApplication[] }, number, ThunkConfig
>('manager/fetchTaskDetail', async (taskId, { rejectWithValue }) => {
  try {
    const task = await managerApi.getTaskById(taskId);
    if (!task) return rejectWithValue('Task not found or it is no longer assigned to this manager.');
    const [deliverables, applications] = await Promise.all([
      managerApi.getTaskDeliverables(taskId),
      managerApi.getTaskApplications(taskId),
    ]);
    return { task, deliverables, applications };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to load task details'));
  }
});

// ---------------------------------------------------------------------------
// Submitted deliverables
// ---------------------------------------------------------------------------

export const fetchTaskDeliverables = createAsyncThunk<Deliverable[], number, ThunkConfig>(
  'manager/fetchTaskDeliverables',
  async (taskId, { rejectWithValue }) => {
    try { return await managerApi.getTaskDeliverables(taskId); }
    catch (error) { return rejectWithValue(messageOf(error, 'Failed to load deliverables')); }
  },
);

export const fetchManagerDeliverable = createAsyncThunk<Deliverable, { taskId: number; deliverableNo: number }, ThunkConfig>(
  'manager/fetchDeliverable',
  async ({ taskId, deliverableNo }, { rejectWithValue }) => {
    try {
      const deliverable = await managerApi.getDeliverableByNo(taskId, deliverableNo);
      if (!deliverable) return rejectWithValue('Deliverable not found.');
      return deliverable;
    } catch (error) { return rejectWithValue(messageOf(error, 'Failed to load deliverable')); }
  },
);

/** After a review/close, reload whatever this task already has on screen so progress and badges stay in sync. */
async function refreshAfterDeliverableChange(
  taskId: number,
  dispatch: (action: unknown) => unknown,
  getState: () => { manager: ManagerState },
) {
  const { manager } = getState();
  const refreshes: unknown[] = [dispatch(fetchTaskDeliverables(taskId)), dispatch(fetchAssignedTasks())];
  if (manager.taskDetails[taskId]) refreshes.push(dispatch(fetchManagerTaskDetail(taskId)));
  if (manager.definitionsByTask[taskId]) refreshes.push(dispatch(fetchTaskDefinitions(taskId)));
  await Promise.all(refreshes);
}

export const reviewManagerDeliverable = createAsyncThunk<
  Deliverable, { taskId: number; deliverableNo: number; dto: ReviewDeliverableDto }, ThunkConfig
>('manager/reviewDeliverable', async ({ taskId, deliverableNo, dto }, { dispatch, getState, rejectWithValue }) => {
  try {
    const updated = await managerApi.reviewDeliverable(taskId, deliverableNo, dto);
    await refreshAfterDeliverableChange(taskId, dispatch, getState);
    return updated;
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to review deliverable'));
  }
});

export const closeManagerDeliverable = createAsyncThunk<
  Deliverable, { taskId: number; deliverableNo: number }, ThunkConfig
>('manager/closeDeliverable', async ({ taskId, deliverableNo }, { dispatch, getState, rejectWithValue }) => {
  try {
    const updated = await managerApi.closeDeliverable(taskId, deliverableNo);
    await refreshAfterDeliverableChange(taskId, dispatch, getState);
    return updated;
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to close deliverable'));
  }
});

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export const shortlistManagerApplication = createAsyncThunk<
  ManagerApplication, { taskId: number; applicationId: number; dto: ShortlistApplicationDto }, ThunkConfig
>('manager/shortlistApplication', async ({ taskId, applicationId, dto }, { rejectWithValue }) => {
  try { return await managerApi.shortlistApplication(taskId, applicationId, dto); }
  catch (error) { return rejectWithValue(messageOf(error, 'Failed to shortlist candidate')); }
});

// ---------------------------------------------------------------------------
// Deliverable definitions (task scope items) — full CRUD
// ---------------------------------------------------------------------------

export const fetchTaskDefinitions = createAsyncThunk<TaskDeliverableDefinition[], number, ThunkConfig>(
  'manager/fetchTaskDefinitions',
  async (taskId, { rejectWithValue }) => {
    try { return await managerApi.getTaskDeliverableDefinitions(taskId); }
    catch (error) { return rejectWithValue(messageOf(error, 'Could not load task deliverables.')); }
  },
);

export const createTaskDefinition = createAsyncThunk<
  TaskDeliverableDefinition, { taskId: number; values: { title: string; description?: string } }, ThunkConfig
>('manager/createTaskDefinition', async ({ taskId, values }, { rejectWithValue }) => {
  try { return await managerApi.createTaskDeliverableDefinition(taskId, values); }
  catch (error) { return rejectWithValue(messageOf(error, 'Could not add the deliverable.')); }
});

export const updateTaskDefinition = createAsyncThunk<
  TaskDeliverableDefinition, { taskId: number; definitionId: number; values: { title?: string; description?: string } }, ThunkConfig
>('manager/updateTaskDefinition', async ({ taskId, definitionId, values }, { rejectWithValue }) => {
  try { return await managerApi.updateTaskDeliverableDefinition(taskId, definitionId, values); }
  catch (error) { return rejectWithValue(messageOf(error, 'Could not update the deliverable.')); }
});

export const deleteTaskDefinition = createAsyncThunk<
  { taskId: number; definitionId: number }, { taskId: number; definitionId: number }, ThunkConfig
>('manager/deleteTaskDefinition', async ({ taskId, definitionId }, { rejectWithValue }) => {
  try {
    await managerApi.deleteTaskDeliverableDefinition(taskId, definitionId);
    return { taskId, definitionId };
  } catch (error) { return rejectWithValue(messageOf(error, 'Could not remove the deliverable.')); }
});

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const bump = (counter: Record<number, number>, taskId: number, delta: 1 | -1) => {
  const next = (counter[taskId] ?? 0) + delta;
  if (next > 0) counter[taskId] = next; else delete counter[taskId];
};

/** True when this response belongs to the latest request for that key. */
const isLatest = (requests: Record<number, RequestState>, key: number, requestId: string) =>
  requests[key]?.requestId === requestId;

const upsertDeliverable = (state: ManagerState, deliverable: Deliverable) => {
  const list = state.deliverablesByTask[deliverable.taskId];
  if (!list) { state.deliverablesByTask[deliverable.taskId] = [deliverable]; return; }
  const index = list.findIndex((item) => item.deliverableNo === deliverable.deliverableNo);
  // Keep nested data (gigProfile, claimedDefinitions) the mutation response may omit.
  if (index >= 0) list[index] = { ...list[index], ...deliverable };
  else list.push(deliverable);
};

const managerSlice = createSlice({
  name: 'manager',
  initialState: initialManagerState,
  reducers: {
    setSelectedManagerTask(state, action: PayloadAction<number | null>) {
      state.selectedTaskId = action.payload;
    },
    /** Leaving a task: drop that task's detail only, never the general task cache. */
    clearManagerTaskDetail(state, action: PayloadAction<number>) {
      const taskId = action.payload;
      if (state.selectedTaskId === taskId) state.selectedTaskId = null;
      delete state.taskDetails[taskId];
      delete state.taskDetailRequests[taskId];
      delete state.applicationsByTask[taskId];
      delete state.definitionsByTask[taskId];
      delete state.definitionsRequests[taskId];
      delete state.taskActionErrors[taskId];
      delete state.definitionErrors[taskId];
    },
    clearManagerTaskActionError(state, action: PayloadAction<number>) {
      delete state.taskActionErrors[action.payload];
    },
  },
  extraReducers(builder) {
    builder
      // A new manager session starts from a clean slate.
      .addCase(login.fulfilled, () => initialManagerState)
      .addCase(acceptManagerInvite.fulfilled, () => initialManagerState)

      // Profile
      .addCase(fetchManagerProfile.pending, (s) => { s.profileRequest = { status: 'loading', error: null }; })
      .addCase(fetchManagerProfile.fulfilled, (s, a) => { s.profile = a.payload; s.profileRequest = { status: 'succeeded', error: null }; })
      .addCase(fetchManagerProfile.rejected, (s, a) => { s.profileRequest = { status: 'failed', error: a.payload ?? 'Failed to load manager profile' }; })
      .addCase(updateManagerProfile.pending, (s) => { s.profileSave = { status: 'loading', error: null }; })
      .addCase(updateManagerProfile.fulfilled, (s, a) => { s.profile = a.payload; s.profileSave = { status: 'succeeded', error: null }; })
      .addCase(updateManagerProfile.rejected, (s, a) => { s.profileSave = { status: 'failed', error: a.payload ?? 'Failed to update profile' }; })

      // Assigned task list (latest request wins)
      .addCase(fetchAssignedTasks.pending, (s, a) => { s.tasksRequest = { status: 'loading', error: null, requestId: a.meta.requestId }; })
      .addCase(fetchAssignedTasks.fulfilled, (s, a) => {
        if (s.tasksRequest.requestId !== a.meta.requestId) return;
        s.tasks = a.payload;
        s.tasksRequest = { status: 'succeeded', error: null };
      })
      .addCase(fetchAssignedTasks.rejected, (s, a) => {
        if (s.tasksRequest.requestId !== a.meta.requestId) return;
        s.tasksRequest = { status: 'failed', error: a.payload ?? 'Failed to load assigned tasks' };
      })

      // Task detail, keyed by taskId
      .addCase(fetchManagerTaskDetail.pending, (s, a) => {
        s.taskDetailRequests[a.meta.arg] = { status: 'loading', error: null, requestId: a.meta.requestId };
      })
      .addCase(fetchManagerTaskDetail.fulfilled, (s, a) => {
        const taskId = a.meta.arg;
        if (!isLatest(s.taskDetailRequests, taskId, a.meta.requestId)) return;
        s.taskDetails[taskId] = a.payload.task;
        s.deliverablesByTask[taskId] = a.payload.deliverables;
        s.applicationsByTask[taskId] = a.payload.applications;
        s.taskDetailRequests[taskId] = { status: 'succeeded', error: null, requestId: a.meta.requestId };
      })
      .addCase(fetchManagerTaskDetail.rejected, (s, a) => {
        const taskId = a.meta.arg;
        if (!isLatest(s.taskDetailRequests, taskId, a.meta.requestId)) return;
        s.taskDetailRequests[taskId] = { status: 'failed', error: a.payload ?? 'Failed to load task details', requestId: a.meta.requestId };
      })

      // Submitted deliverables, keyed by taskId
      .addCase(fetchTaskDeliverables.pending, (s, a) => {
        s.deliverablesRequests[a.meta.arg] = { status: 'loading', error: null, requestId: a.meta.requestId };
      })
      .addCase(fetchTaskDeliverables.fulfilled, (s, a) => {
        if (!isLatest(s.deliverablesRequests, a.meta.arg, a.meta.requestId)) return;
        s.deliverablesByTask[a.meta.arg] = a.payload;
        s.deliverablesRequests[a.meta.arg] = { status: 'succeeded', error: null, requestId: a.meta.requestId };
      })
      .addCase(fetchTaskDeliverables.rejected, (s, a) => {
        if (!isLatest(s.deliverablesRequests, a.meta.arg, a.meta.requestId)) return;
        s.deliverablesRequests[a.meta.arg] = { status: 'failed', error: a.payload ?? 'Failed to load deliverables', requestId: a.meta.requestId };
      })
      .addCase(fetchManagerDeliverable.fulfilled, (s, a) => { upsertDeliverable(s, a.payload); })

      // Task mutations: shortlist / review / close
      .addCase(shortlistManagerApplication.pending, (s, a) => { bump(s.taskMutations, a.meta.arg.taskId, 1); delete s.taskActionErrors[a.meta.arg.taskId]; })
      .addCase(shortlistManagerApplication.fulfilled, (s, a) => {
        const { taskId, applicationId } = a.meta.arg;
        bump(s.taskMutations, taskId, -1);
        const list = s.applicationsByTask[taskId];
        const index = list?.findIndex((app) => app.applicationId === applicationId) ?? -1;
        if (list && index >= 0) list[index] = { ...list[index], ...a.payload };
      })
      .addCase(shortlistManagerApplication.rejected, (s, a) => {
        bump(s.taskMutations, a.meta.arg.taskId, -1);
        s.taskActionErrors[a.meta.arg.taskId] = a.payload ?? 'Failed to shortlist candidate';
      })
      .addCase(reviewManagerDeliverable.pending, (s, a) => { bump(s.taskMutations, a.meta.arg.taskId, 1); delete s.taskActionErrors[a.meta.arg.taskId]; })
      .addCase(reviewManagerDeliverable.fulfilled, (s, a) => { bump(s.taskMutations, a.meta.arg.taskId, -1); upsertDeliverable(s, a.payload); })
      .addCase(reviewManagerDeliverable.rejected, (s, a) => {
        bump(s.taskMutations, a.meta.arg.taskId, -1);
        s.taskActionErrors[a.meta.arg.taskId] = a.payload ?? 'Failed to review deliverable';
      })
      .addCase(closeManagerDeliverable.pending, (s, a) => { bump(s.taskMutations, a.meta.arg.taskId, 1); delete s.taskActionErrors[a.meta.arg.taskId]; })
      .addCase(closeManagerDeliverable.fulfilled, (s, a) => { bump(s.taskMutations, a.meta.arg.taskId, -1); upsertDeliverable(s, a.payload); })
      .addCase(closeManagerDeliverable.rejected, (s, a) => {
        bump(s.taskMutations, a.meta.arg.taskId, -1);
        s.taskActionErrors[a.meta.arg.taskId] = a.payload ?? 'Failed to close deliverable';
      })

      // Definitions read, keyed by taskId
      .addCase(fetchTaskDefinitions.pending, (s, a) => {
        s.definitionsRequests[a.meta.arg] = { status: 'loading', error: null, requestId: a.meta.requestId };
      })
      .addCase(fetchTaskDefinitions.fulfilled, (s, a) => {
        if (!isLatest(s.definitionsRequests, a.meta.arg, a.meta.requestId)) return;
        s.definitionsByTask[a.meta.arg] = a.payload;
        s.definitionsRequests[a.meta.arg] = { status: 'succeeded', error: null, requestId: a.meta.requestId };
      })
      .addCase(fetchTaskDefinitions.rejected, (s, a) => {
        if (!isLatest(s.definitionsRequests, a.meta.arg, a.meta.requestId)) return;
        s.definitionsRequests[a.meta.arg] = { status: 'failed', error: a.payload ?? 'Could not load task deliverables.', requestId: a.meta.requestId };
      })

      // Definitions create / update / delete
      .addCase(createTaskDefinition.pending, (s, a) => { bump(s.definitionMutations, a.meta.arg.taskId, 1); delete s.definitionErrors[a.meta.arg.taskId]; })
      .addCase(createTaskDefinition.fulfilled, (s, a) => {
        const { taskId } = a.meta.arg;
        bump(s.definitionMutations, taskId, -1);
        (s.definitionsByTask[taskId] ??= []).push(a.payload);
      })
      .addCase(createTaskDefinition.rejected, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, -1);
        s.definitionErrors[a.meta.arg.taskId] = a.payload ?? 'Could not add the deliverable.';
      })
      .addCase(updateTaskDefinition.pending, (s, a) => { bump(s.definitionMutations, a.meta.arg.taskId, 1); delete s.definitionErrors[a.meta.arg.taskId]; })
      .addCase(updateTaskDefinition.fulfilled, (s, a) => {
        const { taskId, definitionId } = a.meta.arg;
        bump(s.definitionMutations, taskId, -1);
        const list = s.definitionsByTask[taskId];
        if (list) s.definitionsByTask[taskId] = list.map((item) => (item.definitionId === definitionId ? a.payload : item));
      })
      .addCase(updateTaskDefinition.rejected, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, -1);
        s.definitionErrors[a.meta.arg.taskId] = a.payload ?? 'Could not update the deliverable.';
      })
      .addCase(deleteTaskDefinition.pending, (s, a) => { bump(s.definitionMutations, a.meta.arg.taskId, 1); delete s.definitionErrors[a.meta.arg.taskId]; })
      .addCase(deleteTaskDefinition.fulfilled, (s, a) => {
        const { taskId, definitionId } = a.payload;
        bump(s.definitionMutations, taskId, -1);
        const list = s.definitionsByTask[taskId];
        if (list) s.definitionsByTask[taskId] = list.filter((item) => item.definitionId !== definitionId);
      })
      .addCase(deleteTaskDefinition.rejected, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, -1);
        s.definitionErrors[a.meta.arg.taskId] = a.payload ?? 'Could not remove the deliverable.';
      });
  },
});

export const { setSelectedManagerTask, clearManagerTaskDetail, clearManagerTaskActionError } = managerSlice.actions;
export default managerSlice.reducer;
