import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { apiClient, ApiError, ensureCsrfCookie } from '../lib/api/client';
import { AcademicAuthShell } from '../components/auth/AcademicAuthShell';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; passwordConfirmation?: string; general?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string; passwordConfirmation?: string } = {};

    if (!token) {
      setErrors({ general: 'Invalid or missing password reset token. Please request a new link.' });
      return false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'New password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = 'Please confirm your new password';
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await ensureCsrfCookie();
      await apiClient<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const fieldErrors: { email?: string; password?: string; passwordConfirmation?: string; general?: string } = {};
          if (err.errors.email) fieldErrors.email = err.errors.email[0];
          if (err.errors.password) fieldErrors.password = err.errors.password[0];
          setErrors(fieldErrors);
        } else {
          setErrors({ general: err.message || 'Unable to reset password.' });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AcademicAuthShell
      title="Create a new password"
      subtitle="Set a new strong password for your account."
      mascotState={isSuccess ? 'success' : 'verification'}
      footer={
        <Link
          to="/login"
          className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline transition-colors"
        >
          &larr; Back to sign in
        </Link>
      }
    >
      {isSuccess ? (
        <div className="space-y-6" data-testid="reset-password-success">
          <Alert variant="success" title="Password updated successfully">
            Your password has been changed. For security reasons, please manually sign in with your new credentials.
          </Alert>

          <div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              Proceed to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errors.general && (
            <div role="alert">
              <Alert variant="error">{errors.general}</Alert>
            </div>
          )}

          <FormField
            id="reset-email"
            label="Email address"
            required
            error={errors.email}
          >
            <Input
              type="email"
              autoComplete="email"
              value={email}
              disabled={isLoading || !!initialEmail}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <FormField
            id="reset-password"
            label="New Password"
            required
            hint="Must be at least 8 characters"
            error={errors.password}
          >
            <PasswordInput
              autoComplete="new-password"
              placeholder="Enter new password"
              value={password}
              disabled={isLoading}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>

          <FormField
            id="reset-password-confirmation"
            label="Confirm New Password"
            required
            error={errors.passwordConfirmation}
          >
            <PasswordInput
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={passwordConfirmation}
              disabled={isLoading}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full shadow-sm hover:shadow active:scale-[0.99] transition-all"
            >
              Reset password
            </Button>
          </div>
        </form>
      )}
    </AcademicAuthShell>
  );
};
