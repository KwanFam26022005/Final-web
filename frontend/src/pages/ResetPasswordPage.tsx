import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { apiClient, ApiError, ensureCsrfCookie } from '../lib/api/client';

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
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create a new password
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Set a new strong password for your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="elevated" className="p-8 dark:bg-slate-800 dark:border-slate-700">
          {isSuccess ? (
            <div className="space-y-6" data-testid="reset-password-success">
              <Alert variant="success" title="Password reset successful">
                Your password has been changed securely. Please log in with your new password.
              </Alert>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center font-medium rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 text-sm w-full"
                >
                  Proceed to Sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errors.general && (
                <div role="alert" className="space-y-2">
                  <Alert variant="error">{errors.general}</Alert>
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      Request a new reset link &rarr;
                    </Link>
                  </div>
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
                  disabled={Boolean(initialEmail) || isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>

              <FormField
                id="reset-password"
                label="New Password"
                required
                hint="Minimum 8 characters"
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
                  className="w-full"
                  isLoading={isLoading}
                >
                  Reset password
                </Button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel and return to sign in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
