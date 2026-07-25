import { describe, expect, it } from 'vitest';
import { buildStatsCsv } from './csv';
import type { StatsCounters, StatsWindow } from './api';

describe('buildStatsCsv', () => {
  const window: StatsWindow = { from: '2026-06-22T12:00:00Z', to: '2026-07-22T12:00:00Z' };
  const counters: StatsCounters = {
    issued: 1234,
    claimsRedeemed: 900,
    consumed: 800,
    verifyOk: 700,
    revoked: 3,
    consumeDenied: 2,
    verifyFailed: 1,
  };

  it('serializes every counter plus the window bounds', () => {
    const csv = buildStatsCsv(counters, window);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('metric,value');
    expect(lines).toContain('window_from,2026-06-22T12:00:00Z');
    expect(lines).toContain('window_to,2026-07-22T12:00:00Z');
    expect(lines).toContain('issued,1234');
    expect(lines).toContain('claimsRedeemed,900');
    expect(lines).toContain('consumed,800');
    expect(lines).toContain('verifyOk,700');
    expect(lines).toContain('revoked,3');
    expect(lines).toContain('consumeDenied,2');
    expect(lines).toContain('verifyFailed,1');
  });

  it('defaults every counter to 0 and the window bounds to empty when missing, never throwing', () => {
    const csv = buildStatsCsv(undefined, undefined);
    expect(csv).toContain('window_from,');
    expect(csv).toContain('issued,0');
  });
});
