/**
 * @file clientApi.ts
 * @description
 * Real API service client for the Client module. Dispatches typed HTTP requests
 * to the backend with Bearer JWT tokens. No mock fallbacks.
 */

import { apiFetch } from '../httpClient';

// Every call here is made with the client's JWT.
const actor = 'client' as const;

/** The client organisation profile as returned by the API. */
export interface ClientProfileData {
  clientId: number;
  userId: number;
  clientName: string;
  numberOfManager: number;
  domain?: string | null;
  user?: {
    userId: number;
    name: string;
    email: string;
    role: string;
  };
}

/** Body for creating/updating a task. */
export interface TaskDto {
  title: string;
  description?: string;
  category?: string;
  duration?: string;
  skills?: string[];
  budget: number;
  dueDate?: string;
}

/** A task exactly as the API returns it (mapped to UI shape in ClientContext). */
export interface RawTask {
  taskId: number;
  clientId: number;
  title: string;
  description: string | null;
  budget: number | string;
  dueDate: string | null;
  status: 'open' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  category: string | null;
  duration: string | null;
  skills: string[];
}

/** A gig pro's application to a task, with task + applicant details. */
export interface RawApplication {
  applicationId: number;
  gigProfileId: number;
  taskId: number;
  status: 'pending' | 'accepted' | 'declined' | 'shortlisted';
  createdAt: string;
  hourlyRate: number | null;
  rating: number | null;
  task: {
    taskId: number;
    title: string;
    budget: number | string;
    status: string;
    createdAt: string;
  };
  gigProfile: {
    gigProfileId: number;
    userId: number;
    bio: string | null;
    user: {
      userId: number;
      name: string;
      email: string;
    };
  };
}

/** A review left on a completed contract. */
export interface RawContractReview {
  reviewId: number;
  taskId: number;
  reviewerId: number;
  revieweeId: number;
  reviewerName?: string;
  revieweeName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

/** An assigned task ("contract") with progress and reviews. */
export interface RawContract {
  taskId: number;
  taskTitle: string;
  gigProfileId?: number;
  gigProfessionalName: string;
  status: 'open' | 'in_progress' | 'completed';
  progress: number;
  budget: number | string;
  createdAt: string;
  reviews?: RawContractReview[];
}

/** One submission of work by a gig pro. */
export interface RawDeliverable {
  taskId: number;
  deliverableNo: number;
  gigProfileId: number;
  description: string;
  submissionPath: string;
  status: 'submitted' | 'approved' | 'revision_requested' | 'closed';
  createdAt: string;
  feedback: string | null;
  gigProfile?: {
    user: {
      name: string;
    };
  };
  claimedDefinitions?: Array<{ definitionId: number; title: string; description: string | null }>;
}

/** An expected deliverable defined on a task, with the submissions made against it. */
export interface TaskDeliverableDefinition {
  definitionId: number;
  taskId: number;
  title: string;
  description: string | null;
  createdAt: string;
  submissions: Array<{
    deliverableNo: number;
    status: 'submitted' | 'approved' | 'revision_requested' | 'closed';
    createdAt: string;
    feedback: string | null;
  }>;
}

/** A service listing published by a gig pro. */
export interface RawService {
  serviceId: number;
  gigProfileId: number;
  title: string;
  description: string | null;
  price: number | string;
  thumbnail: string | null;
  status: string;
  createdAt: string;
  tags: Array<{ tag: string }>;
  profile: {
    gigProfileId: number;
    user: {
      userId: number;
      name: string;
      email: string;
    };
  };
}

/** A client's request to hire a service. */
export interface RawServiceRequest {
  requestId: number;
  serviceId: number;
  clientId: number;
  status: string;
  createdAt: string;
}

/** An active manager linked to this client. */
export interface RawManager {
  clientId: number;
  managerId: number;
  userId: number;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

/** An invitation sent to a prospective manager. */
export interface RawManagerInvite {
  inviteId: number;
  clientId: number;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: string;
  /** Present on pending invites: the one-time link to share with the manager. */
  inviteLink?: string;
}

export const clientApi = {
  /** GET /clients/me — the logged-in client's organisation profile. */
  getProfile: async (): Promise<ClientProfileData> => {
    return apiFetch<ClientProfileData>('/clients/me', { actor });
  },

  /** Update profile. Pass a clientId to POST /clients/:id/profile (first-time setup), or just the fields to PATCH /clients/me/profile. */

  updateProfile: async (
    dtoOrClientId: { clientName?: string; domain?: string } | number,
    maybeDto?: { clientName?: string; domain?: string }
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

  /** GET /tasks — all tasks posted by this client. */

  getTasks: async (): Promise<RawTask[]> => {
    return apiFetch<RawTask[]>('/tasks', { actor });
  },

  /** POST /tasks — post a new task. */

  createTask: async (dto: TaskDto): Promise<RawTask> => {
    return apiFetch<RawTask>('/tasks', {
      method: 'POST',
      body: dto,
      actor,
    });
  },

  /** PATCH /tasks/:id — edit a task. */

  updateTask: async (taskId: number, dto: Partial<TaskDto>): Promise<RawTask> => {
    return apiFetch<RawTask>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: dto,
      actor,
    });
  },

  /** DELETE /tasks/:id */

