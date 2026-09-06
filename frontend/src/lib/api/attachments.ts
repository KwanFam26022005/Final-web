import { apiClient, ensureCsrfCookie, getApiBaseUrl, ApiError } from './client';

export interface Attachment {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

interface AttachmentListResponse {
  data: Attachment[];
}

interface AttachmentResponse {
  data: Attachment;
}

export async function fetchAttachments(noteId: number, signal?: AbortSignal): Promise<Attachment[]> {
  const res = await apiClient<AttachmentListResponse>(`/api/notes/${noteId}/attachments`, {
    method: 'GET',
    signal,
  });
  return res.data;
}

export async function uploadAttachment(noteId: number, file: File): Promise<Attachment> {
  await ensureCsrfCookie();
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient<AttachmentResponse>(`/api/notes/${noteId}/attachments`, {
    method: 'POST',
    body: formData,
  });
  return res.data;
}

export async function fetchAttachmentBlob(
  attachmentId: number
): Promise<{ blob: Blob; mimeType: string }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/attachments/${attachmentId}/content`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(`Failed to fetch attachment: ${response.statusText}`, response.status, errorData);
  }

  const blob = await response.blob();
  const mimeType = response.headers.get('Content-Type') || blob.type;
  return { blob, mimeType };
}

export async function downloadAttachment(
  attachmentId: number,
  fallbackFilename: string = 'download'
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/attachments/${attachmentId}/download`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(`Failed to download attachment: ${response.statusText}`, response.status, errorData);
  }

  let filename = fallbackFilename;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '').trim();
    }
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(objectUrl);
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  await ensureCsrfCookie();
  await apiClient<void>(`/api/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}
