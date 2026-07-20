import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type CredentialView = components['schemas']['CredentialView'];

/** Proof/status metadata for one credential — never claim values (P1). */
export function getCredential(id: string): Promise<CredentialView> {
  return apiFetch<CredentialView>(`/api/v1/credentials/${encodeURIComponent(id)}`);
}

/**
 * Revoke a credential. Irreversible. Requires the `revoke` scope and a console
 * session server-side; returns an empty 200 on success.
 */
export async function revokeCredential(id: string): Promise<void> {
  await apiFetch(`/api/v1/credentials/${encodeURIComponent(id)}/revoke`, { method: 'POST' });
}
