import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAutosave, type AutosaveStatus } from '../hooks/useAutosave';
import {
  createNote,
  updateNote,
  fetchNote,
  deleteNote,
  pinNote,
  syncNoteLabels,
  protectNote,
  unlockNote,
  lockNote,
  removeNoteProtection,
  fetchNoteShares,
  createNoteShare,
  updateNoteShare,
  deleteNoteShare,
  type NoteShare,
} from '../lib/api/notes';
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

  const [isProtected, setIsProtected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const [isProtectModalOpen, setIsProtectModalOpen] = useState(false);
  const [protectPassword, setProtectPassword] = useState('');
  const [protectPasswordConfirm, setProtectPasswordConfirm] = useState('');
  const [isProtecting, setIsProtecting] = useState(false);
  const [protectError, setProtectError] = useState<string | null>(null);

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [removePassword, setRemovePassword] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const [accessType, setAccessType] = useState<'owner' | 'shared'>('owner');
  const [permission, setPermission] = useState<'owner' | 'read' | 'edit' | null>('owner');
  const [permissionDowngradeError, setPermissionDowngradeError] = useState<string | null>(null);

  const isOwner = accessType === 'owner' || permission === 'owner' || isNewNote;
  const isReadOnly = !isOwner && permission === 'read';
  const canEdit = isOwner || permission === 'edit';

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shares, setShares] = useState<NoteShare[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'read' | 'edit'>('read');
  const [isSubmittingShare, setIsSubmittingShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [updatingShareId, setUpdatingShareId] = useState<number | null>(null);
  const [shareToRevoke, setShareToRevoke] = useState<NoteShare | null>(null);
  const [isRevokingShare, setIsRevokingShare] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

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
    if (id && (!isProtected || isUnlocked)) {
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
  }, [noteId, createdNoteId, isProtected, isUnlocked]);

  const validate = useCallback((data: { title: string; content: string }) => {
    if (isProtected && !isUnlocked) return false;
    if (isReadOnly) return false;
    return data.title.trim().length > 0 && data.content.trim().length > 0;
  }, [isProtected, isUnlocked, isReadOnly]);

  const handleSave = useCallback(async (data: { title: string; content: string }) => {
    if (isDeletedRef.current) return;
    if (isProtected && !isUnlocked) return;
    if (isReadOnly) return;
    const currentId = persistedNoteIdRef.current;
    try {
      if (currentId !== null) {
        await updateNote(currentId, data);
      } else {
        const created = await createNote(data);
        if (isDeletedRef.current) return;
        persistedNoteIdRef.current = created.id;
        setCreatedNoteId(created.id);
        setAccessType('owner');
        setPermission('owner');
        setAssignedLabels(created.labels || []);
        navigate(`/notes/${created.id}`, { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        setPermissionDowngradeError('You no longer have permission to edit this note.');
        setPermission('read');
      }
      throw err;
    }
  }, [isProtected, isUnlocked, isReadOnly, navigate]);

  const { status, markDirty, cancelAutosave } = useAutosave({ onSave: handleSave, validate });

  useEffect(() => {
    if (!isNewNote && noteId) {
      let isMounted = true;
      void fetchNote(Number(noteId))
        .then((note) => {
          if (!isMounted) return;
          const protectedFlag = Boolean(note.is_protected);
          const unlockedFlag = protectedFlag ? Boolean(note.is_unlocked) : true;
          setIsProtected(protectedFlag);
          setIsUnlocked(unlockedFlag);
          setAccessType(note.access_type || 'owner');
          setPermission(note.permission || 'owner');
          setPermissionDowngradeError(null);
          titleValRef.current = note.title;
          setTitle(note.title);

          if (protectedFlag && !unlockedFlag) {
            contentValRef.current = '';
            setContent('');
            cancelAutosave();
          } else {
            contentValRef.current = note.content ?? '';
            setContent(note.content ?? '');
          }

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
  }, [noteId, isNewNote, cancelAutosave]);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = persistedNoteIdRef.current;
    if (!id || isUnlocking || !unlockPassword) return;

    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const unlockedNote = await unlockNote(id, { password: unlockPassword });
      setIsUnlocked(true);
      const newContent = unlockedNote.content ?? '';
      setContent(newContent);
      contentValRef.current = newContent;
      setUnlockPassword('');
      setUnlockError(null);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError && err.errors?.password?.[0]
          ? err.errors.password[0]
          : err instanceof Error
            ? err.message
            : 'Incorrect note password.';
      setUnlockError(msg);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleManualLock = async () => {
    const id = persistedNoteIdRef.current;
    if (!id) return;

    cancelAutosave();
    setContent('');
    contentValRef.current = '';
    setIsUnlocked(false);
    setAttachments([]);

    try {
      await lockNote(id);
    } catch {
      // Local state already locked
    }
  };

  const handleProtectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = persistedNoteIdRef.current;
    if (!id || isProtecting) return;

    if (protectPassword.length < 8) {
      setProtectError('Password must be at least 8 characters.');
      return;
    }

    if (protectPassword !== protectPasswordConfirm) {
      setProtectError('Password confirmation does not match.');
      return;
    }

    setIsProtecting(true);
    setProtectError(null);

    try {
      await protectNote(id, {
        password: protectPassword,
        password_confirmation: protectPasswordConfirm,
      });
      setIsProtected(true);
      setIsUnlocked(true);
      setIsProtectModalOpen(false);
      setProtectPassword('');
      setProtectPasswordConfirm('');
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError && err.errors?.password?.[0]
          ? err.errors.password[0]
          : err instanceof Error
            ? err.message
            : 'Failed to protect note.';
      setProtectError(msg);
    } finally {
      setIsProtecting(false);
    }
  };

  const handleRemoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = persistedNoteIdRef.current;
    if (!id || isRemoving || !removePassword) return;

    setIsRemoving(true);
    setRemoveError(null);

    try {
      await removeNoteProtection(id, { password: removePassword });
      setIsProtected(false);
      setIsUnlocked(true);
      setIsRemoveModalOpen(false);
      setRemovePassword('');
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError && err.errors?.password?.[0]
          ? err.errors.password[0]
          : err instanceof Error
            ? err.message
            : 'Incorrect note password.';
      setRemoveError(msg);
    } finally {
      setIsRemoving(false);
    }
  };

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

  const loadShares = async () => {
    const id = persistedNoteIdRef.current;
    if (!id || !isOwner) return;
    setIsLoadingShares(true);
    setShareError(null);
    try {
      const items = await fetchNoteShares(id);
      setShares(items);
    } catch (err: unknown) {
      setShareError(err instanceof Error ? err.message : 'Failed to load shares.');
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = persistedNoteIdRef.current;
    if (!id || !shareEmail.trim() || isSubmittingShare) return;

    setIsSubmittingShare(true);
    setShareError(null);
    setShareSuccess(null);

    try {
      const newShare = await createNoteShare(id, {
        email: shareEmail.trim(),
        permission: sharePermission,
      });
      setShares((prev) => {
        const idx = prev.findIndex((s) => s.id === newShare.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newShare;
          return updated;
        }
        return [newShare, ...prev];
      });
      setShareEmail('');
      const targetUser = newShare.recipient || newShare.user;
      setShareSuccess(`Shared with ${targetUser?.email || shareEmail} (${newShare.permission}).`);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError && err.errors?.email?.[0]
          ? err.errors.email[0]
          : err instanceof ApiError && err.errors?.permission?.[0]
            ? err.errors.permission[0]
            : err instanceof Error
              ? err.message
              : 'Failed to share note.';
      setShareError(msg);
    } finally {
      setIsSubmittingShare(false);
    }
  };

  const handleChangeSharePermission = async (shareId: number, nextPerm: 'read' | 'edit') => {
    setUpdatingShareId(shareId);
    setShareError(null);
    try {
      const updated = await updateNoteShare(shareId, { permission: nextPerm });
      setShares((prev) => prev.map((s) => (s.id === shareId ? updated : s)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update permission.';
      setShareError(msg);
    } finally {
      setUpdatingShareId(null);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!shareToRevoke || isRevokingShare) return;
    setIsRevokingShare(true);
    setRevokeError(null);
    try {
      await deleteNoteShare(shareToRevoke.id);
      setShares((prev) => prev.filter((s) => s.id !== shareToRevoke.id));
      setShareToRevoke(null);
      setShareSuccess('Collaborator access revoked.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke share.';
      setRevokeError(msg);
    } finally {
      setIsRevokingShare(false);
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
          {!isOwner && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isReadOnly
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              }`}
              data-testid="permission-badge"
            >
              {isReadOnly ? 'Read only' : 'Can edit'}
            </span>
          )}

          {isProtected && !isUnlocked ? (
            <span
              className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800"
              data-testid="locked-status"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Locked
            </span>
          ) : !isReadOnly ? (
            <StatusIndicator status={status} />
          ) : null}

          {isPersisted && (
            <>
              {!isProtected && isOwner && (
                <button
                  type="button"
                  aria-label="Protect note"
                  title="Protect note"
                  data-testid="protect-note-button"
                  onClick={() => {
                    setProtectError(null);
                    setIsProtectModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </button>
              )}

              {isProtected && isUnlocked && (
                <>
                  <button
                    type="button"
                    aria-label="Lock note now"
                    title="Lock note now"
                    data-testid="lock-now-button"
                    onClick={() => { void handleManualLock(); }}
                    className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </button>
                  {isOwner && (
                    <button
                      type="button"
                      aria-label="Remove protection"
                      title="Remove protection"
                      data-testid="remove-protection-button"
                      onClick={() => {
                        setRemoveError(null);
                        setIsRemoveModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </>
              )}

              {isOwner && (
                <>
                  <button
                    type="button"
                    aria-label="Share note"
                    title="Share note"
                    data-testid="share-note-button"
                    onClick={() => {
                      setIsShareModalOpen(true);
                      setShareError(null);
                      setShareSuccess(null);
                      void loadShares();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </button>

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
            </>
          )}
        </div>
      </header>

      {/* Editor Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto py-8 px-4 sm:px-6">
        <div className="space-y-4">
          {permissionDowngradeError && (
            <div
              className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between"
              role="alert"
              data-testid="permission-downgrade-banner"
            >
              <span>{permissionDowngradeError}</span>
              <button
                type="button"
                onClick={() => setPermissionDowngradeError(null)}
                className="text-amber-600 hover:text-amber-800 ml-2 font-bold"
                aria-label="Dismiss banner"
              >
                &times;
              </button>
            </div>
          )}

          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={(isProtected && !isUnlocked) || isReadOnly}
            readOnly={isReadOnly}
            placeholder="Untitled note"
            className="w-full text-2xl sm:text-3xl font-bold tracking-tight bg-transparent border-none outline-none placeholder-slate-300 dark:placeholder-slate-600 text-slate-900 dark:text-white disabled:opacity-60"
            aria-label="Note title"
            data-testid="note-title-input"
          />

          {isPersisted && isOwner && (
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

          {isProtected && !isUnlocked ? (
            <div className="py-12 px-6 max-w-md mx-auto text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5" data-testid="locked-note-view">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  This note is password protected
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the password to view and edit the contents of this note.
                </p>
              </div>
              <form onSubmit={handleUnlockSubmit} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="unlock-password">
                    Password
                  </label>
                  <input
                    id="unlock-password"
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder="Enter note password"
                    aria-label="Note password"
                    data-testid="unlock-password-input"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  {unlockError && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" data-testid="unlock-error">
                      {unlockError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isUnlocking || !unlockPassword}
                  data-testid="unlock-note-button"
                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 cursor-pointer"
                >
                  {isUnlocking ? 'Unlocking…' : 'Unlock note'}
                </button>
              </form>
            </div>
          ) : (
            <>
              <textarea
                value={content}
                onChange={handleContentChange}
                disabled={isReadOnly}
                readOnly={isReadOnly}
                placeholder="Start writing…"
                className="w-full min-h-[50vh] text-base leading-relaxed bg-transparent border-none outline-none resize-none placeholder-slate-300 dark:placeholder-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-80"
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
                    {canEdit && (
                      <label
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer ${
                          isUploadingAttachment ? 'opacity-50 pointer-events-none' : ''
                        }`}
                        data-testid="add-attachment-button"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>{isUploadingAttachment ? 'Uploading…' : 'Add file'}</span>
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
                    )}
                  </div>

                  {canEdit && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      JPEG, PNG, WebP or PDF &middot; max 10 MB
                    </p>
                  )}

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
                            {canEdit && (
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
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </>
          )}
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

      {/* Protect Note Modal */}
      {isProtectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" data-testid="protect-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Protect Note</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Set a password to restrict view and edit access to this note. Minimum 8 characters.
              </p>
            </div>
            <form onSubmit={handleProtectSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="protect-password">
                  Password
                </label>
                <input
                  id="protect-password"
                  type="password"
                  value={protectPassword}
                  onChange={(e) => setProtectPassword(e.target.value)}
                  placeholder="Enter password (min. 8 characters)"
                  aria-label="Password"
                  data-testid="protect-password-input"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="protect-password-confirm">
                  Confirm Password
                </label>
                <input
                  id="protect-password-confirm"
                  type="password"
                  value={protectPasswordConfirm}
                  onChange={(e) => setProtectPasswordConfirm(e.target.value)}
                  placeholder="Confirm password"
                  aria-label="Confirm Password"
                  data-testid="protect-password-confirm-input"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {protectError && (
                <p className="text-xs text-red-600 dark:text-red-400" data-testid="protect-error">
                  {protectError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProtectModalOpen(false);
                    setProtectPassword('');
                    setProtectPasswordConfirm('');
                    setProtectError(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProtecting || !protectPassword || !protectPasswordConfirm}
                  data-testid="confirm-protect-button"
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isProtecting ? 'Protecting…' : 'Protect note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Protection Modal */}
      {isRemoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" data-testid="remove-protection-modal">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Remove Password Protection</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your note password to remove protection. Anyone with access to the note will be able to view it.
              </p>
            </div>
            <form onSubmit={handleRemoveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="remove-password">
                  Note Password
                </label>
                <input
                  id="remove-password"
                  type="password"
                  value={removePassword}
                  onChange={(e) => setRemovePassword(e.target.value)}
                  placeholder="Enter note password"
                  aria-label="Note password"
                  data-testid="remove-protection-password-input"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              {removeError && (
                <p className="text-xs text-red-600 dark:text-red-400" data-testid="remove-protection-error">
                  {removeError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRemoveModalOpen(false);
                    setRemovePassword('');
                    setRemoveError(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRemoving || !removePassword}
                  data-testid="confirm-remove-protection-button"
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isRemoving ? 'Removing…' : 'Remove protection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          data-testid="share-modal"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Share Note</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Share this note with registered users by email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsShareModalOpen(false);
                  setShareError(null);
                  setShareSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                aria-label="Close share dialog"
                data-testid="close-share-modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Share form */}
            <form onSubmit={handleShareSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Collaborator email"
                  aria-label="Collaborator email"
                  data-testid="share-email-input"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <select
                    value={sharePermission}
                    onChange={(e) => setSharePermission(e.target.value as 'read' | 'edit')}
                    aria-label="Share permission"
                    data-testid="share-permission-select"
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="read">Read only</option>
                    <option value="edit">Can edit</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmittingShare || !shareEmail.trim()}
                    data-testid="confirm-share-button"
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    {isSubmittingShare ? 'Sharing…' : 'Share'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="share-permission-radio"
                    value="read"
                    checked={sharePermission === 'read'}
                    onChange={() => setSharePermission('read')}
                    data-testid="share-perm-read"
                  />
                  <span>Read only</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="share-permission-radio"
                    value="edit"
                    checked={sharePermission === 'edit'}
                    onChange={() => setSharePermission('edit')}
                    data-testid="share-perm-edit"
                  />
                  <span>Can edit</span>
                </label>
              </div>

              {shareError && (
                <p className="text-xs text-red-600 dark:text-red-400 p-2 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800" data-testid="share-error">
                  {shareError}
                </p>
              )}
              {shareSuccess && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800" data-testid="share-success">
                  {shareSuccess}
                </p>
              )}
            </form>

            {/* Collaborators list */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                People with access
              </h4>
              {isLoadingShares ? (
                <p className="text-xs text-slate-400 py-3 text-center">Loading collaborators…</p>
              ) : shares.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center" data-testid="no-shares-message">
                  This note hasn&apos;t been shared with anyone yet.
                </p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto" data-testid="shares-list">
                  {shares.map((s) => {
                    const targetUser = s.recipient || s.user;
                    return (
                      <li
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                        data-testid="share-item"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-medium text-slate-900 dark:text-white truncate" data-testid="share-user-email">
                            {targetUser?.email}
                          </div>
                          {targetUser?.display_name && (
                            <div className="text-slate-400 dark:text-slate-500 text-[11px] truncate">
                              {targetUser.display_name}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={s.permission}
                            disabled={updatingShareId === s.id}
                            onChange={(e) => void handleChangeSharePermission(s.id, e.target.value as 'read' | 'edit')}
                            aria-label={`Change permission for ${targetUser?.email}`}
                            data-testid="change-share-permission"
                            className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="read">Read only</option>
                            <option value="edit">Can edit</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setRevokeError(null);
                              setShareToRevoke(s);
                            }}
                            aria-label={`Revoke access for ${targetUser?.email}`}
                            data-testid="revoke-share-button"
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                            title="Revoke access"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revoke Share Confirmation Dialog */}
      {shareToRevoke && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          data-testid="confirm-revoke-dialog"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Revoke access?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to revoke access for <strong className="text-slate-800 dark:text-slate-200">{(shareToRevoke.recipient || shareToRevoke.user)?.email}</strong>? They will immediately lose access to this note.
              </p>
            </div>

            {revokeError && (
              <p className="text-xs text-red-600 dark:text-red-400" data-testid="revoke-error">
                {revokeError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isRevokingShare}
                onClick={() => {
                  setShareToRevoke(null);
                  setRevokeError(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                data-testid="cancel-revoke-button"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRevokingShare}
                onClick={() => void handleConfirmRevoke()}
                data-testid="confirm-revoke-button"
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isRevokingShare ? 'Revoking…' : 'Revoke access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
