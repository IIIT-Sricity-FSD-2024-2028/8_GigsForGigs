import React, { createContext, useContext, useState, useEffect } from 'react';
import { managerApi } from '../../services/api/manager/managerApi';

export type AdminTier = 'OWNER' | 'SUPER_ADMIN' | 'FINANCIAL_ADMIN' | 'SUPPORT_ADMIN' | 'CONTENT_MODERATOR' | 'AUDITOR';

export interface UserSession {
  userId: string;
  role: 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN';
  name: string;
  email: string;
  adminTier?: AdminTier;
  permissions?: string[];
  appliedTaskIds: string[];
  isNewAccount?: boolean;
}

export interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  signup: (name: string, email: string, password: string, role: 'CLIENT' | 'GIG_PROFESSIONAL') => Promise<boolean>;
  login: (email: string, password?: string, roleHint?: string, customName?: string) => Promise<boolean>;
  loginManager: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  logoutManager: () => Promise<void>;
  updateUserSession: (patch: Partial<UserSession>) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContextInstance = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(role: string): 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN' {
  const upper = (role || '').toUpperCase().trim();
  if (upper.includes('ADMIN') || upper.includes('OWNER') || upper === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (upper.includes('MGR') || upper.includes('MANAGER')) return 'MANAGER';
  if (upper.includes('GIG') || upper.includes('FREELANCE') || upper === 'FREELANCER' || upper === 'GIG_PROFESSIONAL') return 'GIG_PROFESSIONAL';
  return 'CLIENT';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('gfg_active_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.userId && parsed.role) {
            return {
              ...parsed,
              role: normalizeRole(parsed.role)
            };
          }
        }
      } catch (_) {}
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('gfg_active_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('gfg_active_user');
      }
    }
  }, [user]);

  const signup = async (name: string, email: string, _password: string, role: 'CLIENT' | 'GIG_PROFESSIONAL'): Promise<boolean> => {
    setLoading(true);
    const newUserId = 'new-user-' + Date.now();
    const newUserSession: UserSession = {
      userId: newUserId,
      role,
      name,
      email,
      appliedTaskIds: [],
      isNewAccount: true
    };
    setUser(newUserSession);
    setLoading(false);
    return true;
  };

  const login = async (email: string, _pass?: string, roleHint?: string, customName?: string): Promise<boolean> => {
    setLoading(true);
    const normalized = normalizeRole(roleHint || (email.includes('admin') ? 'SUPER_ADMIN' : email.includes('techstart') ? 'CLIENT' : 'GIG_PROFESSIONAL'));
    let defaultName = customName || (normalized === 'SUPER_ADMIN' ? 'Chaitanya Anand' : normalized === 'MANAGER' ? 'Leo Hudson' : normalized === 'CLIENT' ? 'Aditya Deshmukh' : 'Elena Rodriguez');
    let defaultUserId = normalized === 'SUPER_ADMIN' ? 'adm-01' : normalized === 'MANAGER' ? 'mgr-01' : normalized === 'CLIENT' ? 'cli-01' : 'gig-01';
    let adminTier: AdminTier | undefined = normalized === 'SUPER_ADMIN' ? 'OWNER' : undefined;
    let permissions: string[] = normalized === 'SUPER_ADMIN' ? ['*'] : [];

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: normalized })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.user) {
          const u = data.data.user;
          defaultUserId = u.userId;
          defaultName = u.name;
          adminTier = u.adminTier;
          permissions = u.permissions || [];
        }
      }
    } catch (_) {
      // Fallback gracefully
    }

    const newUser: UserSession = {
      userId: defaultUserId,
      role: normalized,
      name: defaultName,
      email: email || (normalized === 'SUPER_ADMIN' ? 'chaitanya.admin@gigsforgigs.internal' : `${normalized.toLowerCase()}@gigsforgigs.com`),
      adminTier,
      permissions,
      appliedTaskIds: [],
      isNewAccount: false
    };

    setUser(newUser);
    setLoading(false);
    return true;
  };

  const loginManager = async (email: string, pass?: string): Promise<boolean> => {
    setLoading(true);
    try {
      await managerApi.login(email, pass || 'password5');
    } catch (_) {}

    await login(email || 'aditya@techstart.io', pass, 'MANAGER');
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const logoutManager = async () => {
    setLoading(true);
    try {
      await managerApi.logout();
    } catch (_) {}
    setUser(null);
    setLoading(false);
  };

  const updateUserSession = (patch: Partial<UserSession>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : null));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || user.role !== 'SUPER_ADMIN') return false;
    if (user.adminTier === 'OWNER') return true;
    if (user.adminTier === 'AUDITOR') return false;
    if (user.permissions?.includes('*')) return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContextInstance.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
        loading,
        signup,
        login,
        loginManager,
        logout,
        logoutManager,
        updateUserSession,
        hasPermission
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
