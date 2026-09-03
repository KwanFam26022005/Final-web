import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailVerificationBanner } from '../components/auth/EmailVerificationBanner';
import { AuthContext, type AuthContextType, type User, type UserPreference } from '../context/auth-types';
import * as clientModule from '../lib/api/client';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { ProfileSettingsPage } from './settings/ProfileSettingsPage';
import { SecuritySettingsPage } from './settings/SecuritySettingsPage';
import { PreferencesSettingsPage } from './settings/PreferencesSettingsPage';

function renderWithAuth(
  ui: React.ReactElement,
  authOverrides: Partial<AuthContextType> = {},
  initialEntries: string[] = ['/']
) {
  const defaultUser: User = {
    id: 1,
    display_name: 'Test Account',
    email: 'user@example.com',
    email_verified_at: null,
    avatar_url: null,
    created_at: '2026-09-03T00:00:00Z',
    updated_at: '2026-09-03T00:00:00Z',
  };

  const defaultPref: UserPreference = {
    id: 1,
    user_id: 1,
    theme: 'system',
    default_note_view: 'grid',
  };

  const authValue: AuthContextType = {
    user: defaultUser,
    preference: defaultPref,
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue({ emailChanged: false }),
    uploadAvatar: vi.fn().mockResolvedValue(undefined),
    removeAvatar: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn().mockResolvedValue(undefined),
    resendVerification: vi.fn().mockResolvedValue('Verification link sent.'),
    updatePreference: vi.fn().mockResolvedValue(undefined),
    ...authOverrides,
  };

  return {
    ...render(
      <MemoryRouter initialEntries={initialEntries}>
        <AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>
      </MemoryRouter>
    ),
    authValue,
  };
}

