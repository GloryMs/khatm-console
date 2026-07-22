# STATE — khatm-console

> Updated at the end of EVERY Claude Code session.

## Current phase / task

- Phase 2b — C2b consuming-party management + consume simulator — **DONE. PR #5**
  (`feat/C2b-consuming-parties-and-consume-sim`) merged into `main` on 2026-07-22 after Majd's
  manual walkthrough on the local Docker stack (branch deleted post-merge).

## Last completed

- 2026-07-22 (follow-up): Majd's manual pass against the running Docker stack (via the
  `khatm-console` container, rebuilt with `docker compose up -d --build` to pick up the PR #5
  changes). First attempt to consume via the simulator got `KH-RBC-0403` ("forbidden"). Diagnosed
  as **not a console bug**: the audit log showed zero trace of any API-key auth attempt at that
  timestamp (no `API_KEY_AUTH_FAILED`, nothing) — meaning the pasted key field never reached the
  server as a real `khk_...` key, so the request fell back to the admin session, which
  `/api/v1/credentials/consume` explicitly rejects regardless of scope (only a `CONSUMING_PARTY`
  key is accepted there, by design). Confirmed by reproducing the exact browser request (session
  cookie + `Authorization: Bearer` header) through the live `khatm-console` container with a
  freshly minted `probe-party` key — succeeded (`consumed: true`) on the first try, proving the
  request pipeline is correct end-to-end. Root cause on the user side (empty/incomplete key
  paste), not the app. Majd re-tested with a fresh credential + freshly minted key, confirmed the
  full flow, and approved. PR #5 merged.

- 2026-07-22: C2b session. Hard gate held once at the very start: the first `npm run
contract:update` + `npm run gen:api` pass showed the vendored contract still had no
  `/api/v1/admin/consuming-parties` surface at all (paused, reported, no code written — same
  protocol as the C2 pause). Resumed once Majd reported khatm-platform PR #27 (KH-1.4.4-BE) had
  merged (`d4e0c47`) with the local Docker stack already up and a seeded demo consuming party +
  key. Re-ran the contract refresh: the full `consuming-parties-admin` tag is now present — `GET
/api/v1/admin/consuming-parties`, `POST .../consuming-parties`, `.../{id}/activate`,
  `.../{id}/suspend`, `.../{id}/allowed-schemas` (POST + DELETE), `.../{id}/api-keys` (mint).
  Delivered:
  - **Consuming-party admin plane** (`/consumers`, `RequireScope('admin')`,
    `src/features/consumingParties/`): list (code, localized name, status badge, allowed-schema
    chips, createdAt), a create dialog (both-language name + slug-validated code, mirroring the
    server's `^[a-z0-9][a-z0-9_-]{1,62}$` pattern client-side and surfacing `KH-CNS-0400`/
    `KH-CNS-0409` cleanly server-side), an allowlist editor (multi-select over the existing
    `useSchemas` catalog, diffed client-side by `allowlistDiff.ts` into the matching
    allow/disallow calls), suspend/activate via the shared `ConfirmDialog`, and a mint-key flow
    (confirm → mint → `MintedKeyModal`, the same one-time-display contract as the C1b claim
    code — copy button, bilingual "shown once" warning, no re-fetch path, key never enters the
    TanStack Query cache). Every mutation invalidates the parties list.
  - **Consume simulator** (`/consume-sim`, any authenticated operator,
    `src/features/consumeSim/`): credential UUID id (deep-linkable), a `type=password` API-key
    field with a reveal toggle, and an auto-generated regenerate-able idempotency key. Submits to
    `POST /api/v1/credentials/consume` authenticated with the **pasted key** via `Authorization:
Bearer khk_...` — confirmed to be the platform's actual API-key header by reading
    `ApiKeyAuthFilter.java` in the local `khatm-platform` checkout (the vendored OpenAPI contract
    declares no `securitySchemes` at all, so this could not be confirmed from the contract alone;
    a naive `X-API-Key` guess was tried first against the live stack and correctly got nowhere).
    Renders the full `ConsumeResponse` envelope, including the platform's exact four `reason`
    values (`consumed`/`already_consumed`/`not_consumable`/`idempotent_replay` — read from
    `CredentialService.java` and independently reproduced live). `KH-CNS-0403` (deny-by-default)
    and a suspended/invalid key's `KH-RBC-1401` each get their own localized `errors.<messageKey>`
    entry so they read as clear, specific messages rather than the generic fallback. The pasted
    key is local component state only — cleared on unmount and on every navigation event
    (`location.key`-keyed effect), never logged, never in the URL. Credential search rows gained a
    "Consume…" deep-link (`/consume-sim?id=<id>`), mirroring C2's revoke deep-link.
  - Every consume-related request/response shape and error path (create/duplicate/invalid code,
    allow/disallow, mint, suspend blocking a key with `KH-RBC-1401`, deny-by-default
    `KH-CNS-0403`, and all four consume `reason`s) was verified by hand against the live Docker
    stack before writing any UI code, not just inferred from the contract — see the API-key header
    finding above for why that mattered here specifically.
  - Sidebar: "Consuming Parties" (admin-gated) and "Consume Simulator" (all operators).
  - EN/AR i18n parity green; RTL-correct (logical properties only, grep-verified — no physical
    left/right properties introduced in the new CSS).
  - Tests (107 total in the suite now): `allowlistDiff.test.ts` (diff logic), consumingParties
    `hooks.test.tsx` (mutation → list invalidation), `ConsumingPartiesPage.test.tsx` (scope gating,
    both-language + code-format create validation, one-time key modal renders exactly once per
    mint with the raw key absent from the TanStack Query cache), consumeSim `api.test.ts` (request
    construction — header + body shape), `ConsumeSimPage.test.tsx` (idempotency regenerate, all
    four result reasons, `KH-CNS-0403` and `KH-RBC-1401` friendly messages, deep-link preload, key
    cleared on unmount via a `localStorage.setItem` spy that's never called, key cleared on an
    in-place navigation event), plus a new `CredentialsPage` assertion for the consume deep-link.
  - `npm run check` and `npm run build` both clean.
  - Closes the "why doesn't the console do consume" open question as **resolved by design**: the
    consume act stays a consuming-party act authenticated by its own key (KH-1.4.3 deny-by-default,
    never a console-session act) — the console now covers the admin side of that (registering
    parties, scoping their allowlist, minting their keys) plus a clearly-labeled testing/demo
    channel to exercise the actual consume call end-to-end, without ever blurring session auth and
    API-key auth into the same channel.

