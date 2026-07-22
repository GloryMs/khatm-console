import type { ClaimField } from '@/features/issuance/claimsDef';

export const PSEUDO_REF_FIELD = 'pseudoRef';

/** Maps each claim field name (plus the optional `pseudoRef` column) to a CSV header, or `null` if unmapped. */
export interface ColumnMapping {
  pseudoRef: string | null;
  claims: Record<string, string | null>;
}

/** Auto-map CSV headers to claim fields by exact match, then case-insensitive match. */
export function autoMapColumns(headers: string[], fields: ClaimField[]): ColumnMapping {
  const findHeader = (name: string): string | null => {
    if (headers.includes(name)) return name;
    const lower = name.toLowerCase();
    return headers.find((header) => header.toLowerCase() === lower) ?? null;
  };

  const claims: Record<string, string | null> = {};
  for (const field of fields) claims[field.name] = findHeader(field.name);
  return { pseudoRef: findHeader(PSEUDO_REF_FIELD), claims };
}

/** Read one row's value for a mapped header; `undefined` when unmapped or the header is missing. */
export function readMappedValue(
  headers: string[],
  row: string[],
  header: string | null,
): string | undefined {
  if (!header) return undefined;
  const columnIndex = headers.indexOf(header);
  if (columnIndex === -1) return undefined;
  return row[columnIndex]?.trim();
}

export function isFullyMapped(mapping: ColumnMapping, fields: ClaimField[]): boolean {
  return fields.every((field) => mapping.claims[field.name] !== null);
}
