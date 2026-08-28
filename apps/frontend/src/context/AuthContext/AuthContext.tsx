import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../../services/api/auth/authApi';
import type { AuthUser } from '../../services/api/auth/authApi';
import { ApiError, setToken, clearToken, UNAUTHORIZED_EVENT, type ActorRole } from '../../services/api/httpClient';
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

function sessionFromAuthResponse(user: AuthUser, token: string): UserSession {
  const payload = decodeJwtPayload<TokenPayload>(token);
  const role = backendRoleToFrontend(payload?.role ?? user.role);
  return {
    userId: user.userId,
    role,
    name: user.name,
    email: user.email,
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

  // Initial user state is null so http://localhost:5173/ always loads the Landing Page first!
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
    try {
      const res =
        roleHint === 'MANAGER' ? await authApi.managerLogin(email, password) : await authApi.login(email, password);
      const session = sessionFromAuthResponse(res.user, res.token);
      setToken(roleToActor(session.role), res.token);
      setUser(session);
      return true;
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Invalid login credentials or server error.');
      return false;
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
