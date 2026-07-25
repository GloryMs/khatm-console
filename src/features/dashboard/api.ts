import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type StatsResponse = components['schemas']['StatsResponse'];
export type StatsCounters = components['schemas']['StatsCounters'];
export type StatsWindow = components['schemas']['StatsWindow'];

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
 * One entry of `GET /.well-known/jwks.json`. The contract declares this
 * endpoint's response as an opaque JSON string (no `JwksResponse` schema),
 * so this shape is hand-typed from the platform's live response rather than
 * generated — only the fields actually present are typed; anything else is
 * ignored rather than guessed at.
 */
export interface SigningKey {
  kid: string;
  kty: string;
}

interface JwksResponse {
  keys?: SigningKey[];
}

/**
 * The platform's public signing-key set — ACTIVE + RETIRING keys, no
 * authentication required. Carries no status/expiry/rotation metadata of
 * its own (see `docs/specs/dashboard-v2-backend-needs.md` for what a real
 * "signing key health" view would need); the console only renders what's
 * verifiably here — a key is present.
 */
export async function getSigningKeys(): Promise<SigningKey[]> {
  const response = await apiFetch<JwksResponse>('/.well-known/jwks.json');
  return response.keys ?? [];
}
