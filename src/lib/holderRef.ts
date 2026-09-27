/** Shape the platform requires for a caller-supplied holder reference (`IssueRequest.holderRef`, `BulkIssueItem.pseudoRef`). */
export const HOLDER_REF_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Normalize operator input before shape-checking or sending it: `trim()` then
 * `toLowerCase()`. The platform's own pattern is lowercase-only, and hex is
 * case-insensitive, so this is a pure convenience — it never changes what the
 * value refers to.
 */
export function normalizeHolderRef(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * True when `input`, once normalized, is a well-formed holder reference.
 *
 * A holder reference, when present, is a pseudonymous alias for the credential's
 * holder — typically an HMAC-SHA256 the issuing organization's own system
 * computes over a real identifier it never discloses to Khatm. This console
 * only ever checks the value's *shape* (64 lowercase hex characters); it never
 * interprets what it refers to, and never computes or generates one itself —
 * that happens either in the issuing organization's own system, or, when the
 * field is left absent for a human console session, on the platform (P1: the
 * console holds no PII, so it cannot be the one deriving a pseudonym from it).
 */
export function isValidHolderRef(input: string): boolean {
  return HOLDER_REF_PATTERN.test(normalizeHolderRef(input));
}
