import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NoteEditorPage } from './NoteEditorPage';
import * as notesApi from '../lib/api/notes';

vi.mock('../lib/api/notes');

describe('NoteEditorPage (NOTE-02 & NOTE-03 unified editor)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders creation mode with title and content fields and NO save button (NOTE-02 & NOTE-03)', () => {
    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <Routes>
          <Route path="/notes/new" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Title and content inputs present
    const titleInput = screen.getByTestId('note-title-input');
    const contentInput = screen.getByTestId('note-content-input');
    expect(titleInput).toBeInTheDocument();
    expect(contentInput).toBeInTheDocument();
    expect(titleInput).toHaveValue('');
    expect(contentInput).toHaveValue('');

    // Crucial requirement: NO primary save button
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save note/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /update note/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/save/i)).not.toBeInTheDocument();

    // Back to notes link present
    expect(screen.getByTestId('back-to-notes')).toBeInTheDocument();
  });

  it('renders edit mode loading existing note title and content (NOTE-02)', async () => {
    vi.mocked(notesApi.fetchNote).mockResolvedValue({
      id: 42,
      title: 'Existing Note Title',
      content: 'Existing note body content.',
      created_at: '2026-09-04T08:00:00Z',
      updated_at: '2026-09-04T09:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/notes/42']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Existing Note Title');
      expect(screen.getByTestId('note-content-input')).toHaveValue('Existing note body content.');
    });

    expect(notesApi.fetchNote).toHaveBeenCalledWith(42);

    // Still NO primary save button
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });

  it('displays validation message when fields are incomplete', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <Routes>
          <Route path="/notes/new" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    const titleInput = screen.getByTestId('note-title-input');
    fireEvent.change(titleInput, { target: { value: 'Draft Title' } });

    // With only title, it is invalid for autosave
    await waitFor(() => {
      expect(screen.getByTestId('autosave-status')).toHaveTextContent('Add a title and content to save');
    });
  });

  it('prevents duplicate POST when edits occur while initial create is in flight (TEST C)', async () => {
    vi.useFakeTimers();

    let resolveCreate: (val: unknown) => void = () => {};
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });

    vi.mocked(notesApi.createNote).mockImplementation(() => createPromise as never);
    vi.mocked(notesApi.updateNote).mockResolvedValue({
      id: 42,
      title: 'Draft B',
      content: 'Content B',
      created_at: '2026-09-04T00:00:00Z',
      updated_at: '2026-09-04T00:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <Routes>
          <Route path="/notes/new" element={<NoteEditorPage />} />
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    const titleInput = screen.getByTestId('note-title-input');
    const contentInput = screen.getByTestId('note-content-input');

    // User types valid draft A
    fireEvent.change(titleInput, { target: { value: 'Draft A' } });
    fireEvent.change(contentInput, { target: { value: 'Content A' } });

    // Advance past 600ms debounce to trigger createNote
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(notesApi.createNote).toHaveBeenCalledTimes(1);
    expect(notesApi.createNote).toHaveBeenCalledWith({ title: 'Draft A', content: 'Content A' });
    expect(notesApi.updateNote).not.toHaveBeenCalled();

    // While initial create is in flight, user changes to valid draft B
    fireEvent.change(titleInput, { target: { value: 'Draft B' } });
    fireEvent.change(contentInput, { target: { value: 'Content B' } });

    // Allow debounce for B to expire while create is still in flight
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Invariant: createNote must NOT be called a second time
    expect(notesApi.createNote).toHaveBeenCalledTimes(1);
    expect(notesApi.updateNote).not.toHaveBeenCalled();

    // Now resolve the initial create request with note id 42
    await act(async () => {
      resolveCreate({
        id: 42,
        title: 'Draft A',
        content: 'Content A',
        created_at: '2026-09-04T00:00:00Z',
        updated_at: '2026-09-04T00:00:00Z',
      });
    });

    // Invariant: queued save for draft B must PATCH note 42, NOT POST again
    expect(notesApi.createNote).toHaveBeenCalledTimes(1);
    expect(notesApi.updateNote).toHaveBeenCalledTimes(1);
    expect(notesApi.updateNote).toHaveBeenCalledWith(42, { title: 'Draft B', content: 'Content B' });

    vi.useRealTimers();
  });

  it('handles multiple rapid edits A -> B -> C during initial create (TEST D)', async () => {
    vi.useFakeTimers();

    let resolveCreate: (val: unknown) => void = () => {};
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });

    vi.mocked(notesApi.createNote).mockImplementation(() => createPromise as never);
    vi.mocked(notesApi.updateNote).mockResolvedValue({
      id: 42,
      title: 'Draft C',
      content: 'Content C',
      created_at: '2026-09-04T00:00:00Z',
      updated_at: '2026-09-04T00:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <Routes>
          <Route path="/notes/new" element={<NoteEditorPage />} />
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    const titleInput = screen.getByTestId('note-title-input');
    const contentInput = screen.getByTestId('note-content-input');

    // Type Draft A
    fireEvent.change(titleInput, { target: { value: 'Draft A' } });
    fireEvent.change(contentInput, { target: { value: 'Content A' } });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(notesApi.createNote).toHaveBeenCalledTimes(1);

    // Rapid edits during in-flight create: B then C
    fireEvent.change(titleInput, { target: { value: 'Draft B' } });
    fireEvent.change(contentInput, { target: { value: 'Content B' } });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.change(titleInput, { target: { value: 'Draft C' } });
    fireEvent.change(contentInput, { target: { value: 'Content C' } });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Resolve initial create
    await act(async () => {
      resolveCreate({
        id: 42,
        title: 'Draft A',
        content: 'Content A',
        created_at: '2026-09-04T00:00:00Z',
        updated_at: '2026-09-04T00:00:00Z',
      });
    });

    // Invariant: createNote once, updateNote once with C (B superseded)
    expect(notesApi.createNote).toHaveBeenCalledTimes(1);
    expect(notesApi.updateNote).toHaveBeenCalledTimes(1);
    expect(notesApi.updateNote).toHaveBeenCalledWith(42, { title: 'Draft C', content: 'Content C' });

    vi.useRealTimers();
  });

  it('retains invalid status in UI if draft becomes invalid while create finishes (TEST E)', async () => {
    vi.useFakeTimers();

    let resolveCreate: (val: unknown) => void = () => {};
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });

    vi.mocked(notesApi.createNote).mockImplementation(() => createPromise as never);

    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <Routes>
          <Route path="/notes/new" element={<NoteEditorPage />} />
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    const titleInput = screen.getByTestId('note-title-input');
    const contentInput = screen.getByTestId('note-content-input');

    // Type Draft A
    fireEvent.change(titleInput, { target: { value: 'Draft A' } });
    fireEvent.change(contentInput, { target: { value: 'Content A' } });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(notesApi.createNote).toHaveBeenCalledTimes(1);

    // User clears content while create is in-flight
    fireEvent.change(contentInput, { target: { value: '' } });
    expect(screen.getByTestId('autosave-status')).toHaveTextContent('Add a title and content to save');

    // Create resolves
    await act(async () => {
      resolveCreate({
        id: 42,
        title: 'Draft A',
        content: 'Content A',
        created_at: '2026-09-04T00:00:00Z',
        updated_at: '2026-09-04T00:00:00Z',
      });
    });

    // Invariant: status MUST NOT say 'Saved', must remain invalid
    expect(screen.getByTestId('autosave-status')).toHaveTextContent('Add a title and content to save');

    vi.useRealTimers();
  });
});
