import React, { useEffect, useState } from 'react';
import { useAuth } from '../context';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top navigation header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            N
          </div>
          <span className="font-semibold text-slate-900 text-sm sm:text-base">
            Collaborative Intelligent Note Management
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900" data-testid="user-display-name">
              {user?.display_name}
            </p>
            <p className="text-xs text-slate-500" data-testid="user-email">
              {user?.email}
            </p>
          </div>
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

      {/* Main Workspace Area */}
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.display_name}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Phase 2 Authenticated Workspace Shell
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="elevated" className="p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Session & Account Info
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Display Name</dt>
                <dd className="font-medium text-slate-900">{user?.display_name}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Email Address</dt>
                <dd className="font-medium text-slate-900">{user?.email}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Authentication</dt>
                <dd className="font-medium text-emerald-600">Sanctum First-Party SPA</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500">Email Status</dt>
                <dd className="font-medium text-slate-600">
                  {user?.email_verified_at ? 'Verified' : 'Unverified (M1)'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card variant="elevated" className="p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Runtime Foundation Diagnostics
            </h2>
            <ul className="space-y-3 text-sm">
              <li
                data-testid="backend-status-row"
                className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50 border border-slate-100"
              >
                <span className="font-medium text-slate-700">Backend API</span>
                <span
                  data-testid="backend-status-badge"
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    backendStatus === 'ok'
                      ? 'bg-emerald-100 text-emerald-800'
                      : backendStatus === 'loading'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {backendStatus === 'ok' ? 'Online' : backendStatus === 'loading' ? 'Checking...' : 'Offline'}
                </span>
              </li>

              <li
                data-testid="database-status-row"
                className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50 border border-slate-100"
              >
                <span className="font-medium text-slate-700">Database Engine</span>
                <span
                  data-testid="database-status-badge"
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    dbStatus === 'ok'
                      ? 'bg-emerald-100 text-emerald-800'
                      : dbStatus === 'loading'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {dbStatus === 'ok' ? 'Connected' : dbStatus === 'loading' ? 'Checking...' : 'Offline'}
                </span>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
              Notes management, categorization, collaboration, and AI modules are scheduled for subsequent milestones.
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
