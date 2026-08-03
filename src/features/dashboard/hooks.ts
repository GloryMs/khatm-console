import { useQuery } from '@tanstack/react-query';
import {
  getActivity,
  getAttention,
  getConsumingPartyStats,
  getDailyStats,
  getStats,
  type ActivityParams,
} from './api';
import { computeComparisonWindow, computeWindow, type StatsWindowOption } from './windows';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (days: StatsWindowOption) => [...dashboardKeys.all, 'stats', days] as const,
  dailyStats: (days: StatsWindowOption) => [...dashboardKeys.all, 'dailyStats', days] as const,
  consumingPartyStats: (days: StatsWindowOption) =>
    [...dashboardKeys.all, 'consumingPartyStats', days] as const,
  attention: () => [...dashboardKeys.all, 'attention'] as const,
  activity: (params: ActivityParams) => [...dashboardKeys.all, 'activity', params] as const,
};

/** 60s, per the brief: no websockets — a manual refresh button plus staleTime-based auto-refetch. */
const STATS_REFRESH_MS = 60_000;

/** Pilot-metrics counters for the last 7 or 30 days; auto-refetches every 60s and stays stale after that. */
export function useStats(days: StatsWindowOption) {
  const { from, to } = computeWindow(days);
  return useQuery({
    queryKey: dashboardKeys.stats(days),
    queryFn: () => getStats({ from, to }),
    staleTime: STATS_REFRESH_MS,
    refetchInterval: STATS_REFRESH_MS,
  });
}

/**
 * Per-day counters over twice the selected window (see
 * `windows.ts#computeComparisonWindow`) — one query backs the lifecycle
 * chart, the KPI cards' sparkline, and their period-over-period delta
 * (`dailyStats.ts`'s split/sum/delta helpers slice this one response three
 * ways instead of issuing three separate requests).
 */
export function useDailyStats(days: StatsWindowOption) {
  const { from, to } = computeComparisonWindow(days);
  return useQuery({
    queryKey: dashboardKeys.dailyStats(days),
    queryFn: () => getDailyStats({ from, to }),
    staleTime: STATS_REFRESH_MS,
    refetchInterval: STATS_REFRESH_MS,
  });
}

/** Call-volume + success rate per consuming party for the selected window — the top-parties panel. */
export function useConsumingPartyStats(days: StatsWindowOption) {
  const { from, to } = computeWindow(days);
  return useQuery({
    queryKey: dashboardKeys.consumingPartyStats(days),
    queryFn: () => getConsumingPartyStats({ from, to }),
    staleTime: STATS_REFRESH_MS,
    refetchInterval: STATS_REFRESH_MS,
  });
}

/** Itemized needs-attention feed — computed on read, so the same 60s cadence as the counters. */
export function useAttention() {
  return useQuery({
    queryKey: dashboardKeys.attention(),
    queryFn: getAttention,
    staleTime: STATS_REFRESH_MS,
    refetchInterval: STATS_REFRESH_MS,
  });
}

/** The recent-activity feed, optionally filtered to a set of actions — the activity table + tabs. */
export function useActivity(params: ActivityParams) {
  return useQuery({
    queryKey: dashboardKeys.activity(params),
    queryFn: () => getActivity(params),
    staleTime: STATS_REFRESH_MS,
    refetchInterval: STATS_REFRESH_MS,
  });
}
