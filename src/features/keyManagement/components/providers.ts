import type { StatusTone } from '@/components/ui/StatusBadge';

// SOFT (neutral/gray — transitional) vs VAULT (success/green — the migration target, FS-2.3 D5/D6).
// An unrecognized future provider (AWS/GCP on the same SPI) falls through to 'neutral' and its raw
// value, rather than breaking — see SESSION-C8b scope.
export const PROVIDER_TONE: Record<string, StatusTone> = {
  SOFT: 'neutral',
  VAULT: 'success',
};

/**
 * Every provider this console knows how to offer explicitly (the contract's
 * own `provider` field is free-text, no server-side enum — see SESSION-C8b).
 * Reused by the rotate dialog's provider-switch choice (SESSION-C10) so the
 * known-provider list lives in exactly one place.
 */
export const KNOWN_PROVIDERS = Object.keys(PROVIDER_TONE);
