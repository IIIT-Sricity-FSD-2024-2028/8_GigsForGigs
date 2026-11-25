/**
 * @file adminApi.ts
 * @description
 * API repository for the Super Admin vertical.
 * Communicates with Express backend REST endpoints (/api/admin/*)
 * using the centralized apiFetch wrapper with strict domain typing.
 */

import { apiFetch } from '../httpClient';
import type {
  AdminAnalyticsData,
  AdminInviteResult,
  AdminKPIs,
  AdminStaff,
  AdminUserProfile,
  AdminUserSummary,
  AuditLogEntry,
  ClientDetail,
  ClientDossier,
  CreateClientAccountInput,
  CreateManagerSeatInput,
  DisputeCase,
  DisputeSettlementOutcome,
  GigProDetail,
  GigProDossier,
  ManagerAssignmentRow,
  ManagerDetail,
  ModerationReview,
  PlatformSettingsData,
  ProjectTask,
  UpdateClientDetailsInput,
  UpdateGigProDetailsInput,
  UpdateManagerDetailsInput,
} from './adminTypes';

export type {
  AdminAnalyticsData,
  AdminInviteResult,
  AdminKPIs,
  AdminStaff,
  AdminUserProfile,
  AdminUserSummary,
  AuditLogEntry,
  ClientDetail,
  ClientDossier,
  CreateClientAccountInput,
  CreateManagerSeatInput,
  DisputeCase,
  DisputeSettlementOutcome,
  GigProDetail,
  GigProDossier,
  ManagerAssignmentRow,
  ManagerDetail,
  ModerationReview,
  PlatformSettingsData,
  ProjectTask,
  UpdateClientDetailsInput,
  UpdateGigProDetailsInput,
  UpdateManagerDetailsInput,
};

const actor = 'admin' as const;
const stripDigits = (raw: string | number): string => String(raw).replace(/\D/g, '');

interface RawClientDossierResponse {
  clientId: number;
  userId: number;
  clientName: string;
  domain: string | null;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  user: { name: string; email: string; status: string; createdAt: string };
  managers: Array<{ managerId: number; user: { name: string; email: string; status: string } }>;
  tasks: Array<{
    taskId: number;
    title: string;
    status: string;
    budget: number | string;
    createdAt: string;
    applications?: unknown[];
    deliverables?: unknown[];
    payments?: Array<{ status: string; amount: number | string; platformFee: number | string }>;
  }>;
  serviceRequests?: unknown[];
}

interface RawGigProDossierResponse {
  gigProfileId: number;
  userId: number;
  bio: string | null;
  badge: string | null;
  user: { name: string; email: string; status: string };
  skills: Array<{ skill: string }>;
  tools: Array<{ tool: string }>;
  portfolio: Array<{ url: string }>;
  deliverables: Array<{
    taskId: number;
    deliverableNo: number;
    description: string;
    submissionPath: string;
    status: string;
    feedback: string | null;
    createdAt: string;
  }>;
  services: Array<{
    serviceId: number;
    title: string;
    description: string | null;
    price: number | string;
    category: string | null;
    status: string;
    createdAt: string;
  }>;
}

interface RawAssignmentResponse {
  gigProfileId: number;
  taskId: number;
  managerId: number | null;
  assignedAt: string;
  task: { title: string; status: string; budget: number | string };
  gigProfile: { user: { name: string } };
  manager: { user: { name: string } } | null;
}

