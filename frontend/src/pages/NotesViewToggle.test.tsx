import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const mockNotes = [
  {
    id: 1,
    title: 'First Note',
    content: 'First note content text.',
    is_pinned: false,
    created_at: '2026-09-03T10:00:00Z',
    updated_at: '2026-09-03T12:00:00Z',
  },
  {
    id: 2,
    title: 'Second Note',
    content: 'Second note content text.',
    is_pinned: false,
    created_at: '2026-09-03T09:00:00Z',
    updated_at: '2026-09-03T11:00:00Z',
  },
];

describe('NotesWorkspacePage (NOTE-01 & NOTE-02 workspace layout)', () => {
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

    vi.mocked(notesApi.fetchNotes).mockResolvedValue(mockNotes);
  });

  it('renders notes in grid view by default (NOTE-01)', async () => {
    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notes-grid')).toBeInTheDocument();
    });

    const cards = screen.getAllByTestId('note-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('First Note')).toBeInTheDocument();
    expect(screen.getByText('Second Note')).toBeInTheDocument();

    const gridBtn = screen.getByTestId('grid-view-button');
    expect(gridBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles to list view and calls updatePreference (NOTE-01)', async () => {
    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notes-grid')).toBeInTheDocument();
    });

    const listBtn = screen.getByTestId('list-view-button');
    fireEvent.click(listBtn);

    expect(mockUpdatePreference).toHaveBeenCalledWith(undefined, 'list');
  });

  it('renders list view when user preference is list (NOTE-01)', async () => {
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

    const rows = screen.getAllByTestId('note-row');
    expect(rows).toHaveLength(2);
    expect(screen.queryByTestId('notes-grid')).not.toBeInTheDocument();

    const listBtn = screen.getByTestId('list-view-button');
    expect(listBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('renders empty state with WiseCat when there are no notes', async () => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('empty-notes-state')).toBeInTheDocument();
    });

    expect(screen.getByText('Your knowledge space is ready.')).toBeInTheDocument();
    expect(screen.getByTestId('empty-new-note')).toBeInTheDocument();
  });
});
