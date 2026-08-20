import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type TenantView = components['schemas']['TenantView'];
export type OnboardTenantRequest = components['schemas']['OnboardTenantRequest'];
export type OnboardTenantResponse = components['schemas']['OnboardTenantResponse'];
export type InitialAdminRequest = components['schemas']['InitialAdminRequest'];
export type CreateUserRequest = components['schemas']['CreateUserRequest'];
export type CreateUserResponse = components['schemas']['CreateUserResponse'];
export type UserSummary = components['schemas']['UserSummary'];
export type SetParentRequest = components['schemas']['SetParentRequest'];

export type TenantType = 'GOVERNMENT' | 'EDUCATION' | 'PRIVATE' | 'OTHER';
export type TenantDeployMode = 'SAAS' | 'ONPREM' | 'FEDERATED';

const BASE = '/api/v1/admin/tenants';

/** Every tenant registered on the platform, newest first. Requires the `platform:admin` scope. */
export function listTenants(): Promise<TenantView[]> {
  return apiFetch<TenantView[]>(BASE);
}

/** One tenant by id. Requires the `platform:admin` scope. */
export function getTenant(id: string): Promise<TenantView> {
  return apiFetch<TenantView>(`${BASE}/${encodeURIComponent(id)}`);
}

/**
 * Full onboarding: tenant row, first ACTIVE signing key, default status list,
 * the three-role catalog, and — when `initialAdmin` is present — the
 * tenant's first TENANT_ADMIN with a one-time temporary password (spec
 * FS-2.2 D6). Resumable — retrying with a slug whose onboarding died partway
 * through resumes it rather than conflicting; only a fully-onboarded slug
 * 409s (KH-TNT-0409). Requires the `platform:admin` scope.
 */
export function createTenant(req: OnboardTenantRequest): Promise<OnboardTenantResponse> {
  return apiFetch<OnboardTenantResponse>(BASE, { method: 'POST', body: req });
}

/**
 * Adds a user to a tenant other than the caller's own, run on behalf of the
 * named tenant (spec FS-2.2 D4 `OnBehalfOfExecutor`, audited `ON_BEHALF_OF`).
 * Same creation shape as a tenant admin's own-user create. Requires the
 * `platform:admin` scope.
 */
export function createUserInTenant(
  tenantId: string,
  req: CreateUserRequest,
): Promise<CreateUserResponse> {
  return apiFetch<CreateUserResponse>(`${BASE}/${encodeURIComponent(tenantId)}/users`, {
    method: 'POST',
    body: req,
  });
}

/**
 * Every user of the named tenant, newest first — the same row shape
 * `GET /api/v1/users` returns for a tenant admin's own tenant, run on behalf
 * of the named tenant (`OnBehalfOfExecutor`, audited `ON_BEHALF_OF`).
 * Requires the `platform:admin` scope.
 */
export function listUsersInTenant(tenantId: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`${BASE}/${encodeURIComponent(tenantId)}/users`);
}

/**
 * Clears a user's TOTP enrollment in a tenant other than the caller's own,
 * run on behalf of the named tenant (`OnBehalfOfExecutor`, audited
 * `ON_BEHALF_OF`). Idempotent. Requires the `platform:admin` scope.
 */
export async function resetTotpInTenant(tenantId: string, userId: string): Promise<void> {
  await apiFetch(
    `${BASE}/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}/totp/reset`,
    { method: 'POST' },
  );
}

/** ACTIVE -> SUSPENDED; blocks new issuance and sign-ins only. Idempotent. */
export function suspendTenant(id: string): Promise<TenantView> {
  return apiFetch<TenantView>(`${BASE}/${encodeURIComponent(id)}/suspend`, { method: 'POST' });
}

/** SUSPENDED -> ACTIVE; issuance and sign-ins resume. Idempotent. */
export function activateTenant(id: string): Promise<TenantView> {
  return apiFetch<TenantView>(`${BASE}/${encodeURIComponent(id)}/activate`, { method: 'POST' });
}

/**
 * Links, re-links, or unlinks a tenant's parent (spec FS-2.5 §2) — pure
 * organisational metadata, never a security or cryptographic change. An
 * omitted/blank `parentSlug` clears it, making the tenant a root again
 * (the contract's `parentSlug` is a plain optional string, so "clear" is
 * sent as `''` rather than `null`). Rejects a self-parent, a cycle,
 * exceeding the maximum hierarchy depth (three levels), or a parent that
 * is not ACTIVE (`KH-TNT-0422`/`1422`/`2422`/`3422`). Requires the
 * `platform:admin` scope.
 */
export function setParentTenant(id: string, parentSlug: string | undefined): Promise<TenantView> {
  return apiFetch<TenantView>(`${BASE}/${encodeURIComponent(id)}/parent`, {
    method: 'POST',
    body: { parentSlug: parentSlug ?? '' } satisfies SetParentRequest,
  });
}
