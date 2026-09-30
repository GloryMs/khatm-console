import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type IssuerClientResponse = components['schemas']['IssuerClientResponse'];
export type CreateIssuerClientRequest = components['schemas']['CreateIssuerClientRequest'];
export type CreatedIssuerClientResponse = components['schemas']['CreatedIssuerClientResponse'];
export type RotateIssuerClientRequest = components['schemas']['RotateIssuerClientRequest'];

const BASE = '/api/v1/issuer-clients';

/**
 * The caller's tenant's issuer clients, newest first — prefix, status,
 * scopes, allowed schemas, last use. Never the key, its secret, or its hash
 * (spec FS-2.7a D10). Requires the `key:manage` scope.
 */
export function listIssuerClients(): Promise<IssuerClientResponse[]> {
  return apiFetch<IssuerClientResponse[]>(BASE);
}

/**
 * Creates an issuer client and returns its `khi_` API key once — it cannot
 * be retrieved again. For the first client of a root tenant the response
 * also carries the tenant's holder HMAC secret, also shown once (spec D9);
 * later clients and child-tenant clients never carry one. Requires the
 * `key:manage` scope.
 */
export function createIssuerClient(
  req: CreateIssuerClientRequest,
): Promise<CreatedIssuerClientResponse> {
  return apiFetch<CreatedIssuerClientResponse>(BASE, { method: 'POST', body: req });
}

/**
 * Mints a replacement client (new key, same schemas and expiry) and puts
 * this one into a grace window (`retireAfterHours`, 0-72, default 24) before
 * a platform worker revokes it. Only an ACTIVE client can be rotated.
 * Requires the `key:manage` scope.
 */
export function rotateIssuerClient(
  id: string,
  req: RotateIssuerClientRequest,
): Promise<CreatedIssuerClientResponse> {
  return apiFetch<CreatedIssuerClientResponse>(`${BASE}/${encodeURIComponent(id)}/rotate`, {
    method: 'POST',
    body: req,
  });
}

/** ACTIVE -> SUSPENDED; its key is rejected until resumed. Requires the `key:manage` scope. */
export function suspendIssuerClient(id: string): Promise<IssuerClientResponse> {
  return apiFetch<IssuerClientResponse>(`${BASE}/${encodeURIComponent(id)}/suspend`, {
    method: 'POST',
  });
}

/** SUSPENDED -> ACTIVE. Requires the `key:manage` scope. */
export function resumeIssuerClient(id: string): Promise<IssuerClientResponse> {
  return apiFetch<IssuerClientResponse>(`${BASE}/${encodeURIComponent(id)}/resume`, {
    method: 'POST',
  });
}

/** Permanent. Requires the `key:manage` scope. */
export function revokeIssuerClient(id: string): Promise<IssuerClientResponse> {
  return apiFetch<IssuerClientResponse>(`${BASE}/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
  });
}
