import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NoteEditorPage } from './NoteEditorPage';
import * as notesApi from '../lib/api/notes';
import * as attachmentsApi from '../lib/api/attachments';
import * as labelsApi from '../lib/api/labels';
import * as authContext from '../context';
import { ApiError } from '../lib/api/client';

vi.mock('../lib/api/notes');
vi.mock('../lib/api/attachments');
vi.mock('../lib/api/labels');
vi.mock('../context');

const mockOwner = {
  id: 1,
  display_name: 'Owner Alice',
  email: 'alice@example.com',
  email_verified_at: '2026-09-01T00:00:00Z',
  avatar_url: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

const mockCollaboratorBob = {
  id: 2,
  display_name: 'Collaborator Bob',
  email: 'bob@example.com',
  email_verified_at: '2026-09-01T00:00:00Z',
  avatar_url: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

describe('SHARE-03 & SHARE-04 Sharing and Permissions Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockOwner,
      preference: { theme: 'system', default_note_view: 'grid' },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      removeAvatar: vi.fn(),
      updatePassword: vi.fn(),
      resendVerification: vi.fn(),
      updatePreference: vi.fn(),
    });

    vi.mocked(labelsApi.fetchLabels).mockResolvedValue([]);
    vi.mocked(attachmentsApi.fetchAttachments).mockResolvedValue([]);
  });

  describe('SHARE-03: User-to-User Sharing Flow', () => {
    it('allows owner to open share modal, loads shares, adds collaborator, and changes permission', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 101,
        title: 'Project Roadmap',
        content: 'Initial planning notes.',
        is_pinned: false,
        is_protected: false,
        is_unlocked: true,
        access_type: 'owner',
        permission: 'owner',
        labels: [],
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T10:00:00Z',
      });

      vi.mocked(notesApi.fetchNoteShares).mockResolvedValue([
        {
          id: 1,
          note_id: 101,
          permission: 'read',
          user: {
            id: 2,
            display_name: 'Bob Collaborator',
            email: 'bob@example.com',
          },
          created_at: '2026-09-06T10:05:00Z',
          updated_at: '2026-09-06T10:05:00Z',
        },
      ]);

      render(
        <MemoryRouter initialEntries={['/notes/101']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('share-note-button')).toBeInTheDocument();
      });

      // Open share modal
      fireEvent.click(screen.getByTestId('share-note-button'));

      await waitFor(() => {
        expect(screen.getByTestId('share-modal')).toBeInTheDocument();
        expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      });

      expect(notesApi.fetchNoteShares).toHaveBeenCalledWith(101);

      // Add a new collaborator (Carol)
      vi.mocked(notesApi.createNoteShare).mockResolvedValue({
        id: 2,
        note_id: 101,
        permission: 'edit',
        user: {
          id: 3,
          display_name: 'Carol Engineer',
          email: 'carol@example.com',
        },
        created_at: '2026-09-06T10:10:00Z',
        updated_at: '2026-09-06T10:10:00Z',
      });

      fireEvent.change(screen.getByTestId('share-email-input'), {
        target: { value: 'carol@example.com' },
      });
      fireEvent.click(screen.getByTestId('share-perm-edit'));
      fireEvent.click(screen.getByTestId('confirm-share-button'));

      await waitFor(() => {
        expect(notesApi.createNoteShare).toHaveBeenCalledWith(101, {
          email: 'carol@example.com',
          permission: 'edit',
        });
        expect(screen.getByText('carol@example.com')).toBeInTheDocument();
        expect(screen.getByTestId('share-success')).toHaveTextContent(
          'Shared with carol@example.com (edit).'
        );
      });

      // Update Bob's permission from read to edit
      vi.mocked(notesApi.updateNoteShare).mockResolvedValue({
        id: 1,
        note_id: 101,
        permission: 'edit',
        user: {
          id: 2,
          display_name: 'Bob Collaborator',
          email: 'bob@example.com',
        },
        created_at: '2026-09-06T10:05:00Z',
        updated_at: '2026-09-06T10:15:00Z',
      });

      const bobSelect = screen.getByLabelText('Change permission for bob@example.com');
      fireEvent.change(bobSelect, { target: { value: 'edit' } });

      await waitFor(() => {
        expect(notesApi.updateNoteShare).toHaveBeenCalledWith(1, { permission: 'edit' });
      });
    });

    it('shows error banner when share creation fails (e.g. self-sharing or user not found)', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 101,
        title: 'Project Roadmap',
        content: 'Initial planning notes.',
        is_pinned: false,
        is_protected: false,
        is_unlocked: true,
        access_type: 'owner',
        permission: 'owner',
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T10:00:00Z',
      });

      vi.mocked(notesApi.fetchNoteShares).mockResolvedValue([]);

      vi.mocked(notesApi.createNoteShare).mockRejectedValue(
        new ApiError('You cannot share a note with yourself.', 422, {
          email: ['You cannot share a note with yourself.'],
        })
      );

      render(
        <MemoryRouter initialEntries={['/notes/101']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('share-note-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('share-note-button'));

      await waitFor(() => {
        expect(screen.getByTestId('share-modal')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('share-email-input'), {
        target: { value: 'alice@example.com' },
      });
      fireEvent.click(screen.getByTestId('confirm-share-button'));

      await waitFor(() => {
        expect(screen.getByTestId('share-error')).toHaveTextContent(
          'You cannot share a note with yourself.'
        );
      });
    });

    it('allows revoking a share with confirmation dialog', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 101,
        title: 'Project Roadmap',
        content: 'Initial planning notes.',
        is_pinned: false,
        is_protected: false,
        is_unlocked: true,
        access_type: 'owner',
        permission: 'owner',
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T10:00:00Z',
      });

      vi.mocked(notesApi.fetchNoteShares).mockResolvedValue([
        {
          id: 5,
          note_id: 101,
          permission: 'read',
          user: {
            id: 2,
            display_name: 'Bob Collaborator',
            email: 'bob@example.com',
          },
          created_at: '2026-09-06T10:05:00Z',
          updated_at: '2026-09-06T10:05:00Z',
        },
      ]);

      vi.mocked(notesApi.deleteNoteShare).mockResolvedValue({ message: 'Share revoked successfully.' });

      render(
        <MemoryRouter initialEntries={['/notes/101']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('share-note-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('share-note-button'));

      await waitFor(() => {
        expect(screen.getByTestId('share-modal')).toBeInTheDocument();
        expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      });

      // Click revoke button on Bob's share
      fireEvent.click(screen.getByTestId('revoke-share-button'));

      // Confirm dialog appears
      await waitFor(() => {
        expect(screen.getByTestId('confirm-revoke-dialog')).toBeInTheDocument();
      });

      // Click cancel
      fireEvent.click(screen.getByTestId('cancel-revoke-button'));
      expect(screen.queryByTestId('confirm-revoke-dialog')).not.toBeInTheDocument();
      expect(notesApi.deleteNoteShare).not.toHaveBeenCalled();

      // Click revoke again and confirm
      fireEvent.click(screen.getByTestId('revoke-share-button'));
      fireEvent.click(screen.getByTestId('confirm-revoke-button'));

      await waitFor(() => {
        expect(notesApi.deleteNoteShare).toHaveBeenCalledWith(5);
        expect(screen.queryByTestId('confirm-revoke-dialog')).not.toBeInTheDocument();
        expect(screen.queryByText('bob@example.com')).not.toBeInTheDocument();
      });
    });
  });

  describe('SHARE-04: Granular Permissions Enforcement', () => {
    it('enforces read-only mode for collaborator with permission="read"', async () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: mockCollaboratorBob,
        preference: { theme: 'system', default_note_view: 'grid' },
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
        updateProfile: vi.fn(),
        uploadAvatar: vi.fn(),
        removeAvatar: vi.fn(),
        updatePassword: vi.fn(),
        resendVerification: vi.fn(),
        updatePreference: vi.fn(),
      });

      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 202,
        title: 'Confidential Spec',
        content: 'Read only specifications.',
        is_pinned: false,
        is_protected: false,
        is_unlocked: true,
        access_type: 'shared',
        permission: 'read',
        labels: [],
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T10:00:00Z',
      });

      vi.mocked(attachmentsApi.fetchAttachments).mockResolvedValue([
        {
          id: 11,
          note_id: 202,
          original_name: 'diagram.png',
          mime_type: 'image/png',
          size_bytes: 4096,
          created_at: '2026-09-06T10:00:00Z',
        },
      ]);

      render(
        <MemoryRouter initialEntries={['/notes/202']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('permission-badge')).toHaveTextContent('Read only');
      });

      // Title and content are disabled / read-only
      const titleInput = screen.getByTestId('note-title-input');
      const contentInput = screen.getByTestId('note-content-input');
      expect(titleInput).toBeDisabled();
      expect(contentInput).toHaveAttribute('readonly');

      // Owner-only actions are NOT rendered
      expect(screen.queryByTestId('share-note-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('editor-pin-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('editor-delete-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('protect-note-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('remove-protection-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('note-labels-section')).not.toBeInTheDocument();

      // Attachments: Can view and download, but CANNOT add or delete
      expect(screen.getByTestId('open-attachment-button')).toBeInTheDocument();
      expect(screen.getByTestId('download-attachment-button')).toBeInTheDocument();
      expect(screen.queryByTestId('add-attachment-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('delete-attachment-button')).not.toBeInTheDocument();
    });

    it('enforces edit capability for collaborator with permission="edit" but restricts owner actions', async () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: mockCollaboratorBob,
        preference: { theme: 'system', default_note_view: 'grid' },
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
        updateProfile: vi.fn(),
        uploadAvatar: vi.fn(),
        removeAvatar: vi.fn(),
        updatePassword: vi.fn(),
        resendVerification: vi.fn(),
        updatePreference: vi.fn(),
      });

      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 203,
        title: 'Collaborative Sprint Backlog',
        content: 'Tasks to complete.',
        is_pinned: false,
        is_protected: false,
        is_unlocked: true,
        access_type: 'shared',
        permission: 'edit',
        labels: [],
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T10:00:00Z',
      });

      vi.mocked(attachmentsApi.fetchAttachments).mockResolvedValue([
        {
          id: 12,
          note_id: 203,
          original_name: 'backlog.pdf',
          mime_type: 'application/pdf',
          size_bytes: 8192,
          created_at: '2026-09-06T10:00:00Z',
        },
      ]);

      render(
        <MemoryRouter initialEntries={['/notes/203']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('permission-badge')).toHaveTextContent('Can edit');
      });

      // Title and content are editable
      const titleInput = screen.getByTestId('note-title-input');
      const contentInput = screen.getByTestId('note-content-input');
      expect(titleInput).not.toBeDisabled();
      expect(contentInput).not.toHaveAttribute('readonly');

      // Attachments: Can add and delete
      expect(screen.getByTestId('add-attachment-button')).toBeInTheDocument();
      expect(screen.getByTestId('delete-attachment-button')).toBeInTheDocument();
      expect(screen.getByTestId('open-attachment-button')).toBeInTheDocument();
      expect(screen.getByTestId('download-attachment-button')).toBeInTheDocument();

      // Owner-only actions remain strictly NOT rendered
      expect(screen.queryByTestId('share-note-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('editor-pin-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('editor-delete-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('protect-note-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('remove-protection-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('note-labels-section')).not.toBeInTheDocument();
    });

    it('handles permission downgrade on save attempt by locking editor and showing alert banner', async () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        user: mockCollaboratorBob,
        preference: { theme: 'system', default_note_view: 'grid' },
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
        updateProfile: vi.fn(),
        uploadAvatar: vi.fn(),
        removeAvatar: vi.fn(),
        updatePassword: vi.fn(),
        resendVerification: vi.fn(),
        updatePreference: vi.fn(),
      });

      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 204,
        title: 'Draft Document',
        content: 'Original content.',
        is_pinned: false,
        is_protected: false,
        is_unlocked: true,
        access_type: 'shared',
        permission: 'edit',
        labels: [],
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T10:00:00Z',
      });

      // When update is attempted, backend rejects with 403 Forbidden
      vi.mocked(notesApi.updateNote).mockRejectedValue(
        new ApiError('This action is unauthorized.', 403)
      );

      render(
        <MemoryRouter initialEntries={['/notes/204']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('permission-badge')).toHaveTextContent('Can edit');
      });

      // Type in title to trigger autosave debounce
      fireEvent.change(screen.getByTestId('note-title-input'), {
        target: { value: 'Modified Title' },
      });

      // Fast forward debounce / wait for save attempt
      await waitFor(
        () => {
          expect(notesApi.updateNote).toHaveBeenCalled();
        },
        { timeout: 2500 }
      );

      // Verify that downgrade banner appears and editor locks down to Read only
      await waitFor(() => {
        expect(screen.getByTestId('permission-downgrade-banner')).toHaveTextContent(
          'You no longer have permission to edit this note.'
        );
        expect(screen.getByTestId('permission-badge')).toHaveTextContent('Read only');
        expect(screen.getByTestId('note-title-input')).toBeDisabled();
        expect(screen.getByTestId('note-content-input')).toHaveAttribute('readonly');
      });
    });
  });
});
