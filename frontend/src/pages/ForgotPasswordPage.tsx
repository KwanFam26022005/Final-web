import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { apiClient, ApiError, ensureCsrfCookie } from '../lib/api/client';
import { AcademicAuthShell } from '../components/auth/AcademicAuthShell';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      await ensureCsrfCookie();
      await apiClient<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message || 'Unable to process password reset request.');
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AcademicAuthShell
      title="Reset your password"
      subtitle="Enter your registered email address and we'll send you a password recovery link."
      mascotState={isLoading ? 'loading' : isSuccess ? 'success' : 'verification'}
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
        <div className="space-y-6" data-testid="forgot-password-success">
          <Alert variant="success" title="Check your email">
            If an account exists for this email, a password reset link has been sent.
          </Alert>

          <p className="text-xs text-slate-600 dark:text-slate-400 text-center leading-relaxed">
            Please check your spam or promotions folder if you do not see the email in your inbox within a few moments.
          </p>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
            >
              &larr; Return to login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {generalError && (
            <div role="alert">
              <Alert variant="error">{generalError}</Alert>
            </div>
          )}

          <FormField
            id="forgot-email"
            label="Email address"
            required
            error={emailError}
          >
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              disabled={isLoading}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full shadow-sm hover:shadow active:scale-[0.99] transition-all"
            >
              Send reset link
            </Button>
          </div>
        </form>
      )}
    </AcademicAuthShell>
  );
};
