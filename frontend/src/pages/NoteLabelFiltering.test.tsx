import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotesWorkspacePage } from './NotesWorkspacePage';
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

const labels = [
  { id: 10, name: 'CS', created_at: '2026-09-04T00:00:00Z', updated_at: '2026-09-04T00:00:00Z' },
  { id: 20, name: 'Math', created_at: '2026-09-04T00:00:00Z', updated_at: '2026-09-04T00:00:00Z' },
];

const sampleNotes = [
  {
    id: 1,
    title: 'Note 1 with CS and Math',
    content: 'Content 1',
    is_pinned: false,
    labels: [labels[0], labels[1]],
    created_at: '2026-09-04T01:00:00Z',
    updated_at: '2026-09-04T01:00:00Z',
  },
  {
    id: 2,
    title: 'Note 2 with CS only',
    content: 'Content 2',
    is_pinned: false,
    labels: [labels[0]],
    created_at: '2026-09-04T02:00:00Z',
    updated_at: '2026-09-04T02:00:00Z',
  },
];

describe('LABEL-03 Label Filtering', () => {
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

    vi.mocked(labelsApi.fetchLabels).mockResolvedValue([...labels]);
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([...sampleNotes]);
  });

  it('renders label filter bar with chips for user labels', async () => {
    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    const chips = screen.getAllByTestId('label-filter-chip');
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveTextContent('CS');
    expect(chips[1]).toHaveTextContent('Math');
  });

  it('toggles label filter chip and passes label_ids to fetchNotes', async () => {
    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    const chips = screen.getAllByTestId('label-filter-chip');
    expect(chips[0]).toHaveAttribute('aria-pressed', 'false');

    // Click 'CS' (id: 10)
    await act(async () => {
      fireEvent.click(chips[0]);
    });

    expect(chips[0]).toHaveAttribute('aria-pressed', 'true');
    expect(notesApi.fetchNotes).toHaveBeenCalledWith('', [10], expect.any(AbortSignal));
    expect(screen.getByTestId('clear-label-filters-button')).toBeInTheDocument();
  });

  it('supports multi-label filtering (ALL-match semantics)', async () => {
    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    const chips = screen.getAllByTestId('label-filter-chip');

    // Select CS
    await act(async () => {
      fireEvent.click(chips[0]);
    });

    // Select Math
    await act(async () => {
      fireEvent.click(chips[1]);
    });

    expect(notesApi.fetchNotes).toHaveBeenLastCalledWith('', [10, 20], expect.any(AbortSignal));
  });

  it('clears label filters when clear button is clicked', async () => {
    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    const chips = screen.getAllByTestId('label-filter-chip');
    await act(async () => {
      fireEvent.click(chips[0]);
    });

    const clearBtn = screen.getByTestId('clear-label-filters-button');
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    expect(notesApi.fetchNotes).toHaveBeenLastCalledWith('', expect.any(AbortSignal));
    expect(screen.queryByTestId('clear-label-filters-button')).not.toBeInTheDocument();
  });

  it('shows empty-filtered-state when no notes match active label filter', async () => {
    vi.mocked(notesApi.fetchNotes)
      .mockResolvedValueOnce([...sampleNotes]) // Initial load
      .mockResolvedValueOnce([]); // Filter returned empty

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    const chips = screen.getAllByTestId('label-filter-chip');
    await act(async () => {
      fireEvent.click(chips[1]); // Math
    });

    await waitFor(() => {
      expect(screen.getByTestId('empty-filtered-state')).toBeInTheDocument();
    });
    expect(screen.getByText('No notes match your current filters.')).toBeInTheDocument();
    expect(screen.getByTestId('empty-filter-clear-button')).toBeInTheDocument();

    // Clicking clear in empty state resets
    await act(async () => {
      fireEvent.click(screen.getByTestId('empty-filter-clear-button'));
    });

    expect(notesApi.fetchNotes).toHaveBeenLastCalledWith('', expect.any(AbortSignal));
  });
});
