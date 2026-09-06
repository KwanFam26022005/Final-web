import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NoteEditorPage } from './NoteEditorPage';
import * as notesApi from '../lib/api/notes';
import * as echoModule from '../lib/echo';
import { ApiError } from '../lib/api/client';

vi.mock('../lib/api/notes', async (importOriginal) => {
  const actual = await importOriginal<typeof notesApi>();
  return {
    ...actual,
    fetchNote: vi.fn(),
    updateNote: vi.fn(),
    createNote: vi.fn(),
    deleteNote: vi.fn(),
  };
});

describe('Realtime Note Synchronization (Phase 6 M2 - RT-01)', () => {
  let remoteUpdateCallback: (() => void) | null = null;
  let unsubscribeSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notesApi.fetchNote).mockReset();
    vi.mocked(notesApi.updateNote).mockReset();
    vi.mocked(notesApi.createNote).mockReset();
    vi.mocked(notesApi.deleteNote).mockReset();

    remoteUpdateCallback = null;
    unsubscribeSpy = vi.fn();

    vi.spyOn(echoModule, 'subscribeToNoteUpdates').mockImplementation(
      (_noteId: number, onUpdate: () => void) => {
        remoteUpdateCallback = onUpdate;
        return () => {
          unsubscribeSpy();
        };
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribes to note channel once when persisted note detail is loaded', async () => {
    vi.mocked(notesApi.fetchNote).mockResolvedValue({
      id: 42,
      title: 'Initial Title',
      content: 'Initial Content',
      is_pinned: false,
      created_at: '2026-09-06T12:00:00Z',
      updated_at: '2026-09-06T12:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/notes/42']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Initial Title');
    });

    expect(echoModule.subscribeToNoteUpdates).toHaveBeenCalledTimes(1);
    expect(echoModule.subscribeToNoteUpdates).toHaveBeenCalledWith(
      42,
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('cleans up channel subscription on unmount', async () => {
    vi.mocked(notesApi.fetchNote).mockResolvedValue({
      id: 42,
      title: 'Initial Title',
      content: 'Initial Content',
      is_pinned: false,
      created_at: '2026-09-06T12:00:00Z',
      updated_at: '2026-09-06T12:00:00Z',
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/notes/42']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Initial Title');
    });

    unmount();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('remote event triggers authorized REST fetchNote without trusting event payload', async () => {
    let noteData: notesApi.Note = {
      id: 42,
      title: 'Initial Title',
      content: 'Initial Content',
      is_pinned: false,
      created_at: '2026-09-06T12:00:00Z',
      updated_at: '2026-09-06T12:00:00Z',
    };

    vi.mocked(notesApi.fetchNote).mockImplementation(async () => ({ ...noteData }));

    render(
      <MemoryRouter initialEntries={['/notes/42']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Initial Title');
    });

    expect(remoteUpdateCallback).not.toBeNull();

    // Remote update occurs on backend
    noteData = {
      ...noteData,
      title: 'Remote Updated Title',
      content: 'Remote Updated Content',
      updated_at: '2026-09-06T12:05:00Z',
    };

    // Trigger realtime signal
    await act(async () => {
      remoteUpdateCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Remote Updated Title');
      expect(screen.getByTestId('note-content-input')).toHaveValue('Remote Updated Content');
    });

    // Mandatory Section 14: REST fetch was performed
    expect(notesApi.fetchNote).toHaveBeenCalledTimes(2);
    expect(notesApi.fetchNote).toHaveBeenLastCalledWith(42, expect.any(AbortSignal));

    // Mandatory Section 16: Programmatic update MUST NOT trigger autosave updateNote back to server
    expect(notesApi.updateNote).not.toHaveBeenCalled();
  });

  it('read collaborator receives remote UI update and remains read-only', async () => {
    let noteData: notesApi.Note = {
      id: 77,
      title: 'Read-Only Note',
      content: 'Read-Only Content',
      access_type: 'shared',
      permission: 'read',
      is_pinned: false,
      created_at: '2026-09-06T12:00:00Z',
      updated_at: '2026-09-06T12:00:00Z',
    };

    vi.mocked(notesApi.fetchNote).mockImplementation(async () => ({ ...noteData }));

    render(
      <MemoryRouter initialEntries={['/notes/77']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Read-Only Note');
      expect(screen.getByTestId('note-title-input')).toHaveAttribute('readonly');
      expect(screen.getByTestId('note-content-input')).toHaveAttribute('readonly');
    });

    noteData = {
      ...noteData,
      title: 'Owner Updated Read-Only Note',
      content: 'Owner Updated Read-Only Content',
      updated_at: '2026-09-06T12:05:00Z',
    };

    await act(async () => {
      remoteUpdateCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Owner Updated Read-Only Note');
      expect(screen.getByTestId('note-content-input')).toHaveValue('Owner Updated Read-Only Content');
      expect(screen.getByTestId('note-title-input')).toHaveAttribute('readonly');
    });

    expect(notesApi.updateNote).not.toHaveBeenCalled();
  });

  it('edit collaborator receives remote update bidirectionally', async () => {
    let noteData: notesApi.Note = {
      id: 88,
      title: 'Collaborative Note',
      content: 'Initial Content',
      access_type: 'shared',
      permission: 'edit',
      is_pinned: false,
      created_at: '2026-09-06T12:00:00Z',
      updated_at: '2026-09-06T12:00:00Z',
    };

    vi.mocked(notesApi.fetchNote).mockImplementation(async () => ({ ...noteData }));

    render(
      <MemoryRouter initialEntries={['/notes/88']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Collaborative Note');
      expect(screen.getByTestId('note-title-input')).not.toHaveAttribute('readonly');
    });

    noteData = {
      ...noteData,
      content: 'Owner Updated Body Content',
      updated_at: '2026-09-06T12:05:00Z',
    };

    await act(async () => {
      remoteUpdateCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId('note-content-input')).toHaveValue('Owner Updated Body Content');
    });

    expect(notesApi.updateNote).not.toHaveBeenCalled();
  });

  it('protected locked note does NOT leak plaintext on remote update', async () => {
    let noteData: notesApi.Note = {
      id: 55,
      title: 'Protected Note',
      content: null,
      is_protected: true,
      is_unlocked: false,
      is_pinned: false,
      created_at: '2026-09-06T12:00:00Z',
      updated_at: '2026-09-06T12:00:00Z',
    };

    vi.mocked(notesApi.fetchNote).mockImplementation(async () => ({ ...noteData }));

    render(
      <MemoryRouter initialEntries={['/notes/55']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('locked-note-view')).toBeInTheDocument();
    });

    noteData = {
      ...noteData,
      title: 'Protected Note Title Changed',
      content: null, // Locked REST always returns null content
      updated_at: '2026-09-06T12:10:00Z',
    };

    await act(async () => {
      remoteUpdateCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Protected Note Title Changed');
      expect(screen.getByTestId('locked-note-view')).toBeInTheDocument();
      expect(screen.queryByTestId('note-content-input')).not.toBeInTheDocument();
    });

    expect(notesApi.updateNote).not.toHaveBeenCalled();
  });

  it('protected unlocked note updates plaintext body on remote update', async () => {
    let noteData: notesApi.Note = {
      id: 56,
      title: 'Unlocked Protected Note',
      content: 'Initial Plaintext',
      is_protected: true,
      is_unlocked: true,
      is_pinned: false,
      created_at: '2026-09-06T12:00:00Z',
      updated_at: '2026-09-06T12:00:00Z',
    };

    vi.mocked(notesApi.fetchNote).mockImplementation(async () => ({ ...noteData }));

    render(
      <MemoryRouter initialEntries={['/notes/56']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-content-input')).toHaveValue('Initial Plaintext');
    });

    noteData = {
      ...noteData,
      content: 'Updated Plaintext After Unlock',
      updated_at: '2026-09-06T12:10:00Z',
    };

    await act(async () => {
      remoteUpdateCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId('note-content-input')).toHaveValue('Updated Plaintext After Unlock');
    });

    expect(notesApi.updateNote).not.toHaveBeenCalled();
  });

  it('revoked stale socket receiving 403 on refetch clears content and shows access error', async () => {
    let returnForbidden = false;
    vi.mocked(notesApi.fetchNote).mockImplementation(async () => {
      if (returnForbidden) {
        throw new ApiError('Forbidden', 403);
      }
      return {
        id: 99,
        title: 'Revoked Soon Note',
        content: 'Sensitive Information',
        access_type: 'shared',
        permission: 'edit',
        is_pinned: false,
        created_at: '2026-09-06T12:00:00Z',
        updated_at: '2026-09-06T12:00:00Z',
      };
    });

    render(
      <MemoryRouter initialEntries={['/notes/99']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Revoked Soon Note');
    });

    returnForbidden = true;

    await act(async () => {
      remoteUpdateCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByText('You no longer have permission to view this note.')).toBeInTheDocument();
    });

    // Content input and title are cleared to prevent content leakage
    expect(screen.queryByTestId('note-content-input')).not.toBeInTheDocument();
    expect(notesApi.updateNote).not.toHaveBeenCalled();
  });

  it('dirty local editor is NOT clobbered by remote update (Section 17)', async () => {
    let noteData: notesApi.Note = {
      id: 42,
      title: 'Initial Title',
      content: 'Initial Content',
      is_pinned: false,
      created_at: '2026-09-06T12:00:00Z',
      updated_at: '2026-09-06T12:00:00Z',
    };

    vi.mocked(notesApi.fetchNote).mockImplementation(async () => ({ ...noteData }));

    render(
      <MemoryRouter initialEntries={['/notes/42']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Initial Title');
    });

    // User types local changes
    const titleInput = screen.getByTestId('note-title-input');
    fireEvent.change(titleInput, { target: { value: 'User Unsaved Typing' } });

    expect(titleInput).toHaveValue('User Unsaved Typing');

    // Remote event arrives while editor is dirty
    noteData = {
      ...noteData,
      title: 'Remote Overwrite Attempt',
      content: 'Remote Content',
      updated_at: '2026-09-06T12:05:00Z',
    };

    await act(async () => {
      remoteUpdateCallback?.();
    });

    // Local typing MUST NOT be destroyed
    expect(screen.getByTestId('note-title-input')).toHaveValue('User Unsaved Typing');
    // Section 17: restrained banner displayed
    expect(screen.getByTestId('remote-update-pending-banner')).toBeInTheDocument();
  });

  it('race safety: older in-flight remote fetch does not overwrite newer remote state', async () => {
    let callCount = 0;
    let resolveSlowFetch!: (val: notesApi.Note) => void;
    const slowFetchPromise = new Promise<notesApi.Note>((resolve) => {
      resolveSlowFetch = resolve;
    });

    vi.mocked(notesApi.fetchNote).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // Initial load
        return {
          id: 42,
          title: 'Initial Title',
          content: 'Initial Content',
          is_pinned: false,
          created_at: '2026-09-06T12:00:00Z',
          updated_at: '2026-09-06T12:00:00Z',
        };
      }
      if (callCount === 2) {
        // First remote signal (slow)
        return slowFetchPromise;
      }
      // Second remote signal (fast)
      return {
        id: 42,
        title: 'Newer Fast Remote Title',
        content: 'Newer Fast Content',
        is_pinned: false,
        created_at: '2026-09-06T12:00:00Z',
        updated_at: '2026-09-06T12:10:00Z',
      };
    });

    render(
      <MemoryRouter initialEntries={['/notes/42']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Initial Title');
    });

    // Trigger first event (slow in flight)
    await act(async () => {
      remoteUpdateCallback?.();
    });

    // Trigger second event before first resolves (fast)
    await act(async () => {
      remoteUpdateCallback?.();
    });

    // Newer fast remote title applies
    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Newer Fast Remote Title');
    });

    // Now first slow fetch resolves with older data
    await act(async () => {
      resolveSlowFetch({
        id: 42,
        title: 'Older Slow Stale Title',
        content: 'Older Stale Content',
        is_pinned: false,
        created_at: '2026-09-06T12:00:00Z',
        updated_at: '2026-09-06T12:05:00Z',
      });
    });

    // Stale fetch MUST NOT overwrite newer state
    expect(screen.getByTestId('note-title-input')).toHaveValue('Newer Fast Remote Title');
  });
});
