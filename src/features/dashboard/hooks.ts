import { useQuery } from '@tanstack/react-query';
import { getSigningKeys, getStats } from './api';
import { computeWindow, type StatsWindowOption } from './windows';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (days: StatsWindowOption) => [...dashboardKeys.all, 'stats', days] as const,
  signingKeys: () => [...dashboardKeys.all, 'signingKeys'] as const,
};

/** 60s, per the brief: no websockets — a manual refresh button plus staleTime-based auto-refetch. */
const STATS_REFRESH_MS = 60_000;

/** Signing keys rotate on the order of weeks/months — a 5-minute staleness window is plenty. */
const SIGNING_KEYS_REFRESH_MS = 5 * 60_000;

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

/** The platform's public signing-key set, for the dashboard's signing-keys panel. */
export function useSigningKeys() {
  return useQuery({
    queryKey: dashboardKeys.signingKeys(),
    queryFn: getSigningKeys,
    staleTime: SIGNING_KEYS_REFRESH_MS,
    refetchInterval: SIGNING_KEYS_REFRESH_MS,
  });
}
