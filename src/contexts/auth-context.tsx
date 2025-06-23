"use client";

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      if (!res.ok) {
        setLoading(false);
        return null;
      }
  
      const user: User = await res.json();
  
      setUser(user);
      localStorage.setItem('authUser', JSON.stringify(user));
      setLoading(false);
      return user;
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
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, message: "User not authenticated." };
  
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        currentPassword,
        newPassword
      })
    });
  
    try {
      const data = await res.json();
      return data;
    } catch {
      return { success: false, message: 'Invalid server response.' };
    }
  };
  

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
