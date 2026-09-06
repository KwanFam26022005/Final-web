import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('../lib/api/labels', () => ({
  fetchLabels: vi.fn().mockResolvedValue([]),
  createLabel: vi.fn().mockImplementation(async (name: string) => ({
    id: Date.now(),
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })),
  updateLabel: vi.fn().mockImplementation(async (id: number, name: string) => ({
    id,
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })),
  deleteLabel: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/api/attachments', () => ({
  fetchAttachments: vi.fn().mockResolvedValue([]),
  uploadAttachment: vi.fn().mockImplementation(async (_noteId: number, file: File) => ({
    id: Date.now(),
    original_name: file.name,
    mime_type: file.type || 'application/pdf',
    size_bytes: file.size,
    created_at: new Date().toISOString(),
  })),
  fetchAttachmentBlob: vi.fn().mockResolvedValue({ blob: new Blob(['test']), mimeType: 'application/pdf' }),
  downloadAttachment: vi.fn().mockResolvedValue(undefined),
  deleteAttachment: vi.fn().mockResolvedValue(undefined),
}));
