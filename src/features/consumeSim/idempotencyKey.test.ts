import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateIdempotencyKey } from './idempotencyKey';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateIdempotencyKey', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses crypto.randomUUID when available (secure context)', () => {
    const spy = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('11111111-1111-4111-8111-111111111111');
    expect(generateIdempotencyKey()).toBe('11111111-1111-4111-8111-111111111111');
    expect(spy).toHaveBeenCalled();
  });

  it('falls back to a getRandomValues-built UUIDv4 when randomUUID is unavailable, as it is when the console is loaded over plain HTTP via a LAN IP', () => {
    vi.stubGlobal('crypto', {
      ...crypto,
      randomUUID: undefined,
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });

    const key = generateIdempotencyKey();
    expect(key).toMatch(UUID_PATTERN);
  });

  it('produces distinct keys on successive fallback calls', () => {
    vi.stubGlobal('crypto', {
      ...crypto,
      randomUUID: undefined,
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });

    expect(generateIdempotencyKey()).not.toBe(generateIdempotencyKey());
  });
});
