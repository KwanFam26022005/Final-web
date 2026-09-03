import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError, getApiBaseUrl } from './client';

describe('client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('getApiBaseUrl', () => {
    it('returns default URL when VITE_API_BASE_URL is not set', () => {
      const url = getApiBaseUrl();
      expect(url).toBe('http://127.0.0.1:8000');
    });
  });

  describe('apiClient', () => {
    it('successfully parses JSON response on HTTP 200', async () => {
      const mockPayload = { status: 'ok', service: 'backend' };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockPayload,
      } as Response);

      const result = await apiClient<{ status: string; service: string }>('/api/health');
      expect(result).toEqual(mockPayload);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/health',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });

    it('throws ApiError with status and message on non-2xx response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'unavailable', service: 'database' }),
      } as Response);

      await expect(apiClient('/api/health/database')).rejects.toThrow(ApiError);

      try {
        await apiClient('/api/health/database');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(503);
      }
    });

    it('normalizes network fetch exceptions into ApiError', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      await expect(apiClient('/api/health')).rejects.toThrow(ApiError);

      try {
        await apiClient('/api/health');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(0);
        expect(apiError.message).toContain('Unable to connect to API server');
      }
    });
  });
});
