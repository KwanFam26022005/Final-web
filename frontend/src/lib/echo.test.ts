import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getReverbConfig, getEchoInstance, disconnectEcho } from './echo';

describe('Realtime Echo Transport Foundation (M1)', () => {
  beforeEach(() => {
    disconnectEcho();
    vi.clearAllMocks();
  });

  afterEach(() => {
    disconnectEcho();
  });

  it('provides public client connection config without server secrets', () => {
    const config = getReverbConfig();

    expect(config).toBeDefined();
    expect(config.key).toBeDefined();
    expect(config.wsHost).toBeDefined();
    expect(config.wsPort).toBeGreaterThan(0);
    expect(config.enabledTransports).toContain('ws');

    // Security check: Verify no server secrets exist in config
    const configKeys = Object.keys(config);
    expect(configKeys).not.toContain('secret');
    expect(configKeys).not.toContain('REVERB_APP_SECRET');
    expect(JSON.stringify(config)).not.toContain('reverb_secret_local');
  });

  it('manages Echo as a reusable singleton', () => {
    const echo1 = getEchoInstance();
    const echo2 = getEchoInstance();

    expect(echo1).not.toBeNull();
    expect(echo1).toBe(echo2);
    expect(window.Echo).toBe(echo1);
    expect(window.Pusher).toBeDefined();
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

  it('handles disconnect when no instance is active without error', () => {
    expect(() => disconnectEcho()).not.toThrow();
  });
});
