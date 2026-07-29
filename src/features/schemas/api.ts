import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type SchemaSummary = components['schemas']['SchemaSummary'];
export type SchemaDetail = components['schemas']['SchemaDetail'];
export type ClaimFieldRequest = components['schemas']['ClaimFieldRequest'];
export type SchemaCreateRequest = components['schemas']['SchemaCreateRequest'];
export type SchemaAuthoringRequest = components['schemas']['SchemaAuthoringRequest'];

/**
 * Read-only tenant schema list — no scope required (deliberate platform
 * decision). Returns every status; the operator-facing catalog and the
 * admin management view both call this and render it differently.
 */
export function listSchemas(): Promise<SchemaSummary[]> {
  return apiFetch<SchemaSummary[]>('/api/v1/schemas');
}

/** Full detail for one schema, including its raw `claimsDefJson`. */
export function getSchema(id: string): Promise<SchemaDetail> {
  return apiFetch<SchemaDetail>(`/api/v1/schemas/${encodeURIComponent(id)}`);
}

/** Create a new DRAFT schema (version 1). Requires the `schema:manage` scope. */
export function createSchema(req: SchemaCreateRequest): Promise<SchemaDetail> {
  return apiFetch<SchemaDetail>('/api/v1/schemas', { method: 'POST', body: req });
}

/** Rewrite a DRAFT schema's authoring fields in place. Requires the `schema:manage` scope. */
export function updateSchema(id: string, req: SchemaAuthoringRequest): Promise<SchemaDetail> {
  return apiFetch<SchemaDetail>(`/api/v1/schemas/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: req,
  });
}

/** DRAFT -> PUBLISHED. Irreversible: fields can never change again on this version. */
export function publishSchema(id: string): Promise<SchemaDetail> {
  return apiFetch<SchemaDetail>(`/api/v1/schemas/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  });
}

/** PUBLISHED -> ARCHIVED. Stops new issuance only; existing credentials are unaffected. */
export function archiveSchema(id: string): Promise<SchemaDetail> {
  return apiFetch<SchemaDetail>(`/api/v1/schemas/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  });
}

/** Create a new DRAFT version (same code, version + 1) of a PUBLISHED schema. */
export function createSchemaVersion(
  id: string,
  req: SchemaAuthoringRequest,
): Promise<SchemaDetail> {
  return apiFetch<SchemaDetail>(`/api/v1/schemas/${encodeURIComponent(id)}/versions`, {
    method: 'POST',
    body: req,
  });
}
