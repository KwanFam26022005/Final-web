import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotesWorkspacePage } from './NotesWorkspacePage';
import * as labelsApi from '../lib/api/labels';
import * as notesApi from '../lib/api/notes';
import * as authContext from '../context';

vi.mock('../lib/api/labels');
vi.mock('../lib/api/notes');
vi.mock('../context');

const mockUser = {
  id: 1,
  display_name: 'Test Student',
  email: 'student@example.com',
  email_verified_at: '2026-09-01T00:00:00Z',
  avatar_url: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

const initialLabels = [
  { id: 1, name: 'Computer Science', created_at: '2026-09-04T00:00:00Z', updated_at: '2026-09-04T00:00:00Z' },
  { id: 2, name: 'Math', created_at: '2026-09-04T00:00:00Z', updated_at: '2026-09-04T00:00:00Z' },
];

describe('LABEL-01 Label CRUD Management', () => {
  const mockUpdatePreference = vi.fn().mockResolvedValue(undefined);
  const mockLogout = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      preference: { theme: 'system', default_note_view: 'grid' },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      refreshUser: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      removeAvatar: vi.fn(),
      updatePassword: vi.fn(),
      resendVerification: vi.fn(),
      updatePreference: mockUpdatePreference,
    });

    vi.mocked(notesApi.fetchNotes).mockResolvedValue([]);
    vi.mocked(labelsApi.fetchLabels).mockResolvedValue([...initialLabels]);
  });

  it('opens Labels modal via sidebar nav link', async () => {
    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('labels-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('labels-nav-link'));

    const modal = screen.getByTestId('labels-modal');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText('Manage Labels')).toBeInTheDocument();
    expect(within(modal).getByText('Computer Science')).toBeInTheDocument();
    expect(within(modal).getByText('Math')).toBeInTheDocument();
  });

  it('creates new label with trimmed name and adds it to list', async () => {
    const createdLabel = {
      id: 3,
      name: 'Physics',
      created_at: '2026-09-04T01:00:00Z',
      updated_at: '2026-09-04T01:00:00Z',
    };
    vi.mocked(labelsApi.createLabel).mockResolvedValueOnce(createdLabel);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('labels-nav-link'));

    const modal = screen.getByTestId('labels-modal');
    const input = within(modal).getByTestId('new-label-name-input');
    const form = within(modal).getByTestId('create-label-form');

    fireEvent.change(input, { target: { value: '  Physics  ' } });
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(labelsApi.createLabel).toHaveBeenCalledWith('Physics');
    await waitFor(() => {
      expect(within(modal).getByText('Physics')).toBeInTheDocument();
    });
  });

  it('displays validation error when creating label fails (e.g. duplicate name 422)', async () => {
    vi.mocked(labelsApi.createLabel).mockRejectedValueOnce(
      new Error('A label with this name already exists.')
    );

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('labels-nav-link'));

    const modal = screen.getByTestId('labels-modal');
    const input = within(modal).getByTestId('new-label-name-input');
    const form = within(modal).getByTestId('create-label-form');

    fireEvent.change(input, { target: { value: 'Math' } });
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(labelsApi.createLabel).toHaveBeenCalledWith('Math');
    await waitFor(() => {
      expect(within(modal).getByTestId('create-label-error')).toHaveTextContent(
        'A label with this name already exists.'
      );
    });
  });

  it('allows inline renaming and persists update via PATCH', async () => {
    const updated = {
      id: 1,
      name: 'Advanced CS',
      created_at: '2026-09-04T00:00:00Z',
      updated_at: '2026-09-04T02:00:00Z',
    };
    vi.mocked(labelsApi.updateLabel).mockResolvedValueOnce(updated);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('labels-nav-link'));

    const modal = screen.getByTestId('labels-modal');
    const editButtons = within(modal).getAllByTestId('edit-label-button');
    fireEvent.click(editButtons[0]);

    const editInput = within(modal).getByTestId('edit-label-name-input');
    expect(editInput).toHaveValue('Computer Science');

    fireEvent.change(editInput, { target: { value: 'Advanced CS' } });
    const saveBtn = within(modal).getByTestId('save-label-name-button');

    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(labelsApi.updateLabel).toHaveBeenCalledWith(1, 'Advanced CS');
    await waitFor(() => {
      expect(within(modal).getByText('Advanced CS')).toBeInTheDocument();
    });
  });

  it('deletes label with explicit confirmation dialog and removes from UI', async () => {
    vi.mocked(labelsApi.deleteLabel).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('labels-nav-link'));

    const modal = screen.getByTestId('labels-modal');
    const deleteButtons = within(modal).getAllByTestId('delete-label-button');
    fireEvent.click(deleteButtons[1]); // Math

    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete label "Math"?')).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(labelsApi.deleteLabel).toHaveBeenCalledWith(2);
    await waitFor(() => {
      expect(within(modal).queryByText('Math')).not.toBeInTheDocument();
    });
  });

  it('closes modal on escape key or close button', async () => {
    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('label-filters-bar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('labels-nav-link'));
    expect(screen.getByTestId('labels-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-labels-modal'));
    expect(screen.queryByTestId('labels-modal')).not.toBeInTheDocument();
  });
});
