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
});
