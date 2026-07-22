import type { BulkIssueItemResult, BulkIssueResponse } from './api';
import { isRowValid, type ValidatedRow } from './rowValidation';

export type ReportRowStatus = 'EXCLUDED' | 'ISSUED' | 'FAILED' | 'UNKNOWN';

export interface ReportRowView {
  /** 0-based index into the original CSV data rows — stable across client-excluded rows. */
  rowIndex: number;
  pseudoRef?: string;
  clientExcluded: boolean;
  result?: BulkIssueItemResult;
}

/**
 * Align the server's per-item report back to every original CSV row, including
 * rows excluded client-side (never submitted, so they have no server result).
 * `validRows` must be in the exact order they were submitted as `items` —
 * `response.results[i]` corresponds to `validRows[i]`, not the original CSV
 * index, since invalid rows are never sent.
 */
export function buildReportRows(
  allRows: ValidatedRow[],
  validRows: ValidatedRow[],
  response: BulkIssueResponse,
): ReportRowView[] {
  const resultByRowIndex = new Map<number, BulkIssueItemResult>();
  (response.results ?? []).forEach((result, submittedIndex) => {
    const rowIndex = validRows[submittedIndex]?.rowIndex;
    if (rowIndex !== undefined) resultByRowIndex.set(rowIndex, result);
  });

  return allRows.map((row) => {
    const clientExcluded = !isRowValid(row);
    return {
      rowIndex: row.rowIndex,
      pseudoRef: row.pseudoRef,
      clientExcluded,
      result: clientExcluded ? undefined : resultByRowIndex.get(row.rowIndex),
    };
  });
}

export function deriveReportStatus(row: ReportRowView): ReportRowStatus {
  if (row.clientExcluded) return 'EXCLUDED';
  if (row.result?.status === 'ISSUED') return 'ISSUED';
  if (row.result?.status === 'FAILED') return 'FAILED';
  return 'UNKNOWN';
}
