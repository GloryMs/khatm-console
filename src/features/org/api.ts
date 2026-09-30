import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';
import type {
  CreateUserRequest,
  CreateUserResponse,
  TenantView,
  UserSummary,
} from '@/features/tenants/api';
import type { SchemaSummary } from '@/features/schemas/api';
import type {
  CreateIssuerClientRequest,
  CreatedIssuerClientResponse,
  IssuerClientResponse,
  RotateIssuerClientRequest,
} from '@/features/issuerClients/api';

export type TenantRef = components['schemas']['TenantRef'];
export type OrgReportView = components['schemas']['OrgReportView'];
export type OrgReportEntry = components['schemas']['OrgReportEntry'];
export type OrgReportCounters = components['schemas']['OrgReportCounters'];

const BASE = '/api/v1/org';

/**
 * The caller's own direct children only — never grandchildren (spec FS-2.5
 * §7). Requires the `org:admin` scope.
 */
export function listChildren(): Promise<TenantRef[]> {
  return apiFetch<TenantRef[]>(`${BASE}/children`);
}

/**
 * Suspends a direct child — tenant:admin degree, never a delete. Refused
 * with 409 (`KH-TNT-1409`) if the child itself has an active child of its
 * own. Requires the `org:admin` scope.
 */
export function suspendChild(id: string): Promise<TenantView> {
  return apiFetch<TenantView>(`${BASE}/children/${encodeURIComponent(id)}/suspend`, {
    method: 'POST',
  });
}

/** Reactivates a suspended direct child. Requires the `org:admin` scope. */
export function activateChild(id: string): Promise<TenantView> {
  return apiFetch<TenantView>(`${BASE}/children/${encodeURIComponent(id)}/activate`, {
    method: 'POST',
  });
}

/**
 * A direct child's schemas, read-only — org:admin never manages a child's
 * schemas, only views them (spec §3). Requires the `org:admin` scope.
 */
export function listChildSchemas(id: string): Promise<SchemaSummary[]> {
  return apiFetch<SchemaSummary[]>(`${BASE}/children/${encodeURIComponent(id)}/schemas`);
}

/** A direct child's users, on behalf of it. Requires the `org:admin` scope. */
export function listChildUsers(id: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`${BASE}/children/${encodeURIComponent(id)}/users`);
}

/**
 * Creates a user in a direct child with a generated temporary password
 * (shown once) — the same creation shape as a local `tenant:admin`'s
 * own-tenant create, no additional privilege. Requires the `org:admin`
 * scope.
 */
export function createChildUser(id: string, req: CreateUserRequest): Promise<CreateUserResponse> {
  return apiFetch<CreateUserResponse>(`${BASE}/children/${encodeURIComponent(id)}/users`, {
    method: 'POST',
    body: req,
  });
}

/**
 * Disables a user in a direct child. Refused with 409 (`KH-USR-0423`) if it
 * would remove the child's last active administrator. Requires the
 * `org:admin` scope.
 */
export function disableChildUser(id: string, userId: string): Promise<UserSummary> {
  return apiFetch<UserSummary>(
    `${BASE}/children/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}/disable`,
    { method: 'POST' },
  );
}

/**
 * Generates a new temporary password (shown once) for a user in a direct
 * child. Requires the `org:admin` scope.
 */
export function resetChildUserPassword(id: string, userId: string): Promise<CreateUserResponse> {
  return apiFetch<CreateUserResponse>(
    `${BASE}/children/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}/reset-password`,
    { method: 'POST' },
  );
}

/**
 * A direct child's issuer clients, on behalf of it (spec FS-2.7a D10 D3) —
 * the same shape as the tenant's own `/api/v1/issuer-clients`, reached
 * through the parent's `org:admin` scope rather than the child's own
 * `key:manage`. Requires the `org:admin` scope.
 */
export function listChildIssuerClients(childId: string): Promise<IssuerClientResponse[]> {
  return apiFetch<IssuerClientResponse[]>(
    `${BASE}/children/${encodeURIComponent(childId)}/issuer-clients`,
  );
}

/**
 * Creates an issuer client in a direct child. The child inherits the root
 * tenant's holder HMAC secret, so the response never carries one here.
 * Requires the `org:admin` scope.
 */
export function createChildIssuerClient(
  childId: string,
  req: CreateIssuerClientRequest,
): Promise<CreatedIssuerClientResponse> {
  return apiFetch<CreatedIssuerClientResponse>(
    `${BASE}/children/${encodeURIComponent(childId)}/issuer-clients`,
    { method: 'POST', body: req },
  );
}

/** Requires the `org:admin` scope. */
export function rotateChildIssuerClient(
  childId: string,
  clientId: string,
  req: RotateIssuerClientRequest,
): Promise<CreatedIssuerClientResponse> {
  return apiFetch<CreatedIssuerClientResponse>(
    `${BASE}/children/${encodeURIComponent(childId)}/issuer-clients/${encodeURIComponent(clientId)}/rotate`,
    { method: 'POST', body: req },
  );
}

/** Requires the `org:admin` scope. */
export function suspendChildIssuerClient(
  childId: string,
  clientId: string,
): Promise<IssuerClientResponse> {
  return apiFetch<IssuerClientResponse>(
    `${BASE}/children/${encodeURIComponent(childId)}/issuer-clients/${encodeURIComponent(clientId)}/suspend`,
    { method: 'POST' },
  );
}

/** Requires the `org:admin` scope. */
export function resumeChildIssuerClient(
  childId: string,
  clientId: string,
): Promise<IssuerClientResponse> {
  return apiFetch<IssuerClientResponse>(
    `${BASE}/children/${encodeURIComponent(childId)}/issuer-clients/${encodeURIComponent(clientId)}/resume`,
    { method: 'POST' },
  );
}

/** Requires the `org:admin` scope. */
export function revokeChildIssuerClient(
  childId: string,
  clientId: string,
): Promise<IssuerClientResponse> {
  return apiFetch<IssuerClientResponse>(
    `${BASE}/children/${encodeURIComponent(childId)}/issuer-clients/${encodeURIComponent(clientId)}/revoke`,
    { method: 'POST' },
  );
}

export interface OrgReportParams {
  from?: string;
  to?: string;
}

/**
 * Issue/verify/consume/revoke counters per descendant tenant (any depth,
 * transitive over the full subtree — spec §7) plus a whole-subtree rollup,
 * for the requested window — numbers only, never a row or a claim (P1).
 * Requires the `org:admin` scope.
 */
export function fetchOrgReports(params: OrgReportParams): Promise<OrgReportView> {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const query = search.toString();
  return apiFetch<OrgReportView>(`${BASE}/reports${query ? `?${query}` : ''}`);
}
