import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getReverbConfig,
  getEchoInstance,
  getEchoSocketId,
  subscribeToNoteUpdates,
  disconnectEcho,
} from './echo';

describe('Realtime Echo Transport Foundation & Sync Helpers', () => {
  beforeEach(() => {
    disconnectEcho();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  afterEach(() => {
    disconnectEcho();
    vi.unstubAllEnvs();
  });

  it('provides public client connection config without server secrets', () => {
    const config = getReverbConfig();

    expect(config).not.toBeNull();
    if (!config) return;

    expect(config.key).toBe('test_reverb_key');
    expect(config.wsHost).toBeDefined();
    expect(config.wsPort).toBeGreaterThan(0);
    expect(config.enabledTransports).toContain('ws');

    // Security check: Verify no server secrets exist in config
    const configKeys = Object.keys(config);
    expect(configKeys).not.toContain('secret');
    expect(configKeys).not.toContain('REVERB_APP_SECRET');
    expect(JSON.stringify(config)).not.toContain('reverb_secret_local');
  });

  it('gracefully disables realtime when VITE_REVERB_APP_KEY is missing or empty (Section 27)', () => {
    vi.stubEnv('VITE_REVERB_APP_KEY', '');
    expect(getReverbConfig()).toBeNull();
    expect(getEchoInstance()).toBeNull();

    vi.stubEnv('VITE_REVERB_APP_KEY', '   ');
    expect(getReverbConfig()).toBeNull();
    expect(getEchoInstance()).toBeNull();
  });

  it('manages Echo as a reusable singleton', () => {
    const echo1 = getEchoInstance();
    const echo2 = getEchoInstance();

    expect(echo1).not.toBeNull();
    expect(echo1).toBe(echo2);
    expect(window.Echo).toBe(echo1);
    expect(window.Pusher).toBeDefined();
  });

  it('returns null socket ID when Echo has no active socket (Section 11)', () => {
    // Before connection is established, socketId returns null
    const socketId = getEchoSocketId();
    expect(socketId).toBeNull();
  });

  it('disconnects cleanly and resets singleton', () => {
    const echo1 = getEchoInstance();
    expect(echo1).not.toBeNull();

    disconnectEcho();
    expect(window.Echo).toBeNull();

    const echo2 = getEchoInstance();
    expect(echo2).not.toBeNull();
    // After disconnect, a fresh instance is created
    expect(echo2).not.toBe(echo1);
  });

  it('configures private note channel subscription on Echo', () => {
    const echo = getEchoInstance();
    expect(echo).not.toBeNull();

    if (echo) {
      const channel = echo.private('notes.42');
      expect(channel).toBeDefined();
      expect(channel.name).toBe('private-notes.42');
    }
  });

  it('subscribeToNoteUpdates binds listener and returns cleanup function (Section 12 & 13)', () => {
    let updateFired = false;
    const cleanup = subscribeToNoteUpdates(101, () => {
      updateFired = true;
    });

    expect(typeof cleanup).toBe('function');
    expect(updateFired).toBe(false);

    // Calling cleanup executes without errors
    expect(() => cleanup()).not.toThrow();
  });

  it('handles disconnect when no instance is active without error', () => {
    expect(() => disconnectEcho()).not.toThrow();
  });
});
