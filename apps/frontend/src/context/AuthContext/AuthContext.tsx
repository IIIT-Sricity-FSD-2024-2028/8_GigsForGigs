import React, { createContext, useContext, useState, useEffect } from 'react';
import React, { createContext, useContext, useState } from 'react';
import { managerApi } from '../../services/api/manager/managerApi';

export interface UserSession {
  userId: string;
  role: 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN';
  name: string;
  email: string;
  appliedTaskIds: string[];
}

export interface MockUserRecord {
  user_id: string;
  name: string;
  email: string;
  password?: string;
  role: 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN';
}

export const MOCK_USERS_DB: MockUserRecord[] = [
  { user_id: 'u0', name: 'Alex Rivera', email: 'admin@gigsforge.com', password: 'admin123', role: 'SUPER_ADMIN' },
  { user_id: 'u1', name: 'Aditya Deshmukh', email: 'aditya@techstart.io', password: 'password1', role: 'CLIENT' },
  { user_id: 'u6', name: 'Priya Sharma', email: 'priya@designco.in', password: 'password2', role: 'CLIENT' },
  { user_id: 'u2', name: 'Leo Hudson', email: 'leo@techstart.io', password: 'password5', role: 'MANAGER' },
  { user_id: 'u10', name: 'Casey Smith', email: 'casey@mgmt.com', password: 'pass', role: 'MANAGER' },
  { user_id: 'u3', name: 'Arham Kansal', email: 'arham@dev.com', password: 'password3', role: 'GIG_PROFESSIONAL' },
  { user_id: 'u4', name: 'Elena Torres', email: 'elena@code.dev', password: 'password4', role: 'GIG_PROFESSIONAL' }
];

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  login: (email: string, role: string, name?: string) => Promise<void>;
  login: (email: string, password?: string, roleHint?: string) => Promise<boolean>;
  loginManager: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  logoutManager: () => Promise<void>;
  updateUserSession: (patch: Partial<UserSession>) => void;
}

const AuthContextInstance = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(role: string): 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN' {
  const upper = (role || '').toUpperCase();
  if (upper === 'GIG' || upper === 'FREELANCER' || upper === 'GIG_PROFESSIONAL') return 'GIG_PROFESSIONAL';
  if (upper === 'SUPER_ADMIN' || upper === 'ADMIN') return 'SUPER_ADMIN';
  if (upper === 'MANAGER') return 'MANAGER';
  return 'CLIENT';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.__GFG_SESSION__?.userId) {
        return {
          ...win.__GFG_SESSION__,
          role: normalizeRole(win.__GFG_SESSION__.role),
        };
      }
      if (win.name) {
        try {
          const parsed = JSON.parse(win.name);
          if (parsed && parsed.userId) {
            return {
              userId: parsed.userId,
              role: normalizeRole(parsed.role),
              name: parsed.name || 'Aditya',
              email: parsed.email || 'aditya@gigsforgigs.com',
              appliedTaskIds: Array.isArray(parsed.appliedTaskIds) ? parsed.appliedTaskIds : [],
            };
          }
        } catch (_) {}
      }
    }
  
  // Initial user state is null so http://localhost:5173/ always loads the Landing Page first!
  const [user, setUser] = useState<UserSession | null>(null);

  const login = async (email: string, _pass?: string, roleHint?: string): Promise<boolean> => {
    setLoading(true);
    const found = MOCK_USERS_DB.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Default session: Active Client user
    return {
      userId: 'cli-01',
      role: 'CLIENT',
      name: 'Aditya',
      email: 'aditya@gigsforgigs.com',
      appliedTaskIds: [],
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (user) {
        win.__GFG_SESSION__ = user;
        win.name = JSON.stringify(user);
      } else {
        win.__GFG_SESSION__ = null;
        win.name = '';
      }
    if (found) {
      setUser({
        userId: found.user_id,
        role: found.role,
        name: found.name,
        email: found.email,
        appliedTaskIds: []
      });
      setLoading(false);
      return true;
    }
  }, [user]);

  const login = async (email: string, role: string, customName?: string) => {
    setLoading(true);
    const normRole = normalizeRole(role);
    const defaultName = customName || (normRole === 'CLIENT' ? 'Aditya' : normRole === 'MANAGER' ? 'Leo Hudson' : 'Elena Rodriguez');
    const defaultUserId = normRole === 'CLIENT' ? 'cli-01' : normRole === 'MANAGER' ? 'mgr-01' : 'gig-01';
    
    const newUser: UserSession = {
      userId: defaultUserId,
    // Fallback user creation if email not in mock list
    const normRole = normalizeRole(roleHint || 'CLIENT');
    const fallbackName = normRole === 'CLIENT' ? 'Aditya Deshmukh' : normRole === 'MANAGER' ? 'Leo Hudson' : 'Arham Kansal';
    setUser({
      userId: 'u-' + Date.now(),
      role: normRole,
      name: defaultName,
      name: fallbackName,
      email: email,
      appliedTaskIds: [],
    };
    setUser(newUser);
      appliedTaskIds: []
    });
    setLoading(false);
    return true;
  };

  const loginManager = async (email: string, pass?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await managerApi.login(email, pass || 'password123');
      if (res.success) {
        const newUser: UserSession = {
          userId: 'mgr-01',
          role: 'MANAGER',
          name: res.user?.name || 'Leo Hudson',
          email: email,
          appliedTaskIds: [],
        };
        setUser(newUser);
        setLoading(false);
        return true;
      }
    } catch {
      // Fallback
      await managerApi.login(email, pass || 'password5');
    } catch (_) {}
    
    const found = MOCK_USERS_DB.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === 'MANAGER');
    if (found) {
      setUser({
        userId: found.user_id,
        role: 'MANAGER',
        name: found.name,
        email: found.email,
        appliedTaskIds: []
      });
      setLoading(false);
      return true;
    }

    setUser({
      userId: 'mgr-01',
      userId: 'u2',
      role: 'MANAGER',
      name: 'Leo Hudson',
      email: email,
      email: email || 'leo@techstart.io',
      appliedTaskIds: []
    });
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
        role: user?.role || null,
        loading,
        login,
        loginManager,
        logout,
        logoutManager,
        updateUserSession
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

export default AuthProvider;
