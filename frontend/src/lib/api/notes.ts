import { apiClient, ensureCsrfCookie } from './client';
import type { Label } from './labels';

export interface Note {
  id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  labels?: Label[];
  created_at: string;
  updated_at: string;
}

interface NoteListResponse {
  data: Note[];
}

interface NoteResponse {
  data: Note;
}

export async function fetchNotes(
  query?: string,
  labelIdsOrSignal?: number[] | AbortSignal,
  signal?: AbortSignal
): Promise<Note[]> {
  let actualLabelIds: number[] | undefined;
  let actualSignal: AbortSignal | undefined;

  if (labelIdsOrSignal instanceof AbortSignal) {
    actualSignal = labelIdsOrSignal;
  } else {
    actualLabelIds = labelIdsOrSignal;
    actualSignal = signal;
  }

  const params = new URLSearchParams();
  if (query && query.trim() !== '') {
    params.set('q', query.trim());
  }
  if (actualLabelIds && actualLabelIds.length > 0) {
    actualLabelIds.forEach((id) => params.append('label_ids[]', id.toString()));
  }
  const qs = params.toString();
  const url = qs ? `/api/notes?${qs}` : '/api/notes';
  const res = await apiClient<NoteListResponse>(url, { signal: actualSignal });
  return res.data;
}

export async function fetchNote(id: number): Promise<Note> {
  const res = await apiClient<NoteResponse>(`/api/notes/${id}`);
  return res.data;
}

export async function createNote(data: { title: string; content: string }): Promise<Note> {
  await ensureCsrfCookie();
  const res = await apiClient<NoteResponse>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateNote(id: number, data: { title?: string; content?: string }): Promise<Note> {
  await ensureCsrfCookie();
  const res = await apiClient<NoteResponse>(`/api/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function pinNote(id: number, is_pinned: boolean): Promise<Note> {
  await ensureCsrfCookie();
  const res = await apiClient<NoteResponse>(`/api/notes/${id}/pin`, {
    method: 'PATCH',
    body: JSON.stringify({ is_pinned }),
  });
  return res.data;
}

export async function deleteNote(id: number): Promise<void> {
  await ensureCsrfCookie();
  await apiClient<void>(`/api/notes/${id}`, {
    method: 'DELETE',
  });
}

export async function syncNoteLabels(noteId: number, labelIds: number[]): Promise<Note> {
  await ensureCsrfCookie();
  const res = await apiClient<NoteResponse>(`/api/notes/${noteId}/labels`, {
    method: 'PUT',
    body: JSON.stringify({ label_ids: labelIds }),
  });
  return res.data;
}
