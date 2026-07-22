import { describe, expect, it } from 'vitest';
import type { BulkIssueResponse } from './api';
import { buildReportRows, deriveReportStatus } from './report';
import type { ValidatedRow } from './rowValidation';

describe('buildReportRows', () => {
  it('aligns server results back to the original CSV row indexes, including client-excluded rows', () => {
    // Row 1 (index 1) is invalid and excluded client-side, so only rows 0 and 2 are submitted.
    const allRows: ValidatedRow[] = [
      { rowIndex: 0, pseudoRef: 'holder-0', claims: {}, errors: [] },
      {
        rowIndex: 1,
        pseudoRef: 'holder-1',
        claims: {},
        errors: [{ fieldName: 'fullName', kind: 'required' }],
      },
      { rowIndex: 2, pseudoRef: 'holder-2', claims: {}, errors: [] },
    ];
    const validRows: ValidatedRow[] = [allRows[0], allRows[2]];
    const response: BulkIssueResponse = {
      total: 2,
      succeeded: 1,
      failed: 1,
      results: [
        { index: 0, status: 'ISSUED', ref: 'CRD-0', id: 'id-0', claimCode: 'CLAIM-0' },
        { index: 1, status: 'FAILED', error: { code: 'KH-CRD-0400', message: 'bad row' } },
      ],
    };

    const report = buildReportRows(allRows, validRows, response);

    expect(report).toHaveLength(3);
    expect(report[0]).toEqual({
      rowIndex: 0,
      pseudoRef: 'holder-0',
      clientExcluded: false,
      result: { index: 0, status: 'ISSUED', ref: 'CRD-0', id: 'id-0', claimCode: 'CLAIM-0' },
    });
    expect(report[1]).toEqual({
      rowIndex: 1,
      pseudoRef: 'holder-1',
      clientExcluded: true,
      result: undefined,
    });
    expect(report[2]).toEqual({
      rowIndex: 2,
      pseudoRef: 'holder-2',
      clientExcluded: false,
      result: { index: 1, status: 'FAILED', error: { code: 'KH-CRD-0400', message: 'bad row' } },
    });

    expect(deriveReportStatus(report[0])).toBe('ISSUED');
    expect(deriveReportStatus(report[1])).toBe('EXCLUDED');
    expect(deriveReportStatus(report[2])).toBe('FAILED');
  });

  it('marks a row UNKNOWN when a valid row somehow has no matching server result', () => {
    const allRows: ValidatedRow[] = [{ rowIndex: 0, claims: {}, errors: [] }];
    const report = buildReportRows(allRows, allRows, { results: [] });
    expect(deriveReportStatus(report[0])).toBe('UNKNOWN');
  });
});
