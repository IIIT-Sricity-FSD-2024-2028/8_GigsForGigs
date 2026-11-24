/**
 * @file clientSlice.ts
 * @description Redux slice for the Client portal, mapped onto `clientApi`.
 *
 * Rules:
 * - Every API request is a `createAsyncThunk`.
 * - Components and slices only dispatch and select.
 * - Server data updates strictly in `fulfilled` from backend response truth.
 * - Keyed request states ensure concurrent operations for different entities never overwrite each other.
 * - Failed requests preserve existing data and surface actionable error messages.
 */

import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clientApi } from '../../services/api/client/clientApi';
import type {
  ClientProfileData,
  UpdateClientProfileDto,
  CreateTaskDto,
  UpdateTaskDto,
  RawTask,
  RawApplication,
  ApplicantProfileResponse,
  RawContract,
  TaskDeliverableDefinition,
  CreateDeliverableDefinitionDto,
  UpdateDeliverableDefinitionDto,
  RawDeliverable,
  RawService,
  RawServiceRequest,
  RequestServiceResponse,
  RawManager,
  UpdateManagerDto,
  RawManagerInvite,
  CreateManagerInviteDto,
  SetTaskManagerResponse,
  CreateDisputeDto,
  CreateDisputeResponse,
  CreateClientReviewDto,
  ReviewRecord,
} from '../../services/api/client/clientApi';
import type { ClientState, RequestState } from './types';
import { login } from '../auth/authSlice';

export type { ClientState, RequestState } from './types';

const idle: RequestState = { status: 'idle', error: null };

export const initialClientState: ClientState = {
  profile: null,
  profileRequest: idle,
  profileSave: idle,

  tasks: [],
  tasksRequest: idle,
  taskMutations: {},
  taskActionErrors: {},

  applications: [],
  applicationsRequest: idle,
  applicantProfiles: {},
  applicantProfileRequests: {},
  applicationActionErrors: {},

  contracts: [],
  contractsRequest: idle,
  contractActionErrors: {},

  definitionsByTask: {},
  definitionsRequests: {},
  definitionMutations: {},
  definitionErrors: {},

  deliverablesByTask: {},
  deliverablesRequests: {},
  deliverableActionErrors: {},

  services: [],
  servicesRequest: idle,
  serviceRequests: [],
  serviceRequestsRequest: idle,
  requestedServiceIds: [],
  serviceActionError: null,

  managers: [],
  managersRequest: idle,
  managerActionErrors: {},

  invites: [],
  invitesRequest: idle,
  inviteActionErrors: {},
  latestCreatedInvite: null,

  disputeRequests: {},
  reviewSubmitState: idle,
};

type ThunkConfig = { rejectValue: string; state: { client: ClientState } };

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const bump = (counter: Record<number, number>, id: number, delta: 1 | -1) => {
  const next = (counter[id] ?? 0) + delta;
  if (next > 0) counter[id] = next; else delete counter[id];
};

// ===========================================================================
// PROFILE THUNKS
// ===========================================================================

export const fetchClientProfile = createAsyncThunk<ClientProfileData, void, ThunkConfig>(
  'client/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await clientApi.getProfile();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to load client profile.'));
    }
  },
  { condition: (_, { getState }) => getState().client.profileRequest.status !== 'loading' },
);

export const updateClientProfile = createAsyncThunk<ClientProfileData, UpdateClientProfileDto, ThunkConfig>(
  'client/updateProfile',
  async (dto, { rejectWithValue }) => {
    try {
      return await clientApi.updateProfile(dto);
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to update client profile.'));
    }
  },
);

// ===========================================================================
// TASK THUNKS
// ===========================================================================

export const fetchClientTasks = createAsyncThunk<RawTask[], void, ThunkConfig>(
  'client/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      return await clientApi.getTasks();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to load tasks.'));
    }
  },
);

export const createClientTask = createAsyncThunk<RawTask, CreateTaskDto, ThunkConfig>(
  'client/createTask',
  async (dto, { rejectWithValue }) => {
    try {
      return await clientApi.createTask(dto);
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to post task.'));
    }
  },
);

