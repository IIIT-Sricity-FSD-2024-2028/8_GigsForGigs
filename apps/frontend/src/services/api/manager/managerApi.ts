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
  ManagerApplication,
  ReviewDeliverableDto,
  ShortlistApplicationDto,
  UpdateManagerProfileDto
} from '../../../types/manager';
import type { TaskDeliverableDefinition } from '../client/clientApi';

// Every call here is made with the manager's JWT.
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

  // GET /api/managers/me/tasks/{taskId}/applications
  getTaskApplications: async (taskId: number): Promise<ManagerApplication[]> => {
    return apiFetch<ManagerApplication[]>(`/managers/me/tasks/${taskId}/applications`, { actor });
  },

  // PATCH /api/managers/me/tasks/{taskId}/applications/{applicationId}/shortlist
  shortlistApplication: async (taskId: number, applicationId: number, dto: ShortlistApplicationDto): Promise<ManagerApplication> => {
    return apiFetch<ManagerApplication>(`/managers/me/tasks/${taskId}/applications/${applicationId}/shortlist`, {
      method: 'PATCH',
      body: dto,
      actor
    });
  },

  // Deliverable definitions on an assigned task — same shape as clientApi's, for TaskDeliverablesManager.
  getTaskDeliverableDefinitions: async (taskId: number): Promise<TaskDeliverableDefinition[]> =>
    apiFetch<TaskDeliverableDefinition[]>(`/managers/me/tasks/${taskId}/deliverable-definitions`, { actor }),

  /** Add an expected deliverable. */

  createTaskDeliverableDefinition: async (taskId: number, values: { title: string; description?: string }): Promise<TaskDeliverableDefinition> =>
    apiFetch<TaskDeliverableDefinition>(`/managers/me/tasks/${taskId}/deliverable-definitions`, { method: 'POST', body: values, actor }),

  /** Edit an expected deliverable. */

  updateTaskDeliverableDefinition: async (taskId: number, definitionId: number, values: { title?: string; description?: string }): Promise<TaskDeliverableDefinition> =>
    apiFetch<TaskDeliverableDefinition>(`/managers/me/tasks/${taskId}/deliverable-definitions/${definitionId}`, { method: 'PATCH', body: values, actor }),

  /** Remove an expected deliverable. */

  deleteTaskDeliverableDefinition: async (taskId: number, definitionId: number): Promise<void> =>
    apiFetch<void>(`/managers/me/tasks/${taskId}/deliverable-definitions/${definitionId}`, { method: 'DELETE', actor }),

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

  // GET /api/gig/professionals?q= — search gig pros by name/skill (all when no query).
  searchTalent: async (query?: string): Promise<TalentProfile[]> => {
    return apiFetch<TalentProfile[]>(`/gig/professionals${query ? `?q=${encodeURIComponent(query)}` : ''}`, { actor });
  }
};

export default managerApi;
