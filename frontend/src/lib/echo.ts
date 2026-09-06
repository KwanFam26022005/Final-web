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

export function getReverbConfig(): ReverbConfig {
  const key = import.meta.env.VITE_REVERB_APP_KEY || 'reverb_key_local';
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

export function getEchoInstance(): Echo<'reverb'> | null {
  if (echoInstance) {
    return echoInstance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const config = getReverbConfig();
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
                    'Accept': 'application/json',
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
