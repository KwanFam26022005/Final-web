import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { EmailVerificationBanner } from '../../components/auth/EmailVerificationBanner';
import { Button } from '../../components/ui/Button';

export const SettingsLayout: React.FC = () => {
  const { logout } = useAuth();

  const navItems = [
    { to: '/settings/profile', label: 'Profile' },
    { to: '/settings/security', label: 'Security' },
    { to: '/settings/preferences', label: 'Preferences' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              N
            </div>
            <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base hidden sm:inline">
              Collaborative Intelligent Note Management
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            &larr; Back to Workspace
          </Link>
          <Button variant="secondary" size="sm" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Verification Banner */}
      <EmailVerificationBanner />

      {/* Main Settings Content */}
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your account preferences, security credentials, and profile.
          </p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 mb-6" aria-label="Settings Tabs">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Tab Outlet */}
        <div className="mt-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
