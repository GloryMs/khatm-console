import type { DailyStatsEntry } from './api';
import { resolveCounterValue, type CounterKey } from './counters';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Split a `computeComparisonWindow` response's sparse per-day entries
 * (`/api/v1/stats/daily` omits days with zero activity across every action)
 * into the "current" half (from `boundary` to now) and "previous" half
 * (before `boundary`), for the KPI cards' period-over-period delta.
 */
export function splitDailyEntries(
  entries: DailyStatsEntry[],
  boundary: Date,
): { previous: DailyStatsEntry[]; current: DailyStatsEntry[] } {
  const boundaryMs = boundary.getTime();
  const previous: DailyStatsEntry[] = [];
  const current: DailyStatsEntry[] = [];
  for (const entry of entries) {
    if (!entry.day) continue;
    (new Date(entry.day).getTime() < boundaryMs ? previous : current).push(entry);
  }
  return { previous, current };
}

/** Sum one counter across a set of daily entries. */
export function sumCounter(entries: DailyStatsEntry[], key: CounterKey): number {
  return entries.reduce((sum, entry) => sum + resolveCounterValue(entry.counters, key), 0);
}

/**
 * Percent change from `previous` to `current`. `undefined` when there's no
 * meaningful baseline to compare against (previous is 0) — never a
 * fabricated or infinite percentage.
 */
export function computeDeltaPercent(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

/**
 * One counter's value per calendar day over the trailing `days` days ending
 * on `windowEnd`, densified with 0 for days `/api/v1/stats/daily` omitted —
 * the KPI cards' sparkline.
 */
export function buildSparkline(
  entries: DailyStatsEntry[],
  key: CounterKey,
  days: number,
  windowEnd: Date,
): number[] {
  const byDate = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.day) continue;
    byDate.set(entry.day.slice(0, 10), resolveCounterValue(entry.counters, key));
  }
  const values: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dateKey = new Date(windowEnd.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    values.push(byDate.get(dateKey) ?? 0);
  }
  return values;
}

export interface ChartDay {
  date: string;
  issued: number;
  consumed: number;
  revoked: number;
}

/**
 * The lifecycle chart's per-day series (issued/consumed/revoked) over the
 * trailing `days` days ending on `windowEnd`, densified with 0 for days
 * `/api/v1/stats/daily` omitted, oldest first.
 */
export function buildChartDays(
  entries: DailyStatsEntry[],
  days: number,
  windowEnd: Date,
): ChartDay[] {
  const byDate = new Map<string, DailyStatsEntry>();
  for (const entry of entries) {
    if (!entry.day) continue;
    byDate.set(entry.day.slice(0, 10), entry);
  }
  const result: ChartDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dateKey = new Date(windowEnd.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    const entry = byDate.get(dateKey);
    result.push({
      date: dateKey,
      issued: resolveCounterValue(entry?.counters, 'issued'),
      consumed: resolveCounterValue(entry?.counters, 'consumed'),
      revoked: resolveCounterValue(entry?.counters, 'revoked'),
    });
  }
  return result;
}
