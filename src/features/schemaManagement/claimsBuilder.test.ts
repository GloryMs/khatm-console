import { describe, expect, it } from 'vitest';
import type { SchemaDetail } from '@/features/schemas/api';
import {
  deriveSdFields,
  emptyRow,
  fromSchemaDetail,
  isBuilderFieldType,
  toClaimsDef,
  type BuilderFieldRow,
} from './claimsBuilder';

const rows: BuilderFieldRow[] = [
  {
    name: 'caseNumber',
    type: 'text',
    labelEn: 'Case number',
    labelAr: 'رقم القضية',
    selective: true,
  },
  { name: 'result', type: 'text', labelEn: 'Result', labelAr: 'النتيجة', selective: false },
  {
    name: 'issuedOn',
    type: 'date',
    labelEn: 'Issued on',
    labelAr: 'تاريخ الإصدار',
    selective: false,
  },
];

describe('toClaimsDef', () => {
  it('serializes rows to the request DTO in row order, using the contract\'s "text" literal', () => {
    expect(toClaimsDef(rows)).toEqual([
      { name: 'caseNumber', type: 'text', labelI18n: { en: 'Case number', ar: 'رقم القضية' } },
      { name: 'result', type: 'text', labelI18n: { en: 'Result', ar: 'النتيجة' } },
      { name: 'issuedOn', type: 'date', labelI18n: { en: 'Issued on', ar: 'تاريخ الإصدار' } },
    ]);
  });

  it('round-trips through fromSchemaDetail for a schema authored by this builder', () => {
    const claimsDef = toClaimsDef(rows);
    const claimsDefJson = JSON.stringify(
      Object.fromEntries(
        claimsDef.map((field) => [field.name, { type: field.type, label_i18n: field.labelI18n }]),
      ),
    );
    const detail: SchemaDetail = {
      id: 's1',
      code: 'Test/v1',
      version: 1,
      status: 'DRAFT',
      nameI18n: { en: 'Test', ar: 'اختبار' },
      claimsDefJson,
      sdFields: deriveSdFields(rows),
    };
    expect(fromSchemaDetail(detail)).toEqual(rows);
  });
});

describe('deriveSdFields', () => {
  it('lists only the names of rows toggled selective, in row order', () => {
    expect(deriveSdFields(rows)).toEqual(['caseNumber']);
  });

  it('is empty when no row is selective', () => {
    expect(deriveSdFields(rows.map((row) => ({ ...row, selective: false })))).toEqual([]);
  });
});

describe('emptyRow', () => {
  it('starts blank, non-selective, and typed as text', () => {
    expect(emptyRow()).toEqual({
      name: '',
      type: 'text',
      labelEn: '',
      labelAr: '',
      selective: false,
    });
  });
});

describe('isBuilderFieldType', () => {
  it('accepts the three contract-supported types and rejects anything else, including the legacy "string" alias', () => {
    expect(isBuilderFieldType('text')).toBe(true);
    expect(isBuilderFieldType('number')).toBe(true);
    expect(isBuilderFieldType('date')).toBe(true);
    expect(isBuilderFieldType('string')).toBe(false);
    expect(isBuilderFieldType('boolean')).toBe(false);
  });
});

describe('fromSchemaDetail', () => {
  it('maps claimsDefJson entries to rows and marks sdFields as selective (version-prefill mapping)', () => {
    const detail: SchemaDetail = {
      id: 's1',
      code: 'CriminalRecord/v1',
      version: 1,
      status: 'PUBLISHED',
      nameI18n: { en: 'Criminal record', ar: 'السجل الجنائي' },
      sdFields: ['caseNumber'],
      claimsDefJson: JSON.stringify({
        result: { type: 'text', required: true, label_i18n: { en: 'Result', ar: 'النتيجة' } },
        caseNumber: {
          type: 'text',
          required: false,
          label_i18n: { en: 'Case number', ar: 'رقم القضية' },
        },
      }),
    };

    expect(fromSchemaDetail(detail)).toEqual([
      { name: 'result', type: 'text', labelEn: 'Result', labelAr: 'النتيجة', selective: false },
      {
        name: 'caseNumber',
        type: 'text',
        labelEn: 'Case number',
        labelAr: 'رقم القضية',
        selective: true,
      },
    ]);
  });

  it('normalizes the legacy "string" type (pre-existing/seeded schemas) to "text"', () => {
    const detail: SchemaDetail = {
      id: 's1',
      code: 'Legacy/v1',
      version: 1,
      status: 'PUBLISHED',
      nameI18n: { en: 'Legacy', ar: 'قديم' },
      claimsDefJson: JSON.stringify({
        result: { type: 'string', required: true, label_i18n: { en: 'Result', ar: 'النتيجة' } },
      }),
    };

    expect(fromSchemaDetail(detail)).toEqual([
      { name: 'result', type: 'text', labelEn: 'Result', labelAr: 'النتيجة', selective: false },
    ]);
  });

  it('tolerates a missing claimsDefJson', () => {
    const detail: SchemaDetail = {
      id: 's1',
      code: 'X/v1',
      version: 1,
      status: 'DRAFT',
      nameI18n: { en: 'X', ar: 'خ' },
    };
    expect(fromSchemaDetail(detail)).toEqual([]);
  });

  it('tolerates malformed claimsDefJson instead of throwing', () => {
    const detail: SchemaDetail = {
      id: 's1',
      code: 'X/v1',
      version: 1,
      status: 'DRAFT',
      nameI18n: { en: 'X', ar: 'خ' },
      claimsDefJson: 'not json',
    };
    expect(fromSchemaDetail(detail)).toEqual([]);
  });

  it('falls back to type "text" for an unrecognized stored type', () => {
    const detail: SchemaDetail = {
      id: 's1',
      code: 'X/v1',
      version: 1,
      status: 'DRAFT',
      nameI18n: { en: 'X', ar: 'خ' },
      claimsDefJson: JSON.stringify({
        weird: { type: 'unknown-type', label_i18n: { en: 'Weird', ar: 'غريب' } },
      }),
    };
    expect(fromSchemaDetail(detail)).toEqual([
      { name: 'weird', type: 'text', labelEn: 'Weird', labelAr: 'غريب', selective: false },
    ]);
  });
});
