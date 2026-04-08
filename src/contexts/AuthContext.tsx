// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { api } from '@/lib/api';
import { getAndClearPendingAction, PendingAction } from '@/lib/auth/redirects';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; pendingAction?: PendingAction | null }>;
  register: (userData: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize authentication state
    const initAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return;

        const response = await api.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
          document.cookie = `role=${response.data.role}; path=/; SameSite=Lax`;
        } else {
          // Token invalid or expired — clear everything
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'role=; path=/; max-age=0';
        }
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        document.cookie = 'role=; path=/; max-age=0';
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleForceLogout = () => {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'role=; path=/; max-age=0';
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        document.cookie = `role=${response.data.role}; path=/; SameSite=Lax`;

        // Check for pending actions
        const pendingAction = getAndClearPendingAction();
        
        return { success: true, pendingAction };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    try {
      const response = await api.register(userData);
      
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'An error occurred during registration' };
    }
  };

  const logout = async () => {
    try {
      // Call API logout endpoint
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'role=; path=/; max-age=0';
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



