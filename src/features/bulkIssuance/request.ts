import type { BulkIssueDefaults, BulkIssueItem, BulkIssueRequest } from './api';
import type { ValidatedRow } from './rowValidation';

export interface BatchOptionsValues {
  maxUses: string;
  validMinutes: string;
  mintClaimCodes: boolean;
}

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

function buildClaimsMap(claims: Record<string, string>): BulkIssueItem['claims'] {
  const map: NonNullable<BulkIssueItem['claims']> = {};
  for (const [key, value] of Object.entries(claims)) {
    map[key] = value as unknown as Record<string, never>;
  }
  return map;
}

/** Build the exact `POST /api/v1/credentials/bulk` request from the wizard's valid rows and batch options. */
export function buildBulkIssueRequest(
  schemaCode: string,
  validRows: ValidatedRow[],
  options: BatchOptionsValues,
): BulkIssueRequest {
  const maxUses = toNumber(options.maxUses);
  const validMinutes = toNumber(options.validMinutes);
  const items: BulkIssueItem[] = validRows.map((row) => ({
    claims: buildClaimsMap(row.claims),
    pseudoRef: row.pseudoRef || undefined,
  }));
  const defaults: BulkIssueDefaults | undefined =
    maxUses !== undefined || validMinutes !== undefined ? { maxUses, validMinutes } : undefined;

  return {
    schemaCode,
    items,
    mintClaimCodes: options.mintClaimCodes,
    defaults,
  };
}
