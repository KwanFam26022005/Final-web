import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type Label, createLabel, updateLabel, deleteLabel } from '../lib/api/labels';
import { Button } from './ui/Button';
import { ConfirmDeleteDialog } from './ui/ConfirmDeleteDialog';

export interface LabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: Label[];
  onLabelCreated: (label: Label) => void;
  onLabelUpdated: (label: Label) => void;
  onLabelDeleted: (labelId: number) => void;
}

export const LabelsModal: React.FC<LabelsModalProps> = ({
  isOpen,
  onClose,
  labels,
  onLabelCreated,
  onLabelUpdated,
  onLabelDeleted,
}) => {
  const [newLabelName, setNewLabelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [labelToDelete, setLabelToDelete] = useState<Label | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const newLabelInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setNewLabelName('');
    setCreateError(null);
    setEditingLabelId(null);
    setUpdateError(null);
    setLabelToDelete(null);
    setDeleteError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        newLabelInputRef.current?.focus();
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingLabelId !== null) {
      editInputRef.current?.focus();
    }
  }, [editingLabelId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting && !labelToDelete) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, labelToDelete, handleClose]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLabelName.trim();
    if (!trimmed) {
      setCreateError('Label name cannot be empty.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await createLabel(trimmed);
      onLabelCreated(created);
      setNewLabelName('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create label.';
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (label: Label) => {
    setEditingLabelId(label.id);
    setEditingName(label.name);
    setUpdateError(null);
  };

  const handleCancelEdit = () => {
    setEditingLabelId(null);
    setEditingName('');
    setUpdateError(null);
  };

  const handleSaveEdit = async (labelId: number) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setUpdateError('Label name cannot be empty.');
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);
    try {
      const updated = await updateLabel(labelId, trimmed);
      onLabelUpdated(updated);
      setEditingLabelId(null);
      setEditingName('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to rename label.';
      setUpdateError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!labelToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteLabel(labelToDelete.id);
      onLabelDeleted(labelToDelete.id);
      setLabelToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete label.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        data-testid="labels-modal-backdrop"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="labels-modal-title"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 text-left relative max-h-[90vh] flex flex-col"
          data-testid="labels-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h2 id="labels-modal-title" className="text-lg font-bold text-slate-900 dark:text-white" data-testid="labels-modal-title">
              Manage Labels
            </h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close labels modal"
              data-testid="close-labels-modal"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Create Label Form */}
          <form onSubmit={handleCreate} data-testid="create-label-form" className="mb-4">
            <label htmlFor="new-label-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Create New Label
            </label>
            <div className="flex gap-2">
              <input
                id="new-label-name"
                ref={newLabelInputRef}
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name..."
                maxLength={50}
                aria-label="New label name"
                data-testid="new-label-name-input"
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="submit"
                size="sm"
                isLoading={isCreating}
                disabled={!newLabelName.trim()}
                data-testid="create-label-button"
              >
                Create
              </Button>
            </div>
            {createError && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" data-testid="create-label-error">
                {createError}
              </p>
            )}
          </form>

          {/* Labels List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1" data-testid="labels-list">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Existing Labels ({labels.length})
            </h3>

            {labels.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center" data-testid="empty-labels-message">
                No labels created yet. Add one above to organize your notes.
              </p>
            ) : (
              labels.map((label) => {
                const isEditing = editingLabelId === label.id;

                return (
                  <div
                    key={label.id}
                    className="flex flex-col p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                    data-testid="label-item"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            maxLength={50}
                            aria-label="Edit label name"
                            data-testid="edit-label-name-input"
                            className="flex-1 px-2.5 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void handleSaveEdit(label.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            isLoading={isUpdating}
                            onClick={() => void handleSaveEdit(label.id)}
                            data-testid="save-label-name-button"
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isUpdating}
                            onClick={handleCancelEdit}
                            data-testid="cancel-edit-label-button"
                          >
                            Cancel
                          </Button>
                        </div>
                        {updateError && (
                          <p className="text-xs text-red-600 dark:text-red-400" data-testid="edit-label-error">
                            {updateError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate" data-testid="label-name">
                          {label.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            aria-label={`Rename ${label.name}`}
                            onClick={() => handleStartEdit(label)}
                            data-testid="edit-label-button"
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Rename label"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${label.name}`}
                            onClick={() => {
                              setLabelToDelete(label);
                              setDeleteError(null);
                            }}
                            data-testid="delete-label-button"
                            className="p-1 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Delete label"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Delete Label Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={labelToDelete !== null}
        title={labelToDelete ? `Delete label "${labelToDelete.name}"?` : 'Delete label?'}
        description="This removes the label from your notes but does not delete the notes."
        confirmLabel="Delete label"
        cancelLabel="Cancel"
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setLabelToDelete(null);
            setDeleteError(null);
          }
        }}
      />
    </>
  );
};