export const updateClientTask = createAsyncThunk<RawTask, { taskId: number; dto: UpdateTaskDto }, ThunkConfig>(
  'client/updateTask',
  async ({ taskId, dto }, { rejectWithValue }) => {
    try {
      return await clientApi.updateTask(taskId, dto);
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to update task.'));
    }
  },
);

export const deleteClientTask = createAsyncThunk<number, number, ThunkConfig>(
  'client/deleteTask',
  async (taskId, { dispatch, rejectWithValue }) => {
    try {
      await clientApi.deleteTask(taskId);
      // Deleting a task can affect contracts
      void dispatch(fetchClientContracts());
      return taskId;
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to delete task.'));
    }
  },
);

// ===========================================================================
// APPLICATION THUNKS
// ===========================================================================

export const fetchClientApplications = createAsyncThunk<RawApplication[], void, ThunkConfig>(
  'client/fetchApplications',
  async (_, { rejectWithValue }) => {
    try {
      return await clientApi.getApplications();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to load applications.'));
    }
  },
);

export const fetchApplicantProfile = createAsyncThunk<ApplicantProfileResponse, number, ThunkConfig>(
  'client/fetchApplicantProfile',
  async (applicationId, { rejectWithValue }) => {
    try {
      return await clientApi.getApplicantProfile(applicationId);
    } catch (error) {
      return rejectWithValue(messageOf(error, "Could not load this applicant's profile."));
    }
  },
);

export const approveApplication = createAsyncThunk<RawApplication, number, ThunkConfig>(
  'client/approveApplication',
  async (applicationId, { dispatch, rejectWithValue }) => {
    try {
      const updated = await clientApi.approveApplication(applicationId);
      // Accepting an application creates a new contract and updates task hire state
      void dispatch(fetchClientContracts());
      void dispatch(fetchClientTasks());
      return updated;
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to approve applicant.'));
    }
  },
);

export const rejectApplication = createAsyncThunk<RawApplication, number, ThunkConfig>(
  'client/rejectApplication',
  async (applicationId, { rejectWithValue }) => {
    try {
      return await clientApi.rejectApplication(applicationId);
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to reject applicant.'));
    }
  },
);

// ===========================================================================
// CONTRACT THUNKS
// ===========================================================================

export const fetchClientContracts = createAsyncThunk<RawContract[], void, ThunkConfig>(
  'client/fetchContracts',
  async (_, { rejectWithValue }) => {
    try {
      return await clientApi.getContracts();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to load client contracts.'));
    }
  },
);

// ===========================================================================
// DELIVERABLE DEFINITIONS & SUBMISSIONS THUNKS
// ===========================================================================

export const fetchTaskDeliverableDefinitions = createAsyncThunk<TaskDeliverableDefinition[], number, ThunkConfig>(
  'client/fetchTaskDefinitions',
  async (taskId, { rejectWithValue }) => {
    try {
      return await clientApi.getTaskDeliverableDefinitions(taskId);
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Could not load task deliverable definitions.'));
    }
  },
);

export const createTaskDeliverable = createAsyncThunk<
  TaskDeliverableDefinition,
  { taskId: number; values: CreateDeliverableDefinitionDto },
  ThunkConfig
>('client/createTaskDeliverable', async ({ taskId, values }, { rejectWithValue }) => {
  try {
    return await clientApi.createTaskDeliverableDefinition(taskId, values);
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Could not add the deliverable definition.'));
  }
});

export const updateTaskDeliverable = createAsyncThunk<
  TaskDeliverableDefinition,
  { taskId: number; definitionId: number; values: UpdateDeliverableDefinitionDto },
  ThunkConfig
>('client/updateTaskDeliverable', async ({ taskId, definitionId, values }, { rejectWithValue }) => {
  try {
    return await clientApi.updateTaskDeliverableDefinition(taskId, definitionId, values);
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Could not update the deliverable definition.'));
  }
});

export const deleteTaskDeliverable = createAsyncThunk<
  { taskId: number; definitionId: number },
  { taskId: number; definitionId: number },
  ThunkConfig
