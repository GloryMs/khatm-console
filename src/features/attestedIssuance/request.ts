import type { IssueRequest, SchemaDetail } from '@/features/issuance/api';
import { DOC_SHA256_FIELD_NAME } from './claimFields';

/** Collected attested-issue values. `claims` excludes `doc_sha256` — supplied separately from the computed digest. */
export interface AttestedIssueFormValues {
  holderRef: string;
  maxUses: string;
  validMinutes: string;
  claims: Record<string, string>;
  /** The `attestation.note` request field — recorded in the `SCAN_ATTESTED` audit line, never a claim. */
  attestationNote: string;
}

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

function requireText(value: string | undefined, errorKey: string): string {
  if (!value) throw new Error(errorKey);
  return value;
}

/**
 * Build the exact `POST /api/v1/credentials/issue` request for the attested
 * flow. `digestHex` is always the hashing module's own output — never an
 * operator-typed value (spec FS-2.4 item 2) — and always lands under
 * {@link DOC_SHA256_FIELD_NAME}, overwriting anything a stray form field of
 * the same name might otherwise have contributed. `attestation` is always
 * sent as an object (never omitted): the platform's deny-by-default check
 * (`KH-ATT-0400`) only requires the object to be present, not its `note` to
 * be non-blank.
 */
export function buildAttestedIssueRequest(
  detail: SchemaDetail,
  values: AttestedIssueFormValues,
  digestHex: string,
): IssueRequest {
  const claims: NonNullable<IssueRequest['claims']> = {};
  for (const [key, value] of Object.entries(values.claims)) {
    claims[key] = value as unknown as Record<string, never>;
  }
  claims[DOC_SHA256_FIELD_NAME] = digestHex as unknown as Record<string, never>;

  const note = values.attestationNote.trim();

  return {
    holderRef: values.holderRef,
    schemaCode: requireText(detail.code, 'issueAttested.missingSchemaCode'),
    // Pins issuance to the exact schema version the operator picked, not whatever
    // (schemaCode, version=1) the backend would otherwise resolve on its own.
    schemaId: requireText(detail.id, 'issueAttested.missingSchemaCode'),
    claims,
    maxUses: toNumber(values.maxUses),
    validMinutes: toNumber(values.validMinutes),
    sdFields: detail.sdFields,
    attestation: note ? { note } : {},
  };
}
