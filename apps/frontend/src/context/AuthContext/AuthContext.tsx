import React, { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { acceptAdminInvite as acceptAdminInviteThunk, acceptManagerInvite as acceptManagerInviteThunk, clearSession, login as loginThunk, logoutManager as logoutManagerThunk, refreshAdminSession, replaceToken, signup as signupThunk, updateUserSession as updateUserSessionAction, type AdminTier, type FrontendRole, type UserSession } from '../../store/auth/authSlice';
import { UNAUTHORIZED_EVENT, type ActorRole } from '../../services/api/httpClient';

export type { AdminTier, FrontendRole, UserSession };
export { TIER_PERMISSIONS } from '../../store/auth/authSlice';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  authError: string | null;
  signup: (name: string, email: string, password: string, role: 'CLIENT' | 'GIG_PROFESSIONAL') => Promise<boolean>;
  login: (email: string, password: string, totpCode?: string) => Promise<boolean>;
  twoFactorRequired: boolean;
  loginManager: (email: string, password: string) => Promise<boolean>;
  acceptManagerInvite: (token: string, password: string) => Promise<boolean>;
  acceptAdminInvite: (token: string, email: string, password: string, newPassword: string) => Promise<boolean>;
  logout: () => void;
  logoutManager: () => Promise<void>;
  updateUserSession: (patch: Partial<UserSession>) => void;
  updateToken: (token: string) => void;
  hasPermission: (permission: string) => boolean;
}

/** Compatibility hook while role pages migrate: all auth data and requests live in Redux. */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const adminProfileChecked = useAppSelector((state) => state.auth.adminProfileChecked);

  useEffect(() => {
    const handler = (event: Event) => {
      const actor = (event as CustomEvent<{ actor: ActorRole }>).detail?.actor;
      const activeActor = user?.role === 'CLIENT' ? 'client'
        : user?.role === 'MANAGER' ? 'manager'
          : user?.role === 'GIG_PROFESSIONAL' ? 'gig_professional'
            : user?.role === 'SUPER_ADMIN' ? 'admin' : null;
      if (!actor || actor === activeActor) dispatch(clearSession());
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && !adminProfileChecked && (!user.adminTier || !user.permissions || user.adminTier === 'AUDITOR')) {
      void dispatch(refreshAdminSession());
    }
  }, [dispatch, adminProfileChecked, user?.role, user?.adminTier, user?.permissions]);

  return <>{children}</>;
};

export function useAuth(): AuthContextType {
  const dispatch = useAppDispatch();
  const { user, loading, authError, twoFactorRequired } = useAppSelector((state) => state.auth);

  const signup = useCallback(async (name: string, email: string, password: string, role: 'CLIENT' | 'GIG_PROFESSIONAL') => {
    try { await dispatch(signupThunk({ name, email, password, role })).unwrap(); return true; }
    catch { return false; }
  }, [dispatch]);
  const login = useCallback(async (email: string, password: string, totpCode?: string) => {
    try { await dispatch(loginThunk({ email, password, ...(totpCode ? { totpCode } : {}) })).unwrap(); return true; }
    catch { return false; }
  }, [dispatch]);
  const loginManager = useCallback((email: string, password: string) => login(email, password), [login]);
  const acceptManagerInvite = useCallback(async (token: string, password: string) => {
    try { await dispatch(acceptManagerInviteThunk({ token, password })).unwrap(); return true; }
    catch { return false; }
  }, [dispatch]);
  const acceptAdminInvite = useCallback(async (token: string, email: string, password: string, newPassword: string) => {
    try { await dispatch(acceptAdminInviteThunk({ token, email, password, newPassword })).unwrap(); return true; }
    catch { return false; }
  }, [dispatch]);
  const logout = useCallback(() => { dispatch(clearSession()); }, [dispatch]);
  const logoutManager = useCallback(async () => { await dispatch(logoutManagerThunk()); }, [dispatch]);
  const updateSession = useCallback((patch: Partial<UserSession>) => { dispatch(updateUserSessionAction(patch)); }, [dispatch]);
  const updateToken = useCallback((token: string) => { dispatch(replaceToken(token)); }, [dispatch]);
  const hasPermission = useCallback((permission: string) => {
    if (user?.role !== 'SUPER_ADMIN') return false;
    const permissions = user.permissions ?? [];
    return permissions.includes('*') || permissions.includes(permission);
  }, [user]);

  return {
    user, isAuthenticated: !!user, role: user?.role ?? null, loading, authError, signup, login,
    twoFactorRequired, loginManager, acceptManagerInvite, acceptAdminInvite, logout, logoutManager,
    updateUserSession: updateSession, updateToken, hasPermission,
  };
}

export default AuthProvider;
