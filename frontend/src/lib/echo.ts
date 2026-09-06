import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getApiBaseUrl, getXsrfToken, ensureCsrfCookie } from './api/client';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<'reverb'> | null;
  }
}

// Attach Pusher to window as required by Laravel Echo
if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

let echoInstance: Echo<'reverb'> | null = null;

export interface ReverbConfig {
  key: string;
  wsHost: string;
  wsPort: number;
  wssPort: number;
  forceTLS: boolean;
  enabledTransports: ('ws' | 'wss')[];
}

/**
 * Resolve public Reverb WebSocket configuration.
 *
 * NOTE: Production hardening (Section 27): If VITE_REVERB_APP_KEY is missing or empty,
 * this function returns null, allowing realtime features to gracefully disable themselves
 * while REST capabilities continue working normally.
 */
export function getReverbConfig(): ReverbConfig | null {
  const rawKey = import.meta.env.VITE_REVERB_APP_KEY;
  if (!rawKey || typeof rawKey !== 'string' || rawKey.trim() === '') {
    return null;
  }

  const key = rawKey.trim();
  const wsHost = import.meta.env.VITE_REVERB_HOST || (typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1') || '127.0.0.1';
  const wsPort = import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT, 10) : 8080;
  const wsScheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
  const forceTLS = wsScheme === 'https';

  return {
    key,
    wsHost,
    wsPort,
    wssPort: wsPort,
    forceTLS,
    enabledTransports: ['ws', 'wss'],
  };
}

/**
 * Get or create the singleton Laravel Echo instance.
 * Returns null if Reverb configuration is unavailable or initialization fails.
 */
export function getEchoInstance(): Echo<'reverb'> | null {
  if (echoInstance) {
    return echoInstance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const config = getReverbConfig();
  if (!config) {
    return null;
  }

  const apiBaseUrl = getApiBaseUrl();

  try {
    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: config.key,
      wsHost: config.wsHost,
      wsPort: config.wsPort,
      wssPort: config.wssPort,
      forceTLS: config.forceTLS,
      enabledTransports: config.enabledTransports,
      authEndpoint: `${apiBaseUrl}/broadcasting/auth`,
      authorizer: (channel) => {
        return {
          authorize: (socketId, callback) => {
            (async () => {
              try {
                let token = getXsrfToken();
                if (!token) {
                  await ensureCsrfCookie();
                  token = getXsrfToken();
                }

                const res = await fetch(`${apiBaseUrl}/broadcasting/auth`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(token ? { 'X-XSRF-TOKEN': token } : {}),
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    socket_id: socketId,
                    channel_name: channel.name,
                  }),
                });

                if (!res.ok) {
                  const errData = await res.json().catch(() => ({}));
                  callback(new Error(errData.message || `Broadcast auth failed with status ${res.status}`), null);
                  return;
                }

                const data = await res.json();
                callback(null, data);
              } catch (err) {
                callback(err instanceof Error ? err : new Error(String(err)), null);
              }
            })();
          },
        };
      },
    });

    window.Echo = echoInstance;
    return echoInstance;
  } catch (err) {
    console.warn('[Echo] Failed to initialize Echo instance:', err);
    return null;
  }
}

/**
 * Retrieve the current Echo socket ID for originating socket exclusion (Section 10 & 11).
 * Returns null if Echo is not initialized or not yet connected.
 */
export function getEchoSocketId(): string | null {
  if (!echoInstance) {
    return null;
  }
  try {
    return echoInstance.socketId() || null;
  } catch {
    return null;
  }
}

/**
 * Subscribe to realtime note update signals on private channel `notes.{noteId}` (Section 12 & 13).
 *
 * Returns a cleanup function that unsubscribes and leaves the channel.
 */
export function subscribeToNoteUpdates(
  noteId: number,
  onUpdate: () => void,
  onReconnected?: () => void
): () => void {
  const echo = getEchoInstance();
  if (!echo) {
    return () => {};
  }

  const channelName = `notes.${noteId}`;
  const channel = echo.private(channelName);

  channel.listen('.note.updated', onUpdate);

  // Reconnect reconciliation: when the underlying WebSocket reconnects, notify caller
  let reconnectHandler: (() => void) | undefined;
  const connector = echo.connector as unknown as {
    pusher?: {
      connection?: {
        bind: (event: string, callback: () => void) => void;
        unbind: (event: string, callback: () => void) => void;
      };
    };
  };

  if (connector?.pusher?.connection && onReconnected) {
    reconnectHandler = () => {
      onReconnected();
    };
    try {
      connector.pusher.connection.bind('connected', reconnectHandler);
    } catch {
      // Ignore if binding not supported
    }
  }

  return () => {
    try {
      channel.stopListening('.note.updated');
      echo.leave(channelName);
      if (connector?.pusher?.connection && reconnectHandler) {
        connector.pusher.connection.unbind('connected', reconnectHandler);
      }
    } catch {
      // Ignore cleanup error
    }
  };
}

/**
 * Disconnect the active Echo singleton and reset references.
 */
export function disconnectEcho(): void {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    echoInstance = null;
    if (typeof window !== 'undefined') {
      window.Echo = null;
    }
  }
}
