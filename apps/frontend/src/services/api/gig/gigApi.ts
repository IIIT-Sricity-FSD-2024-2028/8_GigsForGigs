/**
 * @file gigApi.ts
 * @description
 * Real API service client for the Gig Professional module. Calls the backend's
 * `/api/gig/*` routes through the shared `apiFetch` wrapper. No mock datasets,
 * no synthetic fallbacks. All operations persist to the PostgreSQL database.
 */

import { apiFetch } from '../httpClient';
import type {
  GigProfile,
  GigTask,
  PendingRequest,
  CompletedProject,
  EarningsSummary,
  GigService,
  CreateServiceDto,
  SubmitDeliverableDto,
  GigDeliverable,
  TaskDeliverableDefinition
} from '../../../types/gig';

// Every call here is made with the gig professional's JWT.
const actor = 'gig_professional' as const;

export const gigApi = {
  /** GET tasks currently assigned to this gig pro. */
  getActiveTasks: async (): Promise<GigTask[]> => {
    return apiFetch<GigTask[]>('/gig/tasks/active', { actor });
  },

  /** GET the deliverables the client expects for a task. */

  getTaskDeliverableDefinitions: async (taskId: number): Promise<TaskDeliverableDefinition[]> =>
    apiFetch<TaskDeliverableDefinition[]>(`/gig/tasks/${taskId}/deliverable-definitions`, { actor }),

  /** GET applications / service requests still awaiting a response. */

  getPendingRequests: async (): Promise<PendingRequest[]> => {
    return apiFetch<PendingRequest[]>('/gig/requests/pending', { actor });
  },

  /** GET finished projects (with reviews). */

  getCompletedProjects: async (): Promise<CompletedProject[]> => {
    return apiFetch<CompletedProject[]>('/gig/projects/completed', { actor });
  },

  /** GET earnings totals and payout history. */

  getEarnings: async (): Promise<EarningsSummary> => {
    return apiFetch<EarningsSummary>('/gig/earnings', { actor });
  },

  /** GET open tasks this gig pro can apply to. */

  getMarketplaceTasks: async (): Promise<GigTask[]> => {
    return apiFetch<GigTask[]>('/gig/tasks/marketplace', { actor });
  },

  /** POST an application to a task. */

  applyForTask: async (taskId: number): Promise<{ success: boolean; taskId: number }> => {
    return apiFetch<{ success: boolean; taskId: number }>('/gig/applications', {
      method: 'POST',
      body: { taskId },
      actor
    });
  },

  /** DELETE a pending application. */

  withdrawApplication: async (applicationId: number): Promise<void> => {
    return apiFetch<void>(`/gig/applications/${applicationId}`, { method: 'DELETE', actor });
  },

  /** Accept or decline a client's service request. */

  respondToRequest: async (applicationId: number, action: 'accepted' | 'declined'): Promise<{ success: boolean }> => {
    return apiFetch<{ success: boolean }>(`/gig/requests/${applicationId}/respond`, {
      method: 'POST',
      body: { action },
      actor
    });
  },

  /** GET this gig pro's profile. */

  getProfile: async (): Promise<GigProfile> => {
    return apiFetch<GigProfile>('/gig/profile', { actor });
  },

  /** PUT profile changes. */

  updateProfile: async (patch: Partial<GigProfile>): Promise<GigProfile> => {
    return apiFetch<GigProfile>('/gig/profile', { method: 'PUT', body: patch, actor });
  },

  /** GET services this gig pro has published. */

  getServices: async (): Promise<GigService[]> => {
    return apiFetch<GigService[]>('/gig/services/mine', { actor });
  },

  /** POST a new service listing. */

  postService: async (dto: CreateServiceDto): Promise<GigService> => {
    return apiFetch<GigService>('/gig/services', { method: 'POST', body: dto, actor });
  },

  /** POST work for a task; `definitionIds` = which expected deliverables it covers. */

  submitDeliverable: async (dto: SubmitDeliverableDto): Promise<GigDeliverable> => {
    return apiFetch<GigDeliverable>('/gig/deliverables', {
      method: 'POST',
      body: { taskId: dto.taskId, content: dto.content, notes: dto.notes, definitionIds: dto.definitionIds ?? [] },
      actor
    });
  },

  /** POST a review of the client after a completed task. */

  createReview: async (taskId: number, rating: number, comment?: string): Promise<{ success: boolean }> => {
    return apiFetch<{ success: boolean }>('/gig/reviews', {
      method: 'POST',
      body: { taskId, rating, comment },
      actor
    });
  }
};

export default gigApi;
