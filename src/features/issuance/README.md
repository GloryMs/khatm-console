# issuance

Screen 1 (Issue) building blocks. **The end-to-end issue screen (schema picker →
submit → QR success view) is not wired into a route this session** — two
contract gaps block it; see below. What's built and unit-tested:

- `claimsDef.ts` — parses a schema's `claimsDefJson` string into typed
  `ClaimField[]` (`{name, type, required, labelI18n}`), per the authoritative
  shape in khatm-platform's `CredentialService.buildSchemaDefinition` (spec
  FS-0.2 §3.3). `required: false` is the contract-backed selective-disclosure
  signal (FS-0.4 D2), since `sd_fields` itself is not exposed on `SchemaDetail`.
- `qrPayload.ts` — the QR v1 contract (`{v:1, api, code}`), byte-exact
  serialization, and the `VITE_QR_API_BASE`/localhost-detection helpers.
- `components/IssueForm.tsx` — dynamic form generated from `ClaimField[]`:
  label from `label_i18n` in the active language, required/type honored
  (text/number/date; unknown types render as text with a dev console warning),
  badges required vs. selectively-disclosable fields.

**Contract gaps found this session (report-only — contract is read-only from
this repo):**

1. ~~`IssueResponse` had no claim-code field~~ — resolved mid-session:
   `POST /api/v1/credentials/{id}/claim-code` (`ClaimCodeMintRequest/Response`)
   now mints the one-time wallet code the QR encodes, per the redeem endpoint's
   QR v1 description.
2. **Still open:** `IssueRequest.schemaCode` is required in practice (the
   platform's `issue()` defaults to `"GenericDocument/v1"` and looks the schema
   up by `(tenant, code, version)`), but neither `SchemaSummary` nor
   `SchemaDetail` expose a `code` field — only `id`, `nameI18n`, `version`,
   `status` (`claimsDefJson` on detail). A console schema picker cannot
   construct a valid issue request from what `GET /api/v1/schemas` /
   `GET /api/v1/schemas/{id}` return. Needs a `code` field added to one of
   those response types before Issue can be wired end-to-end.
3. `SchemaDetail` also omits `sdFields` and `defaultMaxUses`, even though
   `SchemaCatalogService.toDetail` could include them — the brief's "prefill
   maxUses/validity from schema defaults" isn't achievable from the current
   contract either (the selective-disclosure badge works around this by
   reading `claims_def.required` instead, per gap resolution above).