export const adminApi = {
  // KPIs & Analytics
  async getKPIs(): Promise<AdminKPIs> {
    return apiFetch<AdminKPIs>('/admin/kpis', { actor });
  },

  async getAnalytics(timeRange: string = '30d'): Promise<AdminAnalyticsData> {
    return apiFetch<AdminAnalyticsData>(`/admin/analytics?timeRange=${encodeURIComponent(timeRange)}`, { actor });
  },

  // Master Directories
  async getUsers(): Promise<AdminUserSummary[]> {
    return apiFetch<AdminUserSummary[]>('/admin/users', { actor });
  },

  async getClients(): Promise<ClientDetail[]> {
    return apiFetch<ClientDetail[]>('/admin/clients', { actor });
  },

  async getClientDossier(clientId: string | number): Promise<ClientDossier> {
    const raw = await apiFetch<RawClientDossierResponse>(`/admin/clients/${stripDigits(clientId)}`, { actor });
    return {
      clientId: raw.clientId,
      userId: raw.userId,
      name: raw.user.name,
      companyName: raw.clientName,
      email: raw.user.email,
      domain: raw.domain,
      kycStatus: raw.kycStatus,
      status: raw.user.status,
      joinedDate: String(raw.user.createdAt).split('T')[0],
      managers: raw.managers.map((m) => ({
        managerId: m.managerId,
        name: m.user.name,
        email: m.user.email,
        status: m.user.status,
      })),
      tasks: raw.tasks.map((t) => {
        const payment = t.payments?.[0];
        const committed = (t.payments ?? [])
          .filter((p) => p.status === 'held' || p.status === 'completed')
          .reduce((sum, p) => sum + Number(p.amount) + Number(p.platformFee), 0);
        return {
          taskId: t.taskId,
          title: t.title,
          status: t.status.toUpperCase(),
          budget: Number(t.budget),
          createdAt: String(t.createdAt).split('T')[0],
          applicationsCount: t.applications?.length ?? 0,
          deliverablesCount: t.deliverables?.length ?? 0,
          escrowStatus: payment ? payment.status.toUpperCase() : null,
          totalCommitted: committed,
        };
      }),
      serviceRequestsCount: raw.serviceRequests?.length ?? 0,
    };
  },

  async createClientAccount(input: CreateClientAccountInput): Promise<{ userId: number; clientId: number }> {
    const createdUser = await apiFetch<{ userId: number }>('/admin/users', {
      method: 'POST',
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        role: 'client',
      },
      actor,
    });
    try {
      const createdClient = await apiFetch<{ clientId: number }>('/admin/clients', {
        method: 'POST',
        body: {
          userId: createdUser.userId,
          clientName: input.companyName,
          ...(input.domain?.trim() ? { domain: input.domain.trim() } : {}),
        },
        actor,
      });
      return { userId: createdUser.userId, clientId: createdClient.clientId };
    } catch (error) {
      await apiFetch<void>(`/admin/users/${createdUser.userId}`, { method: 'DELETE', actor }).catch(() => undefined);
      throw error;
    }
  },

  async updateClientDetails(input: UpdateClientDetailsInput): Promise<void> {
    await apiFetch(`/admin/users/${stripDigits(input.userId)}`, {
      method: 'PATCH',
      body: { name: input.name, email: input.email },
      actor,
    });
    await apiFetch(`/admin/clients/${stripDigits(input.clientId)}`, {
      method: 'PATCH',
      body: {
        clientName: input.companyName,
        domain: input.domain && input.domain.trim() ? input.domain.trim() : null,
      },
      actor,
    });
  },

  async decideClientKYC(
    clientId: string,
    status: 'VERIFIED' | 'REJECTED',
  ): Promise<{ success: boolean; clientId: number; kycStatus: 'VERIFIED' | 'REJECTED'; isVerified: boolean }> {
    return apiFetch(`/admin/clients/${clientId}/kyc`, {
      method: 'PATCH',
      body: { status },
      actor,
    });
  },

  async getGigPros(): Promise<GigProDetail[]> {
    return apiFetch<GigProDetail[]>('/admin/gig-pros', { actor });
  },

  async getGigProDossier(gigProfileId: string | number): Promise<GigProDossier> {
    const raw = await apiFetch<RawGigProDossierResponse>(`/admin/gig-profiles/${stripDigits(gigProfileId)}`, { actor });
    return {
      gigProfileId: raw.gigProfileId,
      userId: raw.userId,
      name: raw.user.name,
      email: raw.user.email,
      headline: raw.bio,
      badge: raw.badge ?? 'NONE',
      status: raw.user.status,
      skills: raw.skills.map((s) => s.skill),
      tools: raw.tools.map((t) => t.tool),
      portfolioUrls: raw.portfolio.map((p) => p.url),
      deliverables: raw.deliverables.map((d) => ({
        taskId: d.taskId,
        deliverableNo: d.deliverableNo,
        description: d.description,
        submissionPath: d.submissionPath,
        status: d.status.toUpperCase(),
        feedback: d.feedback,
        createdAt: String(d.createdAt).split('T')[0],
      })),
      services: raw.services.map((s) => ({
        serviceId: s.serviceId,
        title: s.title,
        description: s.description,
        price: Number(s.price),
        category: s.category,
        status: s.status,
        createdAt: String(s.createdAt).split('T')[0],
      })),
    };
  },

  async updateGigProDetails(input: UpdateGigProDetailsInput): Promise<void> {
    await apiFetch(`/admin/users/${stripDigits(input.userId)}`, {
      method: 'PATCH',
      body: { name: input.name, email: input.email },
      actor,
    });
    await apiFetch(`/admin/gig-profiles/${stripDigits(input.gigProfileId)}`, {
      method: 'PATCH',
      body: { bio: input.headline },
      actor,
    });
  },

  async moderateGigService(serviceId: number, status: 'active' | 'paused' | 'archived'): Promise<{ serviceId: number; status: string }> {
    return apiFetch<{ serviceId: number; status: string }>(`/admin/services/${serviceId}`, {
      method: 'PATCH',
      body: { status },
      actor,
    });
  },

  async updateGigProBadge(
    gigProId: string,
    badge: string,
  ): Promise<{ success: boolean; gigProfileId: number; badge: string }> {
    return apiFetch(`/admin/gig-pros/${gigProId}/badge`, {
      method: 'PATCH',
      body: { badge },
      actor,
    });
  },

  async getManagers(): Promise<ManagerDetail[]> {
    return apiFetch<ManagerDetail[]>('/admin/managers', { actor });
  },

  async getAssignments(): Promise<ManagerAssignmentRow[]> {
    const rows = await apiFetch<RawAssignmentResponse[]>('/admin/assignments', { actor });
    return rows.map((r) => ({
      gigProfileId: r.gigProfileId,
      taskId: r.taskId,
      managerId: r.managerId,
      assignedAt: String(r.assignedAt).split('T')[0],
      taskTitle: r.task.title,
      taskStatus: r.task.status.toUpperCase(),
      taskBudget: Number(r.task.budget),
      gigProName: r.gigProfile.user.name,
      managerName: r.manager?.user.name ?? null,
    }));
  },

  async createManagerSeat(input: CreateManagerSeatInput): Promise<{ userId: number; managerId: number; clientId: number }> {
    const createdUser = await apiFetch<{ userId: number }>('/admin/users', {
      method: 'POST',
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        role: 'manager',
      },
      actor,
    });
    try {
      const createdMgr = await apiFetch<{ managerId: number; clientId: number }>('/admin/managers', {
        method: 'POST',
        body: { userId: createdUser.userId, clientId: input.clientId },
        actor,
      });
      return { userId: createdUser.userId, managerId: createdMgr.managerId, clientId: createdMgr.clientId };
    } catch (error) {
      await apiFetch<void>(`/admin/users/${createdUser.userId}`, { method: 'DELETE', actor }).catch(() => undefined);
      throw error;
    }
  },

  async updateManagerDetails(input: UpdateManagerDetailsInput): Promise<void> {
    await apiFetch(`/admin/users/${stripDigits(input.userId)}`, {
      method: 'PATCH',
      body: { name: input.name, email: input.email },
      actor,
    });
  },

  async removeManagerSeat(clientId: number, managerId: number): Promise<void> {
    return apiFetch<void>(`/admin/managers/${clientId}/${managerId}`, { method: 'DELETE', actor });
  },

  async getProjects(): Promise<ProjectTask[]> {
    return apiFetch<ProjectTask[]>('/admin/projects', { actor });
  },

  async overrideProjectStatus(projectId: string, status: string): Promise<{ taskId: number; status: string }> {
    const id = projectId.replace(/\D/g, '');
    return apiFetch(`/admin/tasks/${id}`, {
      method: 'PATCH',
      body: { status: status.toLowerCase() },
      actor,
    });
  },

  async getReviews(): Promise<ModerationReview[]> {
    return apiFetch<ModerationReview[]>('/admin/reviews', { actor });
  },

  async getDisputes(): Promise<DisputeCase[]> {
    return apiFetch<DisputeCase[]>('/admin/disputes', { actor });
  },

  async getAdminStaff(): Promise<AdminStaff[]> {
    return apiFetch<AdminStaff[]>('/admin/admin-staff', { actor });
  },

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return apiFetch<AuditLogEntry[]>('/admin/audit-logs', { actor });
  },

  async getPlatformSettings(): Promise<PlatformSettingsData> {
    return apiFetch<PlatformSettingsData>('/admin/settings', { actor });
  },

  // Mutations
  async updateUserStatus(
    userId: string,
    status: string,
    reason: string,
  ): Promise<{ success: boolean; userId: number; status: string }> {
    return apiFetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: { status, reason },
      actor,
    });
  },

  async inviteAdmin(email: string, role: string, permissions: string[]): Promise<AdminInviteResult> {
    return apiFetch<AdminInviteResult>('/admin/invitations', {
      method: 'POST',
      body: { email, role, permissions },
      actor,
    });
  },

  async acceptAdminInvitation(
    token: string,
    email: string,
    password: string,
    newPassword: string,
  ): Promise<{ success: boolean; token: string; user: AdminUserProfile }> {
    return apiFetch('/admin/invitations/accept', {
      method: 'POST',
      body: { token, email, password, newPassword },
      actor,
    });
  },

  async removeAdmin(staffId: string): Promise<void> {
    return apiFetch<void>(`/admin/users/${staffId.replace(/\D/g, '')}`, { method: 'DELETE', actor });
  },

  async revokeAdminSession(staffId: string): Promise<{ success: boolean; token?: string }> {
    return apiFetch<{ success: boolean; token?: string }>(`/admin/sessions/${staffId}/revoke`, {
      method: 'POST',
      actor,
    });
  },

  async settleDispute(
    disputeId: string,
    settlementType: string,
    resolutionNotes: string,
    splitClientPercent?: number,
  ): Promise<DisputeSettlementOutcome> {
    return apiFetch<DisputeSettlementOutcome>(`/admin/disputes/${disputeId}/settle`, {
      method: 'POST',
      body: { settlementType, resolutionNotes, splitClientPercent },
      actor,
    });
  },

  async moderateReview(
    reviewId: string,
    status: string,
    moderatorNotes?: string,
  ): Promise<{ success: boolean; reviewId: number; status: string }> {
    return apiFetch(`/admin/reviews/${reviewId}/moderate`, {
      method: 'PATCH',
      body: { status, moderatorNotes },
      actor,
    });
  },

  async updatePlatformSettings(settings: PlatformSettingsData): Promise<PlatformSettingsData> {
    return apiFetch<PlatformSettingsData>('/admin/settings', {
      method: 'PUT',
      body: settings,
      actor,
    });
  },

  async getAdminProfile(): Promise<AdminUserProfile> {
    return apiFetch<AdminUserProfile>('/admin/profile', { actor });
  },

  async updateAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; token: string }> {
    return apiFetch<{ success: boolean; token: string }>('/admin/profile/password', {
      method: 'POST',
      body: { currentPassword, newPassword },
      actor,
    });
  },

  async enrollAdmin2FA(): Promise<{ secret: string; otpauthUri: string }> {
    return apiFetch<{ secret: string; otpauthUri: string }>('/admin/profile/2fa/enroll', { method: 'POST', actor });
  },

  async confirmAdmin2FA(code: string): Promise<{ success: boolean; twoFactorEnabled: boolean }> {
    return apiFetch('/admin/profile/2fa/confirm', { method: 'POST', body: { code }, actor });
  },

  async disableAdmin2FA(code: string): Promise<{ success: boolean; twoFactorEnabled: boolean }> {
    return apiFetch('/admin/profile/2fa/disable', { method: 'POST', body: { code }, actor });
  },
};

export default adminApi;
