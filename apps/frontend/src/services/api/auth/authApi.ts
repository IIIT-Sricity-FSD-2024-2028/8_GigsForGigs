/**
 * @file authApi.ts
 * @description Real calls against the backend's /api/auth/* routes. No mock
 * fallback here — auth is the one vertical where a silent fallback to fake
 * success would be actively dangerous (it would let the UI "log in" a user
 * who was never authenticated by the server).
 */
import { apiFetch } from '../httpClient';

/** Role names as the backend spells them. */
export type BackendRole = 'client' | 'gig_professional' | 'manager' | 'admin';

/** The user object returned by login/signup. */
export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: BackendRole;
}

/** Response of login/signup/accept-invite: the user plus their JWT. */
export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export const authApi = {
  /** Create a client or gig-professional account. */
  signup: (name: string, email: string, password: string, role: 'client' | 'gig_professional') =>
    apiFetch<AuthResponse>('/auth/signup', { method: 'POST', body: { name, email, password, role } }),

  /** Log in any role with email + password. */
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),

  /** Manager-specific login endpoint (AuthContext uses the shared `login` instead). */
  managerLogin: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/manager/login', { method: 'POST', body: { email, password } }),

  /** Look up who a manager invite token belongs to (shown on the setup page). */
  getManagerInvite: (token: string) =>
    apiFetch<{ name: string; email: string; clientName: string }>(`/auth/manager/invite?token=${encodeURIComponent(token)}`),

  /** Set the invited manager's password; returns a logged-in session. */
  acceptManagerInvite: (token: string, password: string) =>
    apiFetch<AuthResponse>('/auth/manager/accept-invite', { method: 'POST', body: { token, password } }),

  /** Notify the backend a manager logged out (sessions are stateless JWTs). */
  managerLogout: () =>
    apiFetch<{ success: boolean }>('/auth/manager/logout', { method: 'POST', actor: 'manager' }),
};

export default authApi;
