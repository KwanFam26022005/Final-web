import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { Button } from '../components/ui/Button';
import { EmailVerificationBanner } from '../components/auth/EmailVerificationBanner';
import { WiseCat } from '../components/mascot/WiseCat';
import { KnowledgeMark } from '../components/brand/KnowledgeMark';
import { fetchNotes, deleteNote, pinNote, type Note } from '../lib/api/notes';
import { ConfirmDeleteDialog } from '../components/ui/ConfirmDeleteDialog';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pinningIds, setPinningIds] = useState<Set<number>>(new Set());

  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchReqIdRef = useRef<number>(0);

  const viewMode = preference?.default_note_view || 'grid';

  const executeSearch = useCallback(async (query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const reqId = ++searchReqIdRef.current;

    setIsSearching(true);
    try {
      const data = await fetchNotes(query, controller.signal);
      if (reqId === searchReqIdRef.current) {
        setNotes(data);
        setIsSearching(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (reqId === searchReqIdRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    setIsSearching(true);
    searchTimerRef.current = setTimeout(() => {
      void executeSearch(val);
    }, 300);
  };

  const handleClearSearch = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    setSearchQuery('');
    void executeSearch('');
  };

  const handleOpenDelete = (note: Note) => {
    setNoteToDelete(note);
    setDeleteError(null);
  };

  const handleCancelDelete = () => {
    if (!isDeletingNote) {
      setNoteToDelete(null);
      setDeleteError(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete || isDeletingNote) return;
    setIsDeletingNote(true);
    setDeleteError(null);
    try {
      await deleteNote(noteToDelete.id);
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
      setNoteToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete note. Please try again.';
      setDeleteError(message);
    } finally {
      setIsDeletingNote(false);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (pinningIds.has(note.id)) return;

    const nextPinned = !note.is_pinned;
    setPinningIds((prev) => new Set(prev).add(note.id));

    // Optimistic update
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, is_pinned: nextPinned } : n))
    );

    try {
      await pinNote(note.id, nextPinned);
    } catch {
      // Rollback on failure
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, is_pinned: !nextPinned } : n))
      );
    } finally {
      setPinningIds((prev) => {
        const next = new Set(prev);
        next.delete(note.id);
        return next;
      });
    }
  };

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
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); } finally { setIsLoggingOut(false); }
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

  const pinnedNotes = notes.filter((n) => Boolean(n.is_pinned));
  const regularNotes = notes.filter((n) => !n.is_pinned);

  const renderNoteCard = (note: Note) => (
    <div
      key={note.id}
      onClick={() => navigate(`/notes/${note.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/notes/${note.id}`);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open note: ${note.title}`}
      className={`group text-left rounded-xl border p-5 hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all duration-150 motion-reduce:hover:translate-y-0 cursor-pointer flex flex-col justify-between ${
        note.is_pinned
          ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
      data-testid="note-card"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-start gap-1.5 min-w-0 flex-1">
            {note.is_pinned && (
              <span className="shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" data-testid="pinned-indicator" title="Pinned note">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16 4v4l2 3v2h-5v7l-1 1-1-1v-7H6v-2l2-3V4h8z" />
                </svg>
              </span>
            )}
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{note.title}</h3>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              aria-label={note.is_pinned ? `Unpin ${note.title}` : `Pin ${note.title}`}
              aria-pressed={note.is_pinned}
              data-testid="pin-note-button"
              disabled={pinningIds.has(note.id)}
              onClick={(e) => { void handleTogglePin(e, note); }}
              className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 ${
                note.is_pinned
                  ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 opacity-100'
                  : 'opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={note.is_pinned ? 'Unpin note' : 'Pin note'}
            >
              <svg className="w-4 h-4" fill={note.is_pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v4l2 3v2h-5v7l-1 1-1-1v-7H6v-2l2-3V4h8z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={`Delete ${note.title}`}
              data-testid="delete-note-button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDelete(note);
              }}
              className="opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
              title="Delete note"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-3">{note.content}</p>
      </div>
      <p className="text-[11px] text-slate-400 dark:text-slate-500">{formatRelativeTime(note.updated_at)}</p>
    </div>
  );

  const renderNoteRow = (note: Note) => (
    <div
      key={note.id}
      onClick={() => navigate(`/notes/${note.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/notes/${note.id}`);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open note: ${note.title}`}
      className={`group w-full text-left flex items-center justify-between gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-colors cursor-pointer ${
        note.is_pinned ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
      }`}
      data-testid="note-row"
    >
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {note.is_pinned && (
          <span className="shrink-0 text-blue-600 dark:text-blue-400" data-testid="pinned-indicator" title="Pinned note">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 4v4l2 3v2h-5v7l-1 1-1-1v-7H6v-2l2-3V4h8z" />
            </svg>
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">{note.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{note.content}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">{formatRelativeTime(note.updated_at)}</span>
        <button
          type="button"
          aria-label={note.is_pinned ? `Unpin ${note.title}` : `Pin ${note.title}`}
          aria-pressed={note.is_pinned}
          data-testid="pin-note-button"
          disabled={pinningIds.has(note.id)}
          onClick={(e) => { void handleTogglePin(e, note); }}
          className={`p-1.5 rounded-lg transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 ${
            note.is_pinned
              ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 opacity-100'
              : 'opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={note.is_pinned ? 'Unpin note' : 'Pin note'}
        >
          <svg className="w-4 h-4" fill={note.is_pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v4l2 3v2h-5v7l-1 1-1-1v-7H6v-2l2-3V4h8z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={`Delete ${note.title}`}
          data-testid="delete-note-button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDelete(note);
          }}
          className="opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
          title="Delete note"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
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
          {/* Workspace Title & Actions Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notes</h1>
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

          {/* Search Bar Toolbar */}
          <div className="relative mb-6 max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleClearSearch();
                }
              }}
              placeholder="Search your notes..."
              aria-label="Search your notes"
              data-testid="search-input"
              className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-8 pr-2 flex items-center" data-testid="searching-indicator">
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                data-testid="clear-search-button"
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Notes Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            searchQuery.trim() !== '' ? (
              /* Search Empty State */
              <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-search-state">
                <div className="mb-4">
                  <WiseCat state="reading" size="md" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No notes match your search.</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                  Try searching for different keywords or clear your search to see all notes.
                </p>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                  data-testid="empty-search-clear-button"
                >
                  Clear search
                </button>
              </div>
            ) : (
              /* Global Empty State */
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
            )
          ) : (
            <div className="space-y-8">
              {/* Pinned Section */}
              {pinnedNotes.length > 0 && (
                <section aria-labelledby="pinned-heading" data-testid="pinned-section">
                  <h2 id="pinned-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3" data-testid="pinned-section-heading">
                    Pinned
                  </h2>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="pinned-notes-grid">
                      {pinnedNotes.map((note) => renderNoteCard(note))}
                    </div>
                  ) : (
                    <div className="space-y-1" data-testid="pinned-notes-list">
                      {pinnedNotes.map((note) => renderNoteRow(note))}
                    </div>
                  )}
                </section>
              )}

              {/* Regular Notes Section */}
              {regularNotes.length > 0 && (
                <section aria-labelledby={pinnedNotes.length > 0 ? 'notes-heading' : undefined} aria-label={pinnedNotes.length === 0 ? 'Notes' : undefined} data-testid="notes-section">
                  {pinnedNotes.length > 0 && (
                    <h2 id="notes-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3" data-testid="regular-section-heading">
                      Notes
                    </h2>
                  )}
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="notes-grid">
                      {regularNotes.map((note) => renderNoteCard(note))}
                    </div>
                  ) : (
                    <div className="space-y-1" data-testid="notes-list">
                      {regularNotes.map((note) => renderNoteRow(note))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      <ConfirmDeleteDialog
        isOpen={noteToDelete !== null}
        title="Delete this note?"
        description="This action permanently deletes the note and cannot be undone."
        confirmLabel="Delete note"
        cancelLabel="Cancel"
        isDeleting={isDeletingNote}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};
