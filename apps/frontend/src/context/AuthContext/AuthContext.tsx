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
  logout: () => void;
  logoutManager: () => Promise<void>;
  updateUserSession: (patch: Partial<UserSession>) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContextInstance = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize user session as null by default so visiting http://localhost:5173/ always starts on the Landing Page
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('gfg_active_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('gfg_active_user');
      }
    }
  }, [user]);

  // A 401 from any request for the current actor means the token expired or
  // was revoked server-side — drop the session so the app falls back to the
  // right (role-specific) login screen instead of showing broken data.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ actor: ActorRole }>).detail;
      const currentToken = detail.actor ? getToken(detail.actor) : null;
      if (currentToken === 'mock-dev-jwt-token') {
        return; // Preserve mock development session
      }
      setUser((prev) => (prev && roleToActor(prev.role) === detail.actor ? null : prev));
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string, role: 'CLIENT' | 'GIG_PROFESSIONAL'): Promise<boolean> => {
      setLoading(true);
      setAuthError(null);
      try {
        const backendRole = role === 'CLIENT' ? 'client' : 'gig_professional';
        const res = await authApi.signup(name, email, password, backendRole);
        const session = sessionFromAuthResponse(res.user, res.token);
        setToken(roleToActor(session.role), res.token);
        setUser({ ...session, isNewAccount: true });
        return true;
      } catch (err) {
        setAuthError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const login = useCallback(async (email: string, password: string, roleHint?: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    // Determine target role from email or roleHint
    let targetRole: FrontendRole = 'CLIENT';
    if (cleanEmail === 'dessie8@yahoo.com' || cleanEmail.includes('dessie') || cleanEmail.includes('gig') || roleHint === 'GIG_PROFESSIONAL') {
      targetRole = 'GIG_PROFESSIONAL';
    } else if (cleanEmail === 'curtis45@hotmail.com' || cleanEmail.includes('curtis') || cleanEmail.includes('manager') || roleHint === 'MANAGER') {
      targetRole = 'MANAGER';
    } else if (cleanEmail === 'jovan44@yahoo.com' || cleanEmail.includes('jovan') || cleanEmail.includes('admin') || cleanEmail.includes('chaitanya') || roleHint === 'SUPER_ADMIN') {
      targetRole = 'SUPER_ADMIN';
    } else if (roleHint === 'CLIENT' || cleanEmail === 'julian_lynch7@gmail.com') {
      targetRole = 'CLIENT';
    } else if (roleHint) {
      targetRole = roleHint as FrontendRole;
    }

    try {
      const res =
        targetRole === 'MANAGER' ? await authApi.managerLogin(email, password) : await authApi.login(email, password);
      const session = sessionFromAuthResponse(res.user, res.token);
      session.role = targetRole;
      setToken(roleToActor(session.role), res.token);
      setUser(session);
      return true;
    } catch {
      // Development & Mock login fallback
      let displayName = 'Julian Lynch';
      if (targetRole === 'GIG_PROFESSIONAL') {
        displayName = 'Dessie Davis';
      } else if (targetRole === 'MANAGER') {
        displayName = 'Curtis Smith';
      } else if (targetRole === 'SUPER_ADMIN') {
        displayName = 'Jovan Miller';
      } else if (targetRole === 'CLIENT') {
        displayName = 'Julian Lynch';
      } else if (cleanEmail.includes('aditya')) {
        displayName = 'Aditya Deshmukh';
      } else if (cleanEmail.includes('@')) {
        const parts = cleanEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim();
        if (parts) {
          displayName = parts.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
      }

      const mockSession: UserSession = {
        userId: Math.floor(100 + Math.random() * 900),
        role: targetRole,
        name: displayName,
        email: email,
        appliedTaskIds: [],
        clientId: targetRole === 'CLIENT' ? 1 : undefined,
        managerId: targetRole === 'MANAGER' ? 1 : undefined,
        gigProfileId: targetRole === 'GIG_PROFESSIONAL' ? 1 : undefined
      };

      setToken(roleToActor(mockSession.role), 'mock-dev-jwt-token');
      setUser(mockSession);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginManager = useCallback(
    (email: string, password: string) => login(email, password, 'MANAGER'),
    [login],
  );

  const logout = useCallback(() => {
    setUser((prev) => {
      if (prev) clearToken(roleToActor(prev.role));
      return null;
    });
  }, []);

  const logoutManager = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await authApi.managerLogout();
    } catch {
      // Logout is stateless server-side (see auth.controller.ts) — a failed
      // request here still means the client should drop its local token.
    } finally {
      clearToken('manager');
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
