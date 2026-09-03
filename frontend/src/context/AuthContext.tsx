import React, { useEffect, useState } from 'react';
import { apiClient, ensureCsrfCookie } from '../lib/api/client';
import { AuthContext, type User, type UserPreference } from './auth-types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [preference, setPreference] = useState<UserPreference | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const response = await apiClient<{ user: User }>('/api/auth/user');
      setUser(response.user);

      try {
        const prefRes = await apiClient<{ preference: UserPreference }>('/api/account/preferences');
        setPreference(prefRes.preference);
      } catch {
        // Preferences non-critical on auth refresh
      }
    } catch {
      setUser(null);
      setPreference(null);
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

        try {
          const prefRes = await apiClient<{ preference: UserPreference }>('/api/account/preferences');
          if (isMounted) setPreference(prefRes.preference);
        } catch {
          // Non-critical
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setPreference(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Theme application effect
  useEffect(() => {
    const theme = preference?.theme || 'system';
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preference?.theme]);

  const login = async (email: string, password: string) => {
    await ensureCsrfCookie();
    const response = await apiClient<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(response.user);

    try {
      const prefRes = await apiClient<{ preference: UserPreference }>('/api/account/preferences');
      setPreference(prefRes.preference);
    } catch {
      // Non-critical
    }
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

    try {
      const prefRes = await apiClient<{ preference: UserPreference }>('/api/account/preferences');
      setPreference(prefRes.preference);
    } catch {
      // Non-critical
    }
  };

  const logout = async () => {
    try {
      await apiClient('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      setUser(null);
      setPreference(null);
    }
  };

  const updateProfile = async (displayName: string, email: string): Promise<{ emailChanged: boolean }> => {
    await ensureCsrfCookie();
    const response = await apiClient<{ message: string; user: User; email_changed: boolean }>('/api/account/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        display_name: displayName,
        email,
      }),
    });
    setUser(response.user);
    return { emailChanged: response.email_changed };
  };

  const uploadAvatar = async (file: File): Promise<void> => {
    await ensureCsrfCookie();
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient<{ message: string; user: User }>('/api/account/avatar', {
      method: 'POST',
      body: formData,
    });
    setUser(response.user);
  };

  const removeAvatar = async (): Promise<void> => {
    await ensureCsrfCookie();
    const response = await apiClient<{ message: string; user: User }>('/api/account/avatar', {
      method: 'DELETE',
    });
    setUser(response.user);
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ): Promise<void> => {
    await ensureCsrfCookie();
    await apiClient<{ message: string }>('/api/account/password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      }),
    });
  };

  const resendVerification = async (): Promise<string> => {
    await ensureCsrfCookie();
    const response = await apiClient<{ message: string }>('/api/auth/email/resend', {
      method: 'POST',
    });
    return response.message;
  };

  const updatePreference = async (
    theme?: 'system' | 'light' | 'dark',
    defaultNoteView?: 'grid' | 'list'
  ): Promise<void> => {
    await ensureCsrfCookie();
    const payload: Partial<UserPreference> = {};
    if (theme) payload.theme = theme;
    if (defaultNoteView) payload.default_note_view = defaultNoteView;

    const response = await apiClient<{ message: string; preference: UserPreference }>('/api/account/preferences', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setPreference(response.preference);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preference,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        updatePassword,
        resendVerification,
        updatePreference,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
