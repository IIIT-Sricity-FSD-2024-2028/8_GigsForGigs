/**
 * @file authApi.ts
 * @description Real calls against the backend's /api/auth/* routes. No mock
 * fallback here — auth is the one vertical where a silent fallback to fake
 * success would be actively dangerous (it would let the UI "log in" a user
 * who was never authenticated by the server).
 */
import { apiFetch } from '../httpClient';

export type BackendRole = 'client' | 'gig_professional' | 'manager' | 'admin';

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: BackendRole;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export const authApi = {
  signup: (name: string, email: string, password: string, role: 'client' | 'gig_professional') =>
    apiFetch<AuthResponse>('/auth/signup', { method: 'POST', body: { name, email, password, role } }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),

  managerLogin: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/manager/login', { method: 'POST', body: { email, password } }),

  managerLogout: () =>
    apiFetch<{ success: boolean }>('/auth/manager/logout', { method: 'POST', actor: 'manager' }),
};

export default authApi;
