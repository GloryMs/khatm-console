import type { LocalizedText } from '@/hooks/useLocalizedText';

/**
 * `AttentionEntry.detail` is an untyped JSON object on the wire (the
 * generated type is unusable — an `additionalProperties: {}` schema
 * round-trips through openapi-typescript as `Record<string, never>`
 * values). These are the fields actually observed live for each shipped
 * `type` (verified against the running platform, not guessed) — read
 * defensively, never assumed present.
 */
export interface SchemaDeniedDetail {
  schemaCode?: string;
  credentialRef?: string;
  partyCode?: string;
  partyName?: LocalizedText;
}

export function asSchemaDeniedDetail(detail: unknown): SchemaDeniedDetail {
  return detail && typeof detail === 'object' ? (detail as SchemaDeniedDetail) : {};
}
