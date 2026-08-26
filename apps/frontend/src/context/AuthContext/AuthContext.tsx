import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  userId: string;
  role: 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN';
  name: string;
  email: string;
  appliedTaskIds: string[];
}

interface AuthContextType {
  user: UserSession | null;
  login: (email: string, role: string) => Promise<void>;
  logout: () => void;
  updateUserSession: (patch: Partial<UserSession>) => void;
}

const AuthContextInstance = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(role: string): 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN' {
  if (role === 'GIG') return 'GIG_PROFESSIONAL';
  if (role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (role === 'MANAGER') return 'MANAGER';
  return 'CLIENT';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    // Read from window.__GFG_SESSION__ or window.name
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
    
    // Default fallback to Elena Rodriguez as active Gig Professional user
    return {
      userId: 'gig-01',
      role: 'GIG_PROFESSIONAL',
      name: 'Elena Rodriguez',
      email: 'elena.rodriguez@gigsforgigs.com',
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
    }
  }, [user]);

  const login = async (email: string, role: string) => {
    const defaultName = role === 'CLIENT' ? 'Aditya' : 'Elena Rodriguez';
    const defaultUserId = role === 'CLIENT' ? 'cli-01' : role === 'MANAGER' ? 'mgr-01' : 'gig-01';
    
    const newUser: UserSession = {
      userId: defaultUserId,
      role: normalizeRole(role),
      name: defaultName,
      email: email,
      appliedTaskIds: [],
    };
    setUser(newUser);
  };

  const logout = () => {
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
    <AuthContextInstance.Provider value={{ user, login, logout, updateUserSession }}>
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
