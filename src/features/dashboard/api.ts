import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type StatsResponse = components['schemas']['StatsResponse'];
export type StatsCounters = components['schemas']['StatsCounters'];
export type StatsWindow = components['schemas']['StatsWindow'];
export type DailyStatsResponse = components['schemas']['DailyStatsResponse'];
export type DailyStatsEntry = components['schemas']['DailyStatsEntry'];
export type ConsumingPartyStatsResponse = components['schemas']['ConsumingPartyStatsResponse'];
export type ConsumingPartyStatsEntry = components['schemas']['ConsumingPartyStatsEntry'];
export type AttentionResponse = components['schemas']['AttentionResponse'];
export type AttentionEntry = components['schemas']['AttentionEntry'];
export type ActivityResponse = components['schemas']['ActivityResponse'];
export type ActivityItem = components['schemas']['ActivityItem'];

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

/**
 * The same counters as {@link getStats}, bucketed per UTC day (KH-1.1.5-BE) —
 * backs the dashboard's lifecycle chart and the KPI cards' sparkline/delta.
 * Same session-only gate as `/api/v1/stats`.
 */
export function getDailyStats(params: StatsParams): Promise<DailyStatsResponse> {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const query = search.toString();
  return apiFetch<DailyStatsResponse>(`/api/v1/stats/daily${query ? `?${query}` : ''}`);
}

/**
 * Call-volume + derived success rate per consuming party for a window
 * (KH-1.1.5-BE) — backs the dashboard's top-consuming-parties panel. Same
 * session-only gate as `/api/v1/stats`.
 */
export function getConsumingPartyStats(params: StatsParams): Promise<ConsumingPartyStatsResponse> {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const query = search.toString();
  return apiFetch<ConsumingPartyStatsResponse>(
    `/api/v1/stats/consuming-parties${query ? `?${query}` : ''}`,
  );
}

/**
 * Itemized, actionable anomalies computed on read from the audit trail
 * (KH-1.1.5-BE) — never a bare count, those are `/api/v1/stats`'s job.
 * Same session-only gate as `/api/v1/stats`.
 */
export function getAttention(): Promise<AttentionResponse> {
  return apiFetch<AttentionResponse>('/api/v1/attention');
}

export interface ActivityParams {
  limit?: number;
  /** Comma-separated `AuditAction` names; omit for every eligible action. */
  event?: string;
}

/**
 * The most recent credential-lifecycle audit events, newest first, already
 * resolved for display (human-readable `entityRef`, consuming-party
 * attribution where the event supports it) — KH-1.1.5-BE. Same session-only
 * gate as `/api/v1/stats`.
 */
export function getActivity(params: ActivityParams): Promise<ActivityResponse> {
  const search = new URLSearchParams();
  if (params.limit) search.set('limit', String(params.limit));
  if (params.event) search.set('event', params.event);
  const query = search.toString();
  return apiFetch<ActivityResponse>(`/api/v1/activity${query ? `?${query}` : ''}`);
}
