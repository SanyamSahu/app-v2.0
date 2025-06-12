"use client";

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByUsername, validateUserCredentials, updateUserPassword } from '@/lib/user-db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id && parsedUser.username && parsedUser.role) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('authUser');
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      // First validate credentials
      const credentials = await validateUserCredentials(username, password);
      if (!credentials) {
        setLoading(false);
        return null;
      }

      // If credentials are valid, get the full user data
      const userData = await getUserByUsername(username);
      if (userData) {
        setUser(userData);
        localStorage.setItem('authUser', JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error("Login error:", error);
    }
    
    setLoading(false);
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('authUser');
    router.push('/login');
  }, [router]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'No user logged in' };
    }

    try {
      // Validate current password
      const isValid = await validateUserCredentials(user.username, currentPassword);
      if (!isValid) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Update password
      const updated = await updateUserPassword(user.id, newPassword);
      if (updated) {
        return { success: true, message: 'Password updated successfully' };
      } else {
        return { success: false, message: 'Failed to update password' };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'An error occurred while changing password' };
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
