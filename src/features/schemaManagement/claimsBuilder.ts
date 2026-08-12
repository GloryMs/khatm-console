import type { ClaimFieldRequest, SchemaDetail } from '@/features/schemas/api';

export type BuilderFieldType = 'text' | 'number' | 'date';

export const BUILDER_FIELD_TYPES: readonly BuilderFieldType[] = ['text', 'number', 'date'];

/**
 * One claims-def builder row. The authoring contract (`ClaimFieldRequest`)
 * carries only `name`/`type`/`labelI18n`/`pattern` — no per-field `required`
 * flag — so that concept has no editable representation here (brief/contract
 * gap, noted in STATE.md).
 */
export interface BuilderFieldRow {
  name: string;
  type: BuilderFieldType;
  labelEn: string;
  labelAr: string;
  selective: boolean;
  /** Optional regex a claim value must match at issuance (KH-2.4, spec FS-2.4 item 3). Blank = no constraint. */
  pattern: string;
}

export function isBuilderFieldType(value: string): value is BuilderFieldType {
  return (BUILDER_FIELD_TYPES as readonly string[]).includes(value);
}

export function emptyRow(): BuilderFieldRow {
  return { name: '', type: 'text', labelEn: '', labelAr: '', selective: false, pattern: '' };
}

/**
 * Serialize builder rows to the request's `claimsDef` array, preserving row
 * order. `pattern` is omitted entirely (not sent as an empty string) when
 * blank — matches how a field with no format constraint reads back from
 * `fromSchemaDetail` (an absent `pattern` key, not an empty one).
 */
export function toClaimsDef(rows: BuilderFieldRow[]): ClaimFieldRequest[] {
  return rows.map((row) => ({
    name: row.name,
    type: row.type,
    labelI18n: { en: row.labelEn, ar: row.labelAr },
    ...(row.pattern.trim() ? { pattern: row.pattern.trim() } : {}),
  }));
}

/** sdFields is always a subset of the claims-def names by construction — derived from each row's toggle. */
export function deriveSdFields(rows: BuilderFieldRow[]): string[] {
  return rows.filter((row) => row.selective).map((row) => row.name);
}

interface RawField {
  type?: unknown;
  label_i18n?: unknown;
  labelI18n?: unknown;
  pattern?: unknown;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Normalize a stored claim field type to a builder type. `"string"` is a
 * legacy alias — pre-existing schemas seeded before this authoring endpoint
 * validated its input may still carry it — the server only accepts `"text"`
 * for newly authored/edited schemas (KH-SCH-0400: "expected one of [date,
 * number, text]").
 */
function normalizeFieldType(type: string): BuilderFieldType {
  if (type === 'text' || type === 'string') return 'text';
  if (type === 'number' || type === 'date') return type;
  return 'text';
}

function parseLabel(value: unknown): { en: string; ar: string } {
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return { en: asString(record.en), ar: asString(record.ar) };
  }
  return { en: '', ar: '' };
}

/**
 * Prefill builder rows from an existing schema's detail — used for both the
 * DRAFT editor and the new-version flow (client-side prefill: `POST
 * .../versions` does no server-side default-merging, so the console must
 * submit a complete body). Tolerant of a missing/malformed `claimsDefJson`
 * (returns no rows) so a broken schema never crashes the builder.
 */
export function fromSchemaDetail(detail: SchemaDetail): BuilderFieldRow[] {
  const sdFields = detail.sdFields ?? [];
  if (!detail.claimsDefJson) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(detail.claimsDefJson);
  } catch {
    return [];
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return [];

  const rows: BuilderFieldRow[] = [];
  for (const [name, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) continue;
    const raw = value as RawField;
    const label = parseLabel(raw.label_i18n ?? raw.labelI18n);
    rows.push({
      name,
      type: normalizeFieldType(asString(raw.type)),
      labelEn: label.en,
      labelAr: label.ar,
      selective: sdFields.includes(name),
      pattern: asString(raw.pattern),
    });
  }
  return rows;
}
