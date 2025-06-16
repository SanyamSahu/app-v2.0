"use client";

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
/*
// Removed server-only imports that caused mysql2 error!
// import { getUserByUsername, validateUserCredentials, updateUserPassword } from '@/lib/user-db';
*/

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

  // Refactored: call API route instead of direct DB access!
  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.success || !data.credentials) {
        setLoading(false);
        return null;
      }

      // Optionally, fetch full user profile via another API route if you want details (not shown here)
      // For now, just use returned credentials object:
      setUser(data.credentials);
      localStorage.setItem('authUser', JSON.stringify(data.credentials));
      setLoading(false);
      return data.credentials;
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('authUser');
    router.push('/login');
  }, [router]);

  // Refactored: call a password API route (must be created, e.g. /api/auth/change-password)
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'No user logged in' };
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword, newPassword }),
      });
      return await res.json();
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
