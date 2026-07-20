# STATE — khatm-console

> Updated at the end of EVERY Claude Code session.

## Current phase / task

- Phase 1 — FS-C1 feature screens session — DONE (branch `feat/C1-feature-screens`, PR open, not
  merged). Verify and Revoke shipped end-to-end; Issue is contract-blocked (see below).

## Last completed

- 2026-07-19: FS-C1 feature screens session. Refreshed the vendored contract twice: first pass
  had no claim-code endpoint at all (session paused, reported to Majd); the platform team merged
  `POST /api/v1/credentials/{id}/claim-code` (`ClaimCodeMintRequest/Response`) mid-session,
  second refresh picked it up. Delivered:
  - **Verify** (`/verify`, any authenticated operator): `VerifyPage` + `VerifyResult`, posts
    `{sdJwt}` to `/api/v1/credentials/verify`. Renders the optional KH-1.3 status-list fields
    (`statusListChecked/Version/Uri`) defensively — absent from the current contract, tolerated
    without crashing.
  - **Revoke** (`/revoke`, `RequireScope('revoke')`): `RevokePage` looks up a credential by
    **UUID `id`** (not `ref` — the contract's `{id}` path param is parsed as a UUID server-side,
    a brief/contract mismatch), shows `CredentialSummary`, and gates the destructive action
    behind `RevokeConfirmDialog` (type-the-id-to-confirm).
  - **Issue building blocks** (`src/features/issuance/`, unit-tested, **not wired into a
    route**): `claimsDef.ts` parses `claimsDefJson` per the authoritative shape found in
    khatm-platform's `CredentialService.buildSchemaDefinition`
    (`{fieldName: {type, required, label_i18n{en,ar}}}`); `qrPayload.ts` implements the QR v1
    contract with a byte-exactness test; `IssueForm.tsx` dynamically renders a claims form with
    required/selective-disclosure badges. Blocked from an end-to-end screen by an open contract
    gap (below).
  - i18n: added `issue.*`, `verify.*`, `revoke.*`, `nav.verify`, `nav.revoke` keys to both
    `en.json`/`ar.json`, parity test green. Sidebar has Verify/Revoke entries; RTL not yet
    eyeballed in a real browser this session (no browser tool available in this environment —
    see verification note below).
  - Added `qrcode.react` (SVG mode, approved dependency) — installed but unused pending Issue's
    route wiring.
  - `.env.example` + `vite-env.d.ts` document `VITE_QR_API_BASE` and the localhost-unreachable-
    from-a-physical-wallet pitfall.

## Environment facts

- Dev: web on :5173, Vite proxies `/api` and `/.well-known` to `localhost:8080`.
- Container: nginx on :3000→80, proxies `/api` and `/.well-known` to `http://khatm-api:8080`
  over the external `khatm-net` network.
- `khatm-platform` is a **private** repo — `npm run contract:update` falls back to `gh api`
  (works with the caller's own `gh` credentials). Also used this session to pull spec markdown
  and source files (`FS-0.2`, `FS-0.4`, `FS-1_2_1`, `CredentialService.java`,
  `SchemaCatalogService.java`, `CredentialController.java`) directly via `gh api
repos/GloryMs/khatm-platform/contents/...` when the OpenAPI contract's types alone didn't
  reveal a shape (e.g. `claimsDefJson`'s parsed structure, `{id}`'s actual lookup semantics).
  Worth remembering as a technique for future sessions when the contract is silent on a detail.
- Design tokens (`src/styles/tokens.css`) reuse the POC's neutral palette pending a real
  visual-identity file from the stakeholder — same open item as before, not resolved.
- **No browser-automation tool was available this session.** Verified via `npm run check`
  (typecheck/lint/format/33 tests, all green), a production `npm run build`, and a dev-server
  boot + HTML smoke check (200, shell markup present, no console errors in the Vite log). RTL
  layout and actual click-through of Verify/Revoke against a running platform backend were
  **not** visually confirmed — flag this to Majd before merge if a real visual pass matters for
  this PR.

## Open decisions / blockers

- **Issue screen blocked — contract gap:** `IssueRequest.schemaCode` is required in practice
  (platform's `issue()` defaults to `"GenericDocument/v1"` and resolves the schema by
  `(tenant, code, version)`), but neither `SchemaSummary` nor `SchemaDetail` expose a `code`
  field (`id, nameI18n, version, status[, claimsDefJson]` only). A console schema picker cannot
  construct a valid issue request from what `GET /api/v1/schemas` returns. Needs a `code` field
  added to one of those response types. Full detail in `src/features/issuance/README.md`.
- Related, lower-severity: `SchemaDetail` also omits `sdFields`/`defaultMaxUses`, so the brief's
  "prefill maxUses/validity from schema defaults" isn't achievable either — worked around for the
  selective-disclosure badge by reading `claims_def.required` instead (FS-0.4 D2: `required` is
  `false` exactly for fields in `sd_fields`), but there's no such workaround for defaults.
- Revoke's lookup-by-id vs. the brief's lookup-by-`ref` is a brief/contract mismatch, not a gap —
  built to the contract (UUID `id`) per "path/type authority: the generated types, not this
  brief."
- Design tokens / visual identity file — pending from stakeholder (use neutral tokens meanwhile).
- `khatm-platform`'s CI publishing step for `docs/api/openapi.json` (KH-1.6) should eventually
  make the raw URL work without the `gh` fallback — worth revisiting once that lands.
- Dev-only `esbuild`/vitest-toolchain `npm audit` advisory (moderate, dev-server request
  forgery) — inherent to the current vitest 3.x → vite 6 chain, not a runtime/prod risk. No
  fix available without an unreleased vitest bump; revisit on next dependency update.

## Next up (ordered)

1. Unblock and finish the Issue screen once `SchemaSummary`/`SchemaDetail` expose `code`: wire
   the schema picker → `IssueForm` (already built) → issue → mint claim-code → QR success view
   into a `/issue` route, add the QR-payload-in-context test, gate with `RequireScope('issue')`.
2. KH-1.1.1 schema management UI (create/version — still only a read-only list).
3. KH-1.1.3 bulk issuance: CSV upload → validate → preview → issue → report.
4. KH-1.1.4 credential search/list (Revoke currently requires knowing the id up front — a
   search/list view would remove that gap).
5. Dashboard v1 (issues/verifies/consumes/failures counters).
6. A real visual/RTL pass over Verify + Revoke (and Issue once unblocked) once a browser tool or
   the platform backend is available to click through against.