- 2026-07-21 (follow-up 2): Full manual round-trip against the running stack — create draft
  (with a `full_name`/`birth_date`/`national_id` schema) → publish → issue → redeem the claim
  code → verify. Two findings, neither a khatm-console bug:
  - **`required` is server-derived as `!selective`, confirmed by direct DB inspection** of
    `credential_schema.claims_def`: fields in `sd_fields` are stored `required: false`, the one
    field not in `sd_fields` is stored `required: true` — even though the console never sends a
    `required` flag at all. Closes the open question about how the server fills in `required`
    (see Open decisions, now resolved).
  - **SD-JWT presentations need a trailing `~`** when there's no key-binding JWT (per the SD-JWT
    spec) — verified by hand: a presentation built as `credential + "~" + disclosures.join("~")`
    (no trailing `~`) verified as `invalid`/`withheld_mandatory_claim` with **zero** disclosed
    claims recognized at all; appending one more `~` made the identical presentation verify as
    `valid: true` with all three claims disclosed. Not a bug — the platform's parser is
    spec-correct; the omission was in ad hoc manual-testing guidance given to Majd. Fixed the
    console's `verify.sdJwtPlaceholder` hint (both languages) to call out the trailing `~`
    explicitly so the next manual tester doesn't hit the same dead end.

- 2026-07-21 (follow-up 1): Majd's manual pass against the running Docker stack caught a real bug
  in schema creation — `POST /api/v1/schemas` 400'd (`KH-SCH-0400`) on a text-typed claim field
  because the builder sent `type: "string"`, but the server only accepts `"text"`. Fixed (see
  "Claim field `type` literal" under Open decisions, now resolved) and re-verified by rebuilding
  the container. This is exactly the risk flagged in the original PR description — caught before
  merge, as intended.

