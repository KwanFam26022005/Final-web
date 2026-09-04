import { apiClient, ensureCsrfCookie } from './client';

export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NoteListResponse {
  data: Note[];
}

interface NoteResponse {
  data: Note;
}

export async function fetchNotes(): Promise<Note[]> {
  const res = await apiClient<NoteListResponse>('/api/notes');
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
