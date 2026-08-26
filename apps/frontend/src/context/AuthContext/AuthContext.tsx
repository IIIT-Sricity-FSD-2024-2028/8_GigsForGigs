import React, { createContext, useContext, useState, useEffect } from 'react';

export type AdminTier = 'OWNER' | 'SUPER_ADMIN' | 'FINANCIAL_ADMIN' | 'SUPPORT_ADMIN' | 'CONTENT_MODERATOR' | 'AUDITOR';

export interface UserSession {
  userId: string;
  role: 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN';
  name: string;
  email: string;
  adminTier?: AdminTier;
  permissions?: string[];
  appliedTaskIds: string[];
}

export interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, role: string) => Promise<void>;
  loginManager: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  logoutManager: () => void;
  updateUserSession: (patch: Partial<UserSession>) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContextInstance = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(role: string): 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN' {
  const upper = (role || '').toUpperCase().trim();
  if (upper.includes('ADMIN') || upper.includes('OWNER') || upper === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (upper.includes('MGR') || upper.includes('MANAGER')) return 'MANAGER';
  if (upper.includes('GIG') || upper.includes('FREELANCE') || upper === 'FREELANCER') return 'GIG_PROFESSIONAL';
  return 'CLIENT';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const login = async (email: string, role: string) => {
    const normalized = normalizeRole(role);
    let defaultName = 'Aditya Deshmukh';
    let defaultUserId = 'cli-01';
    let adminTier: AdminTier | undefined = undefined;
    let permissions: string[] = [];

    if (normalized === 'SUPER_ADMIN') {
      defaultName = 'Chaitanya Anand';
      defaultUserId = 'adm-01';
      adminTier = 'OWNER';
      permissions = ['*'];
    } else if (normalized === 'MANAGER') {
      defaultName = 'Leo Hudson';
      defaultUserId = 'mgr-01';
    } else if (normalized === 'GIG_PROFESSIONAL') {
      defaultName = 'Elena Rodriguez';
      defaultUserId = 'gig-01';
    }

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
    };
    setUser(newUser);
  };

  const loginManager = async (email: string, _pass: string): Promise<boolean> => {
    await login(email || 'aditya@techstart.io', 'MANAGER');
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const logoutManager = () => {
    setUser(null);
  };

  const updateUserSession = (patch: Partial<UserSession>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : null));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || user.role !== 'SUPER_ADMIN') return false;
    if (user.adminTier === 'OWNER') return true;
    if (user.adminTier === 'AUDITOR') return false; // Auditors have 0 mutation permissions
    if (user.permissions?.includes('*')) return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContextInstance.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading: false,
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
