/**
 * @file clientApi.ts
 * @description
 * Single source of HTTP communication for all Client-owned server operations.
 * Dispatches strongly-typed requests through the shared `apiFetch` HTTP client
 * with Bearer JWT tokens attached automatically under actor `client`.
 *
 * Rules:
 * - Preserves all existing methods, contracts, and response signatures.
 * - Reuses the shared `httpClient.ts` transport module.
 * - Does not invent endpoints or alter backend schemas.
 */

import { apiFetch } from '../httpClient';
import type { ApplicantProfileResponse } from '../../../types/profile';
import type {
  ClientProfileData,
  UpdateClientProfileDto,
  TaskDto,
  CreateTaskDto,
  UpdateTaskDto,
  RawTask,
  RawApplication,
  RawContract,
  RawContractReview,
  RawDeliverable,
  TaskDeliverableDefinition,
  CreateDeliverableDefinitionDto,
  UpdateDeliverableDefinitionDto,
  ReviewDeliverableDto,
  RawService,
  RawServiceRequest,
  RequestServiceResponse,
  RawManager,
  UpdateManagerDto,
  RawManagerInvite,
  CreateManagerInviteDto,
  SetTaskManagerDto,
  SetTaskManagerResponse,
  CreateDisputeDto,
  CreateDisputeResponse,
  CreateClientReviewDto,
  ReviewRecord,
  RawPaymentStatus,
} from '../../../types/client';

// Re-export all client types so existing component/slice imports remain fully backward-compatible
export type {
  ApplicantProfileResponse,
  ClientProfileData,
  UpdateClientProfileDto,
  TaskDto,
  CreateTaskDto,
  UpdateTaskDto,
  RawTask,
  RawApplication,
  RawContract,
  RawContractReview,
  RawDeliverable,
  TaskDeliverableDefinition,
  CreateDeliverableDefinitionDto,
  UpdateDeliverableDefinitionDto,
  ReviewDeliverableDto,
  RawService,
  RawServiceRequest,
  RequestServiceResponse,
  RawManager,
  UpdateManagerDto,
  RawManagerInvite,
  CreateManagerInviteDto,
  SetTaskManagerDto,
  SetTaskManagerResponse,
  CreateDisputeDto,
  CreateDisputeResponse,
  CreateClientReviewDto,
  ReviewRecord,
  RawPaymentStatus,
};

// Every call here is made with the client's JWT
const actor = 'client' as const;

