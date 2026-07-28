import type { StatusTone } from './StatusBadge';

/**
 * The explicit credential lifecycle vocabulary (spec FS-1.6 D1), shared by every surface that
 * renders a credential's `status` field: search rows, the revoke lookup detail, and (later)
 * holder-status/verify surfaces. `SUSPENDED` is part of the published vocabulary for forward
 * contract stability but is not emitted by the platform yet (no mechanism suspends an individual
 * credential today) — mapped here anyway so a future value doesn't fall through to the
 * `undefined`/unknown-status fallback.
 */
export type CredentialLifecycleStatus =
  'ACTIVE' | 'EXHAUSTED' | 'REVOKED' | 'SUSPENDED' | 'EXPIRED';

const TONE: Record<CredentialLifecycleStatus, StatusTone> = {
  ACTIVE: 'success',
  EXHAUSTED: 'warning',
  REVOKED: 'danger',
  SUSPENDED: 'warning',
  EXPIRED: 'warning',
};

const MESSAGE_KEY: Record<CredentialLifecycleStatus, string> = {
  ACTIVE: 'revoke.statusActive',
  EXHAUSTED: 'revoke.statusExhausted',
  REVOKED: 'revoke.statusRevoked',
  SUSPENDED: 'revoke.statusSuspended',
  EXPIRED: 'revoke.statusExpired',
};

function isKnownStatus(status: string | undefined): status is CredentialLifecycleStatus {
  return status !== undefined && status in TONE;
}

/** Badge tone for a credential's `status` string; `neutral` for an absent/unrecognized value. */
export function credentialStatusTone(status: string | undefined): StatusTone {
  return isKnownStatus(status) ? TONE[status] : 'neutral';
}

/** i18n key for a credential's `status` string; `undefined` for an absent/unrecognized value. */
export function credentialStatusMessageKey(status: string | undefined): string | undefined {
  return isKnownStatus(status) ? MESSAGE_KEY[status] : undefined;
}
