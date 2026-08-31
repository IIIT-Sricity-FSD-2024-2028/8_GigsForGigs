/**
 * @file clientApi.ts
 * @description
 * Real API service client for the Client module. Dispatches typed HTTP requests
 * to the backend with Bearer JWT tokens. No mock fallbacks.
 */

import { apiFetch } from '../httpClient';

const actor = 'client' as const;

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

export interface TaskDto {
  title: string;
  description?: string;
  category?: string;
  duration?: string;
  skills?: string[];
  budget: number;
  dueDate?: string;
}

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

export interface RawContract {
  taskId: number;
  taskTitle: string;
  gigProfileId?: number;
  gigProfessionalName: string;
  status: 'open' | 'in_progress' | 'completed';
  progress: number;
  budget: number | string;
  createdAt: string;
}

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
}

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

export interface RawServiceRequest {
  requestId: number;
  serviceId: number;
  clientId: number;
  status: string;
  createdAt: string;
}

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

export interface RawManagerInvite {
  inviteId: number;
  clientId: number;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: string;
}

export const clientApi = {
  getProfile: async (): Promise<ClientProfileData> => {
    return apiFetch<ClientProfileData>('/clients/me', { actor });
  },

  updateProfile: async (clientId: number, dto: { clientName?: string; domain?: string }): Promise<ClientProfileData> => {
    return apiFetch<ClientProfileData>(`/clients/${clientId}/profile`, {
      method: 'POST',
      body: dto,
      actor,
    });
  },

  getTasks: async (): Promise<RawTask[]> => {
    return apiFetch<RawTask[]>('/tasks', { actor });
  },

  createTask: async (dto: TaskDto): Promise<RawTask> => {
    return apiFetch<RawTask>('/tasks', {
      method: 'POST',
      body: dto,
      actor,
    });
  },

  updateTask: async (taskId: number, dto: Partial<TaskDto> & { status?: string }): Promise<RawTask> => {
    return apiFetch<RawTask>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: dto,
      actor,
    });
  },

  deleteTask: async (taskId: number): Promise<void> => {
    return apiFetch<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
      actor,
    });
  },

  getApplications: async (): Promise<RawApplication[]> => {
    return apiFetch<RawApplication[]>('/applications', { actor });
  },

  reviewApplication: async (applicationId: number, status: 'accepted' | 'declined' | 'shortlisted'): Promise<RawApplication> => {
    return apiFetch<RawApplication>(`/applications/${applicationId}`, {
      method: 'PATCH',
      body: { status },
      actor,
    });
  },

  getContracts: async (): Promise<RawContract[]> => {
    return apiFetch<RawContract[]>('/contracts', { actor });
  },

  getTaskDeliverables: async (taskId: number): Promise<RawDeliverable[]> => {
    return apiFetch<RawDeliverable[]>(`/tasks/${taskId}/deliverables`, { actor });
  },

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

  getServices: async (): Promise<RawService[]> => {
    return apiFetch<RawService[]>('/services', { actor });
  },

  requestService: async (serviceId: number): Promise<unknown> => {
    return apiFetch<unknown>(`/services/${serviceId}/requests`, {
      method: 'POST',
      actor,
    });
  },

  getServiceRequests: async (): Promise<RawServiceRequest[]> => {
    return apiFetch<RawServiceRequest[]>('/requests', { actor });
  },

  getManagers: async (): Promise<RawManager[]> => {
    return apiFetch<RawManager[]>('/managers', { actor });
  },

  updateManager: async (managerId: number, dto: { name?: string; email?: string }): Promise<unknown> => {
    return apiFetch<unknown>(`/managers/${managerId}`, {
      method: 'PATCH',
      body: dto,
      actor,
    });
  },

  deleteManager: async (managerId: number): Promise<void> => {
    return apiFetch<void>(`/managers/${managerId}`, {
      method: 'DELETE',
      actor,
    });
  },

  getManagerInvites: async (): Promise<RawManagerInvite[]> => {
    return apiFetch<RawManagerInvite[]>('/manager-invites', { actor });
  },

  createManagerInvite: async (dto: { name: string; email: string }): Promise<RawManagerInvite> => {
    return apiFetch<RawManagerInvite>('/manager-invites', {
      method: 'POST',
      body: dto,
      actor,
    });
  },
};

export default clientApi;

