import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  userId: string;
  role: 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN';
  name: string;
  email: string;
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
    // Default to unauthenticated so Login / Landing page is presented first
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

    if (normalized === 'SUPER_ADMIN') {
      defaultName = 'Chaitanya Anand';
      defaultUserId = 'adm-01';
    } else if (normalized === 'MANAGER') {
      defaultName = 'Leo Hudson';
      defaultUserId = 'mgr-01';
    } else if (normalized === 'GIG_PROFESSIONAL') {
      defaultName = 'Elena Rodriguez';
      defaultUserId = 'gig-01';
    }

    const newUser: UserSession = {
      userId: defaultUserId,
      role: normalized,
      name: defaultName,
      email: email || (normalized === 'SUPER_ADMIN' ? 'chaitanya.admin@gigsforgigs.internal' : `${normalized.toLowerCase()}@gigsforgigs.com`),
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
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...patch,
      };
    });
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
      }}
    >
      {children}
    </AuthContextInstance.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContextInstance);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Exporting default for folder index support
export default AuthProvider;
