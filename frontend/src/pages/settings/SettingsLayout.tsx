import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { EmailVerificationBanner } from '../../components/auth/EmailVerificationBanner';
import { Button } from '../../components/ui/Button';
import { WiseCat } from '../../components/mascot/WiseCat';

export const SettingsLayout: React.FC = () => {
  const { logout } = useAuth();

  const navItems = [
    { to: '/settings/profile', label: 'Profile' },
    { to: '/settings/security', label: 'Security' },
    { to: '/settings/preferences', label: 'Preferences' },
  ];

  return (
    <div className="min-h-screen bg-academic-light text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
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
          <Link
            to="/"
            className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
      <main className="flex-1 max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Account Settings
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage your personal student profile, credentials, and knowledge environment.
            </p>
          </div>
          <div className="hidden sm:block">
            <WiseCat state="settings" size="sm" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto"
          aria-label="Settings Tabs"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
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
        <div className="mt-4 animate-entrance">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