describe('Phase 2 M2 Account Lifecycle Frontend Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('EmailVerificationBanner', () => {
    it('displays warning banner when user is unverified', () => {
      renderWithAuth(<EmailVerificationBanner />);

      expect(screen.getByTestId('verification-warning-banner')).toBeInTheDocument();
      expect(
        screen.getByText(/Your email address has not been verified/i)
      ).toBeInTheDocument();
      expect(screen.getByTestId('resend-verification-button')).toBeInTheDocument();
    });

    it('does not display warning banner when user is verified', () => {
      const verifiedUser: User = {
        id: 2,
        display_name: 'Verified User',
        email: 'verified@example.com',
        email_verified_at: '2026-09-03T12:00:00Z',
        avatar_url: null,
        created_at: '2026-09-03T00:00:00Z',
        updated_at: '2026-09-03T00:00:00Z',
      };

      renderWithAuth(<EmailVerificationBanner />, { user: verifiedUser });

      expect(screen.queryByTestId('verification-warning-banner')).not.toBeInTheDocument();
    });

    it('handles resend verification flow and displays confirmation message', async () => {
      const resendMock = vi.fn().mockResolvedValue('Verification link sent.');

      renderWithAuth(<EmailVerificationBanner />, { resendVerification: resendMock });

      const resendBtn = screen.getByTestId('resend-verification-button');
      await act(async () => {
        fireEvent.click(resendBtn);
      });

      expect(resendMock).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByTestId('verification-sent-message')).toBeInTheDocument();
      });
    });
  });

  describe('ForgotPasswordPage', () => {
    it('renders email input and validates required format', async () => {
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('submits forgot password request and displays generic security confirmation', async () => {
      vi.spyOn(clientModule, 'ensureCsrfCookie').mockResolvedValue();
      const apiClientSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue({
        message: 'If an account exists for this email, a password reset link has been sent.',
      });

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitBtn = screen.getByRole('button', { name: /send reset link/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(apiClientSpy).toHaveBeenCalledWith(
        '/api/auth/forgot-password',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com' }),
        })
      );

      await waitFor(() => {
        expect(screen.getByTestId('forgot-password-success')).toBeInTheDocument();
        expect(
          screen.getByText(/If an account exists for this email, a password reset link has been sent/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('ResetPasswordPage', () => {
    it('validates password minimum length and confirmation match', async () => {
      render(
        <MemoryRouter initialEntries={['/reset-password?token=sample-token&email=test@example.com']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      );

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);
      const submitBtn = screen.getByRole('button', { name: /reset password/i });

      // Password too short
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.change(confirmInput, { target: { value: 'short' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      // Passwords do not match
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmInput, { target: { value: 'Mismatch999!' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('successfully resets password and offers manual login without auto-login', async () => {
      vi.spyOn(clientModule, 'ensureCsrfCookie').mockResolvedValue();
      const apiClientSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue({
        message: 'Password reset successfully. Please log in with your new password.',
      });

      render(
        <MemoryRouter initialEntries={['/reset-password?token=valid-token&email=test@example.com']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      );

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);
      const submitBtn = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'BrandNew123!' } });
      fireEvent.change(confirmInput, { target: { value: 'BrandNew123!' } });

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(apiClientSpy).toHaveBeenCalledWith(
        '/api/auth/reset-password',
        expect.objectContaining({
          method: 'POST',
        })
      );

      await waitFor(() => {
        expect(screen.getByTestId('reset-password-success')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /proceed to sign in/i })).toBeInTheDocument();
      });
    });
  });

  describe('ProfileSettingsPage', () => {
    it('renders profile details, initials fallback, and handles profile save', async () => {
      const updateProfileMock = vi.fn().mockResolvedValue({ emailChanged: false });

      renderWithAuth(<ProfileSettingsPage />, { updateProfile: updateProfileMock });

      expect(screen.getByTestId('user-avatar-initials')).toHaveTextContent('TA');
      expect(screen.getByTestId('profile-display-name-input')).toHaveValue('Test Account');
      expect(screen.getByTestId('profile-email-input')).toHaveValue('user@example.com');

      const nameInput = screen.getByTestId('profile-display-name-input');
      fireEvent.change(nameInput, { target: { value: 'Renamed Account' } });

      const saveBtn = screen.getByTestId('save-profile-button');
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      expect(updateProfileMock).toHaveBeenCalledWith('Renamed Account', 'user@example.com');

      await waitFor(() => {
        expect(screen.getByTestId('profile-success-alert')).toBeInTheDocument();
      });
    });

    it('rejects oversized avatar files with client-side validation error', async () => {
      renderWithAuth(<ProfileSettingsPage />);

      // Create fake file exceeding 2MB (2.5MB = 2.5 * 1024 * 1024)
      const oversizedFile = new File(['a'.repeat(100)], 'large.png', { type: 'image/png' });
      Object.defineProperty(oversizedFile, 'size', { value: 3 * 1024 * 1024 });

      const fileInput = document.getElementById('avatar-file-input') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('avatar-error-alert')).toHaveTextContent(/Image size must be under 2MB/i);
      });
    });

    it('rejects unsupported avatar MIME types', async () => {
      renderWithAuth(<ProfileSettingsPage />);

      const invalidFile = new File(['text content'], 'document.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('avatar-file-input') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('avatar-error-alert')).toHaveTextContent(/Please upload a valid image file/i);
      });
    });
  });

  describe('SecuritySettingsPage', () => {
    it('validates password change fields and submits update', async () => {
      const updatePasswordMock = vi.fn().mockResolvedValue(undefined);

      renderWithAuth(<SecuritySettingsPage />, { updatePassword: updatePasswordMock });

      const currentInput = screen.getByTestId('current-password-input');
      const newInput = screen.getByTestId('new-password-input');
      const confirmInput = screen.getByTestId('confirm-new-password-input');
      const updateBtn = screen.getByTestId('update-password-button');

      fireEvent.change(currentInput, { target: { value: 'CurrentSecret123!' } });
      fireEvent.change(newInput, { target: { value: 'UpdatedSecret456!' } });
      fireEvent.change(confirmInput, { target: { value: 'UpdatedSecret456!' } });

      await act(async () => {
        fireEvent.click(updateBtn);
      });

      expect(updatePasswordMock).toHaveBeenCalledWith(
        'CurrentSecret123!',
        'UpdatedSecret456!',
        'UpdatedSecret456!'
      );

      await waitFor(() => {
        expect(screen.getByTestId('security-success-alert')).toBeInTheDocument();
      });
    });
  });

  describe('PreferencesSettingsPage', () => {
    it('renders theme and view options, and saves updated preference', async () => {
      const updatePrefMock = vi.fn().mockResolvedValue(undefined);

      renderWithAuth(<PreferencesSettingsPage />, { updatePreference: updatePrefMock });

      const darkOption = screen.getByTestId('theme-option-dark');
      fireEvent.click(darkOption);

      const listOption = screen.getByTestId('view-option-list');
      fireEvent.click(listOption);

      const saveBtn = screen.getByTestId('save-preferences-button');
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      expect(updatePrefMock).toHaveBeenCalledWith('dark', 'list');

      await waitFor(() => {
        expect(screen.getByTestId('preferences-success-alert')).toBeInTheDocument();
      });
    });
  });
});
