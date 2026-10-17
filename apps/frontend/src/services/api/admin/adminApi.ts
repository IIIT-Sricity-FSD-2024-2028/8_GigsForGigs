/**
 * @file adminApi.ts
 * @description
 * High-performance API client for the Super Admin vertical.
 * Communicates directly with Express backend REST endpoints (/api/admin/*)
 * using the centralized apiFetch wrapper.
 */

import { apiFetch } from '../httpClient';

// Every call here is made with the admin's JWT. Responses are untyped (`any`) for now.
const actor = 'admin' as const;

export const adminApi = {
  // KPIs & Analytics
  /** GET headline platform KPIs. */
  async getKPIs() {
    return apiFetch<any>('/admin/kpis', { actor });
  },

  /** GET trend data for a range like "7d" / "30d". */

  async getAnalytics(timeRange: string = '30d') {
    return apiFetch<any>(`/admin/analytics?timeRange=${timeRange}`, { actor });
  },

  /** GET dashboard stats. */

  async getDashboard() {
    return apiFetch<any>('/admin/dashboard/stats', { actor });
  },

  // Master Directories
  /** GET every user. */
  async getUsers() {
    return apiFetch<any[]>('/admin/users', { actor });
  },

  /** GET client organisations. */

  async getClients() {
    return apiFetch<any[]>('/admin/clients', { actor });
  },

  /** Mark a client's KYC as verified. */

  async verifyClientKYC(clientId: string) {
    return apiFetch(`/admin/clients/${clientId}/kyc`, {
      method: 'PATCH',
      actor,
    });
  },

  /** GET gig professionals. */

  async getGigPros() {
    return apiFetch<any[]>('/admin/gig-pros', { actor });
  },

  /** Set a gig pro's badge. */

  async updateGigProBadge(gigProId: string, badge: string) {
    return apiFetch(`/admin/gig-pros/${gigProId}/badge`, {
      method: 'PATCH',
      body: { badge },
      actor,
    });
  },

  /** GET managers. */

  async getManagers() {
    return apiFetch<any[]>('/admin/managers', { actor });
  },

  /** GET projects. */

  async getProjects() {
    return apiFetch<any[]>('/admin/projects', { actor });
  },

  /** GET tasks. */

  async getTasks() {
    return apiFetch<any[]>('/admin/tasks', { actor });
  },

  /** Force a project/task into a status (sent lowercase). */

  async overrideProjectStatus(projectId: string, status: string) {
    return apiFetch(`/admin/projects/${projectId}/status`, {
      method: 'PATCH',
      body: { status: status.toLowerCase() },
      actor,
    });
  },

  /** GET payments ledger. */

  async getPayments() {
    return apiFetch<any[]>('/admin/payments', { actor });
  },

  /** GET reviews for moderation. */

  async getReviews() {
    return apiFetch<any[]>('/admin/reviews', { actor });
  },

  /** GET disputes. */

  async getDisputes() {
    return apiFetch<any[]>('/admin/disputes', { actor });
  },

  /** GET admin accounts. */

  async getAdminStaff() {
    return apiFetch<any[]>('/admin/admin-staff', { actor });
  },

  /** GET audit log entries. */

  async getAuditLogs() {
    return apiFetch<any[]>('/admin/audit-logs', { actor });
  },

  /** GET platform settings. */

  async getPlatformSettings() {
    return apiFetch<any>('/admin/settings', { actor });
  },

  // Mutations
  /** Suspend/activate a user, with a reason for the audit log. */
  async updateUserStatus(userId: string, status: string, reason: string) {
    return apiFetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: { status, reason },
      actor,
    });
  },

  /** Invite a new admin with a role and permissions. */

  async inviteAdmin(email: string, role: string, permissions: string[]) {
    return apiFetch<any>('/admin/invitations', {
      method: 'POST',
      body: { email, role, permissions },
      actor,
    });
  },

  /** Activate an admin invite (optionally setting a new password). */

  async acceptAdminInvitation(token: string, email: string, password: string, newPassword?: string) {
    return apiFetch<any>('/admin/invitations/accept', {
      method: 'POST',
      body: { token, email, password, ...(newPassword ? { newPassword } : {}) },
      actor,
    });
  },

  /** Removes an admin account entirely; their token stops working on the next request. */
  async removeAdmin(staffId: string) {
    // staffId may look like "ADM-12"; the API wants just the digits.
    return apiFetch(`/admin/users/${staffId.replace(/\D/g, '')}`, { method: 'DELETE', actor });
  },

  /** Force-logout an admin. */

  async revokeAdminSession(staffId: string) {
    return apiFetch(`/admin/sessions/${staffId}/revoke`, {
      method: 'POST',
      actor,
    });
  },

  /** Resolve a dispute (optionally splitting funds by percentage). */

  async settleDispute(disputeId: string, settlementType: string, resolutionNotes: string, splitClientPercent?: number) {
    return apiFetch(`/admin/disputes/${disputeId}/settle`, {
      method: 'POST',
      body: { settlementType, resolutionNotes, splitClientPercent },
      actor,
    });
  },

  /** Manually release or refund an escrow payment. */

  async overrideEscrow(paymentId: string, action: 'RELEASE' | 'REFUND', auditReason: string) {
    return apiFetch(`/admin/payments/${paymentId}/override`, {
      method: 'PATCH',
      body: { action, auditReason },
      actor,
    });
  },

  /** Approve/hide a review. */

  async moderateReview(reviewId: string, status: string, moderatorNotes?: string) {
    return apiFetch(`/admin/reviews/${reviewId}/moderate`, {
      method: 'PATCH',
      body: { status, moderatorNotes },
      actor,
    });
  },

  /** PUT platform settings. */

  async updatePlatformSettings(settings: any) {
    return apiFetch('/admin/settings', {
      method: 'PUT',
      body: settings,
      actor,
    });
  },

  /** Change the logged-in admin's password. */

  async updateAdminPassword(currentPassword: string, newPassword: string) {
    return apiFetch('/admin/profile/password', {
      method: 'POST',
      body: { currentPassword, newPassword },
      actor,
    });
  },

  /** Turn 2FA on/off. */

  async toggleAdmin2FA(email: string, isEnabled: boolean) {
    return apiFetch('/admin/profile/2fa', {
      method: 'POST',
      body: { email, isEnabled },
      actor,
    });
  }
};

export default adminApi;
