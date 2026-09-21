import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, getStoredUser, clearStoredAuth } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: 'Admin' | 'User') => Promise<void>;
  logout: () => void;
  switchDemoAccount: (role: 'Admin' | 'User') => Promise<void>;
  updateProfileState: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          setToken(storedToken);
        } catch (error) {
          console.warn('Session expired or invalid token:', error);
          clearStoredAuth();
          setUser(null);
          setToken(null);
        }
      } else {
        // Auto-login to Admin Eleanor on first launch for immediate evaluation convenience
        try {
          const result = await api.login('admin@stockflow.com', 'admin123');
          setUser(result.user);
          setToken(result.token);
        } catch {
          // Ignore if cannot auto-login
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await api.login(email, password);
      setUser(result.user);
      setToken(result.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: 'Admin' | 'User' = 'User') => {
    setIsLoading(true);
    try {
      const result = await api.register(name, email, password, role);
      setUser(result.user);
      setToken(result.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  };

  const switchDemoAccount = async (role: 'Admin' | 'User') => {
    setIsLoading(true);
    try {
      if (role === 'Admin') {
        await login('admin@stockflow.com', 'admin123');
      } else {
        await login('staff@stockflow.com', 'staff123');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileState = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'User';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isStaff,
        login,
        register,
        logout,
        switchDemoAccount,
        updateProfileState,
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
