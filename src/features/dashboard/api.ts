import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type StatsResponse = components['schemas']['StatsResponse'];
export type StatsCounters = components['schemas']['StatsCounters'];

export interface StatsParams {
  from?: string;
  to?: string;
}

/**
 * Pilot-metrics counters (KH-1.5.3) — a plain aggregation over the audit log,
 * never claim content (P1). Requires a console session; no API key of any
 * kind is accepted here.
 */
export function getStats(params: StatsParams): Promise<StatsResponse> {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const query = search.toString();
  return apiFetch<StatsResponse>(`/api/v1/stats${query ? `?${query}` : ''}`);
}
