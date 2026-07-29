import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type ConsumingPartyView = components['schemas']['ConsumingPartyView'];
export type AllowedSchema = components['schemas']['AllowedSchema'];
export type CreateConsumingPartyRequest = components['schemas']['CreateConsumingPartyRequest'];
export type CreateApiKeyResponse = components['schemas']['CreateApiKeyResponse'];

const BASE = '/api/v1/admin/consuming-parties';

/** Every consuming party registered for the tenant. Requires the `consumer:manage` scope. */
export function listConsumingParties(): Promise<ConsumingPartyView[]> {
  return apiFetch<ConsumingPartyView[]>(BASE);
}

/** Register a new consuming party. Requires the `consumer:manage` scope. */
export function createConsumingParty(
  req: CreateConsumingPartyRequest,
): Promise<ConsumingPartyView> {
  return apiFetch<ConsumingPartyView>(BASE, { method: 'POST', body: req });
}

/** SUSPENDED -> ACTIVE; its API keys authenticate again. Idempotent. */
export function activateConsumingParty(id: string): Promise<ConsumingPartyView> {
  return apiFetch<ConsumingPartyView>(`${BASE}/${encodeURIComponent(id)}/activate`, {
    method: 'POST',
  });
}

/** ACTIVE -> SUSPENDED; its API keys stop authenticating immediately. Idempotent. */
export function suspendConsumingParty(id: string): Promise<ConsumingPartyView> {
  return apiFetch<ConsumingPartyView>(`${BASE}/${encodeURIComponent(id)}/suspend`, {
    method: 'POST',
  });
}

/** Add a schema to a party's allowlist (deny-by-default otherwise). Idempotent. */
export function allowSchema(id: string, schemaId: string): Promise<ConsumingPartyView> {
  return apiFetch<ConsumingPartyView>(`${BASE}/${encodeURIComponent(id)}/allowed-schemas`, {
    method: 'POST',
    body: { schemaId },
  });
}

/** Remove a schema from a party's allowlist. Idempotent — a no-op returns 204. */
export async function disallowSchema(id: string, schemaId: string): Promise<void> {
  await apiFetch(
    `${BASE}/${encodeURIComponent(id)}/allowed-schemas/${encodeURIComponent(schemaId)}`,
    {
      method: 'DELETE',
    },
  );
}

/**
 * Mint a CONSUMING_PARTY-owned API key for this party. The response's
 * `rawKey` is shown exactly once — the platform never returns it again.
 */
export function mintApiKey(id: string): Promise<CreateApiKeyResponse> {
  return apiFetch<CreateApiKeyResponse>(`${BASE}/${encodeURIComponent(id)}/api-keys`, {
    method: 'POST',
  });
}
