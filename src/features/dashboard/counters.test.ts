import { describe, expect, it } from 'vitest';
import type { StatsCounters } from './api';
import { resolveCounterValue } from './counters';

describe('resolveCounterValue', () => {
  it('returns the counter value when present, including a real zero', () => {
    const counters: StatsCounters = { issued: 42, revoked: 0 };
    expect(resolveCounterValue(counters, 'issued')).toBe(42);
    expect(resolveCounterValue(counters, 'revoked')).toBe(0);
  });

  it('defaults to 0 for a counter absent from the response, never crashing', () => {
    const counters: StatsCounters = { issued: 5 };
    expect(resolveCounterValue(counters, 'consumeDenied')).toBe(0);
  });

  it('defaults to 0 when the whole counters object is missing', () => {
    expect(resolveCounterValue(undefined, 'issued')).toBe(0);
  });
});
