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
  register: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        
        // Check for pending actions
        const pendingAction = getAndClearPendingAction();
        
        return { success: true, pendingAction };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'An error occurred during login' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      const response = await api.register(userData);
      
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'An error occurred during registration' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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