- 2026-07-21: C2 schema management + credential search session. Session was paused mid-start:
  the contract initially still lacked the schema-management endpoints and `GET
/api/v1/credentials` (hard gate, reported, no code written), then resumed once Majd confirmed
  the KH-1.1-BE platform PR had merged. Re-ran `npm run contract:update` + `npm run gen:api` —
  contract now has `POST /api/v1/schemas`, `PUT /api/v1/schemas/{id}`, `POST .../publish`,
  `POST .../archive`, `POST .../versions`, and `GET /api/v1/credentials`. Delivered:
  - **Schema management** (`/schemas/manage`, `RequireScope('admin')`): list of all statuses
    (status badges, per-row actions by status), a claims-def builder
    (`src/features/schemaManagement/`) for create/edit(DRAFT)/new-version(from PUBLISHED),
    publish and archive confirm dialogs (shared `src/components/ui/ConfirmDialog.tsx`), and a
    read-only view for ARCHIVED schemas. The read-only `/schemas` catalog is unchanged.
    Every write invalidates the management list, the `/schemas` catalog, and the Issue picker's
    published-schemas query (`usePublishSchema` etc. in `schemaManagement/hooks.ts`) — verified
    with a test that publish's `onSuccess` invalidates all three query keys.
  - **Credential search** (`/credentials`, any authenticated operator):
    `src/features/credentials/` — filter bar (ref/pseudoRef exact, schema dropdown, tri-state
    revoked), paged results table (page size 20) from `GET /api/v1/credentials`. Each row's
    Revoke action deep-links to `/revoke?id=<id>`; `RevokePage` now reads an optional `?id=`
    query param to preload the lookup and skip straight to the summary — closes the "know the
    id up front" gap noted after C1.
  - Sidebar gained two entries: "Manage Schemas" (only rendered when `hasScope('admin')`,
    mirroring `RequireScope`'s own gating logic) and "Credentials" (always visible).
  - EN/AR i18n parity green; RTL-correct (logical properties only, verified by grep — no
    physical left/right properties introduced).
  - Tests: claims-def builder serialization round-trip + sd-derivation + version-prefill
    mapping (`claimsBuilder.test.ts`), both-language validation + at-least-one-field +
    duplicate-name validation (`SchemaBuilderForm.test.tsx`), publish-confirm guard + admin
    scope gating (`SchemaManagementPage.test.tsx`), version-prefill through the page
    (`SchemaBuilderPage.test.tsx`), issue-picker invalidation (`hooks.test.tsx`), search
    filter → query-param construction (`queryParams.test.ts`), revoke deep-link preload
    (`RevokePage.test.tsx`).

- 2026-07-20: FS-C1b Issue screen session. Confirmed C1 was merged into `main`, refreshed the
  vendored OpenAPI contract via `npm run contract:update` (authenticated `gh api` fallback), and
  regenerated types. The schema contract enrichment from khatm-platform PR #24
  (`KH-1.4.3 — allowed_schemas enforcement + schema contract enrichment`) is present:
  `SchemaSummary.code`, `SchemaDetail.code`, `sdFields`, `defaultMaxUses`, and `defaultValidity`.
  Delivered:
  - **Issue** (`/issue`, `RequireScope('issue')`): schema picker lists PUBLISHED schemas, displays
    localized `nameI18n` + `code` + version, loads schema detail, renders the C1 `IssueForm`, issues
    with `schemaCode` from the picked schema, then mints a one-time wallet claim code.
  - `IssueForm` now uses real `SchemaDetail.sdFields` for selective-disclosure badges instead of
    the C1 `required === false` workaround; `claims_def.required` remains the required-input rule.
  - `defaultMaxUses` and `defaultValidity` prefill the form; ISO-8601 day/hour/minute durations are
    parsed to display/submission minutes because the current generated `IssueRequest` still uses
    `validMinutes`.
  - Success view shows credential `ref`, one-time claim code, localized expiry plus relative
    countdown-style text, QR v1 via `qrPayload.ts` + `qrcode.react`, the `VITE_QR_API_BASE` value,
    and the localhost warning when applicable. The UI explicitly warns that the claim code is shown
    once and cannot be revealed again.
  - Sidebar now lists Issue as the first entry. EN/AR i18n parity is green.
  - Tests added/updated for real `sdFields`, default prefills, ISO duration parsing, schemaCode
    construction, issue→mint→QR byte-exact payload, localhost warning, and `/issue` scope gating.

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
  - **Issue building blocks** (`src/features/issuance/`, unit-tested): `claimsDef.ts`,
    `qrPayload.ts`, and `IssueForm.tsx` were built but not wired until C1b.
  - Added `qrcode.react` (SVG mode, approved dependency), `.env.example`, and `vite-env.d.ts`
    support for `VITE_QR_API_BASE`.

## Environment facts

- Dev: web on :5173, Vite proxies `/api` and `/.well-known` to `localhost:8080`.
- Container: nginx on :3000→80, proxies `/api` and `/.well-known` to `http://khatm-api:8080`
  over the external `khatm-net` network.
- `khatm-platform` is a **private** repo — `npm run contract:update` falls back to `gh api`
  (works with the caller's own `gh` credentials). The contract, not platform source, is now
  sufficient for Issue request construction.
- Design tokens (`src/styles/tokens.css`) reuse the POC's neutral palette pending a real
  visual-identity file from the stakeholder.
- No browser-automation tool is available in this environment unless a future session gains one.
  For C1/C1b/C2/C2b, automated checks cover type/lint/format/unit tests; a real manual visual/RTL
  pass should still happen before merge.
- The vendored OpenAPI contract declares no `securitySchemes` at all — it cannot answer "what
  header does an API key go in." The authoritative answer lives in the platform source
  (`rbac/security/ApiKeyAuthFilter.java`, present in the local `khatm-platform` checkout on this
  machine): `Authorization: Bearer khk_...`, not `X-API-Key`. Confirmed empirically against the
  live Docker stack (a bad-header guess correctly 401s the same as no header at all; the right
  header gets past authentication to a scope-based 403). Worth checking that file first next time
  a console feature needs to authenticate as an API key rather than a console session.
- `khatm-platform` runs locally via Docker Desktop for manual/live verification during a session
  (containers `khatm-api`/`khatm-worker`/`khatm-postgres`/`khatm-redis`; API at
  `localhost:8080`; Swagger UI at `/swagger-ui.html`). Login as `admin` /
  `khatm-local-dev-admin-change-me` for a console session; the seed data includes a demo
  consuming party with a `CriminalRecordExtract/v1` allowlist entry and a working API key from the
  seeder log — useful for reproducing consume-flow error codes by hand before trusting them in UI
  copy.

## Open decisions / blockers

- **"Why doesn't the console do consume?" — resolved by design, C2b.** Consumption stays a
  consuming-party act authenticated by that party's own API key (KH-1.4.3 deny-by-default), never
  a console-session act — the two auth channels must never blur. C2b closes the resulting gap
  without breaking that separation: an admin plane to register/allowlist/suspend parties and mint
  their keys (`/consumers`), and a clearly-labeled testing/demo simulator that calls the real
  consume endpoint authenticated as a pasted party key (`/consume-sim`) so the full lifecycle can
  be demoed end-to-end without a real integration.
- Revoke's lookup-by-id vs. the brief's lookup-by-`ref` is a brief/contract mismatch, not a gap —
  built to the contract (UUID `id`) per "path/type authority: the generated types, not this brief."
  **Closed as a UX gap** by C2: credential search now surfaces the id up front and deep-links
  `/revoke?id=<id>`, so an operator never has to already know the UUID.
- **`ClaimFieldRequest` (schema authoring) has no per-field `required` flag — resolved, by
  design.** Confirmed by direct inspection of `credential_schema.claims_def` for a live-created
  schema: every field in `sd_fields` is stored `required: false`; the one field not in
  `sd_fields` is stored `required: true`. The server derives `required` as `!selective` — there
  is no independent "required" concept to expose a toggle for, so the claims-def builder not
  having one is correct, not a gap. (One nuance: this means a field can't be both mandatory
  _and_ selectively-disclosable, nor optional-to-fill-in _and_ mandatory-to-disclose — the
  platform only supports the two combinations selective+optional and mandatory+required. Fine
  for now; revisit if a future schema genuinely needs the other two combinations.)
- **Claim field `type` literal — resolved.** Live-tested against the running backend
  (2026-07-21, Majd): `POST /api/v1/schemas` with a field typed `"string"` 400s with
  `KH-SCH-0400`: `"expected one of [date, number, text]"`. The builder now sends `"text"`
  (`schemaManagement/claimsBuilder.ts`'s `BuilderFieldType`), and the read side
  (`issuance/claimsDef.ts`'s `isKnownFieldType`) recognizes both `"text"` and the legacy
  `"string"` (for schemas seeded before this authoring endpoint existed) as the same
  free-text render hint. `fromSchemaDetail` normalizes any stored `"string"` to `"text"` on
  prefill. Fixed and covered by a new test (`claimsBuilder.test.ts` — normalizes legacy
  "string" to "text").
- Design tokens / visual identity file — pending from stakeholder (use neutral tokens meanwhile).
- `khatm-platform`'s CI publishing step for `docs/api/openapi.json` (KH-1.6) should eventually
  make the raw URL work without the `gh` fallback — worth revisiting once that lands.
- Dev-only `esbuild`/vitest-toolchain `npm audit` advisory (moderate, dev-server request forgery)
  — inherent to the current vitest 3.x → vite 6 chain, not a runtime/prod risk. No fix available
  without an unreleased vitest bump; revisit on next dependency update.

## Next up (ordered per Majd)

1. C3: bulk issuance wizard (CSV upload → validate → preview → issue → report) — needs
   KH-1.1.3-BE first.
2. Dashboard v1 (issues/verifies/consumes/failures counters).
3. API-key revocation UI (KH-2.2-era, out of scope for C2b — the platform endpoint already exists,
   `POST /api/v1/admin/api-keys/{id}/revoke`).
4. A real visual/RTL pass over every screen — partially done via live manual round-trips each
   session (no browser-automation tool in this environment); a full EN/AR + RTL click-through
   across all screens including the two C2b ones (`/consumers`, `/consume-sim`) still worth doing.
