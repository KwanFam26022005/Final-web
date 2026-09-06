import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NotesWorkspacePage } from './NotesWorkspacePage';
import { NoteEditorPage } from './NoteEditorPage';
import * as notesApi from '../lib/api/notes';
import * as authContext from '../context';
import { ApiError } from '../lib/api/client';

vi.mock('../lib/api/notes');
vi.mock('../context');

const mockUser = {
  id: 1,
  display_name: 'Cryptographer Alice',
  email: 'alice@example.com',
  email_verified_at: '2026-09-01T00:00:00Z',
  avatar_url: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

describe('SHARE-01 & SHARE-02 Note Protection Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
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
  });

  describe('Workspace representation (SHARE-01)', () => {
    it('renders locked note indicator and replaces content with locked placeholder', async () => {
      vi.mocked(notesApi.fetchNotes).mockResolvedValue([
        {
          id: 501,
          title: 'Classified Strategy',
          content: null,
          is_pinned: false,
          is_protected: true,
          is_unlocked: false,
          created_at: '2026-09-06T10:00:00Z',
          updated_at: '2026-09-06T11:00:00Z',
        },
        {
          id: 502,
          title: 'Public Agenda',
          content: 'Plain open text.',
          is_pinned: false,
          is_protected: false,
          is_unlocked: true,
          created_at: '2026-09-06T10:00:00Z',
          updated_at: '2026-09-06T11:00:00Z',
        },
      ]);

      render(
        <MemoryRouter initialEntries={['/']}>
          <NotesWorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Classified Strategy')).toBeInTheDocument();
      });

      expect(screen.getByTestId('locked-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('locked-note-excerpt')).toHaveTextContent(
        'Locked note · Unlock to view content'
      );
      expect(screen.queryByText('Classified secret data')).not.toBeInTheDocument();

      expect(screen.getByText('Public Agenda')).toBeInTheDocument();
      expect(screen.getByText('Plain open text.')).toBeInTheDocument();
    });

    it('renders unlocked indicator when protected note is unlocked in session', async () => {
      vi.mocked(notesApi.fetchNotes).mockResolvedValue([
        {
          id: 501,
          title: 'Unlocked Secret Document',
          content: 'Session-unlocked confidential data.',
          is_pinned: false,
          is_protected: true,
          is_unlocked: true,
          created_at: '2026-09-06T10:00:00Z',
          updated_at: '2026-09-06T11:00:00Z',
        },
      ]);

      render(
        <MemoryRouter initialEntries={['/']}>
          <NotesWorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Unlocked Secret Document')).toBeInTheDocument();
      });

      expect(screen.getByTestId('unlocked-indicator')).toBeInTheDocument();
      expect(screen.getByText('Session-unlocked confidential data.')).toBeInTheDocument();
      expect(screen.queryByTestId('locked-note-excerpt')).not.toBeInTheDocument();
    });
  });

  describe('Editor locked state and unlock flow (SHARE-02)', () => {
    it('hides content textarea, disables title, and renders unlock view for locked note', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 501,
        title: 'Vault Note',
        content: null,
        is_pinned: false,
        is_protected: true,
        is_unlocked: false,
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      });

      render(
        <MemoryRouter initialEntries={['/notes/501']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('locked-note-view')).toBeInTheDocument();
      });

      expect(screen.getByTestId('locked-status')).toHaveTextContent('Locked');
      expect(screen.getByTestId('note-title-input')).toBeDisabled();
      expect(screen.queryByTestId('note-content-input')).not.toBeInTheDocument();
      expect(screen.getByTestId('unlock-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('unlock-note-button')).toBeInTheDocument();
    });

    it('rejects incorrect password with error message and keeps note locked', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 501,
        title: 'Vault Note',
        content: null,
        is_pinned: false,
        is_protected: true,
        is_unlocked: false,
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      });

      vi.mocked(notesApi.unlockNote).mockRejectedValue(
        new ApiError('Incorrect note password.', 422, {
          password: ['Incorrect note password.'],
        })
      );

      render(
        <MemoryRouter initialEntries={['/notes/501']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('locked-note-view')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('unlock-password-input'), {
        target: { value: 'WrongPassword!' },
      });
      fireEvent.click(screen.getByTestId('unlock-note-button'));

      await waitFor(() => {
        expect(screen.getByTestId('unlock-error')).toHaveTextContent('Incorrect note password.');
      });

      expect(screen.queryByTestId('note-content-input')).not.toBeInTheDocument();
    });

    it('successfully unlocks note with valid password, reveals content, and allows editing', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 501,
        title: 'Vault Note',
        content: null,
        is_pinned: false,
        is_protected: true,
        is_unlocked: false,
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      });

      vi.mocked(notesApi.unlockNote).mockResolvedValue({
        id: 501,
        title: 'Vault Note',
        content: 'Decrypted confidential payload.',
        is_pinned: false,
        is_protected: true,
        is_unlocked: true,
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      });

      render(
        <MemoryRouter initialEntries={['/notes/501']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('locked-note-view')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('unlock-password-input'), {
        target: { value: 'SecretKey2026!' },
      });
      fireEvent.click(screen.getByTestId('unlock-note-button'));

      await waitFor(() => {
        expect(screen.getByTestId('note-content-input')).toBeInTheDocument();
      });

      expect(screen.getByTestId('note-content-input')).toHaveValue('Decrypted confidential payload.');
      expect(screen.queryByTestId('locked-note-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('note-title-input')).not.toBeDisabled();
      expect(screen.getByTestId('lock-now-button')).toBeInTheDocument();
      expect(screen.getByTestId('remove-protection-button')).toBeInTheDocument();
    });
  });

  describe('Protection lifecycle and manual lock (SHARE-01 & SHARE-02)', () => {
    it('allows owner to set password protection on an unprotected note', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 601,
        title: 'Open Draft',
        content: 'Initial open text.',
        is_pinned: false,
        is_protected: false,
        is_unlocked: true,
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      });

      vi.mocked(notesApi.protectNote).mockResolvedValue({
        id: 601,
        title: 'Open Draft',
        content: 'Initial open text.',
        is_pinned: false,
        is_protected: true,
        is_unlocked: true,
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      });

      render(
        <MemoryRouter initialEntries={['/notes/601']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protect-note-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('protect-note-button'));

      expect(screen.getByTestId('protect-modal')).toBeInTheDocument();

      // Test validation: short password
      fireEvent.change(screen.getByTestId('protect-password-input'), {
        target: { value: 'short' },
      });
      fireEvent.change(screen.getByTestId('protect-password-confirm-input'), {
        target: { value: 'short' },
      });
      fireEvent.click(screen.getByTestId('confirm-protect-button'));

      expect(screen.getByTestId('protect-error')).toHaveTextContent('Password must be at least 8 characters.');

      // Test validation: mismatch
      fireEvent.change(screen.getByTestId('protect-password-input'), {
        target: { value: 'ValidPassword123!' },
      });
      fireEvent.change(screen.getByTestId('protect-password-confirm-input'), {
        target: { value: 'DifferentPassword123!' },
      });
      fireEvent.click(screen.getByTestId('confirm-protect-button'));

      expect(screen.getByTestId('protect-error')).toHaveTextContent('Password confirmation does not match.');

      // Valid protection
      fireEvent.change(screen.getByTestId('protect-password-confirm-input'), {
        target: { value: 'ValidPassword123!' },
      });
      fireEvent.click(screen.getByTestId('confirm-protect-button'));

      await waitFor(() => {
        expect(notesApi.protectNote).toHaveBeenCalledWith(601, {
          password: 'ValidPassword123!',
          password_confirmation: 'ValidPassword123!',
        });
      });

      expect(screen.queryByTestId('protect-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('lock-now-button')).toBeInTheDocument();
    });

    it('manual lock button immediately clears plaintext content and locks the view', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 701,
        title: 'Sensitive Financials',
        content: 'Top secret balance sheet data.',
        is_pinned: false,
        is_protected: true,
        is_unlocked: true,
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      });

      vi.mocked(notesApi.lockNote).mockResolvedValue({
        id: 701,
        title: 'Sensitive Financials',
        content: null,
        is_pinned: false,
        is_protected: true,
        is_unlocked: false,
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      });

      render(
        <MemoryRouter initialEntries={['/notes/701']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('note-content-input')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('lock-now-button'));

      await waitFor(() => {
        expect(notesApi.lockNote).toHaveBeenCalledWith(701);
      });

      expect(screen.queryByTestId('note-content-input')).not.toBeInTheDocument();
      expect(screen.getByTestId('locked-note-view')).toBeInTheDocument();
      expect(screen.getByTestId('note-title-input')).toBeDisabled();
    });

    it('allows owner to remove password protection with password confirmation', async () => {
      vi.mocked(notesApi.fetchNote).mockResolvedValue({
        id: 801,
        title: 'Project Roadmap',
        content: 'Roadmap content here.',
        is_pinned: false,
        is_protected: true,
        is_unlocked: true,
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      });

      vi.mocked(notesApi.removeNoteProtection).mockResolvedValue({
        id: 801,
        title: 'Project Roadmap',
        content: 'Roadmap content here.',
        is_pinned: false,
        is_protected: false,
        is_unlocked: true,
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      });

      render(
        <MemoryRouter initialEntries={['/notes/801']}>
          <Routes>
            <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('remove-protection-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('remove-protection-button'));

      expect(screen.getByTestId('remove-protection-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('remove-protection-password-input'), {
        target: { value: 'SecretPassword123!' },
      });
      fireEvent.click(screen.getByTestId('confirm-remove-protection-button'));

      await waitFor(() => {
        expect(notesApi.removeNoteProtection).toHaveBeenCalledWith(801, {
          password: 'SecretPassword123!',
        });
      });

      expect(screen.queryByTestId('remove-protection-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('protect-note-button')).toBeInTheDocument();
      expect(screen.queryByTestId('lock-now-button')).not.toBeInTheDocument();
    });
  });
});
