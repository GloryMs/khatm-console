import { describe, expect, it } from 'vitest';
import {
  buildChartDays,
  buildSparkline,
  computeDeltaPercent,
  splitDailyEntries,
  sumCounter,
} from './dailyStats';
import type { DailyStatsEntry } from './api';

const entries: DailyStatsEntry[] = [
  { day: '2026-07-20T00:00:00Z', counters: { issued: 2, consumed: 1, revoked: 0 } },
  { day: '2026-07-23T00:00:00Z', counters: { issued: 5, consumed: 3, revoked: 1 } },
  { day: '2026-07-24T00:00:00Z', counters: { issued: 4, consumed: 2, revoked: 0 } },
];

describe('splitDailyEntries', () => {
  it('splits entries by whether their day is before or on/after the boundary', () => {
    const { previous, current } = splitDailyEntries(entries, new Date('2026-07-22T00:00:00Z'));
    expect(previous.map((e) => e.day)).toEqual(['2026-07-20T00:00:00Z']);
    expect(current.map((e) => e.day)).toEqual(['2026-07-23T00:00:00Z', '2026-07-24T00:00:00Z']);
  });

  it('ignores entries with no day', () => {
    const { previous, current } = splitDailyEntries(
      [{ counters: { issued: 1 } }, ...entries],
      new Date('2026-07-22T00:00:00Z'),
    );
    expect(previous.length + current.length).toBe(3);
  });
});

describe('sumCounter', () => {
  it('sums one counter across entries', () => {
    expect(sumCounter(entries, 'issued')).toBe(11);
    expect(sumCounter(entries, 'revoked')).toBe(1);
  });

  it('returns 0 for an empty list', () => {
    expect(sumCounter([], 'issued')).toBe(0);
  });
});

describe('computeDeltaPercent', () => {
  it('computes percent change from previous to current', () => {
    expect(computeDeltaPercent(120, 100)).toBe(20);
    expect(computeDeltaPercent(80, 100)).toBe(-20);
  });

  it('returns undefined when there is no baseline, never a fabricated/infinite percent', () => {
    expect(computeDeltaPercent(5, 0)).toBeUndefined();
    expect(computeDeltaPercent(0, 0)).toBeUndefined();
  });
});

describe('buildSparkline', () => {
  it('densifies missing days with 0, oldest first', () => {
    const windowEnd = new Date('2026-07-24T00:00:00Z');
    const spark = buildSparkline(entries, 'issued', 5, windowEnd);
    // 2026-07-20 .. 2026-07-24
    expect(spark).toEqual([2, 0, 0, 5, 4]);
  });
});

describe('buildChartDays', () => {
  it('densifies missing days with 0 counters, oldest first', () => {
    const windowEnd = new Date('2026-07-24T00:00:00Z');
    const days = buildChartDays(entries, 3, windowEnd);
    expect(days).toEqual([
      { date: '2026-07-22', issued: 0, consumed: 0, revoked: 0 },
      { date: '2026-07-23', issued: 5, consumed: 3, revoked: 1 },
      { date: '2026-07-24', issued: 4, consumed: 2, revoked: 0 },
    ]);
  });
});
