import { apiClient } from './client';

export interface HealthResponse {
  status: string;
  service: string;
}

export async function getBackendHealth(): Promise<HealthResponse> {
  return apiClient<HealthResponse>('/api/health');
}

export async function getDatabaseHealth(): Promise<HealthResponse> {
  return apiClient<HealthResponse>('/api/health/database');
}