>('client/deleteTaskDeliverable', async ({ taskId, definitionId }, { rejectWithValue }) => {
  try {
    await clientApi.deleteTaskDeliverableDefinition(taskId, definitionId);
    return { taskId, definitionId };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Could not remove the deliverable definition.'));
  }
});

export const fetchTaskSubmittedDeliverables = createAsyncThunk<RawDeliverable[], number, ThunkConfig>(
  'client/fetchSubmittedDeliverables',
  async (taskId, { rejectWithValue }) => {
    try {
      return await clientApi.getTaskDeliverables(taskId);
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Could not load submitted deliverables.'));
    }
  },
);

export const reviewSubmittedDeliverable = createAsyncThunk<
  RawDeliverable,
  { taskId: number; deliverableNo: number; status: 'approved' | 'revision_requested'; feedback?: string },
  ThunkConfig
>('client/reviewSubmittedDeliverable', async ({ taskId, deliverableNo, status, feedback }, { dispatch, rejectWithValue }) => {
  try {
    const deliverableId = `${taskId}-${deliverableNo}`;
    const updated = await clientApi.reviewDeliverable(deliverableId, status, feedback);
    // Refresh contracts and tasks after deliverable review so progress badges stay accurate
    void dispatch(fetchClientContracts());
    void dispatch(fetchClientTasks());
    return updated;
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to review deliverable.'));
  }
});

// ===========================================================================
// SERVICE MARKETPLACE THUNKS
// ===========================================================================

export const fetchClientServices = createAsyncThunk<RawService[], void, ThunkConfig>(
  'client/fetchServices',
  async (_, { rejectWithValue }) => {
    try {
      return await clientApi.getServices();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to load services.'));
    }
  },
);

export const fetchClientServiceRequests = createAsyncThunk<RawServiceRequest[], void, ThunkConfig>(
  'client/fetchServiceRequests',
  async (_, { rejectWithValue }) => {
    try {
      return await clientApi.getServiceRequests();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to load service requests.'));
    }
  },
);

export const createClientServiceRequest = createAsyncThunk<
  { serviceId: number; response: RequestServiceResponse },
  number,
  ThunkConfig
>('client/createServiceRequest', async (serviceId, { dispatch, rejectWithValue }) => {
  try {
    const response = await clientApi.requestService(serviceId);
    // Requesting a service creates a dedicated task and application
    void dispatch(fetchClientTasks());
    void dispatch(fetchClientApplications());
    return { serviceId, response };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to send hiring request.'));
  }
});

// ===========================================================================
// MANAGER MANAGEMENT THUNKS
// ===========================================================================

export const fetchClientManagers = createAsyncThunk<RawManager[], void, ThunkConfig>(
  'client/fetchManagers',
  async (_, { rejectWithValue }) => {
    try {
      return await clientApi.getManagers();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to load managers.'));
    }
  },
);

export const updateManager = createAsyncThunk<
  { managerId: number; dto: UpdateManagerDto },
  { managerId: number; dto: UpdateManagerDto },
  ThunkConfig
>('client/updateManager', async ({ managerId, dto }, { rejectWithValue }) => {
  try {
    await clientApi.updateManager(managerId, dto);
    return { managerId, dto };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to update manager.'));
  }
});

export const removeManager = createAsyncThunk<number, number, ThunkConfig>(
  'client/removeManager',
  async (managerId, { dispatch, rejectWithValue }) => {
    try {
      await clientApi.deleteManager(managerId);
      // Tasks supervised by this manager are reassigned to client or another manager
      void dispatch(fetchClientContracts());
      return managerId;
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to remove manager.'));
    }
  },
);

export const fetchManagerInvitations = createAsyncThunk<RawManagerInvite[], void, ThunkConfig>(
  'client/fetchManagerInvitations',
  async (_, { rejectWithValue }) => {
    try {
      return await clientApi.getManagerInvites();
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to load manager invitations.'));
    }
  },
);

export const createManagerInvitation = createAsyncThunk<RawManagerInvite, CreateManagerInviteDto, ThunkConfig>(
  'client/createManagerInvitation',
  async (dto, { rejectWithValue }) => {
    try {
      return await clientApi.createManagerInvite(dto);
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to create manager invitation.'));
    }
  },
);

