export class ApiError extends Error {
  public readonly status: number;
  public readonly data: unknown;
  public readonly errors?: Record<string, string[]>;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    if (data && typeof data === 'object' && 'errors' in data && typeof (data as { errors: unknown }).errors === 'object') {
      this.errors = (data as { errors: Record<string, string[]> }).errors;
    }
  }
}

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_API_BASE_URL;
}

export function getXsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function ensureCsrfCookie(): Promise<void> {
  const baseUrl = getApiBaseUrl();
  try {
    await fetch(`${baseUrl}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new ApiError(`Unable to initialize CSRF token: ${message}`, 0);
  }
}

export async function apiClient<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const method = (init?.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers = new Headers(init?.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (isStateChanging) {
    const xsrfToken = getXsrfToken();
    if (xsrfToken && !headers.has('X-XSRF-TOKEN')) {
      headers.set('X-XSRF-TOKEN', xsrfToken);
    }
    const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
    if (!headers.has('Content-Type') && init?.body && !isFormData) {
      headers.set('Content-Type', 'application/json');
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      ...init,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new ApiError(`Unable to connect to API server: ${message}`, 0);
  }

  let data: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}
