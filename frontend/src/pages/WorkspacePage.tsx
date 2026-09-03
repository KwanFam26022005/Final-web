import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmailVerificationBanner } from '../components/auth/EmailVerificationBanner';
import { WiseCat } from '../components/mascot/WiseCat';
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
    <div className="min-h-screen bg-academic-light text-slate-900 dark:text-slate-100 flex flex-col">
      {/* -------------------------------------------------------------------- */}
      {/* Top Academic Light Navigation Header                                 */}
      {/* -------------------------------------------------------------------- */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-blue-900 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-sm relative shadow-sm transition-transform group-hover:scale-105">
              N
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-slate-900" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight hidden sm:inline">
              Collaborative Intelligent Note Management
            </span>
            <span className="font-semibold text-slate-900 dark:text-white text-sm sm:hidden tracking-tight">
              Final-web
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/settings/profile"
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 hover:ring-2 hover:ring-blue-500/30 transition-all"
              title="View profile settings"
            >
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
            </Link>

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
            className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
            className="shadow-2xs"
          >
            Sign out
          </Button>
        </div>
      </header>

      {/* Verification Banner */}
      <EmailVerificationBanner />

      {/* -------------------------------------------------------------------- */}
      {/* Main Workspace Surface                                               */}
      {/* -------------------------------------------------------------------- */}
      <main className="flex-1 max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Academic Light Welcome Hero Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs relative overflow-hidden animate-entrance">
          {/* Subtle Ambient Accent */}
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Academic Light &bull; Living Knowledge
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome, {user?.display_name}!
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                Phase 2 Authenticated Workspace Shell. Your secure personal account lifecycle is active, grounded in first-party session authorization and privacy.
              </p>
              <div className="pt-2">
                <Link
                  to="/settings/profile"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                >
                  Account Settings &rarr;
                </Link>
              </div>
            </div>

            <div className="flex-shrink-0 animate-mascot-float">
              <WiseCat state="welcome" size="lg" />
            </div>
          </div>
        </div>

        {/* Account Details & Session Card */}
        <Card variant="elevated" className="p-6 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>Session &amp; Account Info</span>
          </h2>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Display Name</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-white">{user?.display_name}</dd>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-white">{user?.email}</dd>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Authentication</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-white">Sanctum First-Party SPA</dd>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Status</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                {user?.email_verified_at ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Unverified
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Phase 2 Scoped Architecture & Runtime Diagnostics */}
        <Card variant="elevated" className="p-6 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            Runtime Foundation Diagnostics
          </h2>

          <div className="space-y-3">
            <div
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
              data-testid="backend-status-row"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Backend API</span>
              {backendStatus === 'loading' ? (
                <span className="text-xs text-slate-400">Checking...</span>
              ) : backendStatus === 'ok' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Unavailable
                </span>
              )}
            </div>

            <div
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
              data-testid="database-status-row"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Database Engine</span>
              {dbStatus === 'loading' ? (
                <span className="text-xs text-slate-400">Checking...</span>
              ) : dbStatus === 'ok' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Unavailable
                </span>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
            Notes management, categorization, collaboration, and AI modules are scheduled for subsequent milestones.
          </p>
        </Card>
      </main>
    </div>
  );
};
