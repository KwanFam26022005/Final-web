import { render, screen, fireEvent, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotesWorkspacePage } from './NotesWorkspacePage';
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
    title: 'Database Systems Guide',
    content: 'ACID transactions and B-Trees.',
    is_pinned: false,
    created_at: '2026-09-03T09:00:00Z',
    updated_at: '2026-09-03T11:00:00Z',
  },
];

describe('NOTE-07 Live Search Tests', () => {
  const mockUpdatePreference = vi.fn().mockResolvedValue(undefined);
  const mockLogout = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.useFakeTimers();
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input and searching status', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const input = screen.getByTestId('search-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search your notes...');
    expect(input).toHaveAttribute('aria-label', 'Search your notes');
  });

  it('debounces search: 299ms triggers no request, 300ms triggers request', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(notesApi.fetchNotes).toHaveBeenCalledTimes(1); // initial load

    const input = screen.getByTestId('search-input');

    // Type query
    fireEvent.change(input, { target: { value: 'database' } });

    // Advance 299ms
    act(() => {
      vi.advanceTimersByTime(299);
    });

    // Still only initial call
    expect(notesApi.fetchNotes).toHaveBeenCalledTimes(1);

    // Advance 1ms more to reach 300ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    // Now called with query 'database'
    expect(notesApi.fetchNotes).toHaveBeenCalledTimes(2);
    expect(notesApi.fetchNotes).toHaveBeenLastCalledWith('database', expect.any(AbortSignal));
  });

  it('restores normal collection when search is cleared', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValueOnce([...sampleNotes]);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getAllByTestId('note-card')).toHaveLength(2);

    const input = screen.getByTestId('search-input');

    // Search for algorithm
    vi.mocked(notesApi.fetchNotes).mockResolvedValueOnce([sampleNotes[0]]);
    fireEvent.change(input, { target: { value: 'algorithm' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getByTestId('clear-search-button')).toBeInTheDocument();

    // Click clear search
    vi.mocked(notesApi.fetchNotes).mockResolvedValueOnce([...sampleNotes]);
    fireEvent.click(screen.getByTestId('clear-search-button'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(input).toHaveValue('');
    expect(screen.getAllByTestId('note-card')).toHaveLength(2);
    expect(notesApi.fetchNotes).toHaveBeenLastCalledWith('', expect.any(AbortSignal));
  });

  it('renders search empty state when zero matches returned (distinct from global empty state)', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValueOnce([...sampleNotes]);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getAllByTestId('note-card')).toHaveLength(2);

    const input = screen.getByTestId('search-input');
    vi.mocked(notesApi.fetchNotes).mockResolvedValueOnce([]);

    fireEvent.change(input, { target: { value: 'nonexistentquery' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getByTestId('empty-search-state')).toBeInTheDocument();
    expect(screen.getByText('No notes match your search.')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-notes-state')).not.toBeInTheDocument();
  });

  it('ensures latest search response wins race (older response cannot overwrite)', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValueOnce([...sampleNotes]);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getAllByTestId('note-card')).toHaveLength(2);

    let resolveFirst: (val: typeof sampleNotes) => void = () => {};
    let resolveSecond: (val: typeof sampleNotes) => void = () => {};

    const firstPromise = new Promise<typeof sampleNotes>((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise<typeof sampleNotes>((resolve) => {
      resolveSecond = resolve;
    });

    vi.mocked(notesApi.fetchNotes)
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => secondPromise);

    const input = screen.getByTestId('search-input');

    // First search: 'a'
    fireEvent.change(input, { target: { value: 'a' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // Second search: 'algo'
    fireEvent.change(input, { target: { value: 'algo' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // Second response completes FIRST with [sampleNotes[0]]
    await act(async () => {
      resolveSecond([sampleNotes[0]]);
    });

    expect(screen.getAllByTestId('note-card')).toHaveLength(1);

    // Older first response completes LATER with [sampleNotes[0], sampleNotes[1]]
    await act(async () => {
      resolveFirst([...sampleNotes]);
    });

    // Should still display only 1 note (second search result)
    expect(screen.getAllByTestId('note-card')).toHaveLength(1);
    expect(screen.getByText('Algorithms Lecture Notes')).toBeInTheDocument();
    expect(screen.queryByText('Database Systems Guide')).not.toBeInTheDocument();
  });

  it('switching Grid / List retains active search query and results', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValueOnce([...sampleNotes]);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByTestId('notes-grid')).toBeInTheDocument();

    const input = screen.getByTestId('search-input');
    vi.mocked(notesApi.fetchNotes).mockResolvedValueOnce([sampleNotes[0]]);

    fireEvent.change(input, { target: { value: 'Algorithms' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getAllByTestId('note-card')).toHaveLength(1);

    // Switch to list view
    fireEvent.click(screen.getByTestId('list-view-button'));

    expect(mockUpdatePreference).toHaveBeenCalledWith(undefined, 'list');
    expect(input).toHaveValue('Algorithms');
  });

  it('pinning while search is active keeps query and moves note into Pinned section', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValueOnce([sampleNotes[0]]);
    vi.mocked(notesApi.pinNote).mockResolvedValue({
      ...sampleNotes[0],
      is_pinned: true,
    });

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getAllByTestId('note-card')).toHaveLength(1);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Algorithms' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const pinBtn = screen.getByLabelText('Pin Algorithms Lecture Notes');
    await act(async () => {
      fireEvent.click(pinBtn);
    });

    // Moves into Pinned section
    expect(screen.getByTestId('pinned-section')).toBeInTheDocument();
    expect(screen.getByTestId('pinned-section')).toHaveTextContent('Algorithms Lecture Notes');

    // Query remains intact
    expect(input).toHaveValue('Algorithms');
  });

  it('deleting during search removes result and shows empty search state if last note', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([sampleNotes[0]]);
    vi.mocked(notesApi.deleteNote).mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getAllByTestId('note-card')).toHaveLength(1);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Algorithms' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const deleteBtn = screen.getByLabelText('Delete Algorithms Lecture Notes');
    fireEvent.click(deleteBtn);

    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByTestId('empty-search-state')).toBeInTheDocument();
  });
});
