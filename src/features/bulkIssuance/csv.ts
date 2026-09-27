import Papa from 'papaparse';
import type { ClaimField } from '@/features/issuance/claimsDef';

/** Mirrors the platform's per-batch cap (KH-CRD-0400) so oversized files are rejected client-side. */
export const BULK_MAX_ROWS = 200;

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/** Strip a leading UTF-8 BOM (Arabic Excel exports commonly include one). */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Read a File's text via FileReader — `Blob#text()` isn't implemented in every test/runtime environment. */
function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file, 'utf-8');
  });
}

/** Parse a CSV file's header row and data rows. UTF-8, BOM tolerant. */
export async function parseCsvFile(file: File): Promise<ParsedCsv> {
  const text = stripBom(await readFileText(file));
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const [headerRow, ...rows] = result.data;
  return { headers: headerRow ?? [], rows };
}

const PSEUDO_REF_COLUMN = 'pseudoRef';

/**
 * Template CSV for a schema: one header column per claim field plus an
 * optional trailing `pseudoRef` column. Re-uploading this file unfilled
 * still parses (header row only, zero data rows).
 */
export function generateTemplateCsv(fields: ClaimField[]): string {
  const headers = [...fields.map((field) => field.name), PSEUDO_REF_COLUMN];
  return Papa.unparse({ fields: headers, data: [] });
}

export interface ReportRow {
  index: number;
  ref?: string;
  holderRef?: string;
  status: string;
  /** Resolved, localized error text (never a raw code/message pair) — empty for a non-failed row. */
  error?: string;
}

/**
 * Serialize the full bulk-issue report for the tenant's own record-keeping.
 * Deliberately excludes the one-time claim code (P1-adjacent: a CSV file is a
 * permanent artifact, unlike the report screen's single, revocable render) —
 * `holderRef` is the only per-row reference this export exists to preserve.
 */
export function generateReportCsv(rows: ReportRow[]): string {
  return Papa.unparse({
    fields: ['index', 'ref', 'holderRef', 'status', 'error'],
    data: rows.map((row) => [
      row.index,
      row.ref ?? '',
      row.holderRef ?? '',
      row.status,
      row.error ?? '',
    ]),
  });
}

/** Trigger a browser download of CSV text — the report export and the template download. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
