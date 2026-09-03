import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmailVerificationBanner } from '../components/auth/EmailVerificationBanner';
import { apiClient } from '../lib/api/client';

interface HealthResponse {
  status: string;
  service: string;
}

export const WorkspacePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [dbStatus, setDbStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const res = await apiClient<HealthResponse>('/api/health');
        if (isMounted) setBackendStatus(res.status === 'ok' ? 'ok' : 'error');
      } catch {
        if (isMounted) setBackendStatus('error');
      }

      try {
        const res = await apiClient<HealthResponse>('/api/health/database');
        if (isMounted) setDbStatus(res.status === 'ok' ? 'ok' : 'error');
      } catch {
        if (isMounted) setDbStatus('error');
      }
    }

    checkHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Top navigation header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            N
          </div>
          <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
            Collaborative Intelligent Note Management
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-600">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="w-full h-full object-cover"
                  data-testid="header-avatar-img"
                />
              ) : (
                <span data-testid="header-avatar-initials">{getInitials(user?.display_name || '')}</span>
              )}
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white" data-testid="user-display-name">
                {user?.display_name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="user-email">
                {user?.email}
              </p>
            </div>
          </div>

          <Link
            to="/settings/profile"
            className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            data-testid="settings-nav-link"
          >
            Settings
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            isLoading={isLoggingOut}
            data-testid="logout-button"
          >
            Sign out
          </Button>
        </div>
      </header>

      {/* Verification Banner */}
      <EmailVerificationBanner />

      {/* Main Workspace Area */}
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome, {user?.display_name}!
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Phase 2 Authenticated Workspace Shell
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/settings/profile"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Account Settings &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="elevated" className="p-6 dark:bg-slate-800 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
              Session & Account Info
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400">Display Name</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{user?.display_name}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400">Email Address</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{user?.email}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400">Authentication</dt>
                <dd className="font-medium text-emerald-600 dark:text-emerald-400">Sanctum First-Party SPA</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500 dark:text-slate-400">Email Status</dt>
                <dd className="font-medium text-slate-600 dark:text-slate-300">
                  {user?.email_verified_at ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Verified</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">Unverified</span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          <Card variant="elevated" className="p-6 dark:bg-slate-800 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
              Runtime Foundation Diagnostics
            </h2>
            <ul className="space-y-3 text-sm">
              <li
                data-testid="backend-status-row"
                className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">Backend API</span>
                <span
                  data-testid="backend-status-badge"
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    backendStatus === 'ok'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : backendStatus === 'loading'
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                  }`}
                >
                  {backendStatus === 'ok' ? 'Online' : backendStatus === 'loading' ? 'Checking...' : 'Offline'}
                </span>
              </li>

              <li
                data-testid="database-status-row"
                className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">Database Engine</span>
                <span
                  data-testid="database-status-badge"
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    dbStatus === 'ok'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : dbStatus === 'loading'
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                  }`}
                >
                  {dbStatus === 'ok' ? 'Connected' : dbStatus === 'loading' ? 'Checking...' : 'Offline'}
                </span>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-lg text-xs text-blue-800 dark:text-blue-300">
              Notes management, categorization, collaboration, and AI modules are scheduled for subsequent milestones.
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
