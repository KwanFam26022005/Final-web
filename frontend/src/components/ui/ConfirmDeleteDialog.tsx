import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { Alert } from './Alert';

export interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  isOpen,
  title = 'Delete this note?',
  description = 'This action permanently deletes the note and cannot be undone.',
  confirmLabel = 'Delete note',
  cancelLabel = 'Cancel',
  isDeleting = false,
  error = null,
  onConfirm,
  onCancel,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Focus cancel button as safe default
      requestAnimationFrame(() => {
        cancelButtonRef.current?.focus();
      });
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity"
      data-testid="confirm-dialog-backdrop"
      onClick={(e) => {
        // Close if clicking the backdrop directly and not busy
        if (e.target === e.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-150"
        data-testid="confirm-delete-dialog"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
              data-testid="confirm-dialog-title"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-desc"
              className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed"
              data-testid="confirm-dialog-desc"
            >
              {description}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <Alert variant="error" data-testid="confirm-dialog-error">
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            ref={cancelButtonRef}
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isDeleting}
            data-testid="confirm-dialog-cancel"
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>

          <Button
            ref={confirmButtonRef}
            variant="danger"
            size="md"
            onClick={onConfirm}
            isLoading={isDeleting}
            disabled={isDeleting}
            data-testid="confirm-dialog-confirm"
            className="w-full sm:w-auto"
          >
            {isDeleting ? 'Deleting\u2026' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
