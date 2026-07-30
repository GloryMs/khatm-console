import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type MeResponse = components['schemas']['MeResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];
export type LoginChallengeResponse = components['schemas']['LoginChallengeResponse'];
export type TotpChallengeRequest = components['schemas']['TotpChallengeRequest'];

/**
 * Authenticates the console session. Two outcomes (spec FS-2.2 V1): the
 * platform sets the session cookie directly (this resolves with
 * `undefined`), or — when the account has an active TOTP enrollment — no
 * cookie is set yet and the response instead carries `totpRequired: true` +
 * `challengeId` to submit to {@link completeTotpLogin}.
 */
export function login(req: LoginRequest): Promise<LoginChallengeResponse | undefined> {
  return apiFetch<LoginChallengeResponse | undefined>('/api/v1/auth/login', {
    method: 'POST',
    body: req,
  });
}

/**
 * Completes a login that {@link login} flagged `totpRequired`, with either a
 * live TOTP code or a one-time recovery code (exactly one of the two). On
 * success, establishes the session exactly like a direct login.
 */
export async function completeTotpLogin(req: TotpChallengeRequest): Promise<void> {
  await apiFetch('/api/v1/auth/totp', { method: 'POST', body: req });
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
