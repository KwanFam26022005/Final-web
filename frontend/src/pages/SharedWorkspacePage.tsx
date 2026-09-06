import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { fetchSharedNotes, type SharedNoteItem } from '../lib/api/notes';
import { KnowledgeMark } from '../components/brand/KnowledgeMark';
import { Button } from '../components/ui/Button';
import { EmailVerificationBanner } from '../components/auth/EmailVerificationBanner';

export const SharedWorkspacePage: React.FC = () => {
  const { user, logout, preference, updatePreference } = useAuth();
  const navigate = useNavigate();

  const [sharedNotes, setSharedNotes] = useState<SharedNoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const viewMode = preference?.default_note_view || 'grid';

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const items = await fetchSharedNotes();
        if (isMounted) {
          setSharedNotes(items);
          setError(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load shared notes.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((prev) => prev + 1);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const setViewMode = async (mode: 'grid' | 'list') => {
    if (viewMode !== mode) {
      await updatePreference(undefined, mode);
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatSharedDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const renderSharedCard = (item: SharedNoteItem) => (
    <div
      key={item.share_id}
      onClick={() => navigate(`/notes/${item.note.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/notes/${item.note.id}`);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open shared note: ${item.note.title}`}
      className="group text-left rounded-xl border p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all duration-150 motion-reduce:hover:translate-y-0 cursor-pointer flex flex-col justify-between"
      data-testid="shared-note-card"
    >
      <div>
        {/* Top Badges: Shared Indicator & Permission */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              data-testid="shared-indicator"
              aria-label="Shared note"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Shared</span>
            </span>

            {item.permission === 'read' ? (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                data-testid="permission-badge"
              >
                Read only
              </span>
            ) : (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                data-testid="permission-badge"
              >
                Can edit
              </span>
            )}
          </div>

          {item.note.is_protected && (
            <span
              className={`shrink-0 ${item.note.is_unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
              data-testid={item.note.is_unlocked ? 'unlocked-indicator' : 'locked-indicator'}
              title={item.note.is_unlocked ? 'Protected note (Unlocked)' : 'Protected note (Locked)'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                {item.note.is_unlocked ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                )}
              </svg>
            </span>
          )}
        </div>

        {/* Note Title */}
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 mb-2" data-testid="note-title">
          {item.note.title}
        </h3>

        {/* Note Excerpt (Redacted if locked) */}
        {item.note.is_protected && !item.note.is_unlocked ? (
          <p className="text-xs italic text-amber-700/90 dark:text-amber-400/90 line-clamp-3 mb-4 flex items-center gap-1.5" data-testid="locked-note-excerpt">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Locked note · Unlock to view content</span>
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4" data-testid="note-excerpt">
            {item.note.content ?? ''}
          </p>
        )}
      </div>

      {/* Metadata Footer: Sharer identity & Shared timestamp */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <span className="font-medium text-slate-700 dark:text-slate-300 truncate" data-testid="sharer-name">
          Shared by {item.shared_by.display_name}
        </span>
        <time
          dateTime={item.shared_at}
          className="shrink-0 text-slate-400 dark:text-slate-500"
          data-testid="shared-timestamp"
        >
          Shared {formatSharedDate(item.shared_at)}
        </time>
      </div>
    </div>
  );

  const renderSharedRow = (item: SharedNoteItem) => (
    <div
      key={item.share_id}
      onClick={() => navigate(`/notes/${item.note.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/notes/${item.note.id}`);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open shared note: ${item.note.title}`}
      className="group text-left rounded-lg border px-4 py-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150 cursor-pointer flex items-center justify-between gap-4"
      data-testid="shared-note-card"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0"
          data-testid="shared-indicator"
          aria-label="Shared note"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="hidden sm:inline">Shared</span>
        </span>

        {item.permission === 'read' ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0"
            data-testid="permission-badge"
          >
            Read only
          </span>
        ) : (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0"
            data-testid="permission-badge"
          >
            Can edit
          </span>
        )}

        {item.note.is_protected && (
          <span
            className={`shrink-0 ${item.note.is_unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
            data-testid={item.note.is_unlocked ? 'unlocked-indicator' : 'locked-indicator'}
            title={item.note.is_unlocked ? 'Protected note (Unlocked)' : 'Protected note (Locked)'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {item.note.is_unlocked ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              )}
            </svg>
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" data-testid="note-title">
            {item.note.title}
          </h3>
          {item.note.is_protected && !item.note.is_unlocked ? (
            <p className="text-xs italic text-amber-700/90 dark:text-amber-400/90 truncate" data-testid="locked-note-excerpt">
              Locked note · Unlock to view content
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate" data-testid="note-excerpt">
              {item.note.content ?? ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <span className="font-medium text-slate-700 dark:text-slate-300 hidden md:inline" data-testid="sharer-name">
          Shared by {item.shared_by.display_name}
        </span>
        <time
          dateTime={item.shared_at}
          className="text-slate-400 dark:text-slate-500"
          data-testid="shared-timestamp"
        >
          {formatSharedDate(item.shared_at)}
        </time>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-academic-light text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed inset-y-0 left-0 z-30" data-testid="sidebar">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-200 dark:border-slate-800">
          <KnowledgeMark size="sm" />
          <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">Final-web</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => navigate('/notes/new')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            data-testid="new-note-button"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New note
          </button>

          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            data-testid="notes-nav-link"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Notes
          </Link>

          <Link
            to="/shared"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
            data-testid="shared-nav-link"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Shared with me
          </Link>

          <Link
            to="/settings/profile"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            data-testid="settings-nav-link"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </Link>
        </nav>

        <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" data-testid="header-avatar-img" />
              ) : (
                <span data-testid="header-avatar-initials">{getInitials(user?.display_name || '')}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate" data-testid="user-display-name">{user?.display_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate" data-testid="user-email">{user?.email}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout} isLoading={isLoggingOut} data-testid="logout-button" className="w-full">
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800/80 px-4 h-14 flex items-center justify-between sticky top-0 z-20">
          <Link to="/" className="flex items-center gap-2">
            <KnowledgeMark size="sm" />
            <span className="font-semibold text-sm text-slate-900 dark:text-white">Final-web</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/notes/new')}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              aria-label="New note"
              data-testid="mobile-new-note"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
            <Link to="/" className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
              Notes
            </Link>
            <Link
              to="/shared"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 font-semibold"
              data-testid="mobile-shared-link"
            >
              Shared with me
            </Link>
            <Link to="/settings/profile" className="text-xs font-medium text-slate-600 dark:text-slate-300">Settings</Link>
            <Button variant="secondary" size="sm" onClick={handleLogout} isLoading={isLoggingOut} data-testid="logout-button" className="text-xs">Sign out</Button>
          </div>
        </header>

        <EmailVerificationBanner />

        {/* Workspace Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="shared-workspace-heading">
                Shared with me
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Notes shared with you by other collaborators.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800" role="radiogroup" aria-label="View mode">
                <button
                  role="radio"
                  aria-checked={viewMode === 'grid'}
                  aria-label="Grid view"
                  onClick={() => { void setViewMode('grid'); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  data-testid="grid-view-button"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button
                  role="radio"
                  aria-checked={viewMode === 'list'}
                  aria-label="List view"
                  onClick={() => { void setViewMode('list'); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  data-testid="list-view-button"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20" data-testid="shared-loading-state">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            /* Error State */
            <div className="text-center py-12 px-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20" data-testid="shared-error-state">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
              <button
                onClick={handleRetry}
                data-testid="shared-retry-button"
                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : sharedNotes.length === 0 ? (
            /* Dedicated Empty State (Section 13) */
            <div
              className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50"
              data-testid="shared-empty-state"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                No shared notes
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No notes have been shared with you yet.
              </p>
            </div>
          ) : (
            /* Shared Notes Display */
            <div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="shared-notes-grid">
                  {sharedNotes.map((item) => renderSharedCard(item))}
                </div>
              ) : (
                <div className="space-y-2" data-testid="shared-notes-list">
                  {sharedNotes.map((item) => renderSharedRow(item))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