export const clientApi = {
  // =========================================================================
  // A. CLIENT PROFILE
  // =========================================================================

  /** GET /clients/me — the logged-in client's organisation profile. */
  getProfile: async (): Promise<ClientProfileData> => {
    return apiFetch<ClientProfileData>('/clients/me', { actor });
  },

  /**
   * Update profile. Pass a clientId to POST /clients/:id/profile (first-time setup),
   * or just the fields to PATCH /clients/me/profile.
   */
  updateProfile: async (
    dtoOrClientId: UpdateClientProfileDto | number,
    maybeDto?: UpdateClientProfileDto
  ): Promise<ClientProfileData> => {
    if (typeof dtoOrClientId === 'number') {
      return apiFetch<ClientProfileData>(`/clients/${dtoOrClientId}/profile`, {
        method: 'POST',
        body: maybeDto || {},
        actor,
      });
    }
    return apiFetch<ClientProfileData>('/clients/me/profile', {
      method: 'PATCH',
      body: dtoOrClientId,
      actor,
    });
  },

  // =========================================================================
  // B. TASK MANAGEMENT
  // =========================================================================

  /** GET /tasks — all tasks posted by this client. */
  getTasks: async (): Promise<RawTask[]> => {
    return apiFetch<RawTask[]>('/tasks', { actor });
  },

  /** POST /tasks — post a new task. */
  createTask: async (dto: CreateTaskDto): Promise<RawTask> => {
    return apiFetch<RawTask>('/tasks', {
      method: 'POST',
      body: dto,
      actor,
    });
  },

  /** PATCH /tasks/:id — partial update of a task. */
  updateTask: async (taskId: number, dto: UpdateTaskDto): Promise<RawTask> => {
    return apiFetch<RawTask>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: dto,
      actor,
    });
  },

  /** PUT /tasks/:id — replace all fields of a task. */
  replaceTask: async (taskId: number, dto: CreateTaskDto): Promise<RawTask> => {
    return apiFetch<RawTask>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: dto,
      actor,
    });
  },

  /** DELETE /tasks/:id — delete a task. */
  deleteTask: async (taskId: number): Promise<void> => {
    return apiFetch<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
      actor,
    });
  },

  // =========================================================================
  // C. APPLICATION MANAGEMENT
  // =========================================================================

  /** GET /applications — gig professionals who applied to this client's tasks. */
  getApplications: async (): Promise<RawApplication[]> => {
    return apiFetch<RawApplication[]>('/applications', { actor });
  },

  /**
   * GET /applications/:id/profile — detailed profile of the gig professional
   * behind one application to this client's task.
   * Keyed strictly by applicationId to respect backend permission boundaries.
   */
  getApplicantProfile: async (applicationId: number): Promise<ApplicantProfileResponse> => {
    return apiFetch<ApplicantProfileResponse>(`/applications/${applicationId}/profile`, { actor });
  },

  /** PATCH /applications/:id — accept or decline an applicant. */
  reviewApplication: async (
    applicationId: number,
    status: 'accepted' | 'declined' | 'shortlisted'
  ): Promise<RawApplication> => {
    return apiFetch<RawApplication>(`/applications/${applicationId}`, {
      method: 'PATCH',
      body: { status },
      actor,
    });
  },

  /** Accept an application to hire the gig professional (creates a contract). */
  approveApplication: async (applicationId: number): Promise<RawApplication> => {
    return clientApi.reviewApplication(applicationId, 'accepted');
  },

  /** Reject an application. */
  rejectApplication: async (applicationId: number): Promise<RawApplication> => {
    return clientApi.reviewApplication(applicationId, 'declined');
  },

  // =========================================================================
  // D. CONTRACTS
  // =========================================================================

  /** GET /contracts — tasks that have an assigned professional, with progress, payments, and reviews. */
  getContracts: async (): Promise<RawContract[]> => {
    return apiFetch<RawContract[]>('/contracts', { actor });
  },

  // =========================================================================
  // E. TASK DELIVERABLES & DEFINITIONS
  // =========================================================================

  /** GET /tasks/:id/deliverable-definitions — the list of expected milestone deliverables defined for a task. */
  getTaskDeliverableDefinitions: async (taskId: number): Promise<TaskDeliverableDefinition[]> => {
    return apiFetch<TaskDeliverableDefinition[]>(`/tasks/${taskId}/deliverable-definitions`, { actor });
  },

  /** POST /tasks/:id/deliverable-definitions — add an expected deliverable milestone to a task. */
  createTaskDeliverableDefinition: async (
    taskId: number,
    values: CreateDeliverableDefinitionDto
  ): Promise<TaskDeliverableDefinition> => {
    return apiFetch<TaskDeliverableDefinition>(`/tasks/${taskId}/deliverable-definitions`, {
      method: 'POST',
      body: values,
      actor,
    });
  },

  /** PATCH /tasks/:taskId/deliverable-definitions/:definitionId — edit an expected deliverable. */
  updateTaskDeliverableDefinition: async (
    taskId: number,
    definitionId: number,
    values: UpdateDeliverableDefinitionDto
  ): Promise<TaskDeliverableDefinition> => {
    return apiFetch<TaskDeliverableDefinition>(`/tasks/${taskId}/deliverable-definitions/${definitionId}`, {
      method: 'PATCH',
      body: values,
      actor,
    });
  },

  /** DELETE /tasks/:taskId/deliverable-definitions/:definitionId — remove an expected deliverable. */
  deleteTaskDeliverableDefinition: async (taskId: number, definitionId: number): Promise<void> => {
    return apiFetch<void>(`/tasks/${taskId}/deliverable-definitions/${definitionId}`, {
      method: 'DELETE',
      actor,
    });
  },

  /** GET /tasks/:id/deliverables — work submitted for a task by gig professionals. */
  getTaskDeliverables: async (taskId: number): Promise<RawDeliverable[]> => {
    return apiFetch<RawDeliverable[]>(`/tasks/${taskId}/deliverables`, { actor });
  },

  /**
   * PATCH /deliverables/:deliverableId — approve or request a revision (optional feedback).
   * deliverableId is composite: "<taskId>-<deliverableNo>".
   */
  reviewDeliverable: async (
    deliverableId: string,
    status: 'approved' | 'revision_requested',
    feedback?: string
  ): Promise<RawDeliverable> => {
    return apiFetch<RawDeliverable>(`/deliverables/${deliverableId}`, {
      method: 'PATCH',
      body: { status, ...(feedback?.trim() ? { feedback: feedback.trim().slice(0, 500) } : {}) },
      actor,
    });
  },

  /** Approve a submitted deliverable by task ID and deliverable sequence number. */
  approveDeliverable: async (taskId: number, deliverableNo: number): Promise<RawDeliverable> => {
    return clientApi.reviewDeliverable(`${taskId}-${deliverableNo}`, 'approved');
  },

  /** Request revisions on a submitted deliverable with required/optional feedback. */
  rejectDeliverable: async (
    taskId: number,
    deliverableNo: number,
    feedback?: string
  ): Promise<RawDeliverable> => {
    return clientApi.reviewDeliverable(`${taskId}-${deliverableNo}`, 'revision_requested', feedback);
  },

  // =========================================================================
  // F. SERVICES
  // =========================================================================

  /** GET /services — services published by gig professionals on the marketplace. */
  getServices: async (): Promise<RawService[]> => {
    return apiFetch<RawService[]>('/services', { actor });
  },

  /** POST /services/:id/requests — request/hire a gig professional for their service. */
  requestService: async (serviceId: number): Promise<RequestServiceResponse> => {
    return apiFetch<RequestServiceResponse>(`/services/${serviceId}/requests`, {
      method: 'POST',
      actor,
    });
  },

  /** GET /requests — service requests this client has sent. */
  getServiceRequests: async (): Promise<RawServiceRequest[]> => {
    return apiFetch<RawServiceRequest[]>('/requests', { actor });
  },

  // =========================================================================
  // G. MANAGER MANAGEMENT
  // =========================================================================

  /** GET /managers — active managers who belong to this client's organization. */
  getManagers: async (): Promise<RawManager[]> => {
    return apiFetch<RawManager[]>('/managers', { actor });
  },

  /** PATCH /managers/:id — update manager details (name, email) on the client's roster. */
  updateManager: async (managerId: number, dto: UpdateManagerDto): Promise<unknown> => {
    return apiFetch<unknown>(`/managers/${managerId}`, {
      method: 'PATCH',
      body: dto,
      actor,
    });
  },

  /** DELETE /managers/:id — remove a manager from the client's roster. */
  deleteManager: async (managerId: number): Promise<void> => {
    return apiFetch<void>(`/managers/${managerId}`, {
      method: 'DELETE',
      actor,
    });
  },

  /** GET /manager-invites — pending and past manager invitations sent by this client. */
  getManagerInvites: async (): Promise<RawManagerInvite[]> => {
    return apiFetch<RawManagerInvite[]>('/manager-invites', { actor });
  },

  /** POST /manager-invites — send an invitation to a prospective manager (returns one-time inviteLink). */
  createManagerInvite: async (dto: CreateManagerInviteDto): Promise<RawManagerInvite> => {
    return apiFetch<RawManagerInvite>('/manager-invites', {
      method: 'POST',
      body: dto,
      actor,
    });
  },

  /** DELETE /manager-invites/:id — revoke a pending manager invitation. */
  revokeManagerInvite: async (inviteId: number): Promise<void> => {
    return apiFetch<void>(`/manager-invites/${inviteId}`, {
      method: 'DELETE',
      actor,
    });
  },

  // =========================================================================
  // H. MANAGER ASSIGNMENT
  // =========================================================================

  /**
   * PATCH /tasks/:taskId/manager — assign or change the supervising manager for one hired professional.
   * Passing `managerId: null` keeps supervision with the client directly.
   *
   * Crucial: All three identifiers (`taskId`, `gigProfileId`, `managerId`) are preserved.
   */
  assignTaskManager: async (
    taskId: number,
    gigProfileId: number,
    managerId: number | null
  ): Promise<SetTaskManagerResponse> => {
    return apiFetch<SetTaskManagerResponse>(`/tasks/${taskId}/manager`, {
      method: 'PATCH',
      body: { gigProfileId, managerId },
      actor,
    });
  },

  // =========================================================================
  // I. END HIRE
  // =========================================================================

  /**
   * DELETE /tasks/:taskId/hires/:gigProfileId — end an individual hire before any work was submitted.
   *
   * Crucial: Preserves both `taskId` and `gigProfileId`.
   * Cancels the individual hire and associated pending payments, but keeps the task open
   * so other professionals can continue or be hired.
   */
  endHire: async (taskId: number, gigProfileId: number): Promise<void> => {
    return apiFetch<void>(`/tasks/${taskId}/hires/${gigProfileId}`, {
      method: 'DELETE',
      actor,
    });
  },

  /**
   * Alias for `endHire` to preserve backward compatibility with existing code.
   */
  removeHire: async (taskId: number, gigProfileId: number): Promise<void> => {
    return clientApi.endHire(taskId, gigProfileId);
  },

  // =========================================================================
  // J. DISPUTES
  // =========================================================================

  /**
   * POST /tasks/:taskId/disputes — freeze escrow for admin arbitration when work has been submitted.
   */
  createDispute: async (taskId: number, dto: CreateDisputeDto): Promise<CreateDisputeResponse> => {
    return apiFetch<CreateDisputeResponse>(`/tasks/${taskId}/disputes`, {
      method: 'POST',
      body: dto,
      actor,
    });
  },

  // =========================================================================
  // K. REVIEWS
  // =========================================================================

  /**
   * POST /reviews — rate and review the gig professional who delivered a completed task.
   */
  createReview: async (
    taskId: number,
    gigProfileId: number,
    rating: number,
    comment?: string
  ): Promise<ReviewRecord> => {
    return apiFetch<ReviewRecord>('/reviews', {
      method: 'POST',
      body: {
        taskId,
        gigProfileId,
        rating,
        ...(comment?.trim() ? { comment: comment.trim() } : {}),
      },
      actor,
    });
  },
};

export default clientApi;
