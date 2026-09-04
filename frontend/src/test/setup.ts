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
