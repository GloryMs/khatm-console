import { describe, expect, it } from 'vitest';
import { computeWindow } from './windows';

describe('computeWindow', () => {
  const now = new Date('2026-07-22T12:00:00.000Z');

  it('computes a 7-day trailing window', () => {
    expect(computeWindow(7, now)).toEqual({
      from: '2026-07-15T12:00:00.000Z',
      to: '2026-07-22T12:00:00.000Z',
    });
  });

  it('computes a 30-day trailing window', () => {
    expect(computeWindow(30, now)).toEqual({
      from: '2026-06-22T12:00:00.000Z',
      to: '2026-07-22T12:00:00.000Z',
    });
  });
});
