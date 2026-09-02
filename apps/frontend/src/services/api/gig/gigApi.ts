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
  GigDeliverable
} from '../../../types/gig';

const actor = 'gig_professional' as const;

export const gigApi = {
  getActiveTasks: async (): Promise<GigTask[]> => {
    return apiFetch<GigTask[]>('/gig/tasks/active', { actor });
  },

  getPendingRequests: async (): Promise<PendingRequest[]> => {
    return apiFetch<PendingRequest[]>('/gig/requests/pending', { actor });
  },

  getCompletedProjects: async (): Promise<CompletedProject[]> => {
    return apiFetch<CompletedProject[]>('/gig/projects/completed', { actor });
  },

  getEarnings: async (): Promise<EarningsSummary> => {
    return apiFetch<EarningsSummary>('/gig/earnings', { actor });
  },

  getMarketplaceTasks: async (): Promise<GigTask[]> => {
    return apiFetch<GigTask[]>('/gig/tasks/marketplace', { actor });
  },

  applyForTask: async (taskId: number): Promise<{ success: boolean; taskId: number }> => {
    return apiFetch<{ success: boolean; taskId: number }>('/gig/applications', {
      method: 'POST',
      body: { taskId },
      actor
    });
  },

  withdrawApplication: async (applicationId: number): Promise<void> => {
    return apiFetch<void>(`/gig/applications/${applicationId}`, { method: 'DELETE', actor });
  },

  respondToRequest: async (applicationId: number, action: 'accepted' | 'declined'): Promise<{ success: boolean }> => {
    return apiFetch<{ success: boolean }>(`/gig/requests/${applicationId}/respond`, {
      method: 'POST',
      body: { action },
      actor
    });
  },

  getProfile: async (): Promise<GigProfile> => {
    return apiFetch<GigProfile>('/gig/profile', { actor });
  },

  updateProfile: async (patch: Partial<GigProfile>): Promise<GigProfile> => {
    return apiFetch<GigProfile>('/gig/profile', { method: 'PUT', body: patch, actor });
  },

  getServices: async (): Promise<GigService[]> => {
    return apiFetch<GigService[]>('/gig/services/mine', { actor });
  },

  postService: async (dto: CreateServiceDto): Promise<GigService> => {
    return apiFetch<GigService>('/gig/services', { method: 'POST', body: dto, actor });
  },

  submitDeliverable: async (dto: SubmitDeliverableDto): Promise<GigDeliverable> => {
    return apiFetch<GigDeliverable>('/gig/deliverables', {
      method: 'POST',
      body: { taskId: dto.taskId, content: dto.content, notes: dto.notes },
      actor
    });
  },

  createReview: async (taskId: number, rating: number, comment?: string): Promise<{ success: boolean }> => {
    return apiFetch<{ success: boolean }>('/gig/reviews', {
      method: 'POST',
      body: { taskId, rating, comment },
      actor
    });
  }
};

export default gigApi;
