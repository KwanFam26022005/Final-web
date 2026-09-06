import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAutosave, type AutosaveStatus } from '../hooks/useAutosave';
import { createNote, updateNote, fetchNote, deleteNote, pinNote, syncNoteLabels } from '../lib/api/notes';
import { type Label, fetchLabels } from '../lib/api/labels';
import {
  type Attachment,
  fetchAttachments,
  uploadAttachment,
  fetchAttachmentBlob,
  downloadAttachment,
  deleteAttachment,
} from '../lib/api/attachments';
import { ApiError } from '../lib/api/client';
import { KnowledgeMark } from '../components/brand/KnowledgeMark';
import { WiseCat } from '../components/mascot/WiseCat';
import { ConfirmDeleteDialog } from '../components/ui/ConfirmDeleteDialog';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

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

  const [assignedLabels, setAssignedLabels] = useState<Label[]>([]);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [isLabelPickerOpen, setIsLabelPickerOpen] = useState(false);
  const [isSyncingLabels, setIsSyncingLabels] = useState(false);
  const [syncLabelError, setSyncLabelError] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadAttachmentError, setUploadAttachmentError] = useState<string | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);
  const [deleteAttachmentError, setDeleteAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const persistedNoteIdRef = useRef<number | null>(noteId ? Number(noteId) : createdNoteId);
  const isDeletedRef = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const titleValRef = useRef(title);
  const contentValRef = useRef(content);

  useEffect(() => {
    persistedNoteIdRef.current = noteId ? Number(noteId) : createdNoteId;
  }, [noteId, createdNoteId]);

  useEffect(() => {
    void fetchLabels().then(setAllLabels).catch(() => {});
  }, []);

  useEffect(() => {
    if (isLabelPickerOpen) {
      void fetchLabels().then(setAllLabels).catch(() => {});
    }
  }, [isLabelPickerOpen]);

  useEffect(() => {
    const id = noteId ? Number(noteId) : createdNoteId;
    if (id) {
      let isMounted = true;
      void fetchAttachments(id)
        .then((items) => {
          if (isMounted) setAttachments(items);
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
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
      setAssignedLabels(created.labels || []);
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
          setAssignedLabels(note.labels || []);
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

  const handleToggleLabel = async (label: Label) => {
    const id = persistedNoteIdRef.current;
    if (!id || isSyncingLabels) return;

    const isAssigned = assignedLabels.some((l) => l.id === label.id);
    const nextLabels = isAssigned
      ? assignedLabels.filter((l) => l.id !== label.id)
      : [...assignedLabels, label];

    setAssignedLabels(nextLabels);
    setIsSyncingLabels(true);
    setSyncLabelError(null);

    try {
      const updated = await syncNoteLabels(id, nextLabels.map((l) => l.id));
      setAssignedLabels(updated.labels || nextLabels);
    } catch (err: unknown) {
      setAssignedLabels(assignedLabels);
      const msg = err instanceof Error ? err.message : 'Failed to update note labels.';
      setSyncLabelError(msg);
    } finally {
      setIsSyncingLabels(false);
    }
  };

  const handleRemoveLabel = async (labelId: number) => {
    const id = persistedNoteIdRef.current;
    if (!id || isSyncingLabels) return;

    const nextLabels = assignedLabels.filter((l) => l.id !== labelId);
    setAssignedLabels(nextLabels);
    setIsSyncingLabels(true);
    setSyncLabelError(null);

    try {
      const updated = await syncNoteLabels(id, nextLabels.map((l) => l.id));
      setAssignedLabels(updated.labels || nextLabels);
    } catch (err: unknown) {
      setAssignedLabels(assignedLabels);
      const msg = err instanceof Error ? err.message : 'Failed to remove label.';
      setSyncLabelError(msg);
    } finally {
      setIsSyncingLabels(false);
    }
  };

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const id = persistedNoteIdRef.current;
    if (!id || isUploadingAttachment) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadAttachmentError('Attachment file size must not exceed 10 MB.');
      return;
    }

    setIsUploadingAttachment(true);
    setUploadAttachmentError(null);

    try {
      const newAttachment = await uploadAttachment(id, file);
      setAttachments((prev) => [...prev, newAttachment]);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError && err.errors?.file?.[0]
          ? err.errors.file[0]
          : err instanceof Error
            ? err.message
            : 'Failed to upload attachment.';
      setUploadAttachmentError(msg);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleOpenAttachment = async (attachment: Attachment) => {
    try {
      const { blob } = await fetchAttachmentBlob(attachment.id);
      const objectUrl = window.URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 60000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to open attachment.';
      setUploadAttachmentError(msg);
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      await downloadAttachment(attachment.id, attachment.original_name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download attachment.';
      setUploadAttachmentError(msg);
    }
  };

  const handleConfirmDeleteAttachment = async () => {
    if (!attachmentToDelete || deletingAttachmentId !== null) return;

    const targetId = attachmentToDelete.id;
    setDeletingAttachmentId(targetId);
    setDeleteAttachmentError(null);

    try {
      await deleteAttachment(targetId);
      setAttachments((prev) => prev.filter((a) => a.id !== targetId));
      setAttachmentToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete attachment. Please try again.';
      setDeleteAttachmentError(msg);
    } finally {
      setDeletingAttachmentId(null);
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

          {isPersisted && (
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-2" data-testid="note-labels-section">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
                Labels:
              </span>
              {assignedLabels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80"
                  data-testid="note-assigned-label"
                >
                  <span>{label.name}</span>
                  <button
                    type="button"
                    onClick={() => void handleRemoveLabel(label.id)}
                    aria-label={`Remove label ${label.name}`}
                    data-testid="remove-label-button"
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}

              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setIsLabelPickerOpen((prev) => !prev)}
                  aria-expanded={isLabelPickerOpen}
                  aria-haspopup="true"
                  data-testid="add-label-button"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add label</span>
                </button>

                {isLabelPickerOpen && (
                  <div
                    className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-2 z-30 space-y-1"
                    data-testid="label-picker"
                  >
                    {allLabels.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 p-2 text-center" data-testid="label-picker-empty">
                        No labels yet.
                      </p>
                    ) : (
                      allLabels.map((l) => {
                        const isSelected = assignedLabels.some((assigned) => assigned.id === l.id);
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => void handleToggleLabel(l)}
                            data-testid="label-picker-item"
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded text-left transition-colors ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate">{l.name}</span>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {syncLabelError && (
                <span className="text-xs text-red-600 dark:text-red-400" data-testid="sync-label-error">
                  {syncLabelError}
                </span>
              )}
            </div>
          )}

          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing\u2026"
            className="w-full min-h-[50vh] text-base leading-relaxed bg-transparent border-none outline-none resize-none placeholder-slate-300 dark:placeholder-slate-600 text-slate-700 dark:text-slate-300"
            aria-label="Note content"
            data-testid="note-content-input"
          />

          {/* Attachments Section */}
          {isPersisted ? (
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3" data-testid="attachments-section">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Attachments
                </h3>
                <label
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer ${
                    isUploadingAttachment ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  data-testid="add-attachment-button"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{isUploadingAttachment ? 'Uploading\u2026' : 'Add file'}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    aria-label="Upload attachment"
                    disabled={isUploadingAttachment}
                    onChange={handleFileSelect}
                    data-testid="attachment-file-input"
                  />
                </label>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500">
                JPEG, PNG, WebP or PDF &middot; max 10 MB
              </p>

              {uploadAttachmentError && (
                <div
                  className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center justify-between"
                  role="alert"
                  data-testid="attachment-upload-error"
                >
                  <span>{uploadAttachmentError}</span>
                  <button
                    type="button"
                    onClick={() => setUploadAttachmentError(null)}
                    className="text-red-500 hover:text-red-700 ml-2"
                    aria-label="Dismiss error"
                  >
                    &times;
                  </button>
                </div>
              )}

              {attachments.length > 0 && (
                <ul className="space-y-2 pt-1" data-testid="attachments-list">
                  {attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                      data-testid="attachment-item"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-3">
                        {att.mime_type.startsWith('image/') ? (
                          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-xs" data-testid="attachment-filename">
                          {att.original_name}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 shrink-0" data-testid="attachment-size">
                          ({formatBytes(att.size_bytes)})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleOpenAttachment(att)}
                          className="text-blue-600 dark:text-blue-400 hover:underline px-1 py-0.5"
                          data-testid="open-attachment-button"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDownloadAttachment(att)}
                          className="text-slate-600 dark:text-slate-300 hover:underline px-1 py-0.5"
                          data-testid="download-attachment-button"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteAttachmentError(null);
                            setAttachmentToDelete(att);
                          }}
                          disabled={deletingAttachmentId === att.id}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-1 py-0.5 transition-colors disabled:opacity-50"
                          aria-label={`Delete attachment ${att.original_name}`}
                          data-testid="delete-attachment-button"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
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

      <ConfirmDeleteDialog
        isOpen={Boolean(attachmentToDelete)}
        title="Delete attachment?"
        description="This removes the file from this note permanently."
        confirmLabel="Delete attachment"
        cancelLabel="Cancel"
        isDeleting={deletingAttachmentId !== null}
        error={deleteAttachmentError}
        onConfirm={handleConfirmDeleteAttachment}
        onCancel={() => {
          if (deletingAttachmentId === null) {
            setAttachmentToDelete(null);
            setDeleteAttachmentError(null);
          }
        }}
      />
    </div>
  );
};
