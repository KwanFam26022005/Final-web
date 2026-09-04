import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NoteEditorPage } from './NoteEditorPage';
import * as notesApi from '../lib/api/notes';
import * as labelsApi from '../lib/api/labels';
import * as authContext from '../context';

vi.mock('../lib/api/notes');
vi.mock('../lib/api/labels');
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

const allLabels = [
  { id: 1, name: 'Computer Science', created_at: '2026-09-04T00:00:00Z', updated_at: '2026-09-04T00:00:00Z' },
  { id: 2, name: 'Algorithms', created_at: '2026-09-04T00:00:00Z', updated_at: '2026-09-04T00:00:00Z' },
  { id: 3, name: 'Database', created_at: '2026-09-04T00:00:00Z', updated_at: '2026-09-04T00:00:00Z' },
];

const mockNote = {
  id: 101,
  title: 'Data Structures Summary',
  content: 'Trees, Graphs, and Hash Tables.',
  is_pinned: false,
  labels: [
    { id: 1, name: 'Computer Science', created_at: '2026-09-04T00:00:00Z', updated_at: '2026-09-04T00:00:00Z' },
  ],
  created_at: '2026-09-04T01:00:00Z',
  updated_at: '2026-09-04T01:00:00Z',
};

describe('LABEL-02 Note Label Assignment', () => {
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

    vi.mocked(labelsApi.fetchLabels).mockResolvedValue([...allLabels]);
    vi.mocked(notesApi.fetchNote).mockResolvedValue({ ...mockNote });
    vi.mocked(notesApi.syncNoteLabels).mockResolvedValue({
      ...mockNote,
      labels: [allLabels[0], allLabels[1]],
    });
  });

  it('hides label assignment section on unpersisted /notes/new draft', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <Routes>
          <Route path="/notes/new" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('note-labels-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-label-button')).not.toBeInTheDocument();
  });

  it('renders assigned label chips on persisted note', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-labels-section')).toBeInTheDocument();
    });

    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByTestId('add-label-button')).toBeInTheDocument();
  });

  it('opens label picker dropdown and assigns new label to note', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-label-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-label-button'));

    expect(screen.getByTestId('label-picker')).toBeInTheDocument();
    const items = screen.getAllByTestId('label-picker-item');
    expect(items).toHaveLength(3);

    // Click 'Algorithms' (id: 2) to assign it
    await act(async () => {
      fireEvent.click(items[1]);
    });

    expect(notesApi.syncNoteLabels).toHaveBeenCalledWith(101, [1, 2]);
    await waitFor(() => {
      expect(screen.getByTestId('note-labels-section')).toHaveTextContent('Algorithms');
    });
  });

  it('removes label from note when remove button on chip is clicked', async () => {
    vi.mocked(notesApi.syncNoteLabels).mockResolvedValueOnce({
      ...mockNote,
      labels: [],
    });

    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('remove-label-button')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('remove-label-button'));
    });

    expect(notesApi.syncNoteLabels).toHaveBeenCalledWith(101, []);
    await waitFor(() => {
      expect(screen.queryByText('Computer Science')).not.toBeInTheDocument();
    });
  });

  it('rolls back label assignment when syncNoteLabels fails', async () => {
    vi.mocked(notesApi.syncNoteLabels).mockRejectedValueOnce(
      new Error('Failed to update labels.')
    );

    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-label-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-label-button'));
    const items = screen.getAllByTestId('label-picker-item');

    await act(async () => {
      fireEvent.click(items[1]); // Algorithms
    });

    await waitFor(() => {
      expect(screen.getByTestId('sync-label-error')).toHaveTextContent('Failed to update labels.');
    });

    // Rollback: Algorithms was not persisted in assigned labels
    expect(screen.queryByTestId('note-assigned-label')).toHaveTextContent('Computer Science');
    expect(screen.queryByTestId('note-assigned-label')).not.toHaveTextContent('Algorithms');
  });
});
