import { createContext } from 'react';

export interface User {
  id: number;
  display_name: string;
  email: string;
  email_verified_at: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreference {
  id?: number;
  user_id?: number;
  theme: 'system' | 'light' | 'dark';
  default_note_view: 'grid' | 'list';
}

export interface AuthContextType {
  user: User | null;
  preference: UserPreference | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (displayName: string, email: string) => Promise<{ emailChanged: boolean }>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => Promise<void>;
  resendVerification: () => Promise<string>;
  updatePreference: (theme?: 'system' | 'light' | 'dark', defaultNoteView?: 'grid' | 'list') => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