export const revokeManagerInvitation = createAsyncThunk<number, number, ThunkConfig>(
  'client/revokeManagerInvitation',
  async (inviteId, { rejectWithValue }) => {
    try {
      await clientApi.revokeManagerInvite(inviteId);
      return inviteId;
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to revoke invitation.'));
    }
  },
);

// ===========================================================================
// WORKFLOW THUNKS: ASSIGN MANAGER, END HIRE, DISPUTES
// ===========================================================================

export const assignTaskManager = createAsyncThunk<
  SetTaskManagerResponse,
  { taskId: number; gigProfileId: number; managerId: number | null },
  ThunkConfig
>('client/assignTaskManager', async ({ taskId, gigProfileId, managerId }, { dispatch, rejectWithValue }) => {
  try {
    const result = await clientApi.assignTaskManager(taskId, gigProfileId, managerId);
    void dispatch(fetchClientContracts());
    return result;
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to assign manager to task.'));
  }
});

export const endClientHire = createAsyncThunk<
  { taskId: number; gigProfileId: number },
  { taskId: number; gigProfileId: number },
  ThunkConfig
>('client/endHire', async ({ taskId, gigProfileId }, { dispatch, rejectWithValue }) => {
  try {
    await clientApi.endHire(taskId, gigProfileId);
    // Ending hire removes pending payment, fails held payment, and frees candidate
    void dispatch(fetchClientContracts());
    void dispatch(fetchClientApplications());
    void dispatch(fetchClientTasks());
    return { taskId, gigProfileId };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to end hire.'));
  }
});

export const raiseClientDispute = createAsyncThunk<
  CreateDisputeResponse & { taskId: number; gigProfileId: number },
  { taskId: number; dto: CreateDisputeDto },
  ThunkConfig
>('client/raiseDispute', async ({ taskId, dto }, { dispatch, rejectWithValue }) => {
  try {
    const response = await clientApi.createDispute(taskId, dto);
    void dispatch(fetchClientContracts());
    return { ...response, taskId, gigProfileId: dto.gigProfileId };
  } catch (error) {
    return rejectWithValue(messageOf(error, 'Failed to raise dispute.'));
  }
});

// ===========================================================================
// REVIEWS THUNK
// ===========================================================================

export const submitClientReview = createAsyncThunk<ReviewRecord, CreateClientReviewDto, ThunkConfig>(
  'client/submitReview',
  async ({ taskId, gigProfileId, rating, comment }, { dispatch, rejectWithValue }) => {
    try {
      const review = await clientApi.createReview(taskId, gigProfileId, rating, comment);
      void dispatch(fetchClientContracts());
      return review;
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to submit review.'));
    }
  },
);

// ===========================================================================
// SLICE
// ===========================================================================

