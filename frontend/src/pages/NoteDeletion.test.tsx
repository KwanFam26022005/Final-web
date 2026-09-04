import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NotesWorkspacePage } from './NotesWorkspacePage';
import { NoteEditorPage } from './NoteEditorPage';
import * as notesApi from '../lib/api/notes';
import * as authContext from '../context';

vi.mock('../lib/api/notes');
vi.mock('../context');

const mockUser = {
  id: 1,
  display_name: 'Test Student',
  email: 'student@example.com',
  email_verified_at: '2026-09-01T00:00:00Z',
  avatar_url: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

const sampleNotes = [
  {
    id: 101,
    title: 'Algorithms Lecture Notes',
    content: 'Binary search trees and AVL rotations.',
    is_pinned: false,
    created_at: '2026-09-03T10:00:00Z',
    updated_at: '2026-09-03T12:00:00Z',
  },
  {
    id: 102,
    title: 'Operating Systems Study Guide',
    content: 'Virtual memory and page tables.',
    is_pinned: false,
    created_at: '2026-09-03T09:00:00Z',
    updated_at: '2026-09-03T11:00:00Z',
  },
];

describe('NOTE-05 Safe Note Deletion Tests', () => {
  const mockUpdatePreference = vi.fn().mockResolvedValue(undefined);
  const mockLogout = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      preference: { theme: 'system', default_note_view: 'grid' },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      refreshUser: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      removeAvatar: vi.fn(),
      updatePassword: vi.fn(),
      resendVerification: vi.fn(),
      updatePreference: mockUpdatePreference,
    });
  });

  describe('Workspace Delete Flow (Grid & List)', () => {
    it('Grid delete opens confirmation dialog with accessible copy (NOTE-05)', async () => {
      vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);

      render(
        <MemoryRouter>
          <NotesWorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notes-grid')).toBeInTheDocument();
      });

      const deleteBtns = screen.getAllByTestId('delete-note-button');
      expect(deleteBtns).toHaveLength(2);
      expect(deleteBtns[0]).toHaveAttribute('aria-label', 'Delete Algorithms Lecture Notes');

      // Click delete on first note
      fireEvent.click(deleteBtns[0]);

      // Confirm dialog opens
      const dialog = screen.getByTestId('confirm-delete-dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('role', 'dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByTestId('confirm-dialog-title')).toHaveTextContent('Delete this note?');
      expect(screen.getByTestId('confirm-dialog-desc')).toHaveTextContent(
        'This action permanently deletes the note and cannot be undone.'
      );
    });

    it('List delete opens confirmation dialog (NOTE-05)', async () => {
      vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: mockUser,
        preference: { theme: 'system', default_note_view: 'list' },
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        refreshUser: vi.fn(),
        updateProfile: vi.fn(),
        uploadAvatar: vi.fn(),
        removeAvatar: vi.fn(),
        updatePassword: vi.fn(),
        resendVerification: vi.fn(),
        updatePreference: mockUpdatePreference,
      });

      render(
        <MemoryRouter>
          <NotesWorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notes-list')).toBeInTheDocument();
      });

      const deleteBtns = screen.getAllByTestId('delete-note-button');
      fireEvent.click(deleteBtns[0]);

      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    });

    it('Cancel closes dialog and does NOT call deleteNote API', async () => {
      vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);

      render(
        <MemoryRouter>
          <NotesWorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notes-grid')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByTestId('delete-note-button')[0]);
      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();

      // Click Cancel
      fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));

      expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
      expect(notesApi.deleteNote).not.toHaveBeenCalled();
      // Both notes still present
      expect(screen.getAllByTestId('note-card')).toHaveLength(2);
    });

    it('Escape key closes dialog safely without calling deleteNote', async () => {
      vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);

      render(
        <MemoryRouter>
          <NotesWorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notes-grid')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByTestId('delete-note-button')[0]);
      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
      expect(notesApi.deleteNote).not.toHaveBeenCalled();
    });

    it('Confirm calls DELETE exactly once and removes note from UI', async () => {
      vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);
      vi.mocked(notesApi.deleteNote).mockResolvedValue(undefined);

      render(
        <MemoryRouter>
          <NotesWorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notes-grid')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByTestId('delete-note-button')[0]);
      fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      await waitFor(() => {
        expect(notesApi.deleteNote).toHaveBeenCalledTimes(1);
        expect(notesApi.deleteNote).toHaveBeenCalledWith(101);
      });

      // Dialog is closed and 101 is removed
      await waitFor(() => {
        expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
        expect(screen.queryByText('Algorithms Lecture Notes')).not.toBeInTheDocument();
        expect(screen.getByText('Operating Systems Study Guide')).toBeInTheDocument();
      });
    });

    it('Deleting last remaining note reveals empty state', async () => {
      vi.mocked(notesApi.fetchNotes).mockResolvedValue([sampleNotes[0]]);
      vi.mocked(notesApi.deleteNote).mockResolvedValue(undefined);

      render(
        <MemoryRouter>
          <NotesWorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('note-card')).toHaveLength(1);
      });

      fireEvent.click(screen.getByTestId('delete-note-button'));
      fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      await waitFor(() => {
        expect(notesApi.deleteNote).toHaveBeenCalledWith(101);
        expect(screen.getByTestId('empty-notes-state')).toBeInTheDocument();
      });
    });

    it('Delete failure keeps note visible and surfaces error message', async () => {
      vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);
      vi.mocked(notesApi.deleteNote).mockRejectedValue(new Error('Server error: unable to delete note'));

      render(
        <MemoryRouter>
          <NotesWorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notes-grid')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByTestId('delete-note-button')[0]);
      fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog-error')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-dialog-error')).toHaveTextContent('Server error: unable to delete note');
      });

      // Note still exists in workspace
      expect(screen.getByText('Algorithms Lecture Notes')).toBeInTheDocument();
    });

    it('Double confirm click cannot issue duplicate DELETE', async () => {
      vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);
      let resolveDelete: () => void = () => {};
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      vi.mocked(notesApi.deleteNote).mockReturnValue(deletePromise);

      render(
        <MemoryRouter>
          <NotesWorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notes-grid')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByTestId('delete-note-button')[0]);
      const confirmBtn = screen.getByTestId('confirm-dialog-confirm');

      // Click once
      fireEvent.click(confirmBtn);
      // Click again while in-flight
      fireEvent.click(confirmBtn);

      expect(notesApi.deleteNote).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveDelete();
      });
    });
  });

  describe('Editor Delete Flow & Concurrency', () => {
    it('New /notes/new draft does NOT expose persisted-note Delete action', () => {
      render(
        <MemoryRouter initialEntries={['/notes/new']}>
          <Routes>
            <Route path="/notes/new" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('editor-delete-button')).not.toBeInTheDocument();
    });

    it('Existing note editor exposes Delete affordance', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue(sampleNotes[0]);

      render(
        <MemoryRouter initialEntries={['/notes/101']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('editor-delete-button')).toBeInTheDocument();
      });
    });

    it('Editor delete success navigates to /', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue(sampleNotes[0]);
      vi.mocked(notesApi.deleteNote).mockResolvedValue(undefined);

      render(
        <MemoryRouter initialEntries={['/notes/101']}>
          <Routes>
            <Route path="/" element={<div data-testid="workspace-home">Workspace Home</div>} />
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('editor-delete-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('editor-delete-button'));
      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      await waitFor(() => {
        expect(notesApi.deleteNote).toHaveBeenCalledWith(101);
        expect(screen.getByTestId('workspace-home')).toBeInTheDocument();
      });
    });

    it('Deleted / not-found note does not remain infinite spinner (renders Note not found state)', async () => {
      vi.mocked(notesApi.fetchNote).mockRejectedValue(new Error('Note not found'));

      render(
        <MemoryRouter initialEntries={['/notes/999']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('note-not-found-state')).toBeInTheDocument();
        expect(screen.getByText('Note not found')).toBeInTheDocument();
        expect(screen.getByTestId('not-found-back-button')).toBeInTheDocument();
      });
    });

    it('Autosave does not PATCH after confirmed successful deletion', async () => {
      vi.useFakeTimers();

      vi.mocked(notesApi.fetchNote).mockResolvedValue(sampleNotes[0]);
      vi.mocked(notesApi.deleteNote).mockResolvedValue(undefined);
      vi.mocked(notesApi.updateNote).mockResolvedValue(sampleNotes[0]);

      render(
        <MemoryRouter initialEntries={['/notes/101']}>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for fetchNote to resolve and populate fields
      await act(async () => {
        await Promise.resolve();
      });

      const titleInput = screen.getByTestId('note-title-input');
      const deleteBtn = screen.getByTestId('editor-delete-button');

      // User modifies title -> debounce scheduled
      fireEvent.change(titleInput, { target: { value: 'Modified Before Delete' } });

      // Immediately confirm deletion
      fireEvent.click(deleteBtn);
      const confirmBtn = screen.getByTestId('confirm-dialog-confirm');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      expect(notesApi.deleteNote).toHaveBeenCalledWith(101);

      // Advance timers past 600ms debounce
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // INVARIANT: updateNote must NEVER have been called after deletion
      expect(notesApi.updateNote).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
