import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type MeResponse = components['schemas']['MeResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];

/** Authenticates the console session; the platform sets the session cookie. */
export async function login(req: LoginRequest): Promise<void> {
  await apiFetch('/api/v1/auth/login', { method: 'POST', body: req });
}

/** Invalidates the current console session. */
export async function logout(): Promise<void> {
  await apiFetch('/api/v1/auth/logout', { method: 'POST' });
}

/**
 * Returns the authenticated user's identity, language, scopes, and
 * `mustChangePassword` (spec FS-2.2 D5); 401 if unauthenticated. This is the
 * one endpoint exempt from the platform's forced-password-change gate, so
 * it is safe to call to detect that state before anything else.
 */
export function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/api/v1/auth/me');
}

/**
 * Self-service password change — the one call a `mustChangePassword` user
 * may make while the gate is active, and the call that clears it.
 */
export async function changeMyPassword(req: ChangePasswordRequest): Promise<void> {
  await apiFetch('/api/v1/users/me/password', { method: 'POST', body: req });
}
