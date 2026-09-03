import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { ApiError } from '../lib/api/client';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
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
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const fieldErrors: { email?: string; password?: string; general?: string } = {};
          if (err.errors.email) fieldErrors.email = err.errors.email[0];
          if (err.errors.password) fieldErrors.password = err.errors.password[0];
          setErrors(fieldErrors);
        } else {
          setErrors({ general: err.message || 'Invalid email or password.' });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Collaborative Intelligent Note Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="elevated" className="p-8">
          {errors.general && (
            <div className="mb-6">
              <Alert variant="error">{errors.general}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormField
              id="login-email"
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
              id="login-password"
              label="Password"
              required
              error={errors.password}
            >
              <PasswordInput
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400 cursor-not-allowed" title="Password recovery will be available in Phase 2 Milestone 2">
                Forgot your password?
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center text-xs sm:text-sm text-slate-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
