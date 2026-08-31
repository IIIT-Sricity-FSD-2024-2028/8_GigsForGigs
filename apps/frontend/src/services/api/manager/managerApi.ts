/**
 * @file managerApi.ts
 * @description
 * Real API client for the Manager role. Connects directly to Express endpoints
 * backed by PostgreSQL and Prisma ORM. No mock fallbacks.
 */

import { apiFetch } from '../httpClient';
import type {
  ManagerProfile,
  ManagerTask,
  Deliverable,
  TalentProfile,
  CreateDeliverableDto,
  ReviewDeliverableDto,
  UpdateManagerProfileDto
} from '../../../types/manager';

const actor = 'manager' as const;

export const managerApi = {
  // GET /api/managers/me
  getProfile: async (): Promise<ManagerProfile> => {
    return apiFetch<ManagerProfile>('/managers/me', { actor });
  },

  // PATCH /api/managers/me
  updateProfile: async (dto: UpdateManagerProfileDto): Promise<ManagerProfile> => {
    return apiFetch<ManagerProfile>('/managers/me', {
      method: 'PATCH',
      body: dto,
      actor
    });
  },

  // GET /api/managers/me/tasks
  getAssignedTasks: async (): Promise<ManagerTask[]> => {
    return apiFetch<ManagerTask[]>('/managers/me/tasks', { actor });
  },

  // GET /api/managers/me/tasks/{taskId}
  getTaskById: async (taskId: number): Promise<ManagerTask | null> => {
    return apiFetch<ManagerTask>(`/managers/me/tasks/${taskId}`, { actor });
  },

  // GET /api/managers/me/tasks/{taskId}/deliverables
  getTaskDeliverables: async (taskId: number): Promise<Deliverable[]> => {
    return apiFetch<Deliverable[]>(`/managers/me/tasks/${taskId}/deliverables`, { actor });
  },

  // POST /api/managers/me/tasks/{taskId}/deliverables
  createDeliverable: async (taskId: number, dto: CreateDeliverableDto): Promise<Deliverable> => {
    return apiFetch<Deliverable>(`/managers/me/tasks/${taskId}/deliverables`, {
      method: 'POST',
      body: dto,
      actor
    });
  },

  // GET /api/managers/me/tasks/{taskId}/deliverables/{deliverableNo}
  getDeliverableByNo: async (taskId: number, deliverableNo: number): Promise<Deliverable | null> => {
    return apiFetch<Deliverable>(`/managers/me/tasks/${taskId}/deliverables/${deliverableNo}`, { actor });
  },

  // PATCH /api/managers/me/tasks/{taskId}/deliverables/{deliverableNo}/review
  reviewDeliverable: async (taskId: number, deliverableNo: number, dto: ReviewDeliverableDto): Promise<Deliverable> => {
    return apiFetch<Deliverable>(`/managers/me/tasks/${taskId}/deliverables/${deliverableNo}/review`, {
      method: 'PATCH',
      body: dto,
      actor
    });
  },

  // PATCH /api/managers/me/tasks/{taskId}/deliverables/{deliverableNo}/close
  closeDeliverable: async (taskId: number, deliverableNo: number): Promise<Deliverable> => {
    return apiFetch<Deliverable>(`/managers/me/tasks/${taskId}/deliverables/${deliverableNo}/close`, {
      method: 'PATCH',
      actor
    });
  },

  // Search Talent
  searchTalent: async (query?: string): Promise<TalentProfile[]> => {
    return apiFetch<TalentProfile[]>(`/gig/professionals${query ? `?q=${encodeURIComponent(query)}` : ''}`, { actor });
  }
};

export default managerApi;
