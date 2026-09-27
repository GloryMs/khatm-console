# bulkIssuance

The CSV bulk-issuance wizard (KH-1.1.3): pick a PUBLISHED schema, download a
matching CSV template, upload and map columns to claim fields, validate a
preview (client-side, mirroring but never replacing server validation), then
issue up to 200 credentials in one batch.

**Routes:** `/issue/bulk` (`BulkIssuePage`), self-gated with
`RequireScope('issue')` (same pattern as `schemaManagement`).

**Queries / mutations:** reuses `usePublishedSchemas`/`useIssueSchema` from
`issuance/hooks`; `useBulkIssue` → `POST /api/v1/credentials/bulk`,
invalidating credential search on success.

Per-row claim codes from a successful batch are shown exactly once in the
report (never persisted, never re-fetchable) — export the report CSV before
leaving the page to keep them. Client-excluded (invalid) rows are always
reported alongside server results, aligned back to their original CSV index.

**`pseudoRef` (KH-2.8.2 veto V1-b, session C13a):** the bulk row's name for
the same `holderRef` field the single-issue flows use — optional per row.
`rowValidation.ts` treats a blank/unmapped cell as absence (no error); a
non-blank value is shape-checked (`@/lib/holderRef#isValidHolderRef`, row
error `issueBulk.row.pseudoRefInvalid`) and excludes the row like any other
validation failure. `request.ts` normalizes (trim + lowercase) and omits the
key entirely per item when blank. The report table and CSV export both gain a
`holderRef` column from `BulkIssueItemResult.holderRef` (generated or
supplied); the export (`generateReportCsv`) deliberately excludes the
one-time claim code — it's a permanent artifact, unlike the report screen's
single render — so `index, ref, holderRef, status, error` are its only
columns.