const clientSlice = createSlice({
  name: 'client',
  initialState: initialClientState,
  reducers: {
    clearClientTaskActionError(state, action: PayloadAction<number>) {
      delete state.taskActionErrors[action.payload];
    },
    clearClientApplicationError(state, action: PayloadAction<number>) {
      delete state.applicationActionErrors[action.payload];
    },
    clearClientContractError(state, action: PayloadAction<string>) {
      delete state.contractActionErrors[action.payload];
    },
    clearClientDefinitionError(state, action: PayloadAction<number>) {
      delete state.definitionErrors[action.payload];
    },
    clearLatestCreatedInvite(state) {
      state.latestCreatedInvite = null;
    },
    clearClientDisputeError(state, action: PayloadAction<string>) {
      delete state.disputeRequests[action.payload];
    },
    clearReviewSubmitError(state) {
      state.reviewSubmitState = idle;
    },
  },
  extraReducers(builder) {
    builder
      // Clean slate on new authenticated session
      .addCase(login.fulfilled, () => initialClientState)

      // Profile
      .addCase(fetchClientProfile.pending, (s) => {
        s.profileRequest = { status: 'loading', error: null };
      })
      .addCase(fetchClientProfile.fulfilled, (s, a) => {
        s.profile = a.payload;
        s.profileRequest = { status: 'succeeded', error: null };
      })
      .addCase(fetchClientProfile.rejected, (s, a) => {
        s.profileRequest = { status: 'failed', error: a.payload ?? 'Failed to load client profile.' };
      })

      .addCase(updateClientProfile.pending, (s) => {
        s.profileSave = { status: 'loading', error: null };
      })
      .addCase(updateClientProfile.fulfilled, (s, a) => {
        s.profile = a.payload;
        s.profileSave = { status: 'succeeded', error: null };
      })
      .addCase(updateClientProfile.rejected, (s, a) => {
        s.profileSave = { status: 'failed', error: a.payload ?? 'Failed to update client profile.' };
      })

      // Tasks
      .addCase(fetchClientTasks.pending, (s, a) => {
        s.tasksRequest = { status: 'loading', error: null, requestId: a.meta.requestId };
      })
      .addCase(fetchClientTasks.fulfilled, (s, a) => {
        if (s.tasksRequest.requestId !== a.meta.requestId) return;
        s.tasks = a.payload;
        s.tasksRequest = { status: 'succeeded', error: null };
      })
      .addCase(fetchClientTasks.rejected, (s, a) => {
        if (s.tasksRequest.requestId !== a.meta.requestId) return;
        s.tasksRequest = { status: 'failed', error: a.payload ?? 'Failed to load tasks.' };
      })

      .addCase(createClientTask.fulfilled, (s, a) => {
        s.tasks.unshift(a.payload);
      })

      .addCase(updateClientTask.pending, (s, a) => {
        bump(s.taskMutations, a.meta.arg.taskId, 1);
        delete s.taskActionErrors[a.meta.arg.taskId];
      })
      .addCase(updateClientTask.fulfilled, (s, a) => {
        bump(s.taskMutations, a.meta.arg.taskId, -1);
        s.tasks = s.tasks.map((t) => (t.taskId === a.payload.taskId ? a.payload : t));
      })
      .addCase(updateClientTask.rejected, (s, a) => {
        bump(s.taskMutations, a.meta.arg.taskId, -1);
        s.taskActionErrors[a.meta.arg.taskId] = a.payload ?? 'Failed to update task.';
      })

      .addCase(deleteClientTask.pending, (s, a) => {
        bump(s.taskMutations, a.meta.arg, 1);
        delete s.taskActionErrors[a.meta.arg];
      })
      .addCase(deleteClientTask.fulfilled, (s, a) => {
        bump(s.taskMutations, a.payload, -1);
        s.tasks = s.tasks.filter((t) => t.taskId !== a.payload);
        s.contracts = s.contracts.filter((c) => c.taskId !== a.payload);
      })
      .addCase(deleteClientTask.rejected, (s, a) => {
        bump(s.taskMutations, a.meta.arg, -1);
        s.taskActionErrors[a.meta.arg] = a.payload ?? 'Failed to delete task.';
      })

      // Applications
      .addCase(fetchClientApplications.pending, (s) => {
        s.applicationsRequest = { status: 'loading', error: null };
      })
      .addCase(fetchClientApplications.fulfilled, (s, a) => {
        s.applications = a.payload;
        s.applicationsRequest = { status: 'succeeded', error: null };
      })
      .addCase(fetchClientApplications.rejected, (s, a) => {
        s.applicationsRequest = { status: 'failed', error: a.payload ?? 'Failed to load applications.' };
      })

      .addCase(fetchApplicantProfile.pending, (s, a) => {
        s.applicantProfileRequests[a.meta.arg] = { status: 'loading', error: null };
      })
      .addCase(fetchApplicantProfile.fulfilled, (s, a) => {
        s.applicantProfiles[a.meta.arg] = a.payload;
        s.applicantProfileRequests[a.meta.arg] = { status: 'succeeded', error: null };
      })
      .addCase(fetchApplicantProfile.rejected, (s, a) => {
        s.applicantProfileRequests[a.meta.arg] = { status: 'failed', error: a.payload ?? "Could not load this applicant's profile." };
      })

      .addCase(approveApplication.pending, (s, a) => {
        delete s.applicationActionErrors[a.meta.arg];
      })
      .addCase(approveApplication.fulfilled, (s, a) => {
        s.applications = s.applications.map((app) =>
          app.applicationId === a.payload.applicationId ? { ...app, status: 'accepted' } : app,
        );
      })
      .addCase(approveApplication.rejected, (s, a) => {
        s.applicationActionErrors[a.meta.arg] = a.payload ?? 'Failed to approve applicant.';
      })

      .addCase(rejectApplication.pending, (s, a) => {
        delete s.applicationActionErrors[a.meta.arg];
      })
      .addCase(rejectApplication.fulfilled, (s, a) => {
        s.applications = s.applications.map((app) =>
          app.applicationId === a.payload.applicationId ? { ...app, status: 'declined' } : app,
        );
      })
      .addCase(rejectApplication.rejected, (s, a) => {
        s.applicationActionErrors[a.meta.arg] = a.payload ?? 'Failed to reject applicant.';
      })

      // Contracts
      .addCase(fetchClientContracts.pending, (s) => {
        s.contractsRequest = { status: 'loading', error: null };
      })
      .addCase(fetchClientContracts.fulfilled, (s, a) => {
        s.contracts = a.payload;
        s.contractsRequest = { status: 'succeeded', error: null };
      })
      .addCase(fetchClientContracts.rejected, (s, a) => {
        s.contractsRequest = { status: 'failed', error: a.payload ?? 'Failed to load client contracts.' };
      })

      // Deliverable Definitions
      .addCase(fetchTaskDeliverableDefinitions.pending, (s, a) => {
        s.definitionsRequests[a.meta.arg] = { status: 'loading', error: null };
      })
      .addCase(fetchTaskDeliverableDefinitions.fulfilled, (s, a) => {
        s.definitionsByTask[a.meta.arg] = a.payload;
        s.definitionsRequests[a.meta.arg] = { status: 'succeeded', error: null };
      })
      .addCase(fetchTaskDeliverableDefinitions.rejected, (s, a) => {
        s.definitionsRequests[a.meta.arg] = { status: 'failed', error: a.payload ?? 'Could not load deliverables.' };
      })

      .addCase(createTaskDeliverable.pending, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, 1);
        delete s.definitionErrors[a.meta.arg.taskId];
      })
      .addCase(createTaskDeliverable.fulfilled, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, -1);
        const list = s.definitionsByTask[a.meta.arg.taskId] ?? [];
        s.definitionsByTask[a.meta.arg.taskId] = [...list, a.payload];
      })
      .addCase(createTaskDeliverable.rejected, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, -1);
        s.definitionErrors[a.meta.arg.taskId] = a.payload ?? 'Could not add deliverable definition.';
      })

      .addCase(updateTaskDeliverable.pending, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, 1);
        delete s.definitionErrors[a.meta.arg.taskId];
      })
      .addCase(updateTaskDeliverable.fulfilled, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, -1);
        const list = s.definitionsByTask[a.meta.arg.taskId] ?? [];
        s.definitionsByTask[a.meta.arg.taskId] = list.map((item) =>
          item.definitionId === a.payload.definitionId ? a.payload : item,
        );
      })
      .addCase(updateTaskDeliverable.rejected, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, -1);
        s.definitionErrors[a.meta.arg.taskId] = a.payload ?? 'Could not update deliverable definition.';
      })

      .addCase(deleteTaskDeliverable.pending, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, 1);
        delete s.definitionErrors[a.meta.arg.taskId];
      })
      .addCase(deleteTaskDeliverable.fulfilled, (s, a) => {
        bump(s.definitionMutations, a.payload.taskId, -1);
        const list = s.definitionsByTask[a.payload.taskId] ?? [];
        s.definitionsByTask[a.payload.taskId] = list.filter((item) => item.definitionId !== a.payload.definitionId);
      })
      .addCase(deleteTaskDeliverable.rejected, (s, a) => {
        bump(s.definitionMutations, a.meta.arg.taskId, -1);
        s.definitionErrors[a.meta.arg.taskId] = a.payload ?? 'Could not remove deliverable definition.';
      })

      // Submitted Deliverables
      .addCase(fetchTaskSubmittedDeliverables.pending, (s, a) => {
        s.deliverablesRequests[a.meta.arg] = { status: 'loading', error: null };
      })
      .addCase(fetchTaskSubmittedDeliverables.fulfilled, (s, a) => {
        s.deliverablesByTask[a.meta.arg] = a.payload;
        s.deliverablesRequests[a.meta.arg] = { status: 'succeeded', error: null };
      })
      .addCase(fetchTaskSubmittedDeliverables.rejected, (s, a) => {
        s.deliverablesRequests[a.meta.arg] = { status: 'failed', error: a.payload ?? 'Could not load submitted deliverables.' };
      })

      .addCase(reviewSubmittedDeliverable.pending, (s, a) => {
        const key = `${a.meta.arg.taskId}-${a.meta.arg.deliverableNo}`;
        delete s.deliverableActionErrors[key];
      })
      .addCase(reviewSubmittedDeliverable.fulfilled, (s, a) => {
        const taskId = a.payload.taskId;
        const list = s.deliverablesByTask[taskId] ?? [];
        s.deliverablesByTask[taskId] = list.map((del) =>
          del.deliverableNo === a.payload.deliverableNo ? { ...del, ...a.payload } : del,
        );
      })
      .addCase(reviewSubmittedDeliverable.rejected, (s, a) => {
        const key = `${a.meta.arg.taskId}-${a.meta.arg.deliverableNo}`;
        s.deliverableActionErrors[key] = a.payload ?? 'Failed to review deliverable.';
      })

      // Services & Requests
      .addCase(fetchClientServices.pending, (s) => {
        s.servicesRequest = { status: 'loading', error: null };
      })
      .addCase(fetchClientServices.fulfilled, (s, a) => {
        s.services = a.payload;
        s.servicesRequest = { status: 'succeeded', error: null };
      })
      .addCase(fetchClientServices.rejected, (s, a) => {
        s.servicesRequest = { status: 'failed', error: a.payload ?? 'Failed to load services.' };
      })

      .addCase(fetchClientServiceRequests.pending, (s) => {
        s.serviceRequestsRequest = { status: 'loading', error: null };
      })
      .addCase(fetchClientServiceRequests.fulfilled, (s, a) => {
        s.serviceRequests = a.payload;
        s.requestedServiceIds = a.payload.map((r) => r.serviceId);
        s.serviceRequestsRequest = { status: 'succeeded', error: null };
      })
      .addCase(fetchClientServiceRequests.rejected, (s, a) => {
        s.serviceRequestsRequest = { status: 'failed', error: a.payload ?? 'Failed to load service requests.' };
      })

      .addCase(createClientServiceRequest.fulfilled, (s, a) => {
        if (!s.requestedServiceIds.includes(a.payload.serviceId)) {
          s.requestedServiceIds.push(a.payload.serviceId);
        }
      })
      .addCase(createClientServiceRequest.rejected, (s, a) => {
        s.serviceActionError = a.payload ?? 'Failed to request service.';
      })

      // Managers & Invitations
      .addCase(fetchClientManagers.pending, (s) => {
        s.managersRequest = { status: 'loading', error: null };
      })
      .addCase(fetchClientManagers.fulfilled, (s, a) => {
        s.managers = a.payload;
        s.managersRequest = { status: 'succeeded', error: null };
      })
      .addCase(fetchClientManagers.rejected, (s, a) => {
        s.managersRequest = { status: 'failed', error: a.payload ?? 'Failed to load managers.' };
      })

      .addCase(updateManager.pending, (s, a) => {
        delete s.managerActionErrors[a.meta.arg.managerId];
      })
      .addCase(updateManager.fulfilled, (s, a) => {
        const { managerId, dto } = a.payload;
        s.managers = s.managers.map((m) =>
          m.managerId === managerId
            ? {
                ...m,
                user: {
                  ...m.user,
                  ...(dto.name ? { name: dto.name } : {}),
                  ...(dto.email ? { email: dto.email } : {}),
                },
              }
            : m,
        );
      })
      .addCase(updateManager.rejected, (s, a) => {
        s.managerActionErrors[a.meta.arg.managerId] = a.payload ?? 'Failed to update manager.';
      })

      .addCase(removeManager.fulfilled, (s, a) => {
        s.managers = s.managers.filter((m) => m.managerId !== a.payload);
      })
      .addCase(removeManager.rejected, (s, a) => {
        s.managerActionErrors[a.meta.arg] = a.payload ?? 'Failed to remove manager.';
      })

      .addCase(fetchManagerInvitations.pending, (s) => {
        s.invitesRequest = { status: 'loading', error: null };
      })
      .addCase(fetchManagerInvitations.fulfilled, (s, a) => {
        s.invites = a.payload;
        s.invitesRequest = { status: 'succeeded', error: null };
      })
      .addCase(fetchManagerInvitations.rejected, (s, a) => {
        s.invitesRequest = { status: 'failed', error: a.payload ?? 'Failed to load manager invitations.' };
      })

      .addCase(createManagerInvitation.fulfilled, (s, a) => {
        s.invites.unshift(a.payload);
        s.latestCreatedInvite = a.payload;
      })
      .addCase(revokeManagerInvitation.fulfilled, (s, a) => {
        s.invites = s.invites.filter((i) => i.inviteId !== a.payload);
      })

      // Manager Assignment
      .addCase(assignTaskManager.fulfilled, (s, a) => {
        const { taskId, gigProfileId, managerId } = a.payload;
        s.contracts = s.contracts.map((c) =>
          c.taskId === taskId && c.gigProfileId === gigProfileId ? { ...c, managerId } : c,
        );
      })
      .addCase(assignTaskManager.rejected, (s, a) => {
        const key = `${a.meta.arg.taskId}-${a.meta.arg.gigProfileId}`;
        s.contractActionErrors[key] = a.payload ?? 'Failed to assign manager.';
      })

      // End Individual Hire
      .addCase(endClientHire.fulfilled, (s, a) => {
        const { taskId, gigProfileId } = a.payload;
        s.contracts = s.contracts.filter((c) => !(c.taskId === taskId && c.gigProfileId === gigProfileId));
      })
      .addCase(endClientHire.rejected, (s, a) => {
        const key = `${a.meta.arg.taskId}-${a.meta.arg.gigProfileId}`;
        s.contractActionErrors[key] = a.payload ?? 'Failed to end hire.';
      })

      // Disputes
      .addCase(raiseClientDispute.pending, (s, a) => {
        const key = `${a.meta.arg.taskId}-${a.meta.arg.dto.gigProfileId}`;
        s.disputeRequests[key] = { status: 'loading', error: null };
      })
      .addCase(raiseClientDispute.fulfilled, (s, a) => {
        const key = `${a.payload.taskId}-${a.payload.gigProfileId}`;
        s.disputeRequests[key] = { status: 'succeeded', error: null };
        s.contracts = s.contracts.map((c) =>
          c.taskId === a.payload.taskId && c.gigProfileId === a.payload.gigProfileId
            ? { ...c, hasOpenDispute: true }
            : c,
        );
      })
      .addCase(raiseClientDispute.rejected, (s, a) => {
        const key = `${a.meta.arg.taskId}-${a.meta.arg.dto.gigProfileId}`;
        s.disputeRequests[key] = { status: 'failed', error: a.payload ?? 'Failed to raise dispute.' };
      })

      // Reviews
      .addCase(submitClientReview.pending, (s) => {
        s.reviewSubmitState = { status: 'loading', error: null };
      })
      .addCase(submitClientReview.fulfilled, (s) => {
        s.reviewSubmitState = { status: 'succeeded', error: null };
      })
      .addCase(submitClientReview.rejected, (s, a) => {
        s.reviewSubmitState = { status: 'failed', error: a.payload ?? 'Failed to submit review.' };
      });
  },
});

export const {
  clearClientTaskActionError,
  clearClientApplicationError,
  clearClientContractError,
  clearClientDefinitionError,
  clearLatestCreatedInvite,
  clearClientDisputeError,
  clearReviewSubmitError,
} = clientSlice.actions;

export default clientSlice.reducer;
