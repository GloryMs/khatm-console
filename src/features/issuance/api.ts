import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type SchemaSummary = components['schemas']['SchemaSummary'];
export type SchemaDetail = components['schemas']['SchemaDetail'];
export type IssueRequest = components['schemas']['IssueRequest'];
export type IssueResponse = components['schemas']['IssueResponse'];
export type ClaimCodeMintRequest = components['schemas']['ClaimCodeMintRequest'];
export type ClaimCodeMintResponse = components['schemas']['ClaimCodeMintResponse'];

/**
 * Published schemas available for the standard (non-attested) issue flow.
 * Excludes `requiresAttestation` schemas — those only ever issue via the
 * dedicated attested-document wizard (`attestedIssuance`), which submits the
 * `attestation` object this flow never sends; picking one here would be a
 * guaranteed `KH-ATT-0400` (spec FS-2.4 item 2, deny-by-default). Shared by
 * both the single-issue picker and the bulk-issue picker (`bulkIssuance`
 * re-exports this hook) — bulk issuance rejects attested schemas wholesale
 * (`KH-ATT-0402`) for the same reason, so filtering here covers both screens.
 */
export async function listPublishedSchemas(): Promise<SchemaSummary[]> {
  const schemas = await apiFetch<SchemaSummary[]>('/api/v1/schemas');
  return schemas.filter((schema) => schema.status === 'PUBLISHED' && !schema.requiresAttestation);
}

/** Published schemas for the attested-document wizard — the mirror image of {@link listPublishedSchemas}. */
export async function listAttestedSchemas(): Promise<SchemaSummary[]> {
  const schemas = await apiFetch<SchemaSummary[]>('/api/v1/schemas');
  return schemas.filter((schema) => schema.status === 'PUBLISHED' && schema.requiresAttestation);
}

/** Full schema detail used to render an issue form from `claimsDefJson`. */
export function getIssueSchema(id: string): Promise<SchemaDetail> {
  return apiFetch<SchemaDetail>(`/api/v1/schemas/${encodeURIComponent(id)}`);
}

/** Issue one credential against a selected schema code. */
export function issueCredential(req: IssueRequest): Promise<IssueResponse> {
  return apiFetch<IssueResponse>('/api/v1/credentials/issue', { method: 'POST', body: req });
}

/** Mint the one-time wallet claim code encoded by the issue success QR. */
export function mintClaimCode(
  id: string,
  req: ClaimCodeMintRequest,
): Promise<ClaimCodeMintResponse> {
  return apiFetch<ClaimCodeMintResponse>(
    `/api/v1/credentials/${encodeURIComponent(id)}/claim-code`,
    {
      method: 'POST',
      body: req,
    },
  );
}
