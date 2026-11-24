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
  DisputeCase,
  DisputeSettlementOutcome,
  GigProDetail,
  ManagerDetail,
  ModerationReview,
  PlatformSettingsData,
  ProjectTask,
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
  DisputeCase,
  DisputeSettlementOutcome,
  GigProDetail,
  ManagerDetail,
  ModerationReview,
  PlatformSettingsData,
  ProjectTask,
};

const actor = 'admin' as const;

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
