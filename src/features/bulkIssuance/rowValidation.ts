import type { ClaimField } from '@/features/issuance/claimsDef';
import { readMappedValue, type ColumnMapping } from './columnMapping';
import type { ParsedCsv } from './csv';

const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type RowErrorKind = 'required' | 'number' | 'date';

export interface RowFieldError {
  fieldName: string;
  kind: RowErrorKind;
}

export interface ValidatedRow {
  /** 0-based index into the original CSV data rows (header row excluded). */
  rowIndex: number;
  pseudoRef?: string;
  claims: Record<string, string>;
  errors: RowFieldError[];
}

export function isRowValid(row: ValidatedRow): boolean {
  return row.errors.length === 0;
}

/**
 * Validate every parsed CSV row against the schema's claim fields — same
 * rules as the single-issue `IssueForm` (required = `!selective`, number/date
 * patterns) mirrored client-side, never replacing the server's own
 * validation (hard constraint 3): a row that passes here can still come back
 * `FAILED` from the platform, and that per-item `error.code` is always the
 * displayed truth for that outcome.
 */
export function validateRows(
  parsed: ParsedCsv,
  fields: ClaimField[],
  mapping: ColumnMapping,
): ValidatedRow[] {
  return parsed.rows.map((row, rowIndex) => {
    const claims: Record<string, string> = {};
    const errors: RowFieldError[] = [];

    for (const field of fields) {
      const raw = readMappedValue(parsed.headers, row, mapping.claims[field.name]) ?? '';
      claims[field.name] = raw;

      if (field.required && raw === '') {
        errors.push({ fieldName: field.name, kind: 'required' });
        continue;
      }
      if (raw === '') continue;
      if (field.type === 'number' && !NUMBER_PATTERN.test(raw)) {
        errors.push({ fieldName: field.name, kind: 'number' });
      } else if (field.type === 'date' && !DATE_PATTERN.test(raw)) {
        errors.push({ fieldName: field.name, kind: 'date' });
      }
    }

    const pseudoRef = readMappedValue(parsed.headers, row, mapping.pseudoRef);
    return { rowIndex, pseudoRef, claims, errors };
  });
}
