import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type UserSummary = components['schemas']['UserSummary'];
export type CreateUserRequest = components['schemas']['CreateUserRequest'];
export type CreateUserResponse = components['schemas']['CreateUserResponse'];
export type ReplaceRolesRequest = components['schemas']['ReplaceRolesRequest'];

const BASE = '/api/v1/users';

/** Every user of the caller's own tenant, newest first. Requires the `tenant:admin` scope. */
export function listUsers(): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(BASE);
}

/**
 * Creates a user with a generated temporary password (shown once) and
 * forces a change at first login. Requires the `tenant:admin` scope.
 */
export function createUser(req: CreateUserRequest): Promise<CreateUserResponse> {
  return apiFetch<CreateUserResponse>(BASE, { method: 'POST', body: req });
}

/**
 * Replaces the user's entire role set. Refused with 409 (KH-USR-0423) if it
 * would remove the tenant's last active administrator.
 */
export function replaceRoles(id: string, roles: string[]): Promise<UserSummary> {
  return apiFetch<UserSummary>(`${BASE}/${encodeURIComponent(id)}/roles`, {
    method: 'POST',
    body: { roles } satisfies ReplaceRolesRequest,
  });
}

/** Sets the user LOCKED. Refused with 409 (KH-USR-0423) for the last active administrator. */
export function lockUser(id: string): Promise<UserSummary> {
  return apiFetch<UserSummary>(`${BASE}/${encodeURIComponent(id)}/lock`, { method: 'POST' });
}

/** Restores a LOCKED/DISABLED user to ACTIVE. */
export function unlockUser(id: string): Promise<UserSummary> {
  return apiFetch<UserSummary>(`${BASE}/${encodeURIComponent(id)}/unlock`, { method: 'POST' });
}

/** Sets the user DISABLED. Refused with 409 (KH-USR-0423) for the last active administrator. */
export function disableUser(id: string): Promise<UserSummary> {
  return apiFetch<UserSummary>(`${BASE}/${encodeURIComponent(id)}/disable`, { method: 'POST' });
}

/**
 * Generates a new temporary password (shown once) and forces a change at
 * next login.
 */
export function resetPassword(id: string): Promise<CreateUserResponse> {
  return apiFetch<CreateUserResponse>(`${BASE}/${encodeURIComponent(id)}/reset-password`, {
    method: 'POST',
  });
}
