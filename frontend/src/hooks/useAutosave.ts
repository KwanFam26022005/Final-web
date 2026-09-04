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
  const isLatestValidRef = useRef(isValid);

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
      if (isLatestValidRef.current) {
        pendingRef.current = data;
      }
      return;
    }

    if (!isLatestValidRef.current) {
      return;
    }

    savingRef.current = true;
    setStatus('saving');

    try {
      await onSaveRef.current(data);

      if (pendingRef.current !== null) {
        // A newer save is already queued and will run in finally
      } else if (timerRef.current !== null) {
        setStatus('dirty');
      } else if (!isLatestValidRef.current) {
        setStatus('invalid');
      } else {
        setStatus('saved');
      }
    } catch {
      setStatus('error');
    } finally {
      savingRef.current = false;

      if (pendingRef.current !== null) {
        const next = pendingRef.current;
        pendingRef.current = null;
        if (isLatestValidRef.current) {
          void executeSaveRef.current(next);
        }
      }
    }
  }, []);

  useEffect(() => {
    executeSaveRef.current = executeSave;
  }, [executeSave]);

  const markDirty = useCallback((data: { title: string; content: string }) => {
    // 1. Cancel any active debounce timer immediately when a newer edit arrives
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    latestRef.current = data;

    // 2. Evaluate validity of latest snapshot
    const valid = validateRef.current ? validateRef.current(data) : (isValidRef.current ?? true);
    isLatestValidRef.current = valid;

    // 3. If invalid, cancel any pending save and establish invalid status
    if (!valid) {
      pendingRef.current = null;
      setStatus('invalid');
      return;
    }

    // 4. Valid new edit: transition to dirty and schedule debounce
    setStatus('dirty');

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (latestRef.current && isLatestValidRef.current) {
        void executeSaveRef.current(latestRef.current);
      }
    }, DEBOUNCE_MS);
  }, []);

  const cancelAutosave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = null;
    latestRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return { status, markDirty, cancelAutosave, DEBOUNCE_MS };
}
