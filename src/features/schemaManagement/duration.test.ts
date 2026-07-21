import { describe, expect, it } from 'vitest';
import { daysHoursToIsoDuration, parseIsoDurationToDaysHours } from './duration';

describe('daysHoursToIsoDuration', () => {
  it('serializes days and hours together', () => {
    expect(daysHoursToIsoDuration(2, 3)).toBe('P2DT3H');
  });

  it('omits the T segment when hours is zero', () => {
    expect(daysHoursToIsoDuration(5, 0)).toBe('P5D');
  });

  it('omits the day segment when days is zero', () => {
    expect(daysHoursToIsoDuration(0, 4)).toBe('PT4H');
  });

  it('returns undefined when both are zero (no default set)', () => {
    expect(daysHoursToIsoDuration(0, 0)).toBeUndefined();
  });
});

describe('parseIsoDurationToDaysHours', () => {
  it('round-trips an exact days+hours duration authored by this builder', () => {
    expect(parseIsoDurationToDaysHours(daysHoursToIsoDuration(2, 3))).toEqual({
      days: 2,
      hours: 3,
    });
  });

  it('round-trips a days-only duration', () => {
    expect(parseIsoDurationToDaysHours(daysHoursToIsoDuration(5, 0))).toEqual({
      days: 5,
      hours: 0,
    });
  });

  it('rounds a minute remainder up to the next hour rather than dropping it', () => {
    expect(parseIsoDurationToDaysHours('PT90M')).toEqual({ days: 0, hours: 2 });
  });

  it('returns zero for a blank duration', () => {
    expect(parseIsoDurationToDaysHours(undefined)).toEqual({ days: 0, hours: 0 });
    expect(parseIsoDurationToDaysHours(null)).toEqual({ days: 0, hours: 0 });
  });

  it('returns zero for an unparseable duration instead of throwing', () => {
    expect(parseIsoDurationToDaysHours('not-a-duration')).toEqual({ days: 0, hours: 0 });
  });
});
