import { describe, expect, it } from 'vitest';
import { parseIsoDurationMinutes } from './duration';

describe('parseIsoDurationMinutes', () => {
  it('parses supported ISO-8601 day/hour/minute durations into minutes', () => {
    expect(parseIsoDurationMinutes('PT30M')).toBe(30);
    expect(parseIsoDurationMinutes('PT2H')).toBe(120);
    expect(parseIsoDurationMinutes('P1D')).toBe(1440);
    expect(parseIsoDurationMinutes('P1DT2H30M')).toBe(1590);
  });

  it('returns undefined for blank or unsupported durations', () => {
    expect(parseIsoDurationMinutes(undefined)).toBeUndefined();
    expect(parseIsoDurationMinutes('')).toBeUndefined();
    expect(parseIsoDurationMinutes('P1M')).toBeUndefined();
    expect(parseIsoDurationMinutes('PT30S')).toBeUndefined();
  });
});
