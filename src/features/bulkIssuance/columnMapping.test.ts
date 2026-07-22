import { describe, expect, it } from 'vitest';
import type { ClaimField } from '@/features/issuance/claimsDef';
import { autoMapColumns, isFullyMapped, readMappedValue } from './columnMapping';

const fields: ClaimField[] = [
  { name: 'fullName', type: 'text', required: true, labelI18n: {} },
  { name: 'caseNumber', type: 'text', required: false, labelI18n: {} },
];

describe('autoMapColumns', () => {
  it('maps by exact header match', () => {
    const mapping = autoMapColumns(['fullName', 'caseNumber', 'pseudoRef'], fields);
    expect(mapping).toEqual({
      pseudoRef: 'pseudoRef',
      claims: { fullName: 'fullName', caseNumber: 'caseNumber' },
    });
  });

  it('falls back to a case-insensitive header match', () => {
    const mapping = autoMapColumns(['FULLNAME', 'CaseNumber', 'PSEUDOREF'], fields);
    expect(mapping).toEqual({
      pseudoRef: 'PSEUDOREF',
      claims: { fullName: 'FULLNAME', caseNumber: 'CaseNumber' },
    });
  });

  it('leaves a field unmapped when no header matches', () => {
    const mapping = autoMapColumns(['fullName'], fields);
    expect(mapping.claims.caseNumber).toBeNull();
    expect(mapping.pseudoRef).toBeNull();
    expect(isFullyMapped(mapping, fields)).toBe(false);
  });
});

describe('readMappedValue', () => {
  const headers = ['fullName', 'caseNumber'];
  const row = ['Ali', '  CASE-1  '];

  it('reads and trims the mapped column', () => {
    expect(readMappedValue(headers, row, 'caseNumber')).toBe('CASE-1');
  });

  it('returns undefined when unmapped or the header is missing', () => {
    expect(readMappedValue(headers, row, null)).toBeUndefined();
    expect(readMappedValue(headers, row, 'notAHeader')).toBeUndefined();
  });
});
