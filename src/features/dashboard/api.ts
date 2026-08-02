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
export type SigningKeysResponse = components['schemas']['SigningKeysResponse'];
export type SigningKeyView = components['schemas']['SigningKeyView'];
export type RotateKeyResponse = components['schemas']['RotateKeyResponse'];
export type RetireKeyRequest = components['schemas']['RetireKeyRequest'];
export type RetireKeyResponse = components['schemas']['RetireKeyResponse'];
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

/**
 * Every signing key's lifecycle status (kid/state/validFrom/validTo, never
 * the JWK itself) — KH-1.1.5-BE. Unlike `/.well-known/jwks.json` (public,
 * ACTIVE+RETIRING only) this is admin-scoped and includes every state,
 * including RETIRED.
 */
export function getSigningKeyStatuses(): Promise<SigningKeysResponse> {
  return apiFetch<SigningKeysResponse>('/api/v1/admin/signing-keys');
}

/**
 * Atomically generates a new signing key, moves the current ACTIVE key to
 * RETIRING, and activates the new one (KH-2.3a-BE D2) — the one-ACTIVE
 * partial unique index is the final arbiter under concurrent callers. Also
 * forces the tenant's status lists stale so the next sweep re-signs them
 * with the new key. Requires the `key:manage` scope.
 */
export function rotateSigningKey(): Promise<RotateKeyResponse> {
  return apiFetch<RotateKeyResponse>('/api/v1/admin/signing-keys/rotate', { method: 'POST' });
}

/**
 * Moves a RETIRING key to RETIRED (KH-2.3a-BE D4). 409 (KH-KEY-0409) if the
 * key isn't currently RETIRING; 422 (KH-KEY-0422) if it hasn't yet reached
 * `khatm.keys.min-retiring-age` (default P30D) — pass `force: true` to
 * bypass the guard (audited server-side). Requires the `key:manage` scope.
 */
export function retireSigningKey(kid: string, req: RetireKeyRequest): Promise<RetireKeyResponse> {
  return apiFetch<RetireKeyResponse>(
    `/api/v1/admin/signing-keys/${encodeURIComponent(kid)}/retire`,
    {
      method: 'POST',
      body: req,
    },
  );
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
