import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAutosave, type AutosaveStatus } from '../hooks/useAutosave';
import { createNote, updateNote, fetchNote, deleteNote, pinNote } from '../lib/api/notes';
import { KnowledgeMark } from '../components/brand/KnowledgeMark';
import { WiseCat } from '../components/mascot/WiseCat';
import { ConfirmDeleteDialog } from '../components/ui/ConfirmDeleteDialog';

function StatusIndicator({ status }: { status: AutosaveStatus }) {
  const labels: Record<AutosaveStatus, string> = {
    idle: '',
    invalid: 'Add a title and content to save',
    dirty: '',
    saving: 'Saving\u2026',
    saved: 'Saved',
    error: "Couldn't save",
  };

  const label = labels[status];
  if (!label) return null;

  const color = {
    idle: '',
    invalid: 'text-slate-400 dark:text-slate-500',
    dirty: '',
    saving: 'text-blue-500 dark:text-blue-400',
    saved: 'text-emerald-600 dark:text-emerald-400',
    error: 'text-red-600 dark:text-red-400',
  }[status];

  return (
    <span
      className={`text-xs font-medium ${color}`}
      role="status"
      aria-live="polite"
      data-testid="autosave-status"
    >
      {label}
    </span>
  );
}

export const NoteEditorPage: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const isNewNote = !noteId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isLoadingNote, setIsLoadingNote] = useState(!isNewNote);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createdNoteId, setCreatedNoteId] = useState<number | null>(null);
  const isPersisted = Boolean(noteId || createdNoteId);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const persistedNoteIdRef = useRef<number | null>(noteId ? Number(noteId) : createdNoteId);
  const isDeletedRef = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const titleValRef = useRef(title);
  const contentValRef = useRef(content);

  useEffect(() => {
    persistedNoteIdRef.current = noteId ? Number(noteId) : createdNoteId;
  }, [noteId, createdNoteId]);

  const validate = useCallback((data: { title: string; content: string }) => {
    return data.title.trim().length > 0 && data.content.trim().length > 0;
  }, []);

  const handleSave = useCallback(async (data: { title: string; content: string }) => {
    if (isDeletedRef.current) return;
    const currentId = persistedNoteIdRef.current;
    if (currentId !== null) {
      await updateNote(currentId, data);
    } else {
      const created = await createNote(data);
      if (isDeletedRef.current) return;
      persistedNoteIdRef.current = created.id;
      setCreatedNoteId(created.id);
      navigate(`/notes/${created.id}`, { replace: true });
    }
  }, [navigate]);

  const { status, markDirty, cancelAutosave } = useAutosave({ onSave: handleSave, validate });

  useEffect(() => {
    if (!isNewNote && noteId) {
      let isMounted = true;
      void fetchNote(Number(noteId))
        .then((note) => {
          if (!isMounted) return;
          titleValRef.current = note.title;
          contentValRef.current = note.content;
          setTitle(note.title);
          setContent(note.content);
          setIsPinned(Boolean(note.is_pinned));
          setIsLoadingNote(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setIsLoadingNote(false);
          setLoadError('Note not found');
        });

      return () => {
        isMounted = false;
      };
    } else {
      titleRef.current?.focus();
    }
  }, [noteId, isNewNote]);

  const handleTogglePin = async () => {
    const id = persistedNoteIdRef.current;
    if (!id || isPinning) return;
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    setIsPinning(true);
    try {
      await pinNote(id, nextPinned);
    } catch {
      setIsPinned(!nextPinned);
    } finally {
      setIsPinning(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    titleValRef.current = val;
    setTitle(val);
    markDirty({ title: val, content: contentValRef.current });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    contentValRef.current = val;
    setContent(val);
    markDirty({ title: titleValRef.current, content: val });
  };

  const handleConfirmDelete = async () => {
    const id = persistedNoteIdRef.current;
    if (!id || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);
    isDeletedRef.current = true;
    cancelAutosave();

    try {
      await deleteNote(id);
      setIsConfirmOpen(false);
      navigate('/', { replace: true });
    } catch (err) {
      isDeletedRef.current = false;
      const message = err instanceof Error ? err.message : 'Failed to delete note. Please try again.';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingNote) {
    return (
      <div className="min-h-screen bg-academic-light flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-academic-light text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center" data-testid="note-not-found-state">
        <div className="mb-4">
          <WiseCat state="reading" size="md" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Note not found
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
          This note may have been deleted or you do not have permission to view it.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          data-testid="not-found-back-button"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-academic-light text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Editor Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            data-testid="back-to-notes"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Notes
          </Link>
          <KnowledgeMark size="sm" className="hidden sm:inline-flex" />
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator status={status} />
          {isPersisted && (
            <>
              <button
                type="button"
                aria-label={isPinned ? 'Unpin note' : 'Pin note'}
                title={isPinned ? 'Unpin note' : 'Pin note'}
                aria-pressed={isPinned}
                data-testid="editor-pin-button"
                disabled={isPinning}
                onClick={() => { void handleTogglePin(); }}
                className={`p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 ${
                  isPinned
                    ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <svg className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v4l2 3v2h-5v7l-1 1-1-1v-7H6v-2l2-3V4h8z" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Delete note"
                data-testid="editor-delete-button"
                disabled={isDeleting || status === 'saving'}
                onClick={() => {
                  setDeleteError(null);
                  setIsConfirmOpen(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none disabled:opacity-50"
                title="Delete note"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Editor Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto py-8 px-4 sm:px-6">
        <div className="space-y-4">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled note"
            className="w-full text-2xl sm:text-3xl font-bold tracking-tight bg-transparent border-none outline-none placeholder-slate-300 dark:placeholder-slate-600 text-slate-900 dark:text-white"
            aria-label="Note title"
            data-testid="note-title-input"
          />
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing\u2026"
            className="w-full min-h-[50vh] text-base leading-relaxed bg-transparent border-none outline-none resize-none placeholder-slate-300 dark:placeholder-slate-600 text-slate-700 dark:text-slate-300"
            aria-label="Note content"
            data-testid="note-content-input"
          />
        </div>
      </main>

      <ConfirmDeleteDialog
        isOpen={isConfirmOpen}
        title="Delete this note?"
        description="This action permanently deletes the note and cannot be undone."
        confirmLabel="Delete note"
        cancelLabel="Cancel"
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setIsConfirmOpen(false);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
};
