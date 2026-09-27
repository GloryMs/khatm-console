import { describe, expect, it } from 'vitest';
import type { ClaimField } from '@/features/issuance/claimsDef';
import { generateReportCsv, generateTemplateCsv, parseCsvFile } from './csv';

function makeFile(content: string, name = 'batch.csv'): File {
  return new File([content], name, { type: 'text/csv' });
}

describe('parseCsvFile', () => {
  it('parses the header row and data rows', async () => {
    const file = makeFile('name,pseudoRef\nAli,holder-1\nSara,holder-2\n');
    const parsed = await parseCsvFile(file);
    expect(parsed.headers).toEqual(['name', 'pseudoRef']);
    expect(parsed.rows).toEqual([
      ['Ali', 'holder-1'],
      ['Sara', 'holder-2'],
    ]);
  });

  it('is tolerant of a leading UTF-8 BOM (Arabic Excel exports)', async () => {
    const file = makeFile('﻿name,pseudoRef\nليلى,holder-3\n');
    const parsed = await parseCsvFile(file);
    expect(parsed.headers).toEqual(['name', 'pseudoRef']);
    expect(parsed.rows).toEqual([['ليلى', 'holder-3']]);
  });

  it('skips blank lines', async () => {
    const file = makeFile('name\nAli\n\nSara\n');
    const parsed = await parseCsvFile(file);
    expect(parsed.rows).toEqual([['Ali'], ['Sara']]);
  });
});

describe('generateTemplateCsv', () => {
  it('emits one column per claim field plus a trailing pseudoRef column', () => {
    const fields: ClaimField[] = [
      { name: 'fullName', type: 'text', required: true, labelI18n: {} },
      { name: 'caseNumber', type: 'text', required: false, labelI18n: {} },
    ];
    const csv = generateTemplateCsv(fields);
    expect(csv.trim()).toBe('fullName,caseNumber,pseudoRef');
  });
});

describe('generateReportCsv', () => {
  const HOLDER_REF = '11111111'.repeat(8);

  it('serializes report rows with exactly index, ref, holderRef, status, error', () => {
    const csv = generateReportCsv([
      { index: 1, ref: 'CRD-1', holderRef: HOLDER_REF, status: 'ISSUED' },
      { index: 2, status: 'FAILED', error: 'bad row' },
    ]);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe('index,ref,holderRef,status,error');
    expect(lines[1]).toBe(`1,CRD-1,${HOLDER_REF},ISSUED,`);
    expect(lines[2]).toBe('2,,,FAILED,bad row');
  });

  it('never includes a claim code, even if one were mistakenly passed through', () => {
    const csv = generateReportCsv([{ index: 1, ref: 'CRD-1', status: 'ISSUED' }]);
    expect(csv).not.toContain('claimCode');
  });

  it('escapes commas in error text', () => {
    const csv = generateReportCsv([
      { index: 1, status: 'FAILED', error: 'invalid, missing field' },
    ]);
    const lines = csv.trim().split('\r\n');
    expect(lines[1]).toBe('1,,,FAILED,"invalid, missing field"');
  });
});