  deleteTask: async (taskId: number): Promise<void> => {
    return apiFetch<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
      actor,
    });
  },

  /** GET /applications — gig pros who applied to this client's tasks. */

  getApplications: async (): Promise<RawApplication[]> => {
    return apiFetch<RawApplication[]>('/applications', { actor });
  },

  /** PATCH /applications/:id — accept, decline or shortlist an applicant. */

  reviewApplication: async (applicationId: number, status: 'accepted' | 'declined' | 'shortlisted'): Promise<RawApplication> => {
    return apiFetch<RawApplication>(`/applications/${applicationId}`, {
      method: 'PATCH',
      body: { status },
      actor,
    });
  },

  /** GET /contracts — tasks that have an assigned professional. */

  getContracts: async (): Promise<RawContract[]> => {
    return apiFetch<RawContract[]>('/contracts', { actor });
  },

  /** GET /tasks/:id/deliverables — work submitted for a task. */

  getTaskDeliverables: async (taskId: number): Promise<RawDeliverable[]> => {
    return apiFetch<RawDeliverable[]>(`/tasks/${taskId}/deliverables`, { actor });
  },

  /** GET the list of deliverables the client expects for a task. */

  getTaskDeliverableDefinitions: async (taskId: number): Promise<TaskDeliverableDefinition[]> =>
    apiFetch<TaskDeliverableDefinition[]>(`/tasks/${taskId}/deliverable-definitions`, { actor }),

  /** Add an expected deliverable to a task. */

  createTaskDeliverableDefinition: async (taskId: number, values: { title: string; description?: string }): Promise<TaskDeliverableDefinition> =>
    apiFetch<TaskDeliverableDefinition>(`/tasks/${taskId}/deliverable-definitions`, { method: 'POST', body: values, actor }),

  /** Edit an expected deliverable. */

  updateTaskDeliverableDefinition: async (taskId: number, definitionId: number, values: { title?: string; description?: string }): Promise<TaskDeliverableDefinition> =>
    apiFetch<TaskDeliverableDefinition>(`/tasks/${taskId}/deliverable-definitions/${definitionId}`, { method: 'PATCH', body: values, actor }),

  /** Remove an expected deliverable. */

  deleteTaskDeliverableDefinition: async (taskId: number, definitionId: number): Promise<void> =>
    apiFetch<void>(`/tasks/${taskId}/deliverable-definitions/${definitionId}`, { method: 'DELETE', actor }),

  /** PATCH /deliverables/:id — approve or request a revision (optional feedback). */

  reviewDeliverable: async (
    deliverableId: string,
    status: 'approved' | 'revision_requested',
    feedback?: string
  ): Promise<RawDeliverable> => {
    return apiFetch<RawDeliverable>(`/deliverables/${deliverableId}`, {
      method: 'PATCH',
      body: { status, ...(feedback ? { feedback } : {}) },
      actor,
    });
  },

  /** GET /services — services gig pros offer on the marketplace. */

  getServices: async (): Promise<RawService[]> => {
    return apiFetch<RawService[]>('/services', { actor });
  },

  /** POST /services/:id/requests — ask a gig pro to do their service. */

  requestService: async (serviceId: number): Promise<unknown> => {
    return apiFetch<unknown>(`/services/${serviceId}/requests`, {
      method: 'POST',
      actor,
    });
  },

  /** GET /requests — service requests this client has sent. */

  getServiceRequests: async (): Promise<RawServiceRequest[]> => {
    return apiFetch<RawServiceRequest[]>('/requests', { actor });
  },

  /** GET /managers — managers who accepted this client's invite. */

  getManagers: async (): Promise<RawManager[]> => {
    return apiFetch<RawManager[]>('/managers', { actor });
  },

  /** PATCH /managers/:id — rename / change email. */

  updateManager: async (managerId: number, dto: { name?: string; email?: string }): Promise<unknown> => {
    return apiFetch<unknown>(`/managers/${managerId}`, {
      method: 'PATCH',
      body: dto,
      actor,
    });
  },

  /** DELETE /managers/:id */

  deleteManager: async (managerId: number): Promise<void> => {
    return apiFetch<void>(`/managers/${managerId}`, {
      method: 'DELETE',
      actor,
    });
  },

  /** GET /manager-invites — pending and past invites. */

  getManagerInvites: async (): Promise<RawManagerInvite[]> => {
    return apiFetch<RawManagerInvite[]>('/manager-invites', { actor });
  },

  /** POST /manager-invites — returns the invite incl. its one-time link. */

  createManagerInvite: async (dto: { name: string; email: string }): Promise<RawManagerInvite> => {
    return apiFetch<RawManagerInvite>('/manager-invites', {
      method: 'POST',
      body: dto,
      actor,
    });
  },

  /** DELETE /manager-invites/:id — cancel a pending invite. */

  revokeManagerInvite: async (inviteId: number): Promise<void> =>
    apiFetch<void>(`/manager-invites/${inviteId}`, { method: 'DELETE', actor }),

  /** Rate the professional who delivered a completed task. */
  createReview: async (taskId: number, rating: number, comment?: string): Promise<unknown> =>
    apiFetch<unknown>('/reviews', { method: 'POST', body: { taskId, rating, ...(comment?.trim() ? { comment: comment.trim() } : {}) }, actor }),
};

export default clientApi;

