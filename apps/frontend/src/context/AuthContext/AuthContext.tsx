import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../../services/api/auth/authApi';
import type { AuthUser } from '../../services/api/auth/authApi';
import { ApiError, getToken, setToken, clearToken, UNAUTHORIZED_EVENT, type ActorRole } from '../../services/api/httpClient';
import { decodeJwtPayload } from '../../utils/helpers/jwt';

export type FrontendRole = 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN';

export type AdminTier = 'OWNER' | 'SUPER_ADMIN' | 'FINANCIAL_ADMIN' | 'SUPPORT_ADMIN' | 'CONTENT_MODERATOR' | 'AUDITOR';

export interface UserSession {
  userId: number;
  role: FrontendRole;
  name: string;
  email: string;
  adminTier?: AdminTier;
  permissions?: string[];
  appliedTaskIds: string[];
  isNewAccount?: boolean;
  // Present only for the roles whose JWT payload carries them — see lib/jwt.ts on the backend.
  clientId?: number;
  managerId?: number;
  gigProfileId?: number;
}

interface TokenPayload {
  userId: number;
  role: 'client' | 'gig_professional' | 'manager' | 'admin';
  clientId?: number;
  managerId?: number;
  gigProfileId?: number;
}

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

export const TIER_PERMISSIONS: Record<AdminTier, string[]> = {
  OWNER: ['*'],
  SUPER_ADMIN: ['*'],
  FINANCIAL_ADMIN: ['users:read', 'payments:read', 'payments:release', 'payments:refund', 'projects:read'],
  SUPPORT_ADMIN: ['users:read', 'projects:read', 'disputes:resolve', 'reviews:moderate'],
  CONTENT_MODERATOR: ['reviews:moderate', 'users:read'],
  AUDITOR: ['users:read', 'payments:read', 'projects:read', 'audit:read']
};

function determineAdminTier(email: string): AdminTier {
  const clean = email.toLowerCase();
  if (clean.includes('auditor')) return 'AUDITOR';
  if (clean.includes('finance')) return 'FINANCIAL_ADMIN';
  if (clean.includes('support')) return 'SUPPORT_ADMIN';
  if (clean.includes('moderator') || clean.includes('mod')) return 'CONTENT_MODERATOR';
  return 'OWNER';
}

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
    ...(payload?.clientId !== undefined ? { clientId: payload.clientId } : {}),
    ...(payload?.managerId !== undefined ? { managerId: payload.managerId } : {}),
    ...(payload?.gigProfileId !== undefined ? { gigProfileId: payload.gigProfileId } : {}),
  };
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  authError: string | null;
  signup: (name: string, email: string, password: string, role: 'CLIENT' | 'GIG_PROFESSIONAL') => Promise<boolean>;
  login: (email: string, password: string, roleHint?: string) => Promise<boolean>;
  loginManager: (email: string, password: string) => Promise<boolean>;
  acceptManagerInvite: (token: string, password: string) => Promise<boolean>;
  logout: () => void;
  logoutManager: () => Promise<void>;
  updateUserSession: (patch: Partial<UserSession>) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContextInstance = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore active user session from sessionStorage so page refreshes retain the logged-in session,
  // while ensuring any invalid, missing, or expired token rejects access.
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('gfg_active_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email && parsed.role) {
            const actor = roleToActor(parsed.role);
            const token = getToken(actor);
            if (!token) {
              sessionStorage.removeItem('gfg_active_user');
              return null;
            }
            const payload = decodeJwtPayload<TokenPayload & { exp?: number }>(token);
            if (!payload || !payload.role) {
              sessionStorage.removeItem('gfg_active_user');
              clearToken(actor);
              return null;
            }
            // Check token expiration if present
            if (payload.exp && Date.now() / 1000 >= payload.exp) {
              sessionStorage.removeItem('gfg_active_user');
              clearToken(actor);
              return null;
            }
            // Ensure decoded role matches session role
            if (backendRoleToFrontend(payload.role) !== parsed.role) {
              sessionStorage.removeItem('gfg_active_user');
              clearToken(actor);
              return null;
            }
            return parsed;
          }
        } catch {
          sessionStorage.removeItem('gfg_active_user');
        }
      }
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        sessionStorage.setItem('gfg_active_user', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('gfg_active_user');
      }
    }
  }, [user]);

  // A 401 from any request for the current actor means the token expired or
  // was revoked server-side — drop the session so the app falls back to login.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ actor: ActorRole }>).detail;
      if (!detail?.actor || (user && roleToActor(user.role) === detail.actor)) {
        (['client', 'manager', 'gig_professional', 'admin'] as ActorRole[]).forEach(clearToken);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('gfg_active_user');
        }
        setUser(null);
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [user]);

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
        (['client', 'manager', 'gig_professional', 'admin'] as ActorRole[]).forEach(clearToken);
        setToken(roleToActor(session.role), res.token);
        setUser({ ...session, isNewAccount: true });
        return true;
      } catch (err) {
        setAuthError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Registration failed. Please try again.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const login = useCallback(async (email: string, password: string, _roleHint?: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);

    try {
      const res = await authApi.login(email.trim(), password);
      if (!res || !res.token || !res.user || !res.user.role) {
        throw new Error('Invalid authentication response from server.');
      }
      const session = sessionFromAuthResponse(res.user, res.token);
      // Clear tokens from prior sessions across all roles to prevent leakage
      (['client', 'manager', 'gig_professional', 'admin'] as ActorRole[]).forEach(clearToken);
      setToken(roleToActor(session.role), res.token);
      setUser(session);
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Authentication failed. Please verify your credentials.';
      setAuthError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginManager = useCallback(
    (email: string, password: string) => login(email, password),
    [login],
  );

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
    (['client', 'manager', 'gig_professional', 'admin'] as ActorRole[]).forEach(clearToken);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gfg_active_user');
    }
    setUser(null);
  }, []);

  const logoutManager = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await authApi.managerLogout();
    } catch {
      // Logout is stateless server-side
    } finally {
      (['client', 'manager', 'gig_professional', 'admin'] as ActorRole[]).forEach(clearToken);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('gfg_active_user');
      }
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

export const useAuth = () => {
  const context = useContext(AuthContextInstance);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
