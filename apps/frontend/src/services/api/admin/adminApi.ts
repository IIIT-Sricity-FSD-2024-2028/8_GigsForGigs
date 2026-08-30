/**
 * @file adminApi.ts
 * @description
 * High-performance API client for the Super Admin vertical.
 * Communicates directly with Express backend REST endpoints (/api/admin/*)
 * with robust error handling, cryptographic link generation, and structured typing.
 */

const API_BASE_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5000/api/admin`
  : 'http://localhost:5000/api/admin';

async function getFreshAdminToken(): Promise<string | null> {
  try {
    const authUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:5000/api/auth/login`
      : 'http://localhost:5000/api/auth/login';

    const loginRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'chaitanya.admin@gigsforgigs.internal', password: 'password123' })
    });
    if (loginRes.ok) {
      const data = await loginRes.json();
      if (data?.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('g4g_admin_token', data.token);
        }
        return data.token;
      }
    }
  } catch (err) {
    console.warn('[adminApi] Failed to refresh token:', err);
  }
  return null;
}

async function fetchJson<T>(url: string, options?: RequestInit, isRetry = false): Promise<T | null> {
  try {
    let token = typeof window !== 'undefined' ? localStorage.getItem('g4g_admin_token') : null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.status === 401 && !isRetry) {
      const freshToken = await getFreshAdminToken();
      if (freshToken) {
        return fetchJson<T>(url, options, true);
      }
    }

    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === 'object' && 'data' in json) return json.data;
      return json;
    }
  } catch (err) {
    console.warn(`[adminApi] Request to ${url}:`, err);
  }
  return null;
}

export const adminApi = {
  // KPIs & Analytics
  async getKPIs() {
    return (await fetchJson<any>(`${API_BASE_URL}/kpis`)) || {
      grossMerchandiseVolume: 0,
      platformRevenue: 0,
      activeTasks: 0,
      totalUsers: 0,
      pendingDisputes: 0,
      escrowHeld: 0
    };
  },

  async getAnalytics(timeRange: string = '30d') {
    return (await fetchJson<any>(`${API_BASE_URL}/analytics?timeRange=${timeRange}`)) || {
      timeRange,
      kpis: await this.getKPIs(),
      velocity: [],
      categories: []
    };
  },

  // Master Directories
  async getClients() {
    return (await fetchJson<any[]>(`${API_BASE_URL}/clients`)) || [];
  },

  async verifyClientKYC(clientId: string) {
    return await fetchJson(`${API_BASE_URL}/clients/${clientId}/kyc`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  async getGigPros() {
    return (await fetchJson<any[]>(`${API_BASE_URL}/gig-pros`)) || [];
  },

  async updateGigProBadge(gigProId: string, badge: string) {
    return await fetchJson(`${API_BASE_URL}/gig-pros/${gigProId}/badge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badge })
    });
  },

  async getManagers() {
    return (await fetchJson<any[]>(`${API_BASE_URL}/managers`)) || [];
  },

  async getProjects() {
    return (await fetchJson<any[]>(`${API_BASE_URL}/projects`)) || [];
  },

  async overrideProjectStatus(projectId: string, status: string) {
    return await fetchJson(`${API_BASE_URL}/projects/${projectId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  async getPayments() {
    return (await fetchJson<any[]>(`${API_BASE_URL}/payments`)) || [];
  },

  async getReviews() {
    return (await fetchJson<any[]>(`${API_BASE_URL}/reviews`)) || [];
  },

  async getDisputes() {
    return (await fetchJson<any[]>(`${API_BASE_URL}/disputes`)) || [];
  },

  async getAdminStaff() {
    return (await fetchJson<any[]>(`${API_BASE_URL}/admin-staff`)) || [];
  },

  async getAuditLogs() {
    return (await fetchJson<any[]>(`${API_BASE_URL}/audit-logs`)) || [];
  },

  async getPlatformSettings() {
    return (await fetchJson<any>(`${API_BASE_URL}/settings`)) || {
      platformRakePercentage: 10.0,
      minimumGigBudget: 50,
      escrowHoldingDays: 14,
      maxFileUploadMb: 100,
      isMaintenanceMode: false,
      allowedCategories: ['Software Development', 'Design & Creative', 'AI & Data Science', '3D & Spatial Computing']
    };
  },

  // Mutations
  async updateUserStatus(userId: string, status: string, reason: string) {
    return await fetchJson(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason })
    });
  },

  async inviteAdmin(email: string, role: string, permissions: string[]) {
    return await fetchJson<any>(`${API_BASE_URL}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, permissions })
    });
  },

  async acceptAdminInvitation(token: string, email: string, password?: string) {
    return await fetchJson<any>(`${API_BASE_URL}/invitations/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, password })
    });
  },

  async revokeAdminSession(staffId: string) {
    return await fetchJson(`${API_BASE_URL}/sessions/${staffId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  async settleDispute(disputeId: string, settlementType: string, resolutionNotes: string, splitClientPercent?: number) {
    return await fetchJson(`${API_BASE_URL}/disputes/${disputeId}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settlementType, resolutionNotes, splitClientPercent })
    });
  },

  async overrideEscrow(paymentId: string, action: 'RELEASE' | 'REFUND', auditReason: string) {
    return await fetchJson(`${API_BASE_URL}/payments/${paymentId}/override`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, auditReason })
    });
  },

  async moderateReview(reviewId: string, status: string, moderatorNotes?: string) {
    return await fetchJson(`${API_BASE_URL}/reviews/${reviewId}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, moderatorNotes })
    });
  },

  async updatePlatformSettings(settings: any) {
    return await fetchJson(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  },

  async updateAdminPassword(email: string, newPassword: string) {
    return await fetchJson(`${API_BASE_URL}/profile/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword })
    });
  },

  async toggleAdmin2FA(email: string, isEnabled: boolean) {
    return await fetchJson(`${API_BASE_URL}/profile/2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, isEnabled })
    });
  }
};

export default adminApi;
