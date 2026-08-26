import {
  mockKPIs,
  mockRevenueVelocity,
  mockPlatformConfig,
  mockAuditLogs,
  type PlatformKPIs,
  type PlatformConfig,
  type AuditLogEntry
} from '../../../mock/adminMockData';

/**
 * @file adminApi.ts
 * @description
 * High-level API client for the Super Admin frontend vertical.
 * Connects to Express backend endpoints (/api/admin) with graceful fallback to mock data.
 */

const API_BASE_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5000/api/admin`
  : 'http://localhost:5000/api/admin';

export const adminApi = {
  async getKPIs(): Promise<PlatformKPIs> {
    try {
      const res = await fetch(`${API_BASE_URL}/kpis`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (_) {}
    return mockKPIs;
  },

  async getAnalytics(timeRange: string = '30d') {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics?timeRange=${timeRange}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (_) {}
    return {
      timeRange,
      kpis: mockKPIs,
      velocity: mockRevenueVelocity
    };
  },

  async updateUserStatus(userId: string, status: string, reason: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return { success: true, userId, newStatus: status };
  },

  async inviteAdmin(email: string, role: string, permissions: string[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, permissions })
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      success: true,
      token: 'mock-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
    };
  },

  async settleDispute(disputeId: string, settlementType: string, resolutionNotes: string, splitClientPercent?: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/disputes/${disputeId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementType, resolutionNotes, splitClientPercent })
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return { success: true, disputeId, settlementType, status: 'RESOLVED' };
  },

  async overrideEscrow(paymentId: string, action: 'RELEASE' | 'REFUND', auditReason: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/${paymentId}/override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, auditReason })
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return { success: true, paymentId, action, status: action === 'RELEASE' ? 'RELEASED' : 'REFUNDED' };
  },

  async getPlatformSettings(): Promise<PlatformConfig> {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (_) {}
    return mockPlatformConfig;
  },

  async updatePlatformSettings(settings: PlatformConfig) {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return { success: true, settings };
  },

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/audit-logs`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (_) {}
    return mockAuditLogs;
  }
};

export default adminApi;
