import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as healthApi from './lib/api/health';

vi.mock('./lib/api/health');

describe('App component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays initial checking state before promises resolve', () => {
    // Return never-resolving promises to inspect initial render state
    vi.mocked(healthApi.getBackendHealth).mockReturnValue(new Promise(() => {}));
    vi.mocked(healthApi.getDatabaseHealth).mockReturnValue(new Promise(() => {}));

    render(<App />);

    expect(screen.getByText('Collaborative Intelligent Note Management')).toBeInTheDocument();
    expect(screen.getByText('Frontend SPA')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();

    const checkingBadges = screen.getAllByText('Checking...');
    expect(checkingBadges.length).toBe(2);
  });

  it('displays connected status for both backend and database on success', async () => {
    vi.mocked(healthApi.getBackendHealth).mockResolvedValue({
      status: 'ok',
      service: 'backend',
    });
    vi.mocked(healthApi.getDatabaseHealth).mockResolvedValue({
      status: 'ok',
      service: 'database',
    });

    render(<App />);

    await waitFor(() => {
      const connectedBadges = screen.getAllByText('Connected');
      expect(connectedBadges.length).toBe(2);
    });

    expect(screen.queryByText('Checking...')).not.toBeInTheDocument();
    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
  });

  it('displays unavailable when backend API call fails', async () => {
    vi.mocked(healthApi.getBackendHealth).mockRejectedValue(new Error('Network error'));
    vi.mocked(healthApi.getDatabaseHealth).mockResolvedValue({
      status: 'ok',
      service: 'database',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Backend API').parentElement).toHaveTextContent('Unavailable');
      expect(screen.getByText('MySQL Database').parentElement).toHaveTextContent('Connected');
    });
  });

  it('displays unavailable when database health probe fails', async () => {
    vi.mocked(healthApi.getBackendHealth).mockResolvedValue({
      status: 'ok',
      service: 'backend',
    });
    vi.mocked(healthApi.getDatabaseHealth).mockRejectedValue(new Error('503 Database service unavailable'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Backend API').parentElement).toHaveTextContent('Connected');
      expect(screen.getByText('MySQL Database').parentElement).toHaveTextContent('Unavailable');
    });
  });

  it('does not leak raw exception stack traces or sensitive error messages in the UI', async () => {
    const sensitiveErrorMessage = 'PDOException: SQLSTATE[HY000] [2002] secret_db_password_leak';
    vi.mocked(healthApi.getBackendHealth).mockRejectedValue(new Error(sensitiveErrorMessage));
    vi.mocked(healthApi.getDatabaseHealth).mockRejectedValue(new Error(sensitiveErrorMessage));

    render(<App />);

    await waitFor(() => {
      const unavailableBadges = screen.getAllByText('Unavailable');
      expect(unavailableBadges.length).toBe(2);
    });

    expect(screen.queryByText(sensitiveErrorMessage)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain('secret_db_password_leak');
    expect(document.body.textContent).not.toContain('PDOException');
  });
});
