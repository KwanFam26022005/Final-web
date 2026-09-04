import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    is_pinned: true,
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

describe('NOTE-06 Note Pinning Tests', () => {
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

  it('renders Pinned section and Notes regular section when both exist', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('pinned-section')).toBeInTheDocument();
      expect(screen.getByTestId('pinned-section-heading')).toHaveTextContent('Pinned');
      expect(screen.getByTestId('notes-section')).toBeInTheDocument();
      expect(screen.getByTestId('regular-section-heading')).toHaveTextContent('Notes');
    });

    // Note 101 appears in pinned section, 102 appears in regular section
    const pinnedSection = screen.getByTestId('pinned-section');
    const notesSection = screen.getByTestId('notes-section');

    expect(pinnedSection).toHaveTextContent('Algorithms Lecture Notes');
    expect(pinnedSection).not.toHaveTextContent('Operating Systems Study Guide');

    expect(notesSection).toHaveTextContent('Operating Systems Study Guide');
    expect(notesSection).not.toHaveTextContent('Algorithms Lecture Notes');
  });

  it('note appears in exactly one section (no duplicate rendering)', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(2);
    });

    const cards = screen.getAllByTestId('note-card');
    expect(cards[0]).toHaveTextContent('Algorithms Lecture Notes');
    expect(cards[1]).toHaveTextContent('Operating Systems Study Guide');

    // Indicator on pinned note
    expect(screen.getByTestId('pinned-indicator')).toBeInTheDocument();
  });

  it('Grid pin action toggles unpinned note to pinned (NOTE-06)', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);
    vi.mocked(notesApi.pinNote).mockResolvedValue({
      ...sampleNotes[1],
      is_pinned: true,
    });

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(2);
    });

    // Pin button on unpinned note (102)
    const pinBtn = screen.getByLabelText('Pin Operating Systems Study Guide');
    expect(pinBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(pinBtn);

    // Moves optimistically into Pinned section
    const pinnedSection = screen.getByTestId('pinned-section');
    expect(pinnedSection).toHaveTextContent('Operating Systems Study Guide');
    expect(notesApi.pinNote).toHaveBeenCalledWith(102, true);
  });

  it('List pin action toggles pinned note to unpinned', async () => {
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

    vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);
    vi.mocked(notesApi.pinNote).mockResolvedValue({
      ...sampleNotes[0],
      is_pinned: false,
    });

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('note-row')).toHaveLength(2);
    });

    // Unpin button on pinned note (101)
    const unpinBtn = screen.getByLabelText('Unpin Algorithms Lecture Notes');
    expect(unpinBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(unpinBtn);

    // Moves note back to Notes regular section
    await waitFor(() => {
      const notesSection = screen.getByTestId('notes-section');
      expect(notesSection).toHaveTextContent('Algorithms Lecture Notes');
      expect(notesApi.pinNote).toHaveBeenCalledWith(101, false);
    });
  });

  it('rolls back optimistic pin state on server failure', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);
    vi.mocked(notesApi.pinNote).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(2);
    });

    const pinBtn = screen.getByLabelText('Pin Operating Systems Study Guide');
    fireEvent.click(pinBtn);

    // After failure, it rolls back to unpinned
    await waitFor(() => {
      const notesSection = screen.getByTestId('notes-section');
      expect(notesSection).toHaveTextContent('Operating Systems Study Guide');
      expect(screen.getByLabelText('Pin Operating Systems Study Guide')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('prevents duplicate pin requests while in flight', async () => {
    let resolvePin: (val: unknown) => void = () => {};
    const pinPromise = new Promise((resolve) => {
      resolvePin = resolve;
    });

    vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);
    vi.mocked(notesApi.pinNote).mockImplementation(() => pinPromise as never);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(2);
    });

    const pinBtn = screen.getByLabelText('Pin Operating Systems Study Guide');
    fireEvent.click(pinBtn);

    // After click, note moves into pinned section and button is Unpin... and disabled while in flight
    await waitFor(() => {
      const inFlightBtn = screen.getByLabelText('Unpin Operating Systems Study Guide');
      expect(inFlightBtn).toBeDisabled();
    });

    const inFlightBtn = screen.getByLabelText('Unpin Operating Systems Study Guide');
    // Secondary click while in flight does not fire another API call
    fireEvent.click(inFlightBtn);
    expect(notesApi.pinNote).toHaveBeenCalledTimes(1);

    resolvePin({ ...sampleNotes[1], is_pinned: true });
    await waitFor(() => {
      expect(screen.getByLabelText('Unpin Operating Systems Study Guide')).not.toBeDisabled();
    });
  });

  it('clicking pin does not trigger note navigation', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);
    vi.mocked(notesApi.pinNote).mockResolvedValue({
      ...sampleNotes[1],
      is_pinned: true,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<NotesWorkspacePage />} />
          <Route path="/notes/:noteId" element={<div data-testid="editor-route">Editor</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(2);
    });

    const pinBtn = screen.getByLabelText('Pin Operating Systems Study Guide');
    fireEvent.click(pinBtn);

    // Editor route should NOT be mounted
    expect(screen.queryByTestId('editor-route')).not.toBeInTheDocument();
  });

  it('persisted note editor exposes Pin control in header', async () => {
    vi.mocked(notesApi.fetchNote).mockResolvedValue(sampleNotes[0]);

    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('editor-pin-button')).toBeInTheDocument();
      expect(screen.getByTestId('editor-pin-button')).toHaveAttribute('aria-label', 'Unpin note');
      expect(screen.getByTestId('editor-pin-button')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('new draft /notes/new does not show pin control before persistence', () => {
    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <Routes>
          <Route path="/notes/new" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('editor-pin-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('editor-delete-button')).not.toBeInTheDocument();
  });
});
