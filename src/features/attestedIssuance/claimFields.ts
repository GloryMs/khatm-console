import type { ClaimField } from '@/features/issuance/claimsDef';

/**
 * Convention field name for the auto-populated SHA-256 digest (spec FS-2.4
 * D3, matched verbatim by the platform's own `AttestedDocument/v1` seed
 * schema — `AttestedDocumentSeeder.java`). The wizard locks whichever claim
 * field carries this name to the hashing module's own output; every other
 * claim field on the schema renders as an ordinary operator-filled input.
 */
export const DOC_SHA256_FIELD_NAME = 'doc_sha256';

export interface SplitClaimFields {
  /** The schema's own `doc_sha256` field definition, if it defines one. */
  hashField: ClaimField | undefined;
  /** Every other claim field — rendered and filled the same way the standard issue form does. */
  otherFields: ClaimField[];
}

/** Separate a schema's `doc_sha256` convention field from the rest of its claims_def. */
export function splitClaimFields(fields: ClaimField[]): SplitClaimFields {
  return {
    hashField: fields.find((field) => field.name === DOC_SHA256_FIELD_NAME),
    otherFields: fields.filter((field) => field.name !== DOC_SHA256_FIELD_NAME),
  };
}
