import { describe, expect, it } from 'vitest';
import { isKnownFieldType, parseClaimsDef } from './claimsDef';

// Authoritative claims_def shape, per khatm-platform CredentialService.buildSchemaDefinition:
// { "<field>": { type, required, label_i18n {en,ar} }, ... }
const CRIMINAL_RECORD_CLAIMS_DEF = JSON.stringify({
  result: { type: 'string', required: true, label_i18n: { en: 'Result', ar: 'النتيجة' } },
  caseNumber: {
    type: 'string',
    required: false,
    label_i18n: { en: 'Case number', ar: 'رقم القضية' },
  },
  issuedAt: { type: 'date', required: false, label_i18n: { en: 'Issued at', ar: 'تاريخ الإصدار' } },
  score: { type: 'number', required: true, label_i18n: { en: 'Score', ar: 'الدرجة' } },
});

describe('parseClaimsDef', () => {
  it('parses each field with its name, type, required flag, and bilingual label', () => {
    const { fields } = parseClaimsDef(CRIMINAL_RECORD_CLAIMS_DEF);
    expect(fields).toHaveLength(4);

    const result = fields.find((f) => f.name === 'result');
    expect(result).toEqual({
      name: 'result',
      type: 'string',
      required: true,
      labelI18n: { en: 'Result', ar: 'النتيجة' },
    });

    const caseNumber = fields.find((f) => f.name === 'caseNumber');
    expect(caseNumber?.required).toBe(false);
    expect(caseNumber?.labelI18n.ar).toBe('رقم القضية');
  });

  it('recognises only string/number/date as known field types', () => {
    const { fields } = parseClaimsDef(
      JSON.stringify({
        a: { type: 'string', required: true, label_i18n: {} },
        b: { type: 'number', required: true, label_i18n: {} },
        c: { type: 'date', required: true, label_i18n: {} },
        d: { type: 'geopoint', required: true, label_i18n: {} },
      }),
    );
    expect(fields.map((f) => isKnownFieldType(f.type))).toEqual([true, true, true, false]);
  });

  it('returns no fields for a blank, malformed, or empty-placeholder payload', () => {
    expect(parseClaimsDef(undefined).fields).toEqual([]);
    expect(parseClaimsDef('').fields).toEqual([]);
    expect(parseClaimsDef('{not json').fields).toEqual([]);
    expect(parseClaimsDef('{"fields":[]}').fields).toEqual([]);
    expect(parseClaimsDef('null').fields).toEqual([]);
    expect(parseClaimsDef('[]').fields).toEqual([]);
  });

  it('defaults missing type/required gracefully without throwing', () => {
    const { fields } = parseClaimsDef(JSON.stringify({ loose: { label_i18n: { en: 'Loose' } } }));
    expect(fields).toEqual([
      { name: 'loose', type: 'string', required: false, labelI18n: { en: 'Loose' } },
    ]);
  });
});
