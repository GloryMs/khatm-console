import type { LocalizedText } from '@/hooks/useLocalizedText';

/**
 * One claim field of a credential schema, parsed from the `claimsDefJson`
 * string returned by `GET /api/v1/schemas/{id}`.
 *
 * The platform persists `claims_def` as a JSON object keyed by field name, where
 * every value is `{ type, required, label_i18n {en,ar} }` (source of truth:
 * khatm-platform `CredentialService.buildSchemaDefinition`, spec FS-0.2 §3.3).
 */
export interface ClaimField {
  /** Machine name of the claim, e.g. `caseNumber`. Also the `claims` map key on issue. */
  name: string;
  /** Claimed value type. Only `string`, `number`, and `date` are rendered specially. */
  type: string;
  /**
   * Mandatory-to-disclose (FS-0.4 D2): `true` exactly when the field is NOT in
   * the schema's `sd_fields`. A `false` value therefore marks a field the holder
   * may withhold — i.e. selectively disclosable. This is the contract-backed
   * source of the "selective disclosure" badge, since `sd_fields` itself is not
   * exposed on `SchemaDetail`.
   */
  required: boolean;
  labelI18n: LocalizedText;
}

export interface ClaimsDef {
  fields: ClaimField[];
}

/** Recognised render hints; anything else falls back to a plain text input. */
export type KnownFieldType = 'string' | 'number' | 'date';

interface RawField {
  type?: unknown;
  required?: unknown;
  label_i18n?: unknown;
  labelI18n?: unknown;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asBool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asLocalizedText(value: unknown): LocalizedText {
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const en = asString(record.en);
    const ar = asString(record.ar);
    if (en !== undefined || ar !== undefined) return { en, ar };
  }
  return {};
}

function buildField(name: string, raw: RawField): ClaimField {
  const type = asString(raw.type) ?? 'string';
  const required = asBool(raw.required) ?? false;
  const labelI18n = asLocalizedText(raw.label_i18n ?? raw.labelI18n);
  return { name, type, required, labelI18n };
}

/**
 * Parse a schema's `claimsDefJson` into ordered claim fields. Tolerant of a
 * missing/blank/malformed payload (returns no fields) so a broken schema never
 * crashes the issue form; the caller renders an empty form and can warn.
 */
export function parseClaimsDef(claimsDefJson: string | undefined | null): ClaimsDef {
  if (!claimsDefJson) return { fields: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(claimsDefJson);
  } catch {
    if (import.meta.env.DEV) {
      console.warn('claims_def JSON could not be parsed; rendering an empty form.');
    }
    return { fields: [] };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { fields: [] };
  }

  const entries = Object.entries(parsed as Record<string, unknown>);
  const fields: ClaimField[] = [];
  for (const [name, value] of entries) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      fields.push(buildField(name, value as RawField));
    }
  }
  return { fields };
}

/** A field is selectively disclosable (withholdable) iff it is not mandatory. */
export function isSelective(field: ClaimField): boolean {
  return !field.required;
}

export function isKnownFieldType(type: string): type is KnownFieldType {
  return type === 'string' || type === 'number' || type === 'date';
}
