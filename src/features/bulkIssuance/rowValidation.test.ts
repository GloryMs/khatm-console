import { describe, expect, it } from 'vitest';
import type { ClaimField } from '@/features/issuance/claimsDef';
import { autoMapColumns } from './columnMapping';
import type { ParsedCsv } from './csv';
import { isRowValid, validateRows } from './rowValidation';

const fields: ClaimField[] = [
  { name: 'fullName', type: 'text', required: true, labelI18n: {} },
  { name: 'age', type: 'number', required: false, labelI18n: {} },
  { name: 'birthDate', type: 'date', required: false, labelI18n: {} },
];

function parsedFrom(headers: string[], rows: string[][]): ParsedCsv {
  return { headers, rows };
}

describe('validateRows', () => {
  it('flags a required field left blank', () => {
    const parsed = parsedFrom(['fullName', 'age', 'birthDate'], [['', '30', '2000-01-01']]);
    const mapping = autoMapColumns(parsed.headers, fields);
    const [row] = validateRows(parsed, fields, mapping);
    expect(isRowValid(row)).toBe(false);
    expect(row.errors).toEqual([{ fieldName: 'fullName', kind: 'required' }]);
  });

  it('flags an invalid number and an invalid date', () => {
    const parsed = parsedFrom(['fullName', 'age', 'birthDate'], [['Ali', 'thirty', 'not-a-date']]);
    const mapping = autoMapColumns(parsed.headers, fields);
    const [row] = validateRows(parsed, fields, mapping);
    expect(isRowValid(row)).toBe(false);
    expect(row.errors).toEqual(
      expect.arrayContaining([
        { fieldName: 'age', kind: 'number' },
        { fieldName: 'birthDate', kind: 'date' },
      ]),
    );
  });

  it('allows optional fields to be left blank', () => {
    const parsed = parsedFrom(['fullName', 'age', 'birthDate'], [['Ali', '', '']]);
    const mapping = autoMapColumns(parsed.headers, fields);
    const [row] = validateRows(parsed, fields, mapping);
    expect(isRowValid(row)).toBe(true);
  });

  it('round-trips Arabic content through a required text field untouched', () => {
    const parsed = parsedFrom(
      ['fullName', 'age', 'birthDate'],
      [['ليلى أحمد', '25', '1999-05-12']],
    );
    const mapping = autoMapColumns(parsed.headers, fields);
    const [row] = validateRows(parsed, fields, mapping);
    expect(isRowValid(row)).toBe(true);
    expect(row.claims.fullName).toBe('ليلى أحمد');
  });

  it('preserves the original row index across multiple rows', () => {
    const parsed = parsedFrom(['fullName'], [['Ali'], [''], ['Sara']]);
    const mapping = autoMapColumns(parsed.headers, fields);
    const rows = validateRows(parsed, fields, mapping);
    expect(rows.map((r) => r.rowIndex)).toEqual([0, 1, 2]);
    expect(rows.map(isRowValid)).toEqual([true, false, true]);
  });
});
