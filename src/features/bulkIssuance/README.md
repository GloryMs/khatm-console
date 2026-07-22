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
