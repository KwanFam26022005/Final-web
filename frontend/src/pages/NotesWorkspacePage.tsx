import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { Button } from '../components/ui/Button';
import { EmailVerificationBanner } from '../components/auth/EmailVerificationBanner';
import { WiseCat } from '../components/mascot/WiseCat';
import { KnowledgeMark } from '../components/brand/KnowledgeMark';
import { fetchNotes, type Note } from '../lib/api/notes';

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const NotesWorkspacePage: React.FC = () => {
  const { user, preference, logout, updatePreference } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const viewMode = preference?.default_note_view || 'grid';

  useEffect(() => {
    let isMounted = true;

    async function loadNotes() {
      try {
        const data = await fetchNotes();
        if (isMounted) {
          setNotes(data);
        }
      } catch {
        // Silently handle
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadNotes();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); } finally { setIsLoggingOut(false); }
  };

  const toggleView = async () => {
    const next = viewMode === 'grid' ? 'list' : 'grid';
    await updatePreference(undefined, next);
  };

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
            data-testid="notes-nav-link"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Notes
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
            <Link to="/settings/profile" className="text-xs font-medium text-slate-600 dark:text-slate-300">Settings</Link>
            <Button variant="secondary" size="sm" onClick={handleLogout} isLoading={isLoggingOut} data-testid="logout-button" className="text-xs">Sign out</Button>
          </div>
        </header>

        <EmailVerificationBanner />

        {/* Workspace Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Workspace Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notes</h1>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800" role="radiogroup" aria-label="View mode">
                <button
                  role="radio"
                  aria-checked={viewMode === 'grid'}
                  aria-label="Grid view"
                  onClick={() => { if (viewMode !== 'grid') void toggleView(); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  data-testid="grid-view-button"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button
                  role="radio"
                  aria-checked={viewMode === 'list'}
                  aria-label="List view"
                  onClick={() => { if (viewMode !== 'list') void toggleView(); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  data-testid="list-view-button"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Notes Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-notes-state">
              <div className="mb-6">
                <WiseCat state="welcome" size="lg" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Your knowledge space is ready.</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                Start capturing your ideas, study notes, and insights in one place.
              </p>
              <button
                onClick={() => navigate('/notes/new')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                data-testid="empty-new-note"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                New note
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="notes-grid">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className="group text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all duration-150 motion-reduce:hover:translate-y-0"
                  data-testid="note-card"
                >
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5 line-clamp-2">{note.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-3">{note.content}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{formatRelativeTime(note.updated_at)}</p>
                </button>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-1" data-testid="notes-list">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-colors"
                  data-testid="note-row"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">{note.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{note.content}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">{formatRelativeTime(note.updated_at)}</span>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
