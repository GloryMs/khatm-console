import { afterEach, describe, expect, it, vi } from 'vitest';
import { getQrApiBase, isLocalhostOrigin, serializeQrPayload } from './qrPayload';

describe('serializeQrPayload', () => {
  it('produces byte-exact QR v1 JSON with keys v, api, code and nothing else', () => {
    const json = serializeQrPayload({ v: 1, api: 'https://khatm.example.com', code: 'ABC123' });
    // Exact bytes — the wallet parser is strict; key order and no-extras are part of the contract.
    expect(json).toBe('{"v":1,"api":"https://khatm.example.com","code":"ABC123"}');
  });

  it('starts with the version marker and preserves key order v → api → code', () => {
    const json = serializeQrPayload({ v: 1, api: 'https://api', code: 'xyz' });
    const keys = Object.keys(JSON.parse(json) as Record<string, unknown>);
    expect(keys).toEqual(['v', 'api', 'code']);
    expect(json.startsWith('{"v":1,')).toBe(true);
  });

  it('does not leak extra fields from the input object', () => {
    // Simulate an accidental caller-side extension — it must not reach the QR.
    const leaky = { v: 1, api: 'https://api', code: 'c', extra: 'no' } as unknown as Parameters<
      typeof serializeQrPayload
    >[0];
    expect(serializeQrPayload(leaky)).toBe('{"v":1,"api":"https://api","code":"c"}');
  });

  it('escapes embedded quotes in the code without breaking structure', () => {
    const json = serializeQrPayload({ v: 1, api: 'https://api', code: 'a"b' });
    expect(JSON.parse(json)).toEqual({ v: 1, api: 'https://api', code: 'a"b' });
  });
});

describe('isLocalhostOrigin', () => {
  it('flags localhost, 127.0.0.1, and ::1', () => {
    expect(isLocalhostOrigin('http://localhost:5173')).toBe(true);
    expect(isLocalhostOrigin('http://127.0.0.1:8080')).toBe(true);
    expect(isLocalhostOrigin('http://[::1]:8080')).toBe(true);
  });

  it('does not flag a LAN or production origin', () => {
    expect(isLocalhostOrigin('https://khatm.example.com')).toBe(false);
    expect(isLocalhostOrigin('http://192.168.1.10:5173')).toBe(false);
  });

  it('returns false for a malformed base instead of throwing', () => {
    expect(isLocalhostOrigin('not-a-url')).toBe(false);
  });
});

describe('getQrApiBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('falls back to the window origin when no override is set', () => {
    vi.stubEnv('VITE_QR_API_BASE', '');
    expect(getQrApiBase()).toBe(window.location.origin);
  });

  it('uses the override when VITE_QR_API_BASE is set', () => {
    vi.stubEnv('VITE_QR_API_BASE', 'https://khatm.example.com');
    expect(getQrApiBase()).toBe('https://khatm.example.com');
  });
});

// The "no silent QR api-base fallback" guard: getQrApiBase()'s silent
// window.location.origin fallback is only a real bug when that origin is
// localhost (meaningless to a scanning phone). A non-localhost same-origin
// fallback — the normal deployed case — must stay unflagged.
describe('QR api-base misconfiguration guard (env unset / localhost / real host)', () => {
  const originalLocation = window.location;

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('env set to a real base: resolved base is not flagged as localhost', () => {
    vi.stubEnv('VITE_QR_API_BASE', 'https://khatm.example.com');
    expect(isLocalhostOrigin(getQrApiBase())).toBe(false);
  });

  it('env unset, origin is localhost: resolved base is flagged', () => {
    vi.stubEnv('VITE_QR_API_BASE', '');
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost:5173/'),
      writable: true,
      configurable: true,
    });
    expect(isLocalhostOrigin(getQrApiBase())).toBe(true);
  });

  it('env unset, origin is a real deployed host: resolved base is not flagged', () => {
    vi.stubEnv('VITE_QR_API_BASE', '');
    Object.defineProperty(window, 'location', {
      value: new URL('https://console.khatm.example.com/'),
      writable: true,
      configurable: true,
    });
    expect(isLocalhostOrigin(getQrApiBase())).toBe(false);
  });
});
