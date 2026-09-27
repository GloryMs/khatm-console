import { describe, expect, it } from 'vitest';
import type { ValidatedRow } from './rowValidation';
import { buildBulkIssueRequest } from './request';

const validRows: ValidatedRow[] = [
  {
    rowIndex: 0,
    pseudoRef: 'holder-1',
    claims: { fullName: 'Ali', caseNumber: 'CASE-1' },
    errors: [],
  },
  {
    rowIndex: 2,
    pseudoRef: undefined,
    claims: { fullName: 'Sara', caseNumber: 'CASE-2' },
    errors: [],
  },
];

describe('buildBulkIssueRequest', () => {
  it('matches the generated DTO byte-for-byte on a fixture', () => {
    const request = buildBulkIssueRequest('CriminalRecord/v1', validRows, {
      maxUses: '3',
      validMinutes: '120',
      mintClaimCodes: true,
    });

    expect(JSON.parse(JSON.stringify(request))).toEqual({
      schemaCode: 'CriminalRecord/v1',
      mintClaimCodes: true,
      defaults: { maxUses: 3, validMinutes: 120 },
      items: [
        { claims: { fullName: 'Ali', caseNumber: 'CASE-1' }, pseudoRef: 'holder-1' },
        { claims: { fullName: 'Sara', caseNumber: 'CASE-2' } },
      ],
    });
  });

  it('normalizes a pseudoRef to lowercase and omits it entirely when blank', () => {
    const holderRef = '11111111'.repeat(8);
    const rows: ValidatedRow[] = [
      { rowIndex: 0, pseudoRef: holderRef.toUpperCase(), claims: { fullName: 'Ali' }, errors: [] },
      { rowIndex: 1, pseudoRef: undefined, claims: { fullName: 'Sara' }, errors: [] },
    ];
    const request = buildBulkIssueRequest('Schema/v1', rows, {
      maxUses: '',
      validMinutes: '',
      mintClaimCodes: false,
    });
    const items = JSON.parse(JSON.stringify(request.items));
    expect(items[0]).toEqual({ claims: { fullName: 'Ali' }, pseudoRef: holderRef });
    expect(items[1]).not.toHaveProperty('pseudoRef');
  });

  it('omits defaults entirely when both maxUses and validMinutes are blank', () => {
    const request = buildBulkIssueRequest('Schema/v1', validRows, {
      maxUses: '',
      validMinutes: '',
      mintClaimCodes: false,
    });
    expect(JSON.parse(JSON.stringify(request))).toEqual({
      schemaCode: 'Schema/v1',
      mintClaimCodes: false,
      items: [
        { claims: { fullName: 'Ali', caseNumber: 'CASE-1' }, pseudoRef: 'holder-1' },
        { claims: { fullName: 'Sara', caseNumber: 'CASE-2' } },
      ],
    });
  });
});
