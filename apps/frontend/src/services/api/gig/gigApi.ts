/**
 * @file gigApi.ts
 * @description
 * Real API service client for the Gig Professional module. Calls the backend's
 * `/api/gig/*` routes (see apps/backend/src/modules/gig/gig.route.ts) through the
 * shared `apiFetch` wrapper — no silent fallback to mock data. Any failure or
 * non-2xx response throws `ApiError` (from httpClient.ts) so callers can show a
 * real error instead of silently rendering fake data.
 *
 * Response shapes are dictated by gig.serializer.ts on the backend: snake_case
 * keys, STRING ids, and UPPERCASE status enum values — deliberately different
 * from the manager/client modules' casing convention. Do not "fix" that here.
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
  /**
   * Fetch active tasks assigned to the current Gig Professional.
   * GET /api/gig/tasks/active
   *
   * NOTE (endpoint gap): the backend's serializeTask does not embed a
   * `deliverables` array on task objects, and there is no separate GET
   * endpoint to list a task's deliverable history from the gig side (only
   * POST /gig/deliverables to submit a new one exists). So `task.deliverables`
   * will always come back `undefined` here — pages that render deliverable
   * history (SubmitDeliverables, ProjectDetail) will show an empty history
   * even for tasks that do have submissions. Not fixable from the frontend
   * alone; flagged rather than faked.
   */
  getActiveTasks: async (): Promise<GigTask[]> => {
    return apiFetch<GigTask[]>('/gig/tasks/active', { actor });
  },

  /**
   * Fetch pending task requests/applications (this gig professional's own
   * pending applications — see gig.service.ts listPendingRequests doc comment).
   * GET /api/gig/requests/pending
   */
  getPendingRequests: async (): Promise<PendingRequest[]> => {
    return apiFetch<PendingRequest[]>('/gig/requests/pending', { actor });
  },

  /**
   * Fetch completed projects portfolio.
   * GET /api/gig/projects/completed
   */
  getCompletedProjects: async (): Promise<CompletedProject[]> => {
    return apiFetch<CompletedProject[]>('/gig/projects/completed', { actor });
  },

  /**
   * Fetch total earnings and payments ledger.
   * GET /api/gig/earnings
   */
  getEarnings: async (): Promise<EarningsSummary> => {
    return apiFetch<EarningsSummary>('/gig/earnings', { actor });
  },

  /**
   * Fetch marketplace open tasks available for application.
   * GET /api/gig/tasks/marketplace
   */
  getMarketplaceTasks: async (): Promise<GigTask[]> => {
    return apiFetch<GigTask[]>('/gig/tasks/marketplace', { actor });
  },

  /**
   * Apply for an open task in the marketplace.
   * POST /api/gig/applications  body: { taskId }
   * (taskId is coerced to a number server-side; the frontend's task_id is a
   * numeric string, which zod's z.coerce.number() accepts directly.)
   */
  applyForTask: async (taskId: string): Promise<{ success: boolean; taskId: string }> => {
    return apiFetch<{ success: boolean; taskId: string }>('/gig/applications', {
      method: 'POST',
      body: { taskId },
      actor
    });
  },

  /**
   * Withdraw a previously submitted application.
   * DELETE /api/gig/applications/:id -> 204 No Content
   */
  withdrawApplication: async (applicationId: string): Promise<void> => {
    await apiFetch<null>(`/gig/applications/${applicationId}`, { method: 'DELETE', actor });
  },

  /**
   * Accept or decline an incoming task request (own pending application).
   * POST /api/gig/requests/:id/respond  body: { action }
   */
  respondToRequest: async (applicationId: string, action: 'accepted' | 'declined'): Promise<{ success: boolean }> => {
    return apiFetch<{ success: boolean }>(`/gig/requests/${applicationId}/respond`, {
      method: 'POST',
      body: { action },
      actor
    });
  },

  /**
   * Fetch current Gig Professional profile.
   * GET /api/gig/profile
   */
  getProfile: async (): Promise<GigProfile> => {
    return apiFetch<GigProfile>('/gig/profile', { actor });
  },

  /**
   * Update Gig Professional profile details.
   * PUT /api/gig/profile  body: { bio?, skills?, tools?, portfolio? }
   * (PUT semantics: skills/tools/portfolio are each fully replaced when
   * present, not merged — see gig.service.ts updateProfile.)
   */
  updateProfile: async (patch: Partial<GigProfile>): Promise<GigProfile> => {
    return apiFetch<GigProfile>('/gig/profile', { method: 'PUT', body: patch, actor });
  },

  /**
   * Fetch services posted by the current Gig Professional.
   * GET /api/gig/services/mine
   */
  getServices: async (): Promise<GigService[]> => {
    return apiFetch<GigService[]>('/gig/services/mine', { actor });
  },

  /**
   * Post a new service listing.
   * POST /api/gig/services
   */
  postService: async (dto: CreateServiceDto): Promise<GigService> => {
    return apiFetch<GigService>('/gig/services', { method: 'POST', body: dto, actor });
  },

  /**
   * Submit a deliverable for an active task.
   * POST /api/gig/deliverables  body: { taskId, content, notes? }
   */
  submitDeliverable: async (dto: SubmitDeliverableDto): Promise<GigDeliverable> => {
    return apiFetch<GigDeliverable>('/gig/deliverables', {
      method: 'POST',
      body: { taskId: dto.taskId, content: dto.content, notes: dto.notes },
      actor
    });
  },

  /**
   * Leave a review for the client on a completed task.
   * POST /api/gig/reviews  body: { taskId, rating, comment? }
   * Not currently called from any page — added for contract completeness.
   */
  createReview: async (taskId: string, rating: number, comment?: string): Promise<{ success: boolean }> => {
    return apiFetch<{ success: boolean }>('/gig/reviews', {
      method: 'POST',
      body: { taskId, rating, comment },
      actor
    });
  }
};

export default gigApi;
