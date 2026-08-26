import React, { createContext, useContext, useState, useEffect } from 'react';
import { managerApi } from '../../services/api/manager';
import type { UserRef } from '../../types/manager';

interface AuthContextType {
  user: UserRef | null;
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  loginManager: (email: string, pass: string) => Promise<boolean>;
  logoutManager: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRef | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('g4g_manager_token');
      if (token) {
        try {
          const profile = await managerApi.getProfile();
          if (profile && profile.user) {
            setUser(profile.user);
          }
        } catch {
          // Token invalid or network issue
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const loginManager = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await managerApi.login(email, pass);
      if (res.success) {
        const profile = await managerApi.getProfile();
        setUser(profile.user || { userId: 102, name: 'Leo Hudson', email, role: 'manager' });
        setLoading(false);
        return true;
      }
    } catch {
      // Failed login
    }
    setLoading(false);
    return false;
  };

  const logoutManager = async () => {
    setLoading(true);
    await managerApi.logout();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
        loading,
        loginManager,
        logoutManager
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
