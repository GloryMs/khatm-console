import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type MeResponse = components['schemas']['MeResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];

/** Authenticates the console session; the platform sets the session cookie. */
export async function login(req: LoginRequest): Promise<void> {
  await apiFetch('/api/v1/auth/login', { method: 'POST', body: req });
}

/** Invalidates the current console session. */
export async function logout(): Promise<void> {
  await apiFetch('/api/v1/auth/logout', { method: 'POST' });
}

/** Returns the authenticated user's identity, language, and scopes; 401 if unauthenticated. */
export function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/api/v1/auth/me');
}
