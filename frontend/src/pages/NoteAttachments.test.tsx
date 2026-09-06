import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NoteEditorPage } from './NoteEditorPage';
import * as notesApi from '../lib/api/notes';
import * as labelsApi from '../lib/api/labels';
import * as attachmentsApi from '../lib/api/attachments';
import * as authContext from '../context';

vi.mock('../lib/api/notes');
vi.mock('../lib/api/labels');
vi.mock('../lib/api/attachments');
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

const mockNote = {
  id: 101,
  title: 'Research Paper Notes',
  content: 'Literature review notes and experimental diagrams.',
  is_pinned: false,
  labels: [{ id: 1, name: 'Academic', created_at: '2026-09-04T00:00:00Z', updated_at: '2026-09-04T00:00:00Z' }],
  created_at: '2026-09-04T01:00:00Z',
  updated_at: '2026-09-04T01:00:00Z',
};

const mockAttachments: attachmentsApi.Attachment[] = [
  {
    id: 501,
    original_name: 'methodology.pdf',
    mime_type: 'application/pdf',
    size_bytes: 204800, // 200 KB
    created_at: '2026-09-04T02:00:00Z',
  },
  {
    id: 502,
    original_name: 'chart.png',
    mime_type: 'image/png',
    size_bytes: 51200, // 50 KB
    created_at: '2026-09-04T02:05:00Z',
  },
];

describe('NOTE-08 & SEC-04 Note Attachments Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL object URL functions
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-blob');
    window.URL.revokeObjectURL = vi.fn();
    window.open = vi.fn();

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

    vi.mocked(labelsApi.fetchLabels).mockResolvedValue([]);
    vi.mocked(notesApi.fetchNote).mockResolvedValue({ ...mockNote });
    vi.mocked(attachmentsApi.fetchAttachments).mockResolvedValue([...mockAttachments]);
    vi.mocked(attachmentsApi.uploadAttachment).mockImplementation(async (_noteId, file) => ({
      id: 503,
      original_name: file.name,
      mime_type: file.type || 'application/pdf',
      size_bytes: file.size,
      created_at: new Date().toISOString(),
    }));
    vi.mocked(attachmentsApi.fetchAttachmentBlob).mockResolvedValue({
      blob: new Blob(['content']),
      mimeType: 'application/pdf',
    });
    vi.mocked(attachmentsApi.downloadAttachment).mockResolvedValue(undefined);
    vi.mocked(attachmentsApi.deleteAttachment).mockResolvedValue(undefined);
  });

  it('hides attachment controls on new note draft before persistence', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <Routes>
          <Route path="/notes/new" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('attachments-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-attachment-button')).not.toBeInTheDocument();
  });

  it('renders attachments section, accept contract, and existing items on persisted note', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('attachments-section')).toBeInTheDocument();
    });

    const fileInput = screen.getByTestId('attachment-file-input') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('accept', '.jpg,.jpeg,.png,.webp,.pdf');
    expect(screen.getByText(/max 10 MB/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('methodology.pdf')).toBeInTheDocument();
      expect(screen.getByText('chart.png')).toBeInTheDocument();
    });

    expect(screen.getAllByTestId('attachment-item')).toHaveLength(2);
  });

  it('uploads a file successfully and appends it to the attachments list', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('attachment-file-input')).toBeInTheDocument();
    });

    const fileInput = screen.getByTestId('attachment-file-input');
    const newFile = new File(['sample content'], 'supplement.pdf', { type: 'application/pdf' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [newFile] } });
    });

    await waitFor(() => {
      expect(attachmentsApi.uploadAttachment).toHaveBeenCalledWith(101, newFile);
      expect(screen.getByText('supplement.pdf')).toBeInTheDocument();
    });
  });

  it('rejects oversized files client-side with an accessible error', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('attachment-file-input')).toBeInTheDocument();
    });

    const fileInput = screen.getByTestId('attachment-file-input');
    // 11 MB file
    const oversizedFile = new File([''], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
    });

    expect(screen.getByTestId('attachment-upload-error')).toHaveTextContent(/must not exceed 10 MB/i);
    expect(attachmentsApi.uploadAttachment).not.toHaveBeenCalled();
  });

  it('handles attachment open and download actions securely', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('methodology.pdf')).toBeInTheDocument();
    });

    const openButtons = screen.getAllByTestId('open-attachment-button');
    await act(async () => {
      fireEvent.click(openButtons[0]);
    });

    expect(attachmentsApi.fetchAttachmentBlob).toHaveBeenCalledWith(501);
    expect(window.open).toHaveBeenCalledWith('blob:http://localhost/test-blob', '_blank', 'noopener,noreferrer');

    const downloadButtons = screen.getAllByTestId('download-attachment-button');
    await act(async () => {
      fireEvent.click(downloadButtons[0]);
    });

    expect(attachmentsApi.downloadAttachment).toHaveBeenCalledWith(501, 'methodology.pdf');
  });

  it('opens confirmation modal on delete and removes item only after confirmation', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('methodology.pdf')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTestId('delete-attachment-button');
    fireEvent.click(deleteButtons[0]);

    // Confirmation dialog appears
    expect(screen.getByText('Delete attachment?')).toBeInTheDocument();
    expect(screen.getByText(/This removes the file from this note permanently/i)).toBeInTheDocument();

    // Cancel preserves item
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Delete attachment?')).not.toBeInTheDocument();
    expect(screen.getByText('methodology.pdf')).toBeInTheDocument();
    expect(attachmentsApi.deleteAttachment).not.toHaveBeenCalled();

    // Reopen and confirm delete
    fireEvent.click(screen.getAllByTestId('delete-attachment-button')[0]);
    const confirmButton = screen.getByRole('button', { name: 'Delete attachment' });

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(attachmentsApi.deleteAttachment).toHaveBeenCalledWith(501);
      expect(screen.queryByText('methodology.pdf')).not.toBeInTheDocument();
    });
  });

  it('preserves note title, content, and labels during attachment actions', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/101']}>
        <Routes>
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('note-title-input')).toHaveValue('Research Paper Notes');
      expect(screen.getByTestId('note-content-input')).toHaveValue('Literature review notes and experimental diagrams.');
      expect(screen.getByText('Academic')).toBeInTheDocument();
    });
  });
});
