import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { GuestRoute } from '../components/auth/GuestRoute';
import * as clientModule from '../lib/api/client';
import { ApiError } from '../lib/api/client';

vi.mock('../lib/api/client', async () => {
  const actual = await vi.importActual('../lib/api/client');
  return {
    ...actual,
    ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
    apiClient: vi.fn(),
  };
});

describe('Authentication Pages & Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientModule.apiClient).mockRejectedValue(new ApiError('Unauthenticated', 401));
  });

  describe('LoginPage', () => {
    it('renders login form elements and accessible labels', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create an account/i })).toBeInTheDocument();
    });

    it('toggles password visibility when show/hide button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      );

      const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);

      expect(passwordInput.type).toBe('text');
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /hide password/i }));
      expect(passwordInput.type).toBe('password');
    });

    it('triggers client-side validation on empty submission', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(clientModule.apiClient).not.toHaveBeenCalledWith('/api/auth/login', expect.anything());
    });

    it('maps server-side error responses to alert banner', async () => {
      const user = userEvent.setup();
      vi.mocked(clientModule.apiClient).mockRejectedValue(
        new ApiError('Invalid email or password.', 422, {
          message: 'Invalid email or password.',
        })
      );

      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'WrongPass123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i);
      });
    });
  });

  describe('RegisterPage', () => {
    it('renders exact assignment registration fields and no extraneous fields', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <RegisterPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

      // Ensure no forbidden extra fields exist
      expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/company/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^address/i)).not.toBeInTheDocument();
    });

    it('validates password minimum length and confirmation matching', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <RegisterPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await user.type(screen.getByLabelText(/display name/i), 'Kwan');
      await user.type(screen.getByLabelText(/email address/i), 'kwan@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'short');
      await user.type(screen.getByLabelText(/confirm password/i), 'different');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(clientModule.apiClient).not.toHaveBeenCalledWith('/api/auth/register', expect.anything());
    });

    it('maps server validation errors to individual fields', async () => {
      const user = userEvent.setup();
      vi.mocked(clientModule.apiClient).mockRejectedValue(
        new ApiError('The email has already been taken.', 422, {
          message: 'The email has already been taken.',
          errors: {
            email: ['The email has already been taken.'],
          },
        })
      );

      render(
        <MemoryRouter>
          <AuthProvider>
            <RegisterPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await user.type(screen.getByLabelText(/display name/i), 'Test User');
      await user.type(screen.getByLabelText(/email address/i), 'taken@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/the email has already been taken/i)).toBeInTheDocument();
      });
    });
  });

  describe('Route Guards & Transitions', () => {
    it('redirects anonymous users from ProtectedRoute to /login', async () => {
      // Mock refreshUser resolving to 401
      vi.mocked(clientModule.apiClient).mockRejectedValue(new ApiError('Unauthenticated', 401));

      render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div>Login Screen</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<div>Protected Workspace</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Screen')).toBeInTheDocument();
      });
      expect(screen.queryByText('Protected Workspace')).not.toBeInTheDocument();
    });

    it('redirects authenticated users from GuestRoute to /', async () => {
      // Mock refreshUser resolving to active user
      vi.mocked(clientModule.apiClient).mockResolvedValue({
        user: {
          id: 1,
          display_name: 'Existing User',
          email: 'existing@example.com',
          email_verified_at: null,
          created_at: '2026-09-03',
          updated_at: '2026-09-03',
        },
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<div>Login Screen</div>} />
              </Route>
              <Route path="/" element={<div>Protected Workspace</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Workspace')).toBeInTheDocument();
      });
      expect(screen.queryByText('Login Screen')).not.toBeInTheDocument();
    });

    it('handles registration auto-login and navigation to workspace', async () => {
      const user = userEvent.setup();
      // First mount returns unauthenticated
      vi.mocked(clientModule.apiClient)
        .mockRejectedValueOnce(new ApiError('Unauthenticated', 401))
        // Next call is register, returning newly created user
        .mockResolvedValueOnce({
          message: 'User registered successfully.',
          user: {
            id: 10,
            display_name: 'New Registered User',
            email: 'newuser@example.com',
            email_verified_at: null,
            created_at: '2026-09-03',
            updated_at: '2026-09-03',
          },
        });

      const TestApp = () => {
        const { user: authUser } = useAuth();
        return (
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<div>Welcome {authUser?.display_name}</div>} />
          </Routes>
        );
      };

      render(
        <MemoryRouter initialEntries={['/register']}>
          <AuthProvider>
            <TestApp />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/display name/i), 'New Registered User');
      await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Welcome New Registered User')).toBeInTheDocument();
      });
    });
  });
});
