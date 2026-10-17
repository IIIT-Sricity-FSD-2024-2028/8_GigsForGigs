/**
 * @file AuthContext.tsx
 * @description Who is logged in, and how to log in / sign up / log out.
 *
 * - The JWT for each role is stored by httpClient (sessionStorage, one key per role).
 * - The decoded user ("session") is also kept in sessionStorage so a page refresh
 *   keeps you logged in. On load it is only trusted if a matching, unexpired token exists.
 * - Any 401 from the API fires UNAUTHORIZED_EVENT, which logs the user out here.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../../services/api/auth/authApi';
import type { AuthUser } from '../../services/api/auth/authApi';
import { ApiError, getToken, setToken, clearToken, UNAUTHORIZED_EVENT, ALL_ACTORS, type ActorRole } from '../../services/api/httpClient';
import { decodeJwtPayload } from '../../utils/helpers/jwt';

/** Role names used throughout the UI (the backend uses lowercase names, see ActorRole). */
export type FrontendRole = 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN';

/** Sub-levels of admin; each tier unlocks a different permission set (see TIER_PERMISSIONS). */
export type AdminTier = 'OWNER' | 'SUPER_ADMIN' | 'FINANCIAL_ADMIN' | 'SUPPORT_ADMIN' | 'CONTENT_MODERATOR' | 'AUDITOR';

/** The logged-in user as the frontend sees it. */
export interface UserSession {
  userId: number;
  role: FrontendRole;
  name: string;
  email: string;
  adminTier?: AdminTier;
  permissions?: string[];
  appliedTaskIds: string[];
  /** True right after signup/invite activation — pages use it to show onboarding. */
  isNewAccount?: boolean;
  // Present only for the roles whose JWT payload carries them — see lib/jwt.ts on the backend.
  clientId?: number;
  managerId?: number;
  gigProfileId?: number;
}

/** Claims we read from the backend's JWT. */
interface TokenPayload {
  userId: number;
  role: 'client' | 'gig_professional' | 'manager' | 'admin';
  clientId?: number;
  managerId?: number;
  gigProfileId?: number;
}

/** sessionStorage key for the saved UserSession. */
const ACTIVE_USER_KEY = 'gfg_active_user';

/** Frontend role -> which token slot in httpClient it uses. */
function roleToActor(role: FrontendRole): ActorRole {
  switch (role) {
    case 'CLIENT':
      return 'client';
    case 'MANAGER':
      return 'manager';
    case 'GIG_PROFESSIONAL':
      return 'gig_professional';
    case 'SUPER_ADMIN':
      return 'admin';
  }
}

/** Backend role name -> frontend role name. */
function backendRoleToFrontend(role: TokenPayload['role']): FrontendRole {
  switch (role) {
    case 'client':
      return 'CLIENT';
    case 'gig_professional':
      return 'GIG_PROFESSIONAL';
    case 'manager':
      return 'MANAGER';
    case 'admin':
      return 'SUPER_ADMIN';
  }
}

/** What each admin tier may do. '*' means everything. */
export const TIER_PERMISSIONS: Record<AdminTier, string[]> = {
  OWNER: ['*'],
  SUPER_ADMIN: ['*'],
  FINANCIAL_ADMIN: ['users:read', 'payments:read', 'payments:release', 'payments:refund', 'projects:read'],
  SUPPORT_ADMIN: ['users:read', 'projects:read', 'disputes:resolve', 'reviews:moderate'],
  CONTENT_MODERATOR: ['reviews:moderate', 'users:read'],
  AUDITOR: ['users:read', 'payments:read', 'projects:read', 'audit:read']
};

/** Guess an admin's tier from keywords in their email (e.g. finance@... -> FINANCIAL_ADMIN). */
function determineAdminTier(email: string): AdminTier {
  const clean = email.toLowerCase();
  if (clean.includes('auditor')) return 'AUDITOR';
  if (clean.includes('finance')) return 'FINANCIAL_ADMIN';
  if (clean.includes('support')) return 'SUPPORT_ADMIN';
  if (clean.includes('moderator') || clean.includes('mod')) return 'CONTENT_MODERATOR';
  return 'OWNER';
}

/** Build a UserSession from a login/signup response, reading role ids from the JWT. */
function sessionFromAuthResponse(user: AuthUser, token: string): UserSession {
  const payload = decodeJwtPayload<TokenPayload>(token);
  const role = backendRoleToFrontend(payload?.role ?? user.role);
  const adminTier = role === 'SUPER_ADMIN' ? determineAdminTier(user.email) : undefined;
  const permissions = adminTier ? TIER_PERMISSIONS[adminTier] : undefined;

  return {
    userId: user.userId,
    role,
    name: user.name,
    email: user.email,
    adminTier,
    permissions,
    appliedTaskIds: [],
    // Only copy the ids that are actually in the token.
    ...(payload?.clientId !== undefined ? { clientId: payload.clientId } : {}),
    ...(payload?.managerId !== undefined ? { managerId: payload.managerId } : {}),
    ...(payload?.gigProfileId !== undefined ? { gigProfileId: payload.gigProfileId } : {}),
  };
}

/**
 * Restore the saved session after a page refresh.
 * Returns null (and cleans up) unless there is a valid, unexpired token whose role matches.
 */
