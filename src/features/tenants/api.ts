import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type TenantView = components['schemas']['TenantView'];
export type CreateTenantRequest = components['schemas']['CreateTenantRequest'];

export type TenantType = 'GOVERNMENT' | 'EDUCATION' | 'PRIVATE' | 'OTHER';
export type TenantDeployMode = 'SAAS' | 'ONPREM' | 'FEDERATED';

const BASE = '/api/v1/admin/tenants';

/** Every tenant registered on the platform, newest first. Requires the `admin` scope. */
export function listTenants(): Promise<TenantView[]> {
  return apiFetch<TenantView[]>(BASE);
}

/** One tenant by id. Requires the `admin` scope. */
export function getTenant(id: string): Promise<TenantView> {
  return apiFetch<TenantView>(`${BASE}/${encodeURIComponent(id)}`);
}

/**
 * Full onboarding: tenant row, first ACTIVE signing key, default status list.
 * Resumable — retrying with a slug whose onboarding died partway through
 * resumes it rather than conflicting; only a fully-onboarded slug 409s
 * (KH-TNT-0409). Requires the `admin` scope.
 */
export function createTenant(req: CreateTenantRequest): Promise<TenantView> {
  return apiFetch<TenantView>(BASE, { method: 'POST', body: req });
}

/** ACTIVE -> SUSPENDED; blocks new issuance and sign-ins only. Idempotent. */
export function suspendTenant(id: string): Promise<TenantView> {
  return apiFetch<TenantView>(`${BASE}/${encodeURIComponent(id)}/suspend`, { method: 'POST' });
}

/** SUSPENDED -> ACTIVE; issuance and sign-ins resume. Idempotent. */
export function activateTenant(id: string): Promise<TenantView> {
  return apiFetch<TenantView>(`${BASE}/${encodeURIComponent(id)}/activate`, { method: 'POST' });
}
