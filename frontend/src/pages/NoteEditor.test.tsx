import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
});
