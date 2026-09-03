import React, { useState } from 'react';
import { useAuth } from '../../context';
import { Button } from '../ui/Button';
import { ApiError } from '../../lib/api/client';

export const EmailVerificationBanner: React.FC = () => {
  const { user, resendVerification } = useAuth();
  const [status, setStatus] = useState<'idle' | 'resending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // If there is no user or user is already verified, do not render banner
  if (!user || user.email_verified_at) {
    return null;
  }

  const handleResend = async () => {
    setStatus('resending');
    setErrorMessage('');

    try {
      await resendVerification();
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Failed to resend verification email.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6 lg:px-8 text-amber-900"
      data-testid="verification-warning-banner"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-amber-600 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs sm:text-sm font-medium">
            Your email address has not been verified. Please check your inbox or request a new verification email.
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {status === 'sent' ? (
            <span
              className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full"
              data-testid="verification-sent-message"
            >
              A new verification email has been sent to your inbox.
            </span>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleResend}
              isLoading={status === 'resending'}
              data-testid="resend-verification-button"
              className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100/60"
            >
              Resend verification email
            </Button>
          )}
        </div>
      </div>

      {status === 'error' && (
        <div className="max-w-5xl mx-auto mt-2 text-xs font-medium text-red-700" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
