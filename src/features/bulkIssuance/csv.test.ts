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
  it('serializes report rows with all columns', () => {
    const csv = generateReportCsv([
      { index: 1, status: 'ISSUED', ref: 'CRD-1', claimCode: 'CLAIM-1' },
      { index: 2, status: 'FAILED', errorCode: 'KH-SCH-0400', errorMessage: 'bad row' },
    ]);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe('index,status,ref,id,claimCode,errorCode,errorMessage');
    expect(lines[1]).toBe('1,ISSUED,CRD-1,,CLAIM-1,,');
    expect(lines[2]).toBe('2,FAILED,,,,KH-SCH-0400,bad row');
  });
});
