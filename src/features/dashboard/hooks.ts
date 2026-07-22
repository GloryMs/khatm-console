import { useQuery } from '@tanstack/react-query';
import { getStats } from './api';
import { computeWindow, type StatsWindowOption } from './windows';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (days: StatsWindowOption) => [...dashboardKeys.all, 'stats', days] as const,
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
