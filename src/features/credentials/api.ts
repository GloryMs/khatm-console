import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { buildSearchParams, type CredentialSearchFilters } from './queryParams';

export type CredentialSummary = components['schemas']['CredentialSummary'];
export type CredentialPage = components['schemas']['CredentialPage'];

/**
 * Console-facing search over this tenant's credentials (KH-1.1.4) — proof/
 * status metadata rows only, never claim content (P1 rule). Requires a
 * console session; no API key of any kind is accepted here.
 */
export function searchCredentials(filters: CredentialSearchFilters): Promise<CredentialPage> {
  const params = buildSearchParams(filters);
  return apiFetch<CredentialPage>(`/api/v1/credentials?${params.toString()}`);
}
