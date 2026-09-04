import { apiClient, ensureCsrfCookie } from './client';

export interface Label {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface LabelListResponse {
  data: Label[];
}

interface LabelResponse {
  data: Label;
}

export async function fetchLabels(): Promise<Label[]> {
  const res = await apiClient<LabelListResponse>('/api/labels');
  return res.data;
}

export async function createLabel(name: string): Promise<Label> {
  await ensureCsrfCookie();
  const res = await apiClient<LabelResponse>('/api/labels', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return res.data;
}

export async function updateLabel(id: number, name: string): Promise<Label> {
  await ensureCsrfCookie();
  const res = await apiClient<LabelResponse>(`/api/labels/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  return res.data;
}

export async function deleteLabel(id: number): Promise<void> {
  await ensureCsrfCookie();
  await apiClient<void>(`/api/labels/${id}`, {
    method: 'DELETE',
  });
}
