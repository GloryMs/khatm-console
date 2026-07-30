import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type TotpEnrollResponse = components['schemas']['TotpEnrollResponse'];
export type TotpConfirmRequest = components['schemas']['TotpConfirmRequest'];
export type TotpConfirmResponse = components['schemas']['TotpConfirmResponse'];

const BASE = '/api/v1/users/me/totp';

/**
 * Starts (or restarts) TOTP enrollment for the caller's own account: a fresh
 * secret, shown once as both an `otpauth://` URI (QR) and Base32 text.
 * Refused with 409 if TOTP is already active — an administrator must reset
 * it first (see `features/users`' and `features/tenants`' Reset 2FA action).
 * Calling this again before confirming simply supersedes the previous,
 * not-yet-confirmed secret.
 */
export function enrollTotp(): Promise<TotpEnrollResponse> {
  return apiFetch<TotpEnrollResponse>(`${BASE}/enroll`, { method: 'POST' });
}

/**
 * Activates the pending enrollment with a live code from the authenticator
 * app; returns 10 one-time recovery codes, shown once.
 */
export function confirmTotp(req: TotpConfirmRequest): Promise<TotpConfirmResponse> {
  return apiFetch<TotpConfirmResponse>(`${BASE}/confirm`, { method: 'POST', body: req });
}
