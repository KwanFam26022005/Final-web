import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useAutosave } from './useAutosave';

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts with idle status', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave({ onSave, isValid: true }));

    expect(result.current.status).toBe('idle');
  });

  it('sets status to invalid and does not schedule save when isValid is false', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave({ onSave, isValid: false }));

    act(() => {
      result.current.markDirty({ title: '', content: '' });
    });

    expect(result.current.status).toBe('invalid');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('debounces save by DEBOUNCE_MS (600ms) and sets status to saved on completion', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave({ onSave, isValid: true }));

    act(() => {
      result.current.markDirty({ title: 'My Note', content: 'Some content' });
    });

    expect(result.current.status).toBe('dirty');
    expect(onSave).not.toHaveBeenCalled();

    // Advance partially
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSave).not.toHaveBeenCalled();

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: 'My Note', content: 'Some content' });
    expect(result.current.status).toBe('saved');
  });

  it('sets status to error when onSave rejects', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network failure'));
    const { result } = renderHook(() => useAutosave({ onSave, isValid: true }));

    act(() => {
      result.current.markDirty({ title: 'Title', content: 'Content' });
    });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('error');
  });

  it('handles rapid edits by keeping at most one save in flight and queueing latest snapshot', async () => {
    let resolveFirstSave: () => void = () => {};
    const firstSavePromise = new Promise<void>((resolve) => {
      resolveFirstSave = resolve;
    });

    const onSave = vi.fn().mockImplementation((data: { title: string; content: string }) => {
      if (data.title === 'First') {
        return firstSavePromise;
      }
      return Promise.resolve();
    });

    const { result } = renderHook(() => useAutosave({ onSave, isValid: true }));

    // First edit
    act(() => {
      result.current.markDirty({ title: 'First', content: 'First content' });
    });

    // Trigger first save
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: 'First', content: 'First content' });
    expect(result.current.status).toBe('saving');

    // Rapid edits while first is in flight
    act(() => {
      result.current.markDirty({ title: 'Second', content: 'Second content' });
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    // Still in flight, second save should NOT have fired yet
    expect(onSave).toHaveBeenCalledTimes(1);

    // Another rapid edit replaces queued snapshot
    act(() => {
      result.current.markDirty({ title: 'Third', content: 'Third content' });
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onSave).toHaveBeenCalledTimes(1);

    // Complete the first save
    await act(async () => {
      resolveFirstSave();
    });

    // Now the queued snapshot (Third) should have been executed
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith({ title: 'Third', content: 'Third content' });
    expect(result.current.status).toBe('saved');
  });
  // --- REGRESSION TEST A ---
  it('cancels pending debounce timer when transitioning from valid to invalid before debounce expires (TEST A)', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const validate = (data: { title: string; content: string }) =>
      data.title.trim().length > 0 && data.content.trim().length > 0;
    const { result } = renderHook(() => useAutosave({ onSave, validate }));

    // Step 1: valid snapshot
    act(() => {
      result.current.markDirty({ title: 'Valid Title', content: 'Valid Content' });
    });
    expect(result.current.status).toBe('dirty');

    // Step 2: advance 300ms (less than 600ms debounce)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSave).not.toHaveBeenCalled();

    // Step 3: user changes draft to invalid
    act(() => {
      result.current.markDirty({ title: '', content: '' });
    });
    expect(result.current.status).toBe('invalid');

    // Step 4: advance beyond the original 600ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Invariant: no network save for invalid snapshot; old timer was cancelled
    expect(onSave).toHaveBeenCalledTimes(0);
    expect(result.current.status).toBe('invalid');
  });

  // --- REGRESSION TEST B ---
  it('replaces debounce timer when editing valid A to valid B so only B is saved (TEST B)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave({ onSave, isValid: true }));

    // Valid A
    act(() => {
      result.current.markDirty({ title: 'Note A', content: 'Content A' });
    });

    // Advance 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSave).not.toHaveBeenCalled();

    // Valid B arrives
    act(() => {
      result.current.markDirty({ title: 'Note B', content: 'Content B' });
    });

    // Advance 300ms (600ms after A, but only 300ms after B)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSave).not.toHaveBeenCalled();

    // Advance remaining 300ms for B
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Invariant: only B saved
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: 'Note B', content: 'Content B' });
    expect(result.current.status).toBe('saved');
  });

  // --- REGRESSION TEST E ---
  it('preserves invalid status when an older in-flight save completes after user made draft invalid (TEST E)', async () => {
    let resolveFirstSave: () => void = () => {};
    const firstSavePromise = new Promise<void>((resolve) => {
      resolveFirstSave = resolve;
    });

    const onSave = vi.fn().mockImplementation(() => firstSavePromise);
    const validate = (data: { title: string; content: string }) =>
      data.title.trim().length > 0 && data.content.trim().length > 0;
    const { result } = renderHook(() => useAutosave({ onSave, validate }));

    // Start save for valid draft
    act(() => {
      result.current.markDirty({ title: 'Valid Initial', content: 'Valid Body' });
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('saving');

    // While save is in-flight, user deletes title/content making it invalid
    act(() => {
      result.current.markDirty({ title: '', content: '' });
    });
    expect(result.current.status).toBe('invalid');

    // Older save completes
    await act(async () => {
      resolveFirstSave();
    });

    // Invariant: UI must NOT end in misleading 'saved' state for the currently invalid draft
    expect(result.current.status).toBe('invalid');
  });
});
