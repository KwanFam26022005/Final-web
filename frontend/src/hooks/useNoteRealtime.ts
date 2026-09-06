import { useEffect, useRef, useState } from 'react';
import { subscribeToNoteUpdates, getEchoInstance } from '../lib/echo';

interface UseNoteRealtimeOptions {
  noteId: number | null;
  enabled: boolean;
  onRemoteUpdate: () => void;
  onReconnected?: () => void;
}

export function useNoteRealtime({
  noteId,
  enabled,
  onRemoteUpdate,
  onReconnected,
}: UseNoteRealtimeOptions) {
  const onUpdateRef = useRef(onRemoteUpdate);
  const onReconnectedRef = useRef(onReconnected);

  useEffect(() => {
    onUpdateRef.current = onRemoteUpdate;
    onReconnectedRef.current = onReconnected;
  }, [onRemoteUpdate, onReconnected]);

  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return Boolean(getEchoInstance());
  });

  useEffect(() => {
    if (!enabled || noteId === null || isNaN(noteId) || noteId <= 0) {
      return;
    }

    const unsubscribe = subscribeToNoteUpdates(
      noteId,
      () => {
        onUpdateRef.current();
      },
      () => {
        setIsConnected(true);
        onReconnectedRef.current?.();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [noteId, enabled]);

  return { isConnected };
}