function restoreSession(): UserSession | null {
  const saved = sessionStorage.getItem(ACTIVE_USER_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    if (!parsed?.email || !parsed.role) return null;

    const actor = roleToActor(parsed.role);
    const token = getToken(actor);
    if (!token) {
      sessionStorage.removeItem(ACTIVE_USER_KEY);
      return null;
    }

    const payload = decodeJwtPayload<TokenPayload & { exp?: number }>(token);
    const isExpired = !!payload?.exp && Date.now() / 1000 >= payload.exp;
    const isValid = !!payload?.role && !isExpired && backendRoleToFrontend(payload.role) === parsed.role;
    if (!isValid) {
      sessionStorage.removeItem(ACTIVE_USER_KEY);
      clearToken(actor);
      return null;
    }
    return parsed;
  } catch {
    // Corrupt JSON in storage.
    sessionStorage.removeItem(ACTIVE_USER_KEY);
    return null;
  }
}

/** Remove every role's token and the saved session. */
function clearStoredSession() {
  ALL_ACTORS.forEach(clearToken);
  sessionStorage.removeItem(ACTIVE_USER_KEY);
}

/** Pull a readable message out of an unknown thrown value. */
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  role: string | null;
  /** True while a login/signup/logout request is in flight. */
  loading: boolean;
  /** Last login/signup error message, shown by the auth forms. */
  authError: string | null;
  signup: (name: string, email: string, password: string, role: 'CLIENT' | 'GIG_PROFESSIONAL') => Promise<boolean>;
  login: (email: string, password: string, roleHint?: string) => Promise<boolean>;
  loginManager: (email: string, password: string) => Promise<boolean>;
  acceptManagerInvite: (token: string, password: string) => Promise<boolean>;
  logout: () => void;
  logoutManager: () => Promise<void>;
  /** Merge fields into the current session (e.g. after editing your profile name). */
  updateUserSession: (patch: Partial<UserSession>) => void;
  /** Admin-only permission check; always false for non-admins. */
  hasPermission: (permission: string) => boolean;
}

const AuthContextInstance = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(restoreSession);

  // Keep sessionStorage in sync with the current user.
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(ACTIVE_USER_KEY);
    }
  }, [user]);

  // A 401 from any request for the current actor means the token expired or
  // was revoked server-side — drop the session so the app falls back to login.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ actor: ActorRole }>).detail;
      if (!detail?.actor || (user && roleToActor(user.role) === detail.actor)) {
        clearStoredSession();
        setUser(null);
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [user]);

  /** Create a client or gig-pro account and log straight into it. Returns true on success. */
  const signup = useCallback(
    async (name: string, email: string, password: string, role: 'CLIENT' | 'GIG_PROFESSIONAL'): Promise<boolean> => {
      setLoading(true);
      setAuthError(null);
      try {
        const backendRole = role === 'CLIENT' ? 'client' : 'gig_professional';
        const res = await authApi.signup(name, email, password, backendRole);
        if (!res?.token || !res?.user?.role) {
          throw new Error('Invalid signup response from server.');
        }
        const session = sessionFromAuthResponse(res.user, res.token);
        ALL_ACTORS.forEach(clearToken);
        setToken(roleToActor(session.role), res.token);
        setUser({ ...session, isNewAccount: true });
        return true;
      } catch (err) {
        setAuthError(errorMessage(err, 'Registration failed. Please try again.'));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /** Log in with email + password (any role; the backend decides which). Returns true on success. */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);

    try {
      const res = await authApi.login(email.trim(), password);
      if (!res || !res.token || !res.user || !res.user.role) {
        throw new Error('Invalid authentication response from server.');
      }
      const session = sessionFromAuthResponse(res.user, res.token);
      // Clear tokens from prior sessions across all roles to prevent leakage
      ALL_ACTORS.forEach(clearToken);
      setToken(roleToActor(session.role), res.token);
      setUser(session);
      return true;
    } catch (err) {
      setAuthError(errorMessage(err, 'Authentication failed. Please verify your credentials.'));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Managers use the same login endpoint as everyone else.
  const loginManager = useCallback(
    (email: string, password: string) => login(email, password),
    [login],
  );

  /** Set a password for an invited manager and log them in. */
  const acceptManagerInvite = useCallback(async (token: string, password: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await authApi.acceptManagerInvite(token, password);
      const session = sessionFromAuthResponse(res.user, res.token);
      setToken('manager', res.token);
      setUser({ ...session, isNewAccount: true });
      return true;
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Could not activate your manager account.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
  }, []);

  /** Tell the backend the manager is logging out, then clear the session either way. */
  const logoutManager = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await authApi.managerLogout();
    } catch {
      // Logout is stateless server-side
    } finally {
      clearStoredSession();
      setUser(null);
      setLoading(false);
    }
  }, []);

  const updateUserSession = useCallback((patch: Partial<UserSession>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  // Granular Multi-Tier Admin RBAC evaluation
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role !== 'SUPER_ADMIN') return false;

      const userPermissions = user.permissions || (user.adminTier ? TIER_PERMISSIONS[user.adminTier] : ['*']);

      if (userPermissions.includes('*')) return true;
      return userPermissions.includes(permission);
    },
    [user],
  );

  return (
    <AuthContextInstance.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
        loading,
        authError,
        signup,
        login,
        loginManager,
        acceptManagerInvite,
        logout,
        logoutManager,
        updateUserSession,
        hasPermission,
      }}
    >
      {children}
    </AuthContextInstance.Provider>
  );
};

/** Access the auth state. Must be called inside <AuthProvider>. */
export const useAuth = () => {
  const context = useContext(AuthContextInstance);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
