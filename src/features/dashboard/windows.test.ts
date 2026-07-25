import { describe, expect, it } from 'vitest';
import { computeComparisonWindow, computeWindow, formatWindowRange } from './windows';

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

describe('computeComparisonWindow', () => {
  const now = new Date('2026-07-22T12:00:00.000Z');

  it('spans twice the window, ending now', () => {
    expect(computeComparisonWindow(7, now)).toEqual({
      from: '2026-07-08T12:00:00.000Z',
      to: '2026-07-22T12:00:00.000Z',
    });
  });
});

describe('formatWindowRange', () => {
  it('formats a "from – to" range in the given locale', () => {
    const range = formatWindowRange(
      { from: '2026-07-01T12:00:00.000Z', to: '2026-07-25T12:00:00.000Z' },
      'en',
    );
    expect(range).toBe('Jul 1 – Jul 25');
  });

  it('returns an empty string when either bound is missing, never throwing', () => {
    expect(formatWindowRange(undefined, 'en')).toBe('');
    expect(formatWindowRange({ from: '2026-07-01T12:00:00.000Z' }, 'en')).toBe('');
    expect(formatWindowRange({ to: '2026-07-25T12:00:00.000Z' }, 'en')).toBe('');
  });
});
