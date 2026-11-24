/**
 * @file selectors.ts
 * @description Memoized and parameterized Redux selectors for the Client domain.
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { RawContract, RawTask } from '../../services/api/client/clientApi';

// Base slice selector
const selectClientState = (state: RootState) => state.client;

// ===========================================================================
// PROFILE SELECTORS
// ===========================================================================

export const selectClientProfile = (state: RootState) => selectClientState(state).profile;
export const selectClientProfileRequest = (state: RootState) => selectClientState(state).profileRequest;
export const selectClientProfileSave = (state: RootState) => selectClientState(state).profileSave;

// ===========================================================================
// TASK SELECTORS
// ===========================================================================

export const selectClientTasks = (state: RootState) => selectClientState(state).tasks;
export const selectClientTasksRequest = (state: RootState) => selectClientState(state).tasksRequest;

export const selectActiveTasks = createSelector([selectClientTasks], (tasks: RawTask[]) =>
  tasks.filter((t) => t.status === 'open' || t.status === 'in_progress'),
);

export const selectPostedMarketplaceTasks = createSelector([selectClientTasks], (tasks: RawTask[]) =>
  tasks.filter((t) => t.status === 'open' && !t.skills?.includes('Service Hire')),
);

export const selectCompletedTasks = createSelector([selectClientTasks], (tasks: RawTask[]) =>
  tasks.filter((t) => t.status === 'completed'),
);

export const selectTaskById = (state: RootState, taskId: number) =>
  selectClientState(state).tasks.find((t) => t.taskId === taskId) ?? null;

export const selectTaskMutation = (state: RootState, taskId: number) =>
  Boolean(selectClientState(state).taskMutations[taskId]);

export const selectTaskActionError = (state: RootState, taskId: number) =>
  selectClientState(state).taskActionErrors[taskId] ?? null;

// ===========================================================================
// APPLICATION SELECTORS
// ===========================================================================

export const selectClientApplications = (state: RootState) => selectClientState(state).applications;
export const selectClientApplicationsRequest = (state: RootState) => selectClientState(state).applicationsRequest;

export const selectApplicationsByTaskId = (state: RootState, taskId: number) =>
  selectClientState(state).applications.filter((a) => a.taskId === taskId);

export const selectUndecidedApplications = createSelector([selectClientApplications], (applications) =>
  applications.filter(
    (a) => (a.status === 'pending' || a.status === 'shortlisted') && !a.task?.skills?.includes('Service Hire'),
  ),
);

export const selectApplicantProfile = (state: RootState, applicationId: number) =>
  selectClientState(state).applicantProfiles[applicationId] ?? null;

export const selectApplicantProfileRequest = (state: RootState, applicationId: number) =>
  selectClientState(state).applicantProfileRequests[applicationId] ?? { status: 'idle', error: null };

export const selectApplicationActionError = (state: RootState, applicationId: number) =>
  selectClientState(state).applicationActionErrors[applicationId] ?? null;

// ===========================================================================
// CONTRACT SELECTORS
// ===========================================================================

export const selectClientContracts = (state: RootState) => selectClientState(state).contracts;
export const selectClientContractsRequest = (state: RootState) => selectClientState(state).contractsRequest;

export const selectActiveContracts = createSelector([selectClientContracts], (contracts: RawContract[]) =>
  contracts.filter((c) => c.status !== 'completed'),
);

export const selectCompletedContracts = createSelector([selectClientContracts], (contracts: RawContract[]) =>
  contracts.filter((c) => c.status === 'completed'),
);

export const selectContractsByTaskId = (state: RootState, taskId: number) =>
  selectClientState(state).contracts.filter((c) => c.taskId === taskId);

export const selectContractByHire = (state: RootState, taskId: number, gigProfileId: number) =>
  selectClientState(state).contracts.find((c) => c.taskId === taskId && c.gigProfileId === gigProfileId) ?? null;

export const selectContractActionError = (state: RootState, taskId: number, gigProfileId: number) =>
  selectClientState(state).contractActionErrors[`${taskId}-${gigProfileId}`] ?? null;

// ===========================================================================
// DELIVERABLE SELECTORS
// ===========================================================================

export const selectDeliverableDefinitionsByTask = (state: RootState, taskId: number) =>
  selectClientState(state).definitionsByTask[taskId] ?? [];

export const selectDeliverableDefinitionsRequest = (state: RootState, taskId: number) =>
  selectClientState(state).definitionsRequests[taskId] ?? { status: 'idle', error: null };

export const selectDefinitionMutation = (state: RootState, taskId: number) =>
  Boolean(selectClientState(state).definitionMutations[taskId]);

export const selectDefinitionError = (state: RootState, taskId: number) =>
  selectClientState(state).definitionErrors[taskId] ?? null;

export const selectSubmittedDeliverablesByTask = (state: RootState, taskId: number) =>
  selectClientState(state).deliverablesByTask[taskId] ?? [];

export const selectSubmittedDeliverablesRequest = (state: RootState, taskId: number) =>
  selectClientState(state).deliverablesRequests[taskId] ?? { status: 'idle', error: null };

export const selectDeliverableActionError = (state: RootState, taskId: number, deliverableNo: number) =>
  selectClientState(state).deliverableActionErrors[`${taskId}-${deliverableNo}`] ?? null;

// ===========================================================================
// SERVICE SELECTORS
// ===========================================================================

export const selectClientServices = (state: RootState) => selectClientState(state).services;
export const selectClientServicesRequest = (state: RootState) => selectClientState(state).servicesRequest;
export const selectClientServiceRequests = (state: RootState) => selectClientState(state).serviceRequests;
export const selectClientServiceRequestsRequest = (state: RootState) => selectClientState(state).serviceRequestsRequest;
export const selectRequestedServiceIds = (state: RootState) => selectClientState(state).requestedServiceIds;

// ===========================================================================
// MANAGER & INVITATION SELECTORS
// ===========================================================================

export const selectClientManagers = (state: RootState) => selectClientState(state).managers;
export const selectClientManagersRequest = (state: RootState) => selectClientState(state).managersRequest;
export const selectManagerActionError = (state: RootState, managerId: number) =>
  selectClientState(state).managerActionErrors[managerId] ?? null;

export const selectManagerInvitations = (state: RootState) => selectClientState(state).invites;
export const selectManagerInvitationsRequest = (state: RootState) => selectClientState(state).invitesRequest;

export const selectPendingManagerInvitations = createSelector([selectManagerInvitations], (invites) =>
  invites.filter((i) => i.status === 'pending'),
);

export const selectLatestCreatedInvite = (state: RootState) => selectClientState(state).latestCreatedInvite;

export const selectManagerWorkload = createSelector(
  [selectClientContracts, (_state: RootState, managerId: number) => managerId],
  (contracts: RawContract[], managerId: number) => {
    const assigned = contracts.filter((c) => c.managerId === managerId);
    const active = assigned.filter((c) => c.status !== 'completed');
    return {
      activeCount: active.length,
      totalCount: assigned.length,
      assignedContracts: assigned,
    };
  },
);

// ===========================================================================
// SPENDING & LEDGER SELECTORS
// ===========================================================================

export const selectTotalClientSpent = createSelector([selectCompletedContracts], (completed: RawContract[]) =>
  completed
    .filter((c) => c.paymentStatus === 'completed')
    .reduce((sum, c) => sum + Number(c.totalAmount || 0), 0),
);

export const selectEscrowLockedTotal = createSelector([selectClientContracts], (contracts: RawContract[]) =>
  contracts
    .filter((c) => c.paymentStatus === 'held')
    .reduce((sum, c) => sum + Number(c.totalAmount || 0), 0),
);

// ===========================================================================
// REVIEW & DISPUTE SELECTORS
// ===========================================================================

export const selectReviewSubmitState = (state: RootState) => selectClientState(state).reviewSubmitState;

export const selectDisputeRequest = (state: RootState, taskId: number, gigProfileId: number) =>
  selectClientState(state).disputeRequests[`${taskId}-${gigProfileId}`] ?? { status: 'idle', error: null };
