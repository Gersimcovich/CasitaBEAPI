'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CasitaUser, UserReservation, Locale } from '@/types/user';

interface UserContextType {
  user: CasitaUser | null;
  reservations: UserReservation[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<{ success: boolean; message: string; requiresRegistration?: boolean }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  verifyCode: (email: string, code: string, registrationData?: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  preferredLanguage?: Locale;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  preferredLanguage?: Locale;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CasitaUser | null>(null);
  const [reservations, setReservations] = useState<UserReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          setReservations(data.reservations || []);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          setReservations(data.reservations || []);
        }
      }
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  }, []);

  const login = useCallback(async (email: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return {
        success: data.success,
        message: data.message,
        requiresRegistration: data.requiresRegistration,
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred. Please try again.' };
    }
  }, []);

  const register = useCallback(async (registerData: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'An error occurred. Please try again.' };
    }
  }, []);

  const verifyCode = useCallback(async (
    email: string,
    code: string,
    registrationData?: RegisterData
  ) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          ...(registrationData && {
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            phone: registrationData.phone,
            country: registrationData.country,
            preferredLanguage: registrationData.preferredLanguage,
          }),
        }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        // Fetch reservations after successful login
        await refreshUser();
      }

      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Verify code error:', error);
      return { success: false, message: 'An error occurred. Please try again.' };
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setReservations([]);
    }
  }, []);

  const updateProfile = useCallback(async (updateData: UpdateProfileData) => {
    try {
      const response = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      }

      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'An error occurred. Please try again.' };
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        reservations,
        isLoading,
        isAuthenticated,
        login,
        register,
        verifyCode,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
