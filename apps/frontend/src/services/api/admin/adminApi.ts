/**
 * @file adminApi.ts
 * @description
 * High-performance API client for the Super Admin vertical.
 * Communicates directly with Express backend REST endpoints (/api/admin/*)
 * using the centralized apiFetch wrapper.
 */

import { apiFetch } from '../httpClient';

const actor = 'admin' as const;

export const adminApi = {
  // KPIs & Analytics
  async getKPIs() {
    return apiFetch<any>('/admin/kpis', { actor });
  },

  async getAnalytics(timeRange: string = '30d') {
    return apiFetch<any>(`/admin/analytics?timeRange=${timeRange}`, { actor });
  },

  async getDashboard() {
    return apiFetch<any>('/admin/dashboard/stats', { actor });
  },

  // Master Directories
  async getUsers() {
    return apiFetch<any[]>('/admin/users', { actor });
  },

  async getClients() {
    return apiFetch<any[]>('/admin/clients', { actor });
  },

  async verifyClientKYC(clientId: string) {
    return apiFetch(`/admin/clients/${clientId}/kyc`, {
      method: 'PATCH',
      actor,
    });
  },

  async getGigPros() {
    return apiFetch<any[]>('/admin/gig-pros', { actor });
  },

  async updateGigProBadge(gigProId: string, badge: string) {
    return apiFetch(`/admin/gig-pros/${gigProId}/badge`, {
      method: 'PATCH',
      body: { badge },
      actor,
    });
  },

  async getManagers() {
    return apiFetch<any[]>('/admin/managers', { actor });
  },

  async getProjects() {
    return apiFetch<any[]>('/admin/projects', { actor });
  },

  async getTasks() {
    return apiFetch<any[]>('/admin/tasks', { actor });
  },

  async overrideProjectStatus(projectId: string, status: string) {
    return apiFetch(`/admin/projects/${projectId}/status`, {
      method: 'PATCH',
      body: { status: status.toLowerCase() },
      actor,
    });
  },

  async getPayments() {
    return apiFetch<any[]>('/admin/payments', { actor });
  },

  async getReviews() {
    return apiFetch<any[]>('/admin/reviews', { actor });
  },

  async getDisputes() {
    return apiFetch<any[]>('/admin/disputes', { actor });
  },

  async getAdminStaff() {
    return apiFetch<any[]>('/admin/admin-staff', { actor });
  },

  async getAuditLogs() {
    return apiFetch<any[]>('/admin/audit-logs', { actor });
  },

  async getPlatformSettings() {
    return apiFetch<any>('/admin/settings', { actor });
  },

  // Mutations
  async updateUserStatus(userId: string, status: string, reason: string) {
    return apiFetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: { status, reason },
      actor,
    });
  },

  async inviteAdmin(email: string, role: string, permissions: string[]) {
    return apiFetch<any>('/admin/invitations', {
      method: 'POST',
      body: { email, role, permissions },
      actor,
    });
  },

  async acceptAdminInvitation(token: string, email: string, password: string, newPassword?: string) {
    return apiFetch<any>('/admin/invitations/accept', {
      method: 'POST',
      body: { token, email, password, ...(newPassword ? { newPassword } : {}) },
      actor,
    });
  },

  /** Removes an admin account entirely; their token stops working on the next request. */
  async removeAdmin(staffId: string) {
    return apiFetch(`/admin/users/${staffId.replace(/\D/g, '')}`, { method: 'DELETE', actor });
  },

  async revokeAdminSession(staffId: string) {
    return apiFetch(`/admin/sessions/${staffId}/revoke`, {
      method: 'POST',
      actor,
    });
  },

  async settleDispute(disputeId: string, settlementType: string, resolutionNotes: string, splitClientPercent?: number) {
    return apiFetch(`/admin/disputes/${disputeId}/settle`, {
      method: 'POST',
      body: { settlementType, resolutionNotes, splitClientPercent },
      actor,
    });
  },

  async overrideEscrow(paymentId: string, action: 'RELEASE' | 'REFUND', auditReason: string) {
    return apiFetch(`/admin/payments/${paymentId}/override`, {
      method: 'PATCH',
      body: { action, auditReason },
      actor,
    });
  },

  async moderateReview(reviewId: string, status: string, moderatorNotes?: string) {
    return apiFetch(`/admin/reviews/${reviewId}/moderate`, {
      method: 'PATCH',
      body: { status, moderatorNotes },
      actor,
    });
  },

  async updatePlatformSettings(settings: any) {
    return apiFetch('/admin/settings', {
      method: 'PUT',
      body: settings,
      actor,
    });
  },

  async updateAdminPassword(currentPassword: string, newPassword: string) {
    return apiFetch('/admin/profile/password', {
      method: 'POST',
      body: { currentPassword, newPassword },
      actor,
    });
  },

  async toggleAdmin2FA(email: string, isEnabled: boolean) {
    return apiFetch('/admin/profile/2fa', {
      method: 'POST',
      body: { email, isEnabled },
      actor,
    });
  }
};

export default adminApi;
