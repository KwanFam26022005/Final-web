import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SharedWorkspacePage } from './SharedWorkspacePage';
import * as notesApi from '../lib/api/notes';
import * as authContext from '../context';

vi.mock('../lib/api/notes');
vi.mock('../context');

const mockUser = {
  id: 2,
  display_name: 'Bob Collaborator',
  email: 'bob@example.com',
  email_verified_at: '2026-09-01T00:00:00Z',
  avatar_url: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

const mockSharedItems: notesApi.SharedNoteItem[] = [
  {
    share_id: 10,
    permission: 'read',
    shared_at: '2026-09-06T10:00:00Z',
    shared_by: {
      id: 1,
      display_name: 'Alice Owner',
      email: 'alice@example.com',
    },
    note: {
      id: 101,
      title: 'Company Roadmap 2026',
      content: 'Confidential strategic planning details.',
      is_protected: false,
      is_unlocked: true,
      created_at: '2026-09-06T09:00:00Z',
      updated_at: '2026-09-06T09:30:00Z',
    },
  },
  {
    share_id: 11,
    permission: 'edit',
    shared_at: '2026-09-06T11:00:00Z',
    shared_by: {
      id: 3,
      display_name: 'Carol Director',
      email: 'carol@example.com',
    },
    note: {
      id: 102,
      title: 'Engineering Sprint Backlog',
      content: 'Collaborative task assignments and estimates.',
      is_protected: false,
      is_unlocked: true,
      created_at: '2026-09-06T10:30:00Z',
      updated_at: '2026-09-06T11:00:00Z',
    },
  },
];

describe('SHARE-05: Recipient Shared Workspace Tests', () => {
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

  it('renders shared navigation link, header, and loading state initially', async () => {
    vi.mocked(notesApi.fetchSharedNotes).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={['/shared']}>
        <Routes>
          <Route path="/shared" element={<SharedWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('shared-nav-link')).toBeInTheDocument();
    expect(screen.getByTestId('shared-workspace-heading')).toHaveTextContent('Shared with me');
    expect(screen.getByTestId('shared-loading-state')).toBeInTheDocument();
  });

  it('renders dedicated empty state when no notes have been shared with user', async () => {
    vi.mocked(notesApi.fetchSharedNotes).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/shared']}>
        <Routes>
          <Route path="/shared" element={<SharedWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('shared-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No notes have been shared with you yet.')).toBeInTheDocument();
      expect(screen.queryByTestId('shared-loading-state')).not.toBeInTheDocument();
    });
  });

  it('renders error state and retries successfully', async () => {
    vi.mocked(notesApi.fetchSharedNotes)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockSharedItems);

    render(
      <MemoryRouter initialEntries={['/shared']}>
        <Routes>
          <Route path="/shared" element={<SharedWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('shared-error-state')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('shared-retry-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('shared-error-state')).not.toBeInTheDocument();
      expect(screen.getByText('Company Roadmap 2026')).toBeInTheDocument();
    });
  });

  it('renders shared cards with permission badges, sharer name, shared indicator, and timestamp', async () => {
    vi.mocked(notesApi.fetchSharedNotes).mockResolvedValue(mockSharedItems);

    render(
      <MemoryRouter initialEntries={['/shared']}>
        <Routes>
          <Route path="/shared" element={<SharedWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Company Roadmap 2026')).toBeInTheDocument();
      expect(screen.getByText('Engineering Sprint Backlog')).toBeInTheDocument();
    });

    const sharedIndicators = screen.getAllByTestId('shared-indicator');
    expect(sharedIndicators).toHaveLength(2);

    const permissionBadges = screen.getAllByTestId('permission-badge');
    expect(permissionBadges[0]).toHaveTextContent('Read only');
    expect(permissionBadges[1]).toHaveTextContent('Can edit');

    const sharerNames = screen.getAllByTestId('sharer-name');
    expect(sharerNames[0]).toHaveTextContent('Shared by Alice Owner');
    expect(sharerNames[1]).toHaveTextContent('Shared by Carol Director');

    const timestamps = screen.getAllByTestId('shared-timestamp');
    expect(timestamps).toHaveLength(2);
    expect(timestamps[0]).toHaveAttribute('datetime', '2026-09-06T10:00:00Z');
  });

  it('redacts content excerpt and shows locked indicator for locked protected note', async () => {
    const lockedSharedNote: notesApi.SharedNoteItem = {
      share_id: 12,
      permission: 'read',
      shared_at: '2026-09-06T12:00:00Z',
      shared_by: {
        id: 1,
        display_name: 'Alice Owner',
        email: 'alice@example.com',
      },
      note: {
        id: 103,
        title: 'Secret Formula Document',
        content: null, // redacted server-side
        is_protected: true,
        is_unlocked: false,
        created_at: '2026-09-06T11:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      },
    };

    vi.mocked(notesApi.fetchSharedNotes).mockResolvedValue([lockedSharedNote]);

    render(
      <MemoryRouter initialEntries={['/shared']}>
        <Routes>
          <Route path="/shared" element={<SharedWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Secret Formula Document')).toBeInTheDocument();
    });

    expect(screen.getByTestId('locked-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('locked-note-excerpt')).toHaveTextContent(
      'Locked note · Unlock to view content'
    );
    expect(screen.queryByTestId('note-excerpt')).not.toBeInTheDocument();
  });

  it('displays plaintext content excerpt when protected note is unlocked in session', async () => {
    const unlockedSharedNote: notesApi.SharedNoteItem = {
      share_id: 13,
      permission: 'edit',
      shared_at: '2026-09-06T12:00:00Z',
      shared_by: {
        id: 1,
        display_name: 'Alice Owner',
        email: 'alice@example.com',
      },
      note: {
        id: 104,
        title: 'Decrypted Lab Results',
        content: 'Alpha catalyst test confirmed successful.',
        is_protected: true,
        is_unlocked: true,
        created_at: '2026-09-06T11:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
      },
    };

    vi.mocked(notesApi.fetchSharedNotes).mockResolvedValue([unlockedSharedNote]);

    render(
      <MemoryRouter initialEntries={['/shared']}>
        <Routes>
          <Route path="/shared" element={<SharedWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Decrypted Lab Results')).toBeInTheDocument();
      expect(screen.getByText('Alpha catalyst test confirmed successful.')).toBeInTheDocument();
    });

    expect(screen.getByTestId('unlocked-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('locked-indicator')).not.toBeInTheDocument();
  });

  it('strictly excludes owner controls on recipient shared cards', async () => {
    vi.mocked(notesApi.fetchSharedNotes).mockResolvedValue(mockSharedItems);

    render(
      <MemoryRouter initialEntries={['/shared']}>
        <Routes>
          <Route path="/shared" element={<SharedWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Company Roadmap 2026')).toBeInTheDocument();
    });

    // Owner controls MUST NOT exist
    expect(screen.queryByTestId('pin-note-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-note-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('share-note-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('protect-note-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('note-labels-section')).not.toBeInTheDocument();
  });

  it('clicking shared card navigates to /notes/:id', async () => {
    vi.mocked(notesApi.fetchSharedNotes).mockResolvedValue([mockSharedItems[0]]);

    render(
      <MemoryRouter initialEntries={['/shared']}>
        <Routes>
          <Route path="/shared" element={<SharedWorkspacePage />} />
          <Route path="/notes/:noteId" element={<div data-testid="mock-note-editor">Editor Opened</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Company Roadmap 2026')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('shared-note-card'));

    await waitFor(() => {
      expect(screen.getByTestId('mock-note-editor')).toBeInTheDocument();
    });
  });

  it('supports switching between grid and list view modes', async () => {
    const updatePrefMock = vi.fn();
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
      updatePreference: updatePrefMock,
    });

    vi.mocked(notesApi.fetchSharedNotes).mockResolvedValue(mockSharedItems);

    render(
      <MemoryRouter initialEntries={['/shared']}>
        <Routes>
          <Route path="/shared" element={<SharedWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('shared-notes-grid')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('list-view-button'));
    expect(updatePrefMock).toHaveBeenCalledWith(undefined, 'list');
  });
});
