import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'invalid' | 'dirty' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 600;

interface UseAutosaveOptions {
  onSave: (data: { title: string; content: string }) => Promise<unknown>;
  isValid?: boolean;
  validate?: (data: { title: string; content: string }) => boolean;
}

export function useAutosave({ onSave, isValid = true, validate }: UseAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ title: string; content: string } | null>(null);
  const savingRef = useRef(false);
  const latestRef = useRef<{ title: string; content: string } | null>(null);

  const onSaveRef = useRef(onSave);
  const isValidRef = useRef(isValid);
  const validateRef = useRef(validate);
  const executeSaveRef = useRef<(data: { title: string; content: string }) => Promise<void>>(async () => {});

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    isValidRef.current = isValid;
  }, [isValid]);

  useEffect(() => {
    validateRef.current = validate;
  }, [validate]);

  const executeSave = useCallback(async (data: { title: string; content: string }) => {
    if (savingRef.current) {
      pendingRef.current = data;
      return;
    }

    savingRef.current = true;
    setStatus('saving');

    try {
      await onSaveRef.current(data);
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      savingRef.current = false;

      if (pendingRef.current) {
        const next = pendingRef.current;
        pendingRef.current = null;
        void executeSaveRef.current(next);
      }
    }
  }, []);

  useEffect(() => {
    executeSaveRef.current = executeSave;
  }, [executeSave]);

  const markDirty = useCallback((data: { title: string; content: string }) => {
    latestRef.current = data;

    const valid = validateRef.current ? validateRef.current(data) : (isValidRef.current ?? true);
    if (!valid) {
      setStatus('invalid');
      return;
    }

    setStatus('dirty');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (latestRef.current) {
        void executeSaveRef.current(latestRef.current);
      }
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { status, markDirty, DEBOUNCE_MS };
}
