import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { ApiError } from '../lib/api/client';
import { AcademicAuthShell } from '../components/auth/AcademicAuthShell';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    passwordConfirmation?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: {
      displayName?: string;
      email?: string;
      password?: string;
      passwordConfirmation?: string;
    } = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = 'Please confirm your password';
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
      await register(displayName, email, password, passwordConfirmation);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const fieldErrors: {
            displayName?: string;
            email?: string;
            password?: string;
            passwordConfirmation?: string;
            general?: string;
          } = {};
          if (err.errors.display_name) fieldErrors.displayName = err.errors.display_name[0];
          if (err.errors.email) fieldErrors.email = err.errors.email[0];
          if (err.errors.password) fieldErrors.password = err.errors.password[0];
          if (err.errors.password_confirmation) fieldErrors.passwordConfirmation = err.errors.password_confirmation[0];
          setErrors(fieldErrors);
        } else {
          setErrors({ general: err.message || 'Registration failed. Please try again.' });
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
      title="Create your account"
      subtitle="Begin your personal knowledge journal."
      mascotState={isLoading ? 'loading' : 'reading'}
      footer={
        <p>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {errors.general && (
        <div className="mb-6">
          <Alert variant="error">{errors.general}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="register-display-name"
          label="Display Name"
          required
          error={errors.displayName}
        >
          <Input
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            value={displayName}
            disabled={isLoading}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </FormField>

        <FormField
          id="register-email"
          label="Email address"
          required
          error={errors.email}
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

        <FormField
          id="register-password"
          label="Password"
          required
          hint="Must be at least 8 characters"
          error={errors.password}
        >
          <PasswordInput
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            disabled={isLoading}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>

        <FormField
          id="register-password-confirmation"
          label="Confirm Password"
          required
          error={errors.passwordConfirmation}
        >
          <PasswordInput
            autoComplete="new-password"
            placeholder="Confirm your password"
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
            Create account
          </Button>
        </div>
      </form>
    </AcademicAuthShell>
  );
};
