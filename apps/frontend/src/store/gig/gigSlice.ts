/**
 * @file gigSlice.ts
 * @description Redux state for the Gig Professional portal, mapped 1:1 onto `gigApi`.
 *
 * Same rules as managerSlice (see REDUX_MIGRATION_TEAM_PLAN.md): every request is a
 * `createAsyncThunk`, server data changes only in `fulfilled`, and each request
 * remembers its latest requestId so a slow response never overwrites a newer one
 * (or another task's data). Two local conveniences:
 * - `gigThunk` removes the per-thunk try/catch boilerplate.
 * - List reads skip when the same list is already loading; internal refetches after a
 *   write pass `{ force: true }` so they are never skipped by a stale in-flight read.
 */
import { createAsyncThunk, createSlice, type ActionReducerMapBuilder, type AsyncThunk, type PayloadAction, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { gigApi } from '../../services/api/gig/gigApi';
import type {
  CompletedProject,
  CreateServiceDto,
  EarningsSummary,
  GigDeliverable,
  GigProfile,
  GigService,
  GigTask,
  PendingRequest,
  SubmitDeliverableDto,
  TaskDeliverableDefinition,
} from '../../types/gig';
import type { TaskClientProfileResponse } from '../../types/profile';
import { login, signup } from '../auth/authSlice';
import type { RequestStatus } from '../manager/managerSlice';

/** One server-backed value plus the status of the request that loads it. */
export interface Resource<T> { data: T; loaded: boolean; status: RequestStatus; error: string | null; requestId?: string }

export interface GigLists {
  activeTasks: GigTask[];
  marketplaceTasks: GigTask[];
  completedProjects: CompletedProject[];
  pendingRequests: PendingRequest[];
  applications: PendingRequest[];
  services: GigService[];
  earnings: EarningsSummary | null;
  profile: GigProfile | null;
}

export interface GigState {
  lists: { [K in keyof GigLists]: Resource<GigLists[K]> };
  /** Keyed by taskId / serviceId so a late response for one key can never land on another. */
  definitions: Record<number, Resource<TaskDeliverableDefinition[] | null>>;
  serviceRequests: Record<number, Resource<PendingRequest[] | null>>;
  clientProfiles: Record<number, Resource<TaskClientProfileResponse | null>>;
  /** Header search box text; ExploreTasks filters the marketplace by it. */
  taskSearch: string;
}

const resource = <T>(data: T): Resource<T> => ({ data, loaded: false, status: 'idle', error: null });

export const initialGigState: GigState = {
  lists: {
    activeTasks: resource([]),
    marketplaceTasks: resource([]),
    completedProjects: resource([]),
    pendingRequests: resource([]),
    applications: resource([]),
    services: resource([]),
    earnings: resource(null),
    profile: resource(null),
  },
  definitions: {},
  serviceRequests: {},
  clientProfiles: {},
  taskSearch: '',
};

type ThunkConfig = { rejectValue: string; state: { gig: GigState } };
type ThunkApi = { dispatch: ThunkDispatch<{ gig: GigState }, unknown, UnknownAction>; getState: () => { gig: GigState } };
/** `force` skips the "already loading" dedupe (used for refetches after a write). */
type ReadArg = { force?: boolean } | undefined;

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/** Message from a rejected `dispatch(thunk).unwrap()` (these thunks reject with a string). */
export const rejectionMessage = (error: unknown, fallback: string) =>
  typeof error === 'string' ? error : messageOf(error, fallback);

function gigThunk<R, A = void>(
  type: string,
  call: (arg: A, api: ThunkApi) => Promise<R>,
  fallback: string,
  condition?: (arg: A, api: Pick<ThunkApi, 'getState'>) => boolean,
) {
  return createAsyncThunk<R, A, ThunkConfig>(
    `gig/${type}`,
    async (arg, api) => {
      try { return await call(arg, api); }
      catch (error) { return api.rejectWithValue(messageOf(error, fallback)); }
    },
    condition ? { condition } : undefined,
  );
}

function listThunk<K extends keyof GigLists>(key: K, call: () => Promise<GigLists[K]>, fallback: string) {
  return gigThunk<GigLists[K], ReadArg>(`fetch/${key}`, () => call(), fallback,
    (arg, { getState }) => !!arg?.force || getState().gig.lists[key].status !== 'loading');
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export const fetchActiveTasks = listThunk('activeTasks', gigApi.getActiveTasks, 'Failed to load active tasks.');
export const fetchMarketplaceTasks = listThunk('marketplaceTasks', gigApi.getMarketplaceTasks, 'Failed to load marketplace tasks.');
export const fetchCompletedProjects = listThunk('completedProjects', gigApi.getCompletedProjects, 'Failed to load completed projects.');
export const fetchPendingRequests = listThunk('pendingRequests', gigApi.getPendingRequests, 'Failed to load pending requests.');
export const fetchMyApplications = listThunk('applications', gigApi.getMyApplications, 'Failed to load applications.');
export const fetchServices = listThunk('services', gigApi.getServices, 'Failed to load services.');
export const fetchEarnings = listThunk('earnings', gigApi.getEarnings, 'Failed to load earnings.');
export const fetchGigProfile = listThunk('profile', gigApi.getProfile, 'Failed to load profile.');

export const fetchTaskDefinitions = gigThunk<TaskDeliverableDefinition[], number>(
  'fetchDefinitions', gigApi.getTaskDeliverableDefinitions, 'Could not load the client-defined deliverables.');
export const fetchServiceRequests = gigThunk<PendingRequest[], number>(
  'fetchServiceRequests', gigApi.getServiceRequests, 'Failed to load requests.');
export const fetchTaskClientProfile = gigThunk<TaskClientProfileResponse, number>(
  'fetchClientProfile', gigApi.getTaskClientProfile, 'Could not load the client profile.');

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export const updateGigProfile = gigThunk<GigProfile, Partial<GigProfile>>(
  'updateProfile', gigApi.updateProfile, 'Failed updating profile.');

export const postService = gigThunk<GigService, CreateServiceDto>(
  'postService', gigApi.postService, 'Failed to publish service.');

export const removeService = gigThunk<number, number>(
  'removeService', async (serviceId) => { await gigApi.removeService(serviceId); return serviceId; }, 'Failed to remove service.');

/** Apply: the task leaves the marketplace; Applied Tasks is refetched from the server. */
export const applyForTask = gigThunk<number, number>('apply', async (taskId, { dispatch }) => {
  await gigApi.applyForTask(taskId);
  await dispatch(fetchMyApplications({ force: true }));
  return taskId;
}, 'Failed to apply for task.');

export const withdrawApplication = gigThunk<number, number>(
  'withdrawApplication', async (applicationId) => { await gigApi.withdrawApplication(applicationId); return applicationId; },
  'Could not withdraw.');

/** Withdraw from a hired task (server only allows it before any deliverable is submitted). */
export const withdrawFromTask = gigThunk<number, number>('withdrawFromTask', async (taskId, { dispatch }) => {
  await gigApi.withdrawFromTask(taskId);
  await dispatch(fetchMyApplications({ force: true }));
  return taskId;
}, 'Could not withdraw from this task.');

export const respondToRequest = gigThunk<
  void, { applicationId: number; action: 'accepted' | 'declined'; serviceId?: number }
>('respond', async ({ applicationId, action }, { dispatch }) => {
  await gigApi.respondToRequest(applicationId, action);
  // An accepted request starts a contract, which Active Task shows.
  if (action === 'accepted') await dispatch(fetchActiveTasks({ force: true }));
}, 'Failed responding to request.');

/** Submit work; the server's progress/claimed definitions are re-read for that exact task. */
export const submitDeliverable = gigThunk<GigDeliverable, SubmitDeliverableDto>('submitDeliverable', async (dto, { dispatch }) => {
  const deliverable = await gigApi.submitDeliverable(dto);
  await Promise.all([dispatch(fetchTaskDefinitions(dto.taskId)), dispatch(fetchActiveTasks({ force: true }))]);
  return deliverable;
}, 'Error submitting deliverable.');

export const createReview = gigThunk<void, { taskId: number; rating: number; comment?: string }>(
  'createReview', async ({ taskId, rating, comment }, { dispatch }) => {
    await gigApi.createReview(taskId, rating, comment);
    await dispatch(fetchCompletedProjects({ force: true }));
  }, 'Failed to submit review.');

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

/** Loading/succeeded/failed handling for a list resource; the latest request wins. */
function listCases<K extends keyof GigLists>(
  builder: ActionReducerMapBuilder<GigState>,
  thunk: AsyncThunk<GigLists[K], ReadArg, ThunkConfig>,
  key: K,
  fallback: string,
) {
  const pick = (s: GigState) => s.lists[key] as Resource<GigLists[K]>;
  builder
    .addCase(thunk.pending, (s, a) => { const r = pick(s); r.status = 'loading'; r.error = null; r.requestId = a.meta.requestId; })
    .addCase(thunk.fulfilled, (s, a) => {
      const r = pick(s);
      if (r.requestId !== a.meta.requestId) return;
      r.data = a.payload; r.loaded = true; r.status = 'succeeded'; r.error = null;
    })
    .addCase(thunk.rejected, (s, a) => {
      const r = pick(s);
      if (r.requestId !== a.meta.requestId) return;
      r.status = 'failed'; r.error = a.payload ?? fallback;
    });
}

/** Same, for a resource keyed by a numeric id (the thunk's argument). */
function keyedCases<T>(
  builder: ActionReducerMapBuilder<GigState>,
  thunk: AsyncThunk<T, number, ThunkConfig>,
  pick: (s: GigState) => Record<number, Resource<T | null>>,
  fallback: string,
) {
  builder
    .addCase(thunk.pending, (s, a) => {
      const map = pick(s);
      const prev = map[a.meta.arg];
      map[a.meta.arg] = { data: prev?.data ?? null, loaded: prev?.loaded ?? false, status: 'loading', error: null, requestId: a.meta.requestId };
    })
    .addCase(thunk.fulfilled, (s, a) => {
      const r = pick(s)[a.meta.arg];
      if (r?.requestId !== a.meta.requestId) return;
      r.data = a.payload; r.loaded = true; r.status = 'succeeded'; r.error = null;
    })
    .addCase(thunk.rejected, (s, a) => {
      const r = pick(s)[a.meta.arg];
      if (r?.requestId !== a.meta.requestId) return;
      // Drop stale data on failure: e.g. a client profile must not stay visible after the server stops allowing it.
      r.data = null; r.loaded = false; r.status = 'failed'; r.error = a.payload ?? fallback;
    });
}

const gigSlice = createSlice({
  name: 'gig',
  initialState: initialGigState,
  reducers: {
    setTaskSearch(state, action: PayloadAction<string>) { state.taskSearch = action.payload; },
  },
  extraReducers(builder) {
    // A new gig session starts from a clean slate.
    builder.addCase(login.fulfilled, () => initialGigState).addCase(signup.fulfilled, () => initialGigState);

    listCases(builder, fetchActiveTasks, 'activeTasks', 'Failed to load active tasks.');
    listCases(builder, fetchMarketplaceTasks, 'marketplaceTasks', 'Failed to load marketplace tasks.');
    listCases(builder, fetchCompletedProjects, 'completedProjects', 'Failed to load completed projects.');
    listCases(builder, fetchPendingRequests, 'pendingRequests', 'Failed to load pending requests.');
    listCases(builder, fetchMyApplications, 'applications', 'Failed to load applications.');
    listCases(builder, fetchServices, 'services', 'Failed to load services.');
    listCases(builder, fetchEarnings, 'earnings', 'Failed to load earnings.');
    listCases(builder, fetchGigProfile, 'profile', 'Failed to load profile.');

    keyedCases(builder, fetchTaskDefinitions, (s) => s.definitions, 'Could not load the client-defined deliverables.');
    keyedCases(builder, fetchServiceRequests, (s) => s.serviceRequests, 'Failed to load requests.');
    keyedCases(builder, fetchTaskClientProfile, (s) => s.clientProfiles, 'Could not load the client profile.');

    // Writes: server-confirmed changes only.
    builder
      .addCase(updateGigProfile.fulfilled, (s, a) => { s.lists.profile = { ...s.lists.profile, data: a.payload, loaded: true, status: 'succeeded', error: null }; })
      .addCase(postService.fulfilled, (s, a) => { s.lists.services.data.push(a.payload); })
      .addCase(removeService.fulfilled, (s, a) => { s.lists.services.data = s.lists.services.data.filter((x) => x.serviceId !== a.payload); })
      .addCase(applyForTask.fulfilled, (s, a) => { s.lists.marketplaceTasks.data = s.lists.marketplaceTasks.data.filter((t) => t.taskId !== a.payload); })
      .addCase(withdrawApplication.fulfilled, (s, a) => { s.lists.applications.data = s.lists.applications.data.filter((x) => x.applicationId !== a.payload); })
      .addCase(withdrawFromTask.fulfilled, (s, a) => { s.lists.activeTasks.data = s.lists.activeTasks.data.filter((t) => t.taskId !== a.payload); })
      .addCase(respondToRequest.fulfilled, (s, a) => {
        const { applicationId, serviceId } = a.meta.arg;
        s.lists.pendingRequests.data = s.lists.pendingRequests.data.filter((x) => x.applicationId !== applicationId);
        const forService = serviceId === undefined ? undefined : s.serviceRequests[serviceId];
        if (forService?.data) forService.data = forService.data.filter((x) => x.applicationId !== applicationId);
      });
  },
});

export const { setTaskSearch } = gigSlice.actions;
export default gigSlice.reducer;
