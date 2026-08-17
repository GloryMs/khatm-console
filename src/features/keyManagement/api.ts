import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type SigningKeysResponse = components['schemas']['SigningKeysResponse'];
export type SigningKeyView = components['schemas']['SigningKeyView'];
export type RotateKeyRequest = components['schemas']['RotateKeyRequest'];
export type RotateKeyResponse = components['schemas']['RotateKeyResponse'];
export type RetireKeyRequest = components['schemas']['RetireKeyRequest'];
export type RetireKeyResponse = components['schemas']['RetireKeyResponse'];

/**
 * Every signing key's lifecycle status (kid/state/validFrom/validTo, never
 * the JWK itself) — KH-1.1.5-BE. Unlike `/.well-known/jwks.json` (public,
 * ACTIVE+RETIRING only) this is admin-scoped and includes every state,
 * including RETIRED. Also backs the dashboard's read-only signing-keys
 * glance (`dashboard/components/SigningKeysPanel.tsx`) — same query, same
 * cache entry, so a rotate/retire here is reflected there without a
 * separate invalidation.
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
 *
 * `provider` is the SOFT->Vault migration mechanism (spec FS-2.3 D6,
 * `RotateKeyRequest.provider`): omitted (the default), the new key inherits
 * the tenant's current provider and no request body is sent at all — the
 * literal pre-C10 behavior. Passed explicitly, the new key is generated on
 * that provider instead.
 */
export function rotateSigningKey(
  provider?: RotateKeyRequest['provider'],
): Promise<RotateKeyResponse> {
  return apiFetch<RotateKeyResponse>('/api/v1/admin/signing-keys/rotate', {
    method: 'POST',
    body: provider === undefined ? undefined : { provider },
  });
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
