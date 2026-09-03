import React, { useEffect, useState } from 'react';
import { apiClient, ensureCsrfCookie } from '../lib/api/client';
import { AuthContext, type User } from './auth-types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const response = await apiClient<{ user: User }>('/api/auth/user');
      setUser(response.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await apiClient<{ user: User }>('/api/auth/user');
        if (isMounted) setUser(res.user);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    await ensureCsrfCookie();
    const response = await apiClient<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(response.user);
  };

  const register = async (
    displayName: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    await ensureCsrfCookie();
    const response = await apiClient<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        display_name: displayName,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await apiClient('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
