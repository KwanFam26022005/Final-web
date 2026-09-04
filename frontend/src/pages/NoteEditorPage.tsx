import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAutosave, type AutosaveStatus } from '../hooks/useAutosave';
import { createNote, updateNote, fetchNote } from '../lib/api/notes';
import { KnowledgeMark } from '../components/brand/KnowledgeMark';

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
  const [isLoadingNote, setIsLoadingNote] = useState(!isNewNote);
  const [noteDbId, setNoteDbId] = useState<number | null>(noteId ? Number(noteId) : null);
  const titleRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((data: { title: string; content: string }) => {
    return data.title.trim().length > 0 && data.content.trim().length > 0;
  }, []);

  const handleSave = useCallback(async (data: { title: string; content: string }) => {
    if (noteDbId) {
      await updateNote(noteDbId, data);
    } else {
      const created = await createNote(data);
      setNoteDbId(created.id);
      navigate(`/notes/${created.id}`, { replace: true });
    }
  }, [noteDbId, navigate]);

  const { status, markDirty } = useAutosave({ onSave: handleSave, validate });

  useEffect(() => {
    if (!isNewNote && noteId) {
      void fetchNote(Number(noteId)).then((note) => {
        setTitle(note.title);
        setContent(note.content);
        setIsLoadingNote(false);
      });
    } else {
      titleRef.current?.focus();
    }
  }, [noteId, isNewNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    markDirty({ title: val, content });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    markDirty({ title, content: val });
  };

  if (isLoadingNote) {
    return (
      <div className="min-h-screen bg-academic-light flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
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

        <StatusIndicator status={status} />
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
    </div>
  );
};
