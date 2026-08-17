> التاريخ الأقدم: docs/STATE-archive-phase1.md

# STATE — khatm-console

> Updated at the end of EVERY Claude Code session.

## Current phase / task

- C10-provider-switch-rotation (explicit provider choice in the rotate dialog, session
  `SESSION-C10-provider-switch-rotation.md`) — **DONE, D1–D3 delivered, D4 deferred.** Closes the
  gap narrated in the 2026-08-04 C8b entry below ("noted for whoever eventually wires the 'rotate
  onto a specific provider' UI"): `rotateSigningKey()` now accepts an optional `provider`, and the
  rotate dialog gained a three-way choice (inherit/SOFT/VAULT) with a direction-aware warning when
  an explicit pick differs from the ACTIVE key's current provider. Default behavior (no selection)
  is byte-for-byte the pre-C10 request — no `provider` key at all, verified at the `apiFetch`
  call-site, not just the mutation layer. D4 (type-to-confirm keyed on the tenant slug instead of
  the active key's `kid`) stayed deferred — `MeResponse` still has no `tenantSlug` field, reconfirmed
  against a fresh contract fetch this session, same as C8's original finding. No live walkthrough
  or Arabic-copy review yet — both remain Majd's merge gate. See "Last completed" 2026-08-17.
- C9-attested-issuance-ui (console side of FS-2.4's non-automated issuer portal, session
  `SESSION-C9-attested-issuance-ui.md`, prereq `khatm-platform` KH-2.4-BE PR #54 merged
  2026-08-10) — **DONE.** Delivered 2026-08-11, live Docker Desktop walkthrough (EN/AR/RTL + every
  new surface) by Majd 2026-08-12 — see "Last completed" both dates for the full record, including
  the `schemaId`-pinning fix and two platform-side findings (nginx upstream-connection staleness,
  a `createVersion` version-number collision) surfaced during that walkthrough. Veto answers actually used: **V1=(a)** verifier-side hash compare
  built into `/verify` (`HashCompare`, session-scoped to any disclosed claim shaped like a 64-hex
  digest, not just a literal `doc_sha256` name); **V2=(a)** the picked `File` is never retained in
  React state past the `hashFile` call — only its name/size and the digest string persist;
  **V3=(b)** a dedicated route `/issue/attested` (`features/attestedIssuance`), not a branch of
  the existing `/issue` wizard — `requires_attestation` schemas are filtered out of both `/issue`
  and `/issue/bulk`'s pickers so they can only ever be picked here; **V4=(a)** both the
  `requiresAttestation` toggle and the claim-field `pattern` input shipped on the schema builder
  this session. **One contract-vendoring gap found and worked around by reading platform source
  directly, not self-stopped on**: `KH-ATT-0400`/`0401`/`0402` exist and are fully wired
  server-side (`ErrorCode.java`, `CredentialService#issue`, `BulkIssuanceService#bulkIssue`) but
  are absent from the vendored `openapi.json` — no `@ApiResponse` annotations were added to the
  affected endpoints, so springdoc never emitted them. Recorded as a platform ask below.
  **Print/label output (spec FS-2.4 D5, the parent spec's own session-split table's "التدفق كاملاً
  - الطباعة" for C9) was NOT built** — the actual session brief's five numbered scope items and
    DoD never mention a print screen at all, only the claim-code success path; treated the brief
    (more specific, more current) as authoritative over the parent spec table rather than silently
    expanding scope, and flagged this explicitly rather than quietly matching the older table.
- C8b-provider-column (console side of FS-2.3's KMS provider column/badge, spec §2 C8 brief,
  `docs/sessions/SESSION-C8b.md`) — **DONE. PR #23 merged to `main` 2026-08-04T09:11:08Z**
  (squash, branch deleted), on Majd's go-ahead to merge. Self-stopped earlier the same day at the
  preamble gate (`khatm-platform` PR #51 was still open despite the brief's stated prereq — see
  "Last completed" 2026-08-04, first entry), resumed once Majd confirmed #51 merged. Second "Last
  completed" entry the same day has the full delivery record, including what this session itself
  could and couldn't verify live (no TOTP/browser access) before Majd's own review.
- C8-key-rotation-ui (console side of FS-2.3's KMS key rotation, spec §2 C8 brief) —
  **DONE. PR #22 merged to `main` 2026-08-03T12:40:36Z** (was still shown "open, awaiting
  walkthrough" in this file until the 2026-08-04 C8b session checked `gh pr view 22` and found
  it merged — corrected here, same kind of stale-STATE fix as the 2026-07-27 C6b hygiene pass;
  the merge itself was never narrated in an intervening "Last completed" entry). IA revised
  2026-08-03 per Majd's request (rotate/retire moved off the dashboard onto their own
  `/key-management` page — see that day's "Last completed" for the full rationale). Preamble
  (`npm run
contract:update`) confirmed the contract was already current (no diff against what C7c had
  vendored 2026-07-30) — `POST /api/v1/admin/signing-keys/rotate` and `POST
/api/v1/admin/signing-keys/{kid}/retire` both present with `RotateKeyResponse`/
  `RetireKeyResponse`/`RetireKeyRequest` schemas and `KH-KEY-0404/0409/0422` error codes, gate
  cleared. See "Last completed" 2026-08-02/2026-08-03 for the full delivery record, including two
  self-stops/judgment calls made in the first pass: no `provider` field exists anywhere in the
  contract yet (KH-2.3b-BE/Vault Transit territory, not yet merged) so the brief's "provider
  column" wasn't built; and the brief's "type the tenant slug to confirm" has no contract surface
  for the caller's own tenant slug (checked `MeResponse` and everywhere else reachable — absent),
  so the rotate confirm is keyed off the current ACTIVE key's `kid` instead. **2026-08-03: rotate
  and retire moved off the dashboard onto their own `/key-management` page** (Majd's explicit
  request after reviewing the first pass — see that day's "Last completed" entry for the full
  rationale and the resulting deviation from the FS-2.3 spec's literal placement).
- C7c-totp-2fa (console side of FS-2.2's TOTP 2FA, spec §4 V1 / session KH-2.2c-BE) —
  **DONE. PR #21 merged 2026-07-30** (squash, branch deleted), after self-stopping earlier the
  same day at the preamble gate (KH-2.2c-BE and KH-2.3a-BE not yet merged), resuming once Majd
  confirmed both `khatm-platform` PRs #49/#50 landed. Delivered: (1) the login TOTP challenge
  step (`TotpChallengeForm`, code-or-recovery-code, generic failure copy); (2) self-service
  enrollment (`features/security`, new `/security` route — QR + manual secret + confirm-code +
  one-time recovery codes via `SecretReveal`, extended with a new print action); (3) admin-side
  "Reset 2FA" on the Users screen (`tenant:admin`) and the tenant on-behalf-of Users tab
  (`platform:admin`); full EN/AR + RTL, Majd-verified. **Self-stopped on exactly one numbered
  item**: FORCED ENROLLMENT (auto-routing a `revoke`/`tenant:admin`/`platform:admin` holder into
  a takeover screen) has no contract-discoverable signal — no distinct error code, no
  `MeResponse` field — so it could not be built; same reasoning also means the Security Settings
  page shows no definitive "is TOTP active" status, only an always-available enroll/re-enroll
  action. Both recorded as a platform ask below. Majd's live walkthrough (real authenticator app
  - iOS Passwords, EN/AR) passed, after two mid-walkthrough snags fixed live (see "Last
    completed"): a stale phone-side TOTP entry from a pre-reset secret, and an in-memory TOTP
    attempt-lockout in `khatm-api` with no exposed cooldown — cleared by restarting the container,
    not a console bug either time. Merged over a CI run that failed on GitHub Actions billing
    (account payment/spending-limit issue, job never started) rather than any check — local
    `npm run check` was the actual gate and was green. **KH-2.2 epic is now CLOSED.**
- C7b login-slug-and-obo-list (micro follow-up to C7, closing the console side of the two
  platform gaps recorded 2026-07-28) — **DONE, delivered 2026-07-30.** Preamble
  (`npm run contract:update` against `origin/main`) confirmed both KH-2.2d-BE gate items present
  in the officially-merged contract (not a pre-merge vendor, unlike C6/C7's own preamble
  sessions): optional `tenantSlug` on `LoginRequest`, and `GET /api/v1/admin/tenants/{id}/users`.
  Delivered both items: an optional "Organization" field on the login form (maps to `tenantSlug`,
  omitted from the request when blank) and the on-behalf-of Users tab now lists a tenant's users
  (reusing `UserList` read-only, since lock/roles/reset have no on-behalf-of contract variant).
  **PR #20 merged to `main` 2026-07-30** (squash, branch deleted) after Majd's EN/AR/RTL
  walkthrough. See "Last completed" 2026-07-30 for the full record.

## Last completed

- 2026-08-17 (feat/C10-provider-switch-rotation, spec brief `SESSION-C10-provider-switch-rotation.md`
  — delivered, not yet a PR): **Preamble.** Baseline `npm run check` green on `main` first (per the
  brief's own gate order), then branched. `npm run contract:update` against `origin/main` for
  `khatm-platform`: `RotateKeyRequest.provider` was already present (vendored by the 2026-08-04
  C8b session) — gate 1 cleared without any code change being needed for D1's premise. The raw
  fetch this time came back **pretty-printed** where the committed file was minified — a
  ~4,850-line raw diff that canonicalized (key-sorted) to **zero semantic difference except the
  `servers` block** (same harmless drift as the 2026-07-26 Dashboard precedent). Reverted
  `contracts/openapi.json` rather than commit a purely cosmetic reformat — `git checkout --
contracts/openapi.json` before touching any source. **Gate 2 (optional, non-blocking):**
  `MeResponse` still has exactly `displayNameI18n`/`mustChangePassword`/`preferredLang`/`scopes`/
  `username` — no `tenantSlug` — confirmed directly in the freshly-fetched contract before
  reverting it. Per the brief's own instruction this is not a self-stop: D4 deferred, D1–D3
  proceeded. Baseline `npm run check` (typecheck/lint/test) was green before this session's own
  edits began.
  - **D1 — `api.ts#rotateSigningKey(provider?)`.** Now accepts `RotateKeyRequest['provider']`
    optionally; `provider === undefined` sends `body: undefined` to `apiFetch` — literally the same
    "no body at all" the pre-C10 caller produced (`apiFetch` only sets `Content-Type`/serializes
    when `init.body !== undefined`), not an empty-object body. New `api.test.ts` (2 cases, following
    `consumeSim/api.test.ts`'s precedent of spying on `@/api/client#apiFetch` directly rather than
    mocking at the feature boundary) asserts the exact `init` object for both the omitted-provider
    and `provider: 'VAULT'` calls — the most literal check available that the contract's own
    nullability is respected. `hooks.ts#useRotateKey`'s `mutationFn` now threads the optional
    `provider` through from `mutateAsync(provider)`.
  - **D2 — the rotate dialog's provider choice.** New `components/RotateProviderChoice.tsx`: shows
    the ACTIVE key's current provider (`.ltr-embed`, `providerUnknown` fallback — same convention as
    the `KeyList` column badge), then a `<fieldset>` radio group — "inherit" (always the default
    selection on open, per veto V1) plus one option per `KNOWN_PROVIDERS` (currently `SOFT`/`VAULT`).
    A `Banner tone="warning"` appears only when the pick is explicit **and** differs from the
    current provider (inheriting, or explicitly re-picking the same provider already in use, shows
    nothing) — content depends on direction: switching to `VAULT` gets the fail-closed explanation,
    switching away from it gets the migration-rollback caution, per the brief's own two-variant
    wording. No extra confirm step beyond the existing type-to-confirm (veto V2 default). Extended
    `components/ui/TypeToConfirmDialog.tsx` with an optional `children` slot (rendered between
    `body` and the type-prompt) so this could be composed into the existing rotate dialog rather
    than forking it — `ReviewStep.tsx` (attested issuance's other caller) passes none, unaffected.
    `KeyManagementPage.tsx` holds the `rotateProvider: string | null` selection (reset to `null` —
    inherit — both on open and on close/cancel) and passes `rotateProvider ?? undefined` into
    `rotateKey.mutateAsync`.
  - **Provider-name/bidi discipline (the brief's own Arabic-gate caution, addressed at the copy
    level, not just left for Majd to catch):** `SOFT`/`VAULT` are never spliced into translated
    prose — every appearance is its own `.ltr-embed` span next to a plain-language label (`Current
provider: `, `Switching to: `), the identical shape `KeyList`'s existing provider badge already
    uses. The warning copy itself describes the two behaviors in plain language without repeating
    the provider name or citing the error code inline (`KH-KEY-0503` is surfaced live via the
    standard `ApiErrorBanner` mechanism if it actually occurs, work rule 3 — not hand-authored into
    proactive UI copy). `JWKS` appears inline in the Arabic fail-closed warning the same way it
    already does in two existing, presumably-reviewed strings (`tenants.jwksTitle`/`jwksHelp`), so
    this isn't a new precedent.
  - **Lint hygiene, not itemized in the brief but needed to keep `npm run check` at its existing
    baseline:** exporting `PROVIDER_TONE`/a new `KNOWN_PROVIDERS` straight out of `KeyList.tsx`
    tripped `react-refresh/only-export-components` — the exact same warning category already noted
    as pre-existing on `FormField.tsx`. Rather than add a second instance of it, extracted both
    constants into a new `components/providers.ts` (no components in it); `KeyList.tsx` and the new
    `RotateProviderChoice.tsx` both import from there. Net: still only the one pre-existing
    `FormField.tsx` warning.
  - **D3 — README correction.** `src/features/keyManagement/README.md:24–25` (not the top-level
    repo `README.md` the brief's line numbers pointed at — that file never mentions `provider` at
    all, grepped to confirm) said "No `provider` column yet — the contract has no `provider` field
    until KH-2.3b-BE... lands," stale since the 2026-08-04 C8b session. Corrected, and folded in a
    note about `rotateSigningKey`'s new optional argument and `KNOWN_PROVIDERS`'s new home.
  - **D4 — deferred, recorded per the brief's own fallback wording** (see preamble gate 2 above);
    no code changed for it. The rotate confirm stays keyed on the ACTIVE key's `kid`, exactly as C8
    left it.
  - **Tests: 258 total now (was 253)** — 2 new (`api.test.ts`, the exact-request-body pair above), 3
    new in `KeyManagementPage.test.tsx` (default-inherit + current-provider display + warning
    toggling on/off across inherit → same-as-current → genuinely-different → back to inherit;
    switching away from `VAULT` shows the rollback warning and the confirmed call carries the exact
    chosen provider; the current-provider label and the fail-closed warning both render correctly
    once `i18n.changeLanguage('ar')`, following `IssuePage.test.tsx`'s existing Arabic-case
    pattern including its `afterEach` language-reset), and the existing "type the active kid, then
    rotate" test extended with a literal `expect(rotateSpy).toHaveBeenCalledWith(undefined)` so the
    inherited-default path is checked at this level too, not only in `api.test.ts`.
  - `npm run typecheck`, `npm run lint` (only the pre-existing `FormField.tsx` warning), `npm run
test` (258/258), and `npm run build` all clean. `format:check` clean on every file this session
    touched (`prettier --write` needed on 2 files mid-session, re-verified clean after); still fails
    only on the same pre-existing untracked files as every prior session
    (`.vscode/extensions.json`, `docs/sessions/*.md`, `docs/specs/*.md`) — `docs/STATE.md`/
    `docs/STATE-archive-phase1.md` themselves needed a one-off `prettier --write` earlier the same
    day (see the two hygiene commits ahead of this session on `main`) and are clean now. RTL grep
    (`(margin|padding|border)-(left|right)`, bare `left:`/`right:`, physical `text-align`, `float:`)
    across every new/changed file (`.tsx` and `.module.css`): zero matches.
  - **No live walkthrough this session** — same standing limitation as every session since 2FA
    landed (no browser-automation tool, no authenticator-app access). The brief's explicit
    "no execution against staging" rule was also honored — build/test stayed entirely local
    (Docker Desktop is where Majd's own walkthrough will run, not this session). Both the live
    walkthrough (inherited rotate, explicit SOFT→VAULT against a local Vault compose, warning
    appearing, then an inherited rotate landing on VAULT) and the Arabic-copy/RTL gate are Majd's
    own steps per the brief's DoD and remain the merge gate. **PR not yet opened** — see next
    session-start note for whether it was opened after this entry was written.

- 2026-08-12 (folded into `feat/KH-2.4.1-attested-issuance`, found live-testing the C9 delivery
  against Docker Desktop): **`IssuePage`/`AttestedIssuePage` resolved the operator's exact schema
  selection but never sent it.** Both pages already fetch a specific `SchemaDetail` (by `id`) from
  the schema picker and display its exact version, but `buildIssueRequest`/
  `buildAttestedIssueRequest` only ever put `schemaCode` on the outgoing `IssueRequest` — the
  platform's `CredentialService#issue` had no way to know which version was meant and always
  resolved `(schemaCode, version=1)`, so a schema published at version 2+ was silently unreachable
  from issuance no matter what the operator picked in the UI (root-caused together with the
  platform-side fix — see `khatm-platform` `docs/STATE.md`'s matching 2026-08-12 entry for the full
  diagnostic). **Fix (this repo):** platform added an additive, nullable `IssueRequest.schemaId`;
  `contracts/openapi.json` + `src/api/generated/schema.ts` regenerated via `npm run gen:api` against
  the rebuilt platform's live `/v3/api-docs` (never hand-written, per this repo's CLAUDE.md); both
  `buildIssueRequest` (`features/issuance/IssuePage.tsx`) and `buildAttestedIssueRequest`
  (`features/attestedIssuance/request.ts`) now also send `schemaId: detail.id`. Two existing tests
  (`IssuePage.test.tsx`, `AttestedIssuePage.test.tsx`) updated to expect `schemaId` in the mocked
  `issueCredential` call. `npm run typecheck`/`lint`/`test` all green (253/253 tests; the one
  ESLint warning in `FormField.tsx` and the pre-existing `format:check` failures under `.vscode/`,
  `docs/sessions/`, and `docs/specs/` are pre-existing and untouched by this fix — not silently
  worked around). Rebuilt/redeployed `khatm-console`'s own container and verified live. Committed
  on `feat/KH-2.4.1-attested-issuance` alongside the rest of C9 rather than a separate `main`
  hotfix — the bug was only reachable through this session's own new `AttestedIssuePage`/schema
  builder work in the first place (nothing else in the console lets an operator pick a specific
  non-latest schema version), so it ships in the same PR.

- 2026-08-12 (same branch, live Docker Desktop walkthrough — two platform-side findings, not console
  bugs, recorded here since they cost real debugging time and will recur for the next session that
  hits them):
  - **nginx caches its `khatm-api` upstream connection for the worker's lifetime** (`proxy_pass
http://khatm-api:8080` with no `resolver` directive) — when the local `khatm-api` container
    restarts (observed happening every 1–10 minutes on this host, most likely IntelliJ's
    continuous-build/DevTools live-reload bouncing it), the console's nginx keeps talking to the
    dying old instance for a while, producing a genuine (correctly-shaped, uniquely-traced)
    `KH-SYS-0500` from that instance's own `GlobalExceptionHandler` — reproducible for _any_
    `/api/v1/credentials/verify` payload including garbage input, so it is not attestation-specific.
    Confirmed via: direct calls to `khatm-api:8080` always succeeded; the same call via the
    console's nginx failed consistently; `docker exec khatm-console nginx -s reload` (forcing
    re-resolution) fixed it immediately, until the backend restarted again. Workaround documented
    for whoever hits this next: reload nginx after any backend restart. Also surfaced, in passing,
    a `logback-spring.xml` `TEMP-DIAGNOSTIC` comment on the platform side noting `docker logs`
    itself gets stuck on this host — the `/tmp/khatm-diagnostic.log` file appender it adds was the
    only way to read a given container instance's actual logs during this session.
  - **`SchemaAuthoringService#createVersion` computes the new version as `source.version + 1`
    unconditionally**, not "the next free version number for this `code`." Creating a second new
    version from the same still-`PUBLISHED` source (e.g. after the first new version was archived)
    recomputes the identical version number and hits `credential_schema_tenant_id_code_version_key`
    — a raw `DataIntegrityViolationException` surfaced as `KH-SYS-0500`, not a clean `KH-SCH-*`
    conflict code. Reproduced live via `psql` against the local dev DB (`ba_certificate_v1`: v1
    PUBLISHED, v2 ARCHIVED, a third "New schema version" attempt from v1 collided on v2 again).
    Not actioned this session (`khatm-platform` fix, out of scope for this repo) — recorded as a
    platform ask below. Console-side, `SchemaBuilderPage`'s error path already renders whatever the
    server returns via the standard `ApiErrorBanner`, so no console change is needed once the
    platform maps this to a real conflict code instead of falling through to the generic handler.
  - **Majd's live walkthrough (2026-08-12), the DoD's hard merge gate — passed.** Full EN/AR + RTL
    pass across the new surfaces (attested-issuance wizard, hash-compare on `/verify`, schema
    authoring's `requiresAttestation`/pattern fields), a real scanned-file run end-to-end including
    the two platform-side snags above (both root-caused live, neither a console defect), and the
    schema-builder claim-field row layout fix. Confirmed complete by Majd directly ("tested
    everything including Arabic keys/content, and RTL, and the new features") — proceeding to PR
    and merge on that basis.

- 2026-08-11 (feat/KH-2.4.1-attested-issuance, spec FS-2.4, session
  `SESSION-C9-attested-issuance-ui.md` — delivered, not yet a PR): **Preamble.** `npm run
contract:update` against `origin/main` (public raw fetch, no `gh api` fallback needed, per the
  2026-08-04 precedent) — 29 insertions, purely additive: `AttestationRequest{note}` (new schema),
  `attestation?` on `IssueRequest`, `pattern?` on `ClaimFieldRequest`, `requiresAttestation?` on
  `SchemaSummary`/`SchemaDetail`/`SchemaCreateRequest`/`SchemaAuthoringRequest`. Three of the four
  gate items confirmed directly in the refreshed contract. **The fourth — `KH-ATT-0400`/`0401`/
  `0402` — is genuinely absent from `contracts/openapi.json`** (grepped case-insensitively, zero
  hits, including in the `issue`/`bulk` endpoints' own response descriptions, unlike every other
  error code in this contract which appears as `"... (KH-XXX-NNNN)"` prose in a response
  `description`). Per the brief's own instruction ("KH-2.4-BE verified all of these on the
  platform side, so absence means a contract-vendoring problem, not a missing feature — report it
  as such"), cross-checked the local `khatm-platform` checkout directly (same precedent as every
  prior session's non-guess policy) rather than self-stopping: `ErrorCode.java` has all three,
  fully documented (`KH_ATT_0400`/`attestation.required`, `KH_ATT_0401`/`attestation.not-
applicable`, `KH_ATT_0402`/`attestation.bulk-not-supported`, all HTTP 400), wired into
  `CredentialService#issue`'s `validateAttestation` (deny-by-default in both directions) and
  `BulkIssuanceService#bulkIssue` (wholesale reject on `requiresAttestation`). The affected
  endpoints simply have no `@ApiResponse` springdoc annotations for these paths, so they never
  reach the generated spec — a documentation gap, not a missing feature, exactly as the brief
  predicted. Built the error UI against the confirmed-real `messageKey`s (`errors.attestation.*`)
  rather than self-stopping on item 3. **Recorded as a fresh platform ask below.** Also confirmed
  in platform source (not just the contract): `AttestationRequest` carries only `note` — `doc_type`/
  `original_issue_date`/`attestation_note` are ordinary schema claim fields, not part of the
  attestation object; the `AttestedDocumentSeeder`'s exact `AttestedDocument/v1` demo schema
  (`doc_sha256` field name, `^[0-9a-f]{64}$` pattern, `required: false` on every field) is the
  literal convention this session built against, not a guess. Endpoint path re-confirmed: issuance
  is `POST /api/v1/credentials/issue` (already correct in `issuance/api.ts`, untouched).
  `npm run gen:api` regenerated `schema.ts` clean. `npm run check` baseline green (235/235,
  typecheck/lint clean) before any code change.
  - **Item 1 — `features/attestation/hashFile.ts`.** `hashFile(file, {chunkSize?, onProgress?})`
    → lowercase-hex SHA-256 via `crypto.subtle.digest`, reading in bounded `FileReader` chunks
    (default 8 MiB) rather than one `Blob#arrayBuffer()` call, reporting cumulative progress per
    chunk. Documented the real constraint this design works within: `SubtleCrypto.digest` has no
    incremental/streaming form, so one full-buffer digest call is unavoidable regardless — chunking
    bounds each individual read and keeps the UI responsive/progress-reportable between them, it
    does not reduce peak memory below the file's own size. `isHashingAvailable()` +
    `InsecureHashingContextError` — the non-secure-context guard, never a JS-hash fallback (D1's
    own requirement). 8 unit tests: known vectors (empty file, `"abc"`, both verified against
    Node's own `crypto.createHash('sha256')` before being hardcoded), chunked-vs-single-shot
    equivalence, monotonic progress reporting ending at the file size, the empty-file zero/zero
    tick, and the insecure-context throw (stubs `globalThis.crypto` to `{}`). **Confirms this
    toolchain's Node (24) exposes `crypto.subtle` natively in Vitest/jsdom** — no polyfill needed,
    a real gap in the STATE.md environment notes until now (only the `File#text()`/`#arrayBuffer()`
    jsdom gap was previously documented).
  - **Item 2 — `features/attestedIssuance`, the dedicated wizard (route `/issue/attested`, V3).**
    Five-step local state machine (`AttestedIssuePage.tsx`, not `react-router` sub-routes): schema
    pick (`useAttestedSchemas`, attested-only) → `ScanStep` (file pick + hash, file reference
    dropped immediately per V2 — only `{name, size}` and the digest string survive into the next
    step) → `DetailsForm` (every other claim field, exactly like the standard `IssueForm`, plus the
    request-level `attestation.note` — a **deliberately distinct field** from any schema claim
    literally named `attestation_note`, labelled to avoid the collision) → `ReviewStep`
    (acknowledgment checkbox + `TypeToConfirmDialog` keyed on the digest's first 8 hex chars, C8's
    pattern reused verbatim) → issue + mint, reusing `issuance`'s existing
    `useIssueAndMintCredential` unchanged. `claimFields.ts` splits a schema's parsed claims into the
    `doc_sha256`-named convention field (locked, auto-filled from the computed digest, never
    rendered as an editable input) and everything else; `request.ts`'s `buildAttestedIssueRequest`
    always injects the digest under that key (overwriting anything a stray same-named form field
    could otherwise contribute) and always sends a — possibly empty — `attestation` object, never
    omits it (an omitted object is exactly what `KH-ATT-0400` exists to catch). No `api.ts` in this
    feature — every network call is one `issuance/api.ts` already wraps; `hooks.ts` only re-exports.
  - **Filtering design decision (not explicitly itemized in the brief, but load-bearing for V3):**
    `issuance/api.ts#listPublishedSchemas` now excludes `requiresAttestation` schemas (they'd be a
    guaranteed `KH-ATT-0400` dead end through the standard wizard), and a new
    `listAttestedSchemas` is the mirror image. Because `bulkIssuance/hooks.ts` already re-exports
    `usePublishedSchemas` from `issuance/hooks`, this one change **also satisfies item 3's bulk-
    picker-filtering requirement for free** — no `BulkIssuePage.tsx` edit needed, `KH-ATT-0402`
    schemas simply never appear there either. `schemaManagement/hooks.ts`'s
    `useInvalidateAfterWrite` now invalidates both schema-list query keys.
  - **Item 3 — error i18n + RTL.** `errors.attestation.{required,not-applicable,bulk-not-supported}`
    (EN/AR) resolve through the existing `errors.<messageKey>` mechanism (`useErrorMessage.ts`) with
    zero code changes needed there — confirms that mechanism generalizes to a module tag the app
    had never seen before. RTL grep (`(margin|padding|border)-(left|right)`, bare `left:`/`right:`,
    physical `text-align`, `float:`) across every new/changed stylesheet: zero matches, logical
    properties throughout (`inset-inline-start` for the hidden dropzone file inputs).
  - **Item 4 — `attestation.no-file-egress.test.tsx`, the D1 enforcement artifact.** Spies on the
    real `globalThis.fetch` (not the `api.ts` wrapper functions — mocking those would hide exactly
    what this test exists to prove) across a complete rendered scan-to-issue run, with the picked
    file's own content (`"do-not-upload-me"`) as the tripwire. Asserts, over every captured call: no
    `Content-Type: multipart/form-data`, no request body containing the raw file content or its hex/
    base64 encoding, and the `issue` call's JSON body has `claims.doc_sha256` as a 64-hex string.
    Named per the brief's own suggested pattern, header comment points at FS-2.4 D1.
  - **Item 5 — schema authoring.** `claimsBuilder.ts`'s `BuilderFieldRow` gained `pattern: string`
    (blank = no constraint; `toClaimsDef` omits the key entirely rather than sending an empty
    string, matching how `fromSchemaDetail` reads an absent `pattern` back). `SchemaBuilderForm.tsx`
    gained a schema-level `requiresAttestation` checkbox (helper text: "applies at issuance") and a
    per-row `pattern` text input with **client-side regex-compilability validation** (`new
RegExp(...)` in a zod `.refine`, mirroring `SchemaAuthoringService`'s own `KH-SCH-0400`
    server-side check) so an invalid pattern is caught before submit, not after. `SchemaBuilderPage.tsx`
    wires both into `buildAuthoringBody`/prefill.
  - **V1 — `features/verify/components/HashCompare.tsx`.** Not itemized in the brief's numbered
    scope list, but session veto V1 answered "(a) in scope for C9" and §3's Out-of-scope line reads
    "Verifier-side hash comparison unless V1=(a)" — built. Detects any **disclosed claim value**
    shaped like a 64-hex digest (`/^[0-9a-f]{64}$/i`, not a hardcoded field name — a verifier's own
    schema variant may name the field differently, the value shape is the only reliable signal
    post-issuance) and offers a "compare against your own copy" affordance next to it in
    `VerifyResult`, reusing `hashFile` — zero new crypto, same D1 guarantee (no upload, ever).
  - **Tests: 253 total now (was 235)** — 8 new (`hashFile.test.ts`), 4 new/updated
    (`claimsBuilder.test.ts`'s pattern round-trip + existing fixtures updated for the new field), 2
    new (`SchemaBuilderForm.test.tsx`'s `requiresAttestation` toggle + invalid-pattern rejection), 3
    new (`VerifyResult.test.tsx`'s hash-compare CTA-gating + match + mismatch, using real
    `hashFile`), 2 new (`AttestedIssuePage.test.tsx`'s scope-gate + full walkthrough — schema pick →
    real WebCrypto hash → details → review → type-to-confirm → issue, asserting the exact
    `IssueRequest` body), 1 new (the D1 no-egress test). `npm run typecheck`, `npm run lint` (only
    the pre-existing `FormField.tsx` fast-refresh warning), `npm run test` (253/253), and `npm run
build` all clean. `format:check` clean on every file this session touched (prettier --write
    needed on 5 files mid-session, re-verified clean after) — still fails only on the same
    pre-existing untracked files as every prior session. `npm run gen:api` re-run twice back-to-back
    produces the identical diff both times (stable, additive-only) — will show zero diff once this
    session's changes are committed, confirming the contract-freshness CI gate will pass.
  - **No live walkthrough this session** — same standing limitation recorded 2026-08-04 (no
    browser-automation tool, local `admin` account has TOTP 2FA enrolled so the old curl-based
    fallback no longer works either). The DoD's live walkthrough (real scanned PDF, watch the
    digest appear, issue, verify, and confirm in DevTools' Network tab that no request ever carried
    the file) is explicitly Majd's own step per the brief §5 and remains the merge gate — the
    automated D1 test proves the same thing in CI, seeing it once by hand is what the brief itself
    says makes it believable to a government counterparty later. **PR not yet opened** — branch
    `feat/KH-2.4.1-attested-issuance` has all commits ready; opening the PR and Majd's Arabic
    string review (hard gate per brief §5) are the next steps.
  - **Platform ask, new 2026-08-11 (KH-ATT error codes undocumented in the OpenAPI spec) — OPEN.**
    `KH-ATT-0400`/`0401`/`0402` are fully implemented and correct server-side (confirmed by reading
    `ErrorCode.java`/`CredentialService`/`BulkIssuanceService` directly) but the `issue`/`bulk`
    endpoints carry no springdoc `@ApiResponse` annotations documenting them, unlike most other
    error-bearing endpoints in this contract (which at least name their codes in a response
    `description` string, e.g. `KH-KEY-0404`'s "No such key for the current tenant (KH-KEY-0404)").
    Low cost, real value: a future console session (or an external API consumer) grepping the
    vendored contract for these codes will find nothing and may wrongly self-stop, the way this
    session almost did before checking the platform source directly per the brief's own instruction
    that absence here likely means a vendoring gap, not a missing feature.

- 2026-08-06 (ad hoc container fix, not a coding session — no branch/PR/code change): Majd
  pointed out the 2026-08-05 `staging-khatm-console` setup missed `VITE_QR_API_BASE` — the
  single-issue screen's wallet QR was still encoding `window.location.origin`
  (`http://localhost:3001`), unreachable by a physical phone, so wallet scan-redeem against
  staging would have silently failed even though the console's own API calls worked. Rebuilt as a
  genuine fresh `npm run build` (not layered on the local image) with
  `--build-arg VITE_QR_API_BASE=https://mc-qzln0zm7z7.b-cdn.net`, verified the literal string
  landed in the built JS and the API proxy still works. Also answered Majd's "why does the
  console own this at all" question — checked the contract, confirmed there's no server-side
  source of truth for a platform's own public base URL, recorded as a platform-ask candidate
  below rather than acted on. Full mechanics under "Environment facts" →
  `staging-khatm-console`.
- 2026-08-05 (ad hoc container setup, not a coding session — no branch/PR/code change): stood up
  `staging-khatm-console` on `:3001` pointing at Majd's Bunny-deployed staging `khatm-api`, so the
  console can be checked against a real deployed backend rather than only the local
  docker-compose stack. Verified with a real request (not just a 200 on `/`):
  `GET /api/v1/admin/signing-keys` through the proxy returned the actual platform error envelope
  (`KH-RBC-0401`, fresh `traceId`), confirming it reaches the live app rather than a CDN error
  page. Re-run once when Majd gave a second, different staging URL (`mc-qzln0zm7z7.b-cdn.net`,
  superseding `mc-we1w25akdr.b-cdn.net`) — same verification repeated, green. Full setup mechanics
  (why no `.env` var exists, the Bunny `Host`-header requirement, how the image is built) recorded
  under "Environment facts" above rather than here, since it's a durable fact about this
  environment, not a one-time delivery.
- 2026-08-04 (repo administration, not a coding session — no branch/PR): Majd made both
  `khatm-console` and `khatm-platform` public on GitHub. Verified CI green on `khatm-console`
  `main` after the change (`gh run view` on the latest run: all 10 steps —
  checkout/setup-node/install/typecheck/lint/format/unit-tests/build/contract-freshness —
  succeeded). Added branch protection to `khatm-console` `main` per Majd's choices (asked via
  three questions rather than assuming): block force-push and branch deletion; direct pushes
  still allowed (not requiring PRs, to preserve the existing STATE.md-direct-commit pattern); no
  required status checks (CI stays advisory, Majd's explicit choice — the recommended default
  was "require CI" but he chose otherwise); no required approving reviews (sole
  maintainer/reviewer). See "Environment facts" above for the exact settings and for the
  incidental discovery that `scripts/update-contract.mjs`'s public-URL fetch path now works
  directly against `khatm-platform` (no longer needs the `gh api` fallback every prior session
  actually hit).

- 2026-08-04 (chore/C8b-provider-column, spec FS-2.3 §console, `docs/sessions/SESSION-C8b.md`
  — **self-stopped at the preamble, zero code changed**): the session brief states its prereq as
  met ("Prereq: platform PR #51 مدموج (حقل `provider` صار في `SigningKeyView`)"). Branched off
  latest `origin/main`, ran the mandated preamble (`npm run contract:update`, which fetches
  `khatm-platform`'s published `docs/api/openapi.json` via the public raw URL with a `gh api`
  fallback — the fallback fired, raw URL still 404s on this private repo, same as every prior
  session). Result: **zero diff** against the already-vendored `contracts/openapi.json`, and
  `SigningKeyView` there has exactly four properties — `kid`/`state`/`validFrom`/`validTo` — no
  `provider`. Cross-checked directly: `gh pr view 51 --repo GloryMs/khatm-platform` →
  `"state":"OPEN","mergedAt":null`; re-fetched `docs/api/openapi.json` straight from
  `khatm-platform`'s `main` via `gh api` independent of the console's own script → same four
  properties, confirming this isn't a caching artifact of the update script. So the brief's
  stated prereq does not hold yet — PR #51 (`feat(key): KH-2.3b Vault Transit KMS provider +
SOFT->Vault migration`) is still open. Per this repo's standing rule (vendored contract is the
  sole authority; a value/field cannot be built against a guess — same reasoning as every prior
  self-stop, e.g. C6b's missing `status` query param, C7's missing `mustChangePassword`), none of
  the session's four scope items (provider column, badge, dashboard glance, i18n keys) can be
  built without guessing the field's shape. No UI code touched. Branch `chore/C8b-provider-column`
  was created, found to have zero commits (the contract fetch was a no-op diff), and deleted —
  nothing to keep. Also used this session to fix a stale STATE.md line noticed while re-reading
  "Current phase / task" for the preamble: it still said PR #22 was "open, awaiting walkthrough,"
  but `gh pr view 22` shows it merged 2026-08-03T12:40:36Z — corrected above (same kind of
  hygiene fix as C6b's PR #15 correction). **Next step is platform-side, not console-side**: once
  PR #51 merges, re-run this exact session — no further console-side investigation needed, the
  brief's scope items 2-4 are otherwise fully actionable (badge color mapping SOFT/gray vs
  VAULT/green, unknown-value fallback, dashboard one-line addition, i18n keys) the moment the
  field exists.

- 2026-08-04 (chore/C8b-provider-column, resumed and delivered same day — Majd confirmed live
  that `khatm-platform` PR #51 had merged, `mergedAt: 2026-08-04T07:19:39Z`): re-ran the preamble
  — `npm run contract:update` this time pulled a real, additive-only diff (`git diff --stat`: 46
  insertions/2 deletions in `contracts/openapi.json`): new `RotateKeyRequest{provider?}` schema
  (optional provider override on rotate — this is D6's SOFT→Vault migration mechanism, per its
  own description field), `provider?: string` added to both `RotateKeyResponse` and
  `SigningKeyView`, and new `400`/`503` responses on the rotate endpoint
  (`KH-KEY-0400`/`KH-KEY-0503`, unknown provider / target provider unreachable) — none of this
  session's scope, noted for whoever eventually wires the "rotate onto a specific provider" UI
  (explicitly out of scope here, see brief §3). `npm run gen:api` regenerated
  `src/api/generated/schema.ts` clean. `provider` is a free-text `string` in the schema (no
  server-side enum), same shape as `state` — confirms the brief's "read the value, don't guess."
  - **`KeyList.tsx`** (`/key-management` table): new Provider column, a `StatusBadge` per row —
    `PROVIDER_TONE` map (`SOFT` → `neutral`, `VAULT` → `success`), any other/missing value falls
    back to `neutral` with the raw string (`.ltr-embed`, same treatment as `kid`) or, if `provider`
    is entirely absent, `keyManagement.providerUnknown`. Deliberately did **not** touch
    `rotateSigningKey()`/the rotate dialog to accept a provider override — the brief's §3 explicitly
    keeps "rotate onto a specific provider" out of this session (Game-day does that via direct API
    call per runbook Step 1b).
  - **`SigningKeysPanel.tsx`** (dashboard glance): same `PROVIDER_TONE` map duplicated locally
    (2026-08-03 precedent — each feature owns its own tone/i18n subtree rather than a cross-feature
    import) — a second `StatusBadge` added inline next to the existing state badge on every row in
    the `.head` flex row (already `display:flex` with no fixed width budget, so this is a true
    one-line addition, no panel restructuring). Read literally, the brief says "if it shows the
    ACTIVE key" — the panel already lists every key's state, not just ACTIVE, so the provider badge
    was added to every row rather than special-casing just the ACTIVE one; simpler and consistent
    with how the state badge itself is already rendered per-row.
  - **i18n**: `keyManagement.columnProvider` / `dashboard.keys.providerUnknown` /
    `keyManagement.providerUnknown` (3 new keys, EN+AR same commit). `SOFT`/`VAULT` themselves are
    **not** translated — the brief's own wording treats them as the literal badge text (like `kid`,
    a technical identifier), not prose; only the column header and the "field genuinely absent"
    fallback needed real translation. Manually cross-checked both `en.json`/`ar.json` for the exact
    new key strings (grep, not just the parity test) per the C8 lesson (parity only checks the two
    files have the same key _set_, not that a key referenced in code actually exists) — all three
    present symmetrically.
  - Tests: 235 total now (was 234) — one new case in `KeyManagementPage.test.tsx` (VAULT/SOFT
    badges render their literal raw value — a hardcoded string assertion, not `i18n.t()` of the
    same untranslated value, so immune to the C8 blind spot by construction; a key with no
    `provider` renders the "Unknown" fallback) and `SigningKeysPanel.test.tsx` extended (existing
    case now also asserts the `SOFT` badge). `npm run typecheck`/`lint` (only the pre-existing
    `FormField.tsx` fast-refresh warning)/`format:check` (clean on every file this session
    touched; same pre-existing untracked-file failures as every prior session, none of them
    touched)/`test` (235/235) and `npm run build` all clean. RTL grep
    (`(margin|padding|border)-(left|right)`, bare `left:`/`right:`, physical `text-align`,
    `float:`) on every changed `.tsx` (no `.css` files were touched — both badges reuse the
    existing shared `StatusBadge`/`Table.module.css`/`SigningKeysPanel.module.css`, work rule 4):
    zero matches.
  - **Verified against the local compose stack** (already running: `khatm-api`/`khatm-worker`/
    `khatm-postgres`/`khatm-redis`/**`khatm-vault`** — Majd's own stack, DoD item 3's Vault
    scenario is live-testable here). `docker compose build --no-cache && up -d --force-recreate`;
    confirmed the container serves the new bundle (`docker exec khatm-console grep` found
    `columnProvider`-driven "Provider"/`المزوّد`/`غير معروف` inside the built JS) and that
    `http://localhost:3000/api/v1/admin/signing-keys` correctly proxies through to the backend
    (401, not a broken-proxy 502/404). **Could not complete a full authenticated walkthrough**:
    the local `admin` account now has TOTP 2FA enrolled (KH-2.2c-BE) and this session has no
    authenticator-app access or browser automation, so `POST /auth/login` stops at the TOTP
    challenge — no way to reach the actual rotate-with-`provider:VAULT` call or a real screenshot
    non-interactively. This is the same standing limitation as every prior console session (no
    browser tool available), now compounded by 2FA closing off the curl-based fallback C5–C7 used.
    **DoD items 2/3/5 (SOFT badge screenshot, live SOFT→VAULT rotation via the API against
    `khatm-vault`, full-page RTL review) are unverified by this session and remain Majd's actual
    walkthrough gate** — everything else in the brief's DoD (freshness gate, additive-only diff,
    EN/AR parity + built-bundle presence, all tests green, no self-comparison test) is done and
    confirmed above.
  - **PR #23 merged to `main` 2026-08-04T09:11:08Z** (squash, branch `chore/C8b-provider-column`
    deleted), on Majd's explicit instruction ("Merge Open PRs") after the container rebuild +
    manual test-case list handed off in this same session. Not independently confirmed here
    that every DoD item (SOFT badge screenshot, live SOFT→VAULT rotation, full RTL pass) was
    walked through before the merge decision — recorded as Majd's call, not re-verified by this
    session.

- 2026-08-03 (chore/C8-key-rotation-ui, same PR #22 — signing-key management moved off the
  dashboard onto its own page, per Majd's explicit request): after the 2026-08-02 delivery,
  Majd reviewed it live (rebuilt container, `docker compose build`/`up -d --force-recreate`
  against the already-running backend stack) and raised a UX concern: rotate/retire are
  irreversible, `key:manage`-gated admin actions squeezed into a dashboard card, unlike every
  other admin action in this console (Users, Tenants, Consuming Parties), which each get their
  own scoped page. Agreed and asked for a recommendation before touching anything (exploratory
  question, no code changed yet) — recommended splitting: keep a lightweight read-only status
  glance on the dashboard (matches the FS-2.3 spec's literal "dashboard panel gains..." wording
  and "ops at a glance" intent) but move the mutating actions to their own nav-linked page.
  Flagged explicitly that this deviates from the spec's literal placement before Majd confirmed
  wanting the split — recorded here per that request, not silently done.
  - **New feature `src/features/keyManagement/`** (`api.ts`/`hooks.ts` moved verbatim out of
    `dashboard/`, same `getSigningKeyStatuses`/`rotateSigningKey`/`retireSigningKey` functions and
    types; query-key namespace renamed `dashboardKeys.signingKeys()` →
    `keyManagementKeys.list()`). New route `/key-management` → `KeyManagementPage`, self-gated on
    `key:manage` via `RequireScope` (same pattern as `UsersPage`, not wrapped at the `App.tsx`
    route level). New Sidebar nav item (`nav.keyManagement`, `⚙`, `scope: 'key:manage'`) between
    Tenants and Security.
  - **`KeyManagementPage.tsx`** (+ `KeyList.tsx`, reusing the shared `Table.module.css` idiom
    `UserList.tsx` already established, rather than the dashboard's card/`<ul>` shape) hosts the
    exact same Rotate/Retire logic delivered 2026-08-02 — `TypeToConfirmDialog` keyed off the
    ACTIVE key's `kid`, `RetireKeyDialog`'s staged min-age-guard flow — moved, not rewritten.
    `RetireKeyDialog.tsx`/`.module.css` `git mv`'d from `dashboard/components/` into
    `keyManagement/components/`.
  - **Dashboard's `SigningKeysPanel.tsx` reverted to read-only** (its pre-2026-08-02 shape) plus
    one addition: a "Manage keys →" link in the `PanelCard` header routing to `/key-management`,
    shown only when `hasScope('key:manage')`. It now imports `useSigningKeyStatuses` from
    `@/features/keyManagement/hooks` rather than owning the query itself — same query key as the
    new page, so a rotate/retire done on `/key-management` refreshes this glance with no separate
    invalidation, and vice versa. This is a cross-feature import; same precedent as `tenants`
    reusing `users/components/UserList` (C7).
  - **i18n**: every `dashboard.keys.rotate.*`/`retire.*`/`retireCta` key moved to a new top-level
    `keyManagement.*` namespace (kept `dashboard.keys.*`'s read-only display keys —
    title/empty/adminOnly/validFrom/validTo/noExpiry/states — as-is for the glance, duplicating
    the small states/labels set into `keyManagement.*` too rather than cross-referencing
    `dashboard.*` from a different feature — deliberate: each feature owns its full i18n subtree,
    a few duplicated short strings is cheaper than a cross-feature i18n dependency). Added
    `dashboard.keys.manageLink` and `nav.keyManagement`. **Caught a real bug from the 2026-08-02
    session while moving these**: `RetireKeyDialog`'s "Force retire anyway" button referenced
    `dashboard.keys.retire.blocked.forceCta`, which was never actually added to either `en.json`
    or `ar.json` — it silently rendered the raw key string in the browser. The 2026-08-02
    session's own test suite didn't catch it because the test asserted against `i18n.t()` of the
    _same_ missing key, so both sides evaluated to the identical (wrong) fallback string and
    matched anyway; the i18n parity script only checks that `en`/`ar` have an identical key set,
    not that every key referenced in code actually exists in either file. Added the missing
    `forceCta` copy to both languages this session; wrote a one-off Node script cross-checking
    every `t('...')` call in the touched components against the resolved JSON (not just parity)
    to confirm no other such gaps existed — none did. Worth remembering as a real blind spot in
    this repo's test conventions: a hardcoded literal in a test's expected value would have caught
    this; asserting against `i18n.t()` of the same key a component uses does not, when that key is
    simply absent from the JSON on both sides.
  - Tests: 234 total now (was 231) — `KeyManagementPage.test.tsx` (new, 5 cases: scope-gate
    no-permission + never-fetches, the same rotate type-to-confirm mismatch/match/submit case,
    rotate disabled with no active key, retire happy path, and the full `KH-KEY-0422` →
    blocked → force-armed → second confirm flow — all moved from the old
    `SigningKeysPanel.test.tsx`); `SigningKeysPanel.test.tsx` rewritten to 2 lightweight cases
    (renders lifecycle status with no rotate/retire controls and a working "Manage keys" link;
    no link and no fetch without `key:manage`); `DashboardPage.test.tsx` updated to mock
    `@/features/keyManagement/api` instead of its own `./api` for signing-key data, and wrapped
    in `MemoryRouter` (the panel now renders a real `<Link>`).
  - `npm run typecheck`, `npm run lint` (only the pre-existing `FormField.tsx` fast-refresh
    warning), `npm run test` (234/234), and `npm run build` all clean. `format:check` clean on
    every file this session touched; still fails only on the same pre-existing untracked files as
    every prior session. RTL grep (`(margin|padding|border)-(left|right)`, bare `left:`/`right:`,
    physical `text-align`, `float:`) across every new/changed stylesheet: zero matches.
  - **Rebuilt and ran the container** (`docker compose build --no-cache` + `up -d
--force-recreate` against the already-running backend stack — `khatm-api`/`khatm-worker`/
    `khatm-postgres`/`khatm-redis` untouched) both before this change (to verify the 2026-08-02
    delivery statically — confirmed `signing-keys/rotate`, `KH-KEY-0422`, and the EN/AR rotate
    copy present in the served bundle) and this restructuring is ready for the same rebuild-and-
    grep confirmation before Majd's walkthrough. No browser-driven walkthrough this session either
    (same standing limitation — no browser-automation tool available); Majd's own EN/AR walkthrough
    remains the merge gate, now exercising `/key-management` instead of the dashboard card.
  - Still on **PR #22** (not a new PR) — the branch was updated with these commits rather than
    opening a second PR, since the underlying deliverable (rotate/retire UI) is unchanged, only
    its location moved before any merge happened.

- 2026-08-02 (chore/C8-key-rotation-ui, spec FS-2.3 C8 brief — delivered): Preamble ran
  `npm run contract:update` against `origin/main` — **zero diff**, the contract was already
  current (KH-2.3a-BE landed in the 2026-07-30 C7c session's incidental vendor of PR #50).
  Confirmed directly in `contracts/openapi.json` before writing code: `GET
/api/v1/admin/signing-keys` (`SigningKeysResponse`/`SigningKeyView`, `state` as a free-text
  string — PENDING/ACTIVE/RETIRING/RETIRED only exist as prose/`STATE_TONE`/`STATE_LABEL_KEY`
  client maps, no server-side enum, same shape as every other status field in this contract);
  `POST /api/v1/admin/signing-keys/rotate` → `RotateKeyResponse{kid,state,validFrom}`; `POST
/api/v1/admin/signing-keys/{kid}/retire` → `RetireKeyRequest{force?}` /
  `RetireKeyResponse{kid,state,validTo}`, with `KH-KEY-0404` (no such key), `KH-KEY-0409` (not
  currently RETIRING), `KH-KEY-0422` (min-retiring-age not reached, `force=true` bypasses).
  Generated `schema.ts` already had all five types current — no `gen:api` re-run needed. Gate
  cleared — proceeded.
  - **Item 1 — signing-keys panel gains rotate + retire.** `SigningKeysPanel.tsx` (previously
    read-only) gained a `PanelCard` header action (Rotate, `danger` variant, disabled with a
    tooltip when no ACTIVE key exists to rotate) and a per-row Retire action on RETIRING keys
    only. New `dashboard/api.ts#rotateSigningKey`/`retireSigningKey` and
    `hooks.ts#useRotateKey`/`useRetireKey` (both invalidate `dashboardKeys.signingKeys()` on
    success) follow the exact shape of every other dashboard mutation.
  - **Rotate — hardened type-to-confirm, substituted for the missing tenant slug.** The brief's
    own instruction: "types the tenant slug to confirm — irreversible-action pattern; verify if
    one exists, else this becomes the precedent." Verified one exists:
    `features/revoke/components/RevokeConfirmDialog.tsx` (retype the credential id). Generalized
    it into a new shared `components/ui/TypeToConfirmDialog.tsx` (+ `.module.css`) — deliberately
    did **not** refactor `RevokeConfirmDialog` onto it in place (out of scope: risks its own
    already-shipped tests for a session that didn't touch revoke at all; noted as available for
    future adoption instead). **Self-stop on the literal instruction**: grepped every reachable
    schema (`MeResponse` most importantly — `displayNameI18n`/`mustChangePassword`/
    `preferredLang`/`scopes`/`username` only) and confirmed **no tenant-slug field exists
    anywhere for the caller's own session** — `LoginRequest.tenantSlug` (C7b) is write-only,
    for logging into a tenant other than the caller's own; nothing reads it back. Judgment call:
    substituted the current **ACTIVE key's own `kid`** as the `expectedText` — a real,
    contract-backed, on-screen identifier of exactly the thing being rotated out, which is
    arguably closer to `RevokeConfirmDialog`'s original intent (retype the specific record you're
    about to affect) than a tenant slug would have been anyway. Recorded as a platform ask below
    if a literal tenant-slug field is still wanted.
  - **Retire — staged for the min-age guard, per the brief's exact shape.** New
    `dashboard/components/RetireKeyDialog.tsx`: stage 1 is a plain confirm; on `KH-KEY-0422`
    (checked via `error.code`, same `isApiError` idiom as C7's `KH-USR-0423` handling) it
    switches to an inline `Banner` (tone `warning`) explanation instead of the generic error
    banner, with a "Force retire anyway" action; forcing opens stage 3, a visually distinct
    dialog (`.severe` — 2px danger-colored border + `color-mix` glow, ⚠ in the title, same
    `color-mix(in oklch, ...)` idiom `Banner`/`RevokePage` already use) requiring an explicit
    second "Yes, force retire" click before retrying the mutation with `force: true`. `KH-KEY-0409`
    /`0404` (shouldn't occur from the UI — Retire only renders on RETIRING rows with a real `kid`)
    fall through to the generic `resolveError` fallback in whichever stage they surface in.
  - **Item 2 — provider column: self-stopped, not built.** Grepped the entire refreshed contract
    case-insensitively for `provider` — zero schema/field matches (only prose in the rotate
    endpoint's description: "generate a new key via the configured KeyProvider"). D5/D6 (Vault
    Transit, `provider_ref`) are KH-2.3b-BE's own scope per the spec's own session split, and
    that session hasn't been run yet. Same "self-stop one sub-item, build the rest" precedent as
    every prior C-series session (C7's on-behalf-of listing, C7c's forced enrollment).
  - **EN/AR + RTL**: every new key added to both `en.json`/`ar.json` in the same commit;
    `i18n/parity.test.ts` (part of `npm run test`) verifies key-set parity — green. RTL grep
    (`(margin|padding|border)-(left|right)`, bare `left:`/`right:`, physical `text-align`,
    `float:`) across every new/changed stylesheet (`SigningKeysPanel.module.css`,
    `RetireKeyDialog.module.css`, `TypeToConfirmDialog.module.css`): zero matches — logical
    properties throughout, same as every prior session.
  - Tests: 231 total now (was 227) — new `SigningKeysPanel.test.tsx` (4 cases): rotate
    type-to-confirm mismatch/match/submit, rotate disabled with no ACTIVE key, retire happy path
    (`force: false`), and the full `KH-KEY-0422` → blocked explanation → force-armed → second
    confirm → `retireSigningKey` called a second time with `force: true` flow. No existing test
    file needed changes — `DashboardPage.test.tsx` uses `vi.spyOn` on individual `api.ts` exports
    rather than a blanket `vi.mock`, so the two new exported functions didn't affect it (it never
    exercises rotate/retire, since its tests never open those dialogs).
  - `npm run typecheck`, `npm run lint` (only the pre-existing `FormField.tsx` fast-refresh
    warning), `npm run test` (231/231), and `npm run build` all clean. `format:check` clean on
    every file this session touched (`prettier --write` needed on 3 files mid-session, all
    re-verified clean after); still fails only on the same pre-existing untracked files as every
    prior session (`.vscode/extensions.json`, `docs/sessions/*.md`,
    `docs/specs/FS-2.3-kms-key-rotation.md` — left untracked again, same standing precedent since
    the 2026-07-30 self-stop session first noted it).
  - **No live walkthrough this session** — no running compose stack available. The DoD's live
    walkthrough (rotate → list shows new ACTIVE + old RETIRING → retire early blocked with clear
    copy, EN/AR) is Majd's own step per the brief and remains the merge gate.
  - **PR #22 opened, not merged** — awaiting Majd's walkthrough.
  - **Platform ask (new)**: if a literal tenant-slug (or tenant display name) field on the
    caller's own session is ever wanted for confirm-typing UX (this session substituted the
    active key's `kid` instead, see above), `MeResponse` would need one added — today it only
    round-trips through `LoginRequest.tenantSlug` for cross-tenant login, never back out.

    omitting the gap, same honesty precedent as C7's earlier "listing isn't available here yet"
    banner. USERS screen (`tenant:admin`) gained a "Reset 2FA" row action
    (`useResetTotp` → `POST /users/{id}/totp/reset`, `ConfirmDialog`, idempotent — safe to offer
    unconditionally with no status to gate on); the on-behalf-of Users tab
    (`TenantDetailPage`, `platform:admin`) gained the same via `useResetTotpInTenant` →
    `POST /admin/tenants/{id}/users/{userId}/totp/reset` — the first on-behalf-of action beyond
    create, since this endpoint (unlike lock/roles/reset-password) does have an on-behalf-of
    contract variant.

  - **Item 5 — EN/AR + RTL**: every new key added to both `en.json`/`ar.json` in the same commit;
    parity script-verified (recursive key-diff both directions, zero mismatches). RTL grep
    (`(margin|padding|border)-(left|right)`, bare `left:`/`right:`, physical `text-align`,
    `float:`) across every new/changed stylesheet: zero matches — logical properties throughout.
    Digit/code fields (`TotpChallengeForm`'s code input, the enrollment confirm-code input) use
    the existing `ltr-embed` utility class already applied to other code-like values (usernames,
    slugs, JWKS URLs) — no dedicated numeric-input RTL precedent existed before this session, so
    this is the recorded choice for any future one.
  - Tests: 227 total now (was 218) — 9 new: `TotpChallengeForm.test.tsx` (3: code submit, recovery
    toggle + submit, back button), `LoginForm.test.tsx` gained 1 (`onTotpRequired` called on a
    `totpRequired` response), `TotpEnrollDialog.test.tsx` (2: full generate→confirm→recovery-codes
    walkthrough, print-after-reveal), `SecuritySettingsPage.test.tsx` (1: opens the enroll dialog),
    `UsersPage.test.tsx` gained 1 (reset-2FA confirm → `resetTotp` called), `TenantDetailPage.test.tsx`
    gained 1 (on-behalf-of reset-2FA confirm → `resetTotpInTenant` called with positional args) and
    had its existing on-behalf-of-listing test's assertions updated (the tab now has an actions
    column with exactly the Reset 2FA button, not zero actions — a legitimate behavior change, not
    a regression). Every other `AuthContextValue`-mocking test file (13 of them) needed a
    mechanical `completeTotpLogin: async () => undefined,` added to satisfy the interface's new
    required field — no behavior change in any of them.
  - `npm run typecheck`, `npm run lint` (only the pre-existing `FormField.tsx` fast-refresh
    warning), `npm run test` (227/227), and `npm run build` all clean. `format:check` clean on
    every file this session touched (`prettier --write` needed on 5 files mid-session, all
    re-verified clean after); still fails only on pre-existing untracked files (`.vscode/
extensions.json`, `docs/sessions/*.md` including this session's own two brief-as-a-file records,
    `docs/specs/FS-2.3-kms-key-rotation.md`).
  - **Live check, without an authenticated walkthrough this time**: rebuilt and recreated the
    `khatm-console` container against the running compose stack (`khatm-api`/`khatm-worker`
    up ~33 minutes, consistent with "platform main post-merge"). Diffed the live `/v3/api-docs`
    (fetched from inside the `khatm-console` container, over the `khatm-net` network) against the

## Environment facts

- **`staging-khatm-console` — ad hoc local container for testing against Majd's deployed
  staging backend, set up 2026-08-05, revised 2026-08-06.** Runs at `http://localhost:3001`
  (alongside the normal `khatm-console` container on `:3000`, which still points at the local
  docker-compose backend — both run simultaneously, side by side). Points at `khatm-api` deployed
  on Bunny containers, currently `https://mc-qzln0zm7z7.b-cdn.net` (superseded an earlier
  `https://mc-we1w25akdr.b-cdn.net` used briefly on 2026-08-05). **Not reproducible from the git
  repo alone** — deliberately kept out of any tracked file (`src/api/client.ts` is
  same-origin-only by design, no client-side API-base env var exists for its own calls, so
  pointing it at staging has to happen via nginx's `proxy_pass`, and doing that via a hand-edited
  _checked-in_ `nginx.conf`/`Dockerfile` risked an accidental staging-pointed commit).
  - **2026-08-06 revision — now a real fresh build from repo source, not layered on the local
    image.** The original 2026-08-05 version reused `khatm-console-khatm-console:latest`'s
    already-built `dist/` via `COPY --from=`, swapping only the nginx config. That missed
    `VITE_QR_API_BASE` (Majd caught it): the single-issue screen's wallet QR encodes a platform
    base URL (`qrPayload.ts`'s `getQrApiBase()`) that a wallet POSTs the claim code to on
    redemption — Vite inlines this **at `npm run build` time**, so it can't be fixed by swapping
    nginx config after the fact; the JS has to be rebuilt. New build: `docker build -f
<scratchpad>/staging/Dockerfile --build-context staging-conf=<scratchpad>/staging
--build-arg VITE_QR_API_BASE=https://mc-qzln0zm7z7.b-cdn.net -t khatm-console-staging .` from
    the repo root as context — a full `npm ci && npm run build` inside the image (mirrors the
    real `Dockerfile`'s build stage plus the `ARG`/`ENV` for the QR base), with the staging
    `nginx.conf` pulled in via a named buildx build-context (`staging-conf`) rather than needing
    the file to sit inside the repo's own build context. Verified both halves post-rebuild: the
    API proxy still works (`KH-RBC-0401` envelope through `/api/...`), and the literal string
    `https://mc-qzln0zm7z7.b-cdn.net` is now present in the built JS (`docker exec ... grep`).
    Everything (Dockerfile, nginx.conf) still lives only in the session scratchpad dir.
  - **Raised, not yet acted on**: Majd asked why the console has to be told this at all rather
    than reading it from the backend. Checked — the vendored contract has no field anywhere for
    "the platform's own public base URL" (`baseUrl`/`apiBase`/`publicUrl`, zero hits in
    `contracts/openapi.json`). Recorded as a platform-ask candidate in "Open decisions" below
    rather than implemented — would need a new contract surface (e.g. a `/config` or
    `/.well-known` endpoint) on the platform side first.
  - The nginx config (unchanged from 2026-08-05) forwards `/api/`, `/.well-known/`, `/t/` to the
    staging URL with `proxy_ssl_server_name on` and an explicit
    `proxy_set_header Host <the staging hostname>` (**not** `$host` — Bunny's CDN edge routes by
    the `Host` header, so passing through the browser's own request Host, as the local-backend
    config does, would leave the CDN unable to route to the right origin).
  - To rebuild after a console code change, a new staging URL, or a QR-base change: re-run the
    `docker build --build-context ... --build-arg VITE_QR_API_BASE=...` command above (the exact
    invocation is in this session's transcript, not scripted anywhere yet — worth a small script
    if this becomes a recurring need rather than an occasional check), then `docker rm -f
staging-khatm-console && docker run -d --name staging-khatm-console -p 3001:80
khatm-console-staging`.
- **Both `khatm-console` (this repo) and `khatm-platform` are public as of 2026-08-04** (were
  private before). CI (GitHub Actions) confirmed green on `khatm-console` `main` post-change —
  no billing/permission issue like the 2026-07-30 PR #21 CI failure (that one was a GitHub
  Actions billing/spending-limit issue on the then-private repo, job never started; unrelated to
  going public, but worth noting the symptom looked similar). `scripts/update-contract.mjs`'s
  public `raw.githubusercontent.com` fetch now succeeds directly (verified: 200) — the `gh api`
  fallback that every prior session's `contract:update` run actually used (public URL 404'd on
  the private repo) should no longer be needed going forward, though the fallback code itself is
  harmless to leave in place. Branch protection added the same day on `khatm-console` `main`:
  `allow_force_pushes: false`, `allow_deletions: false`, no required status checks, no required
  PR reviews, `enforce_admins: false` — direct pushes to `main` are still allowed (matches this
  project's existing pattern of pushing STATE.md-only updates directly rather than through a PR),
  only force-push and branch deletion are blocked. `khatm-platform`'s own branch protection (if
  any) wasn't touched — out of scope for a console-repo session.
- Dev: web on :5173, Vite proxies `/api`, `/.well-known`, and `/t` (per-tenant public
  endpoints, added C5) to `localhost:8080`.
- Container: nginx on :3000→80, proxies `/api`, `/.well-known`, and `/t` to
  `http://khatm-api:8080` over the external `khatm-net` network.
- **Probing session-cookie-authenticated mutating endpoints directly via `curl` needs the CSRF
  header, not just the session cookie** (discovered C5, cost real time before found): the
  platform's Spring Security CSRF protection 403s any non-`GET` request that carries the
  `KHATM_SESSION` cookie without also echoing the `XSRF-TOKEN` cookie's value back as an
  `X-XSRF-TOKEN` header — the browser's own fetch/XHR does this automatically via
  `withCredentials`-aware CSRF handling, so it's invisible when testing through the actual UI,
  but a bare `curl -b cookies.txt -X POST ...` gets a misleading `KH-RBC-0403` "forbidden" that
  looks like a scope problem and isn't one. Pattern: `curl -c jar -X POST .../auth/login ...`
  then `XSRF=$(grep XSRF-TOKEN jar | awk '{print $7}')` then pass `-H "X-XSRF-TOKEN: $XSRF"` on
  every subsequent non-GET call using that same jar.
- `khatm-platform` is a **private** repo — `npm run contract:update` falls back to `gh api`
  (works with the caller's own `gh` credentials). The contract, not platform source, is now
  sufficient for Issue request construction.
- Design tokens (`src/styles/tokens.css`): stakeholder verdigris-green system, light/dark via
  `data-theme`. Applied 2026-07-24; the old neutral POC palette is gone.
- No browser-automation tool is available in this environment unless a future session gains one.
  For C1/C1b/C2/C2b/C3/C4, automated checks cover type/lint/format/unit tests; a real manual
  visual/RTL pass should still happen before merge — for C3+C4 specifically, Majd's walkthrough
  (PR body) is the actual gate, not just a nicety.
- **jsdom's `File` implements neither `Blob#text()` nor `#arrayBuffer()`** (Node 24, jsdom 25.0.1,
  this toolchain) — a real browser supports both fine, but any vitest+jsdom test around a
  `File`/`Blob` upload will throw `file.text is not a function`. Read via `FileReader.readAsText`
  instead (see `bulkIssuance/csv.ts`'s `readFileText`), which jsdom does implement correctly.
  Worth remembering before the next file-upload feature.
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

- **Platform ask, new 2026-08-12 (live Docker Desktop walkthrough of feat/KH-2.4.1-attested-issuance)
  — OPEN.** `SchemaAuthoringService#createVersion` computes the new version as `source.version + 1`
  unconditionally rather than the next free version number for that `code` — a second "new version"
  created from the same still-`PUBLISHED` source (after the first new version was archived) collides
  with the existing row on `credential_schema_tenant_id_code_version_key`, surfacing as a raw
  `KH-SYS-0500` instead of a clean conflict code. See "Last completed" 2026-08-12 for the full
  reproduction (`ba_certificate_v1`, local dev DB). No console-side workaround exists — the fix
  belongs in `createVersion`'s version-number computation.
- **Platform ask, new 2026-08-11 (feat/KH-2.4.1-attested-issuance preamble) — OPEN.**
  `KH-ATT-0400`/`0401`/`0402` (attestation deny-by-default, bulk-attested rejection) are absent
  from the vendored `openapi.json` even though they're fully implemented server-side — the
  affected endpoints have no springdoc `@ApiResponse` annotations for these paths. Worked around by
  reading `khatm-platform`'s `ErrorCode.java`/`CredentialService`/`BulkIssuanceService` directly
  rather than self-stopping (the session brief itself predicted this exact gap and called it a
  vendoring problem, not a missing feature). Fix would be adding the annotations so a future
  contract refresh surfaces these codes the way most others already do. See "Last completed"
  2026-08-11 for the full delivery this was built against.
- **Platform ask, new 2026-08-06 (staging container QR-base fix) — OPEN, no contract surface
  requested yet, just recorded.** The console has to be told its own publicly-reachable base URL
  by hand (`VITE_QR_API_BASE`, baked in at build time) because the platform contract exposes no
  way to ask `khatm-api` "what's your own public base URL" — confirmed by grepping
  `contracts/openapi.json` for `baseUrl`/`apiBase`/`publicUrl` (zero hits). This is arguably not
  fully fixable server-side either — a `khatm-api` instance behind a CDN (Bunny, in the current
  staging deploy) has no reliable way to introspect which public hostname/pull-zone external
  devices should use, that's deployment topology known only to whoever configured the CDN. A
  `/config` or `/.well-known` endpoint where ops sets this explicitly (rather than the console
  needing a per-deploy env var) would still remove a manual step and a class of "QR silently
  points at an unreachable host" bugs. Not actioned — just flagged per this repo's own rule that
  a platform gap gets recorded here, not routed around client-side. See "Environment facts" →
  `staging-khatm-console` for the concrete case that surfaced this.
- **Platform ask, new 2026-08-04 (chore/C8b-provider-column preamble self-stop) — CLOSED the
  same day.** `khatm-platform` PR #51 merged `2026-08-04T07:19:39Z` (Majd confirmed live), adding
  `provider` to `SigningKeyView`/`RotateKeyResponse` and a new optional `provider` on
  `RotateKeyRequest`. Session resumed and delivered — see "Last completed" 2026-08-04 (the
  "resumed and delivered" entry) for the full record.
- **Standing, since 2026-08-04 (chore/C8b-provider-column delivery) — not a platform ask, a
  console-session tooling gap, still open for future sessions.** The local `admin` account now
  has TOTP 2FA enrolled, so the curl-based live-verification fallback used successfully by
  C5/C6/C7 (before 2FA existed) no longer works without an authenticator code, and no
  browser-automation tool is available either. For this specific PR the Vault-provider scenario
  and RTL screenshot went unverified by the session itself — PR #23 merged anyway 2026-08-04 on
  Majd's own instruction, not on this session's confirmation of those DoD items (see "Last
  completed" 2026-08-04 for exactly what was and wasn't checked). Flagging this as **standing**
  because it will recur on every future session that needs a live authenticated walkthrough: no
  headless path exists now that 2FA is on.
- **Platform ask, new 2026-07-30 (feat/C7c-totp-2fa preamble self-stop) — CLOSED the same day**,
  fixed by `khatm-platform` PRs #49 (KH-2.2c-BE) and #50 (KH-2.3a-BE, unrelated KMS rotation).
  All five surfaces confirmed live: `POST /auth/login`'s `LoginChallengeResponse`, `POST
/auth/totp`, `POST /users/me/totp/enroll`, `POST /users/me/totp/confirm`, `POST
/users/{id}/totp/reset`, `POST /admin/tenants/{id}/users/{userId}/totp/reset`. See "Last
  completed" 2026-07-30 (the "resumed and delivered" entry) for what was built against it.
- **Platform ask, new 2026-07-30 (feat/C7c-totp-2fa delivery) — OPEN.** Two related gaps, both
  traced to the same root cause: the platform enforces TOTP as fully opt-in/self-service (spec
  FS-2.2 V1's underlying mechanism) but exposes no signal for the _mandatory-for-certain-scopes_
  half of that same spec item. Needed: (1) a distinct error code (or a `MeResponse` boolean,
  mirroring `mustChangePassword`) for "this session's scopes require TOTP and it isn't enrolled
  yet," so the console can build the forced-enrollment takeover screen the brief called for —
  right now nothing distinguishes a `revoke`/`tenant:admin`/`platform:admin` holder who must
  enroll from one who's exempt; (2) any way at all to read the caller's own or another user's
  current TOTP-active status (e.g. `MeResponse.totpEnabled`, or a field on `UserSummary`) — right
  now Security Settings can only ever offer "enroll / re-enroll" with no status shown, and the
  Users screen's "Reset 2FA" is offered unconditionally rather than only where it'd do something
  (harmless today only because `resetTotp` is documented idempotent — a no-op if nothing to
  reset). See "Last completed" 2026-07-30 for the full delivery record and self-stop reasoning.
- **Platform ask from 2026-07-28 morning (C7 preamble self-stop) — closed the same day.** The
  missing forced-password-change signal was fixed by khatm-platform PR #46 (`MeResponse.
mustChangePassword` + `GET /auth/me` exempted from the gate) and confirmed live before C7 was
  resumed and delivered — see "Last completed" 2026-07-28 (the later, "resumed and delivered"
  entry). PR #46 itself is still not merged to `khatm-platform` `main` as of this writing; the
  contract was vendored from the live local container instead (precedent: 2026-07-25 Dashboard).
- **Platform ask, new 2026-07-28 (C7 delivery — login/tenant resolution) — CLOSED 2026-07-30
  (chore/C7b), fixed by khatm-platform's KH-2.2d-BE.** `POST /api/v1/auth/login` now accepts an
  optional `tenantSlug` (`LoginRequest.tenantSlug`); omitting it preserves the exact prior
  default-tenant behavior. Console-side: `LoginForm` gained an optional "Organization" field that
  maps to it, omitted from the request entirely when left blank. Live-verified end-to-end
  2026-07-30: onboarded a fresh tenant with an `initialAdmin`, logged in as that user with its
  `tenantSlug` and one-time temporary password (200, `TENANT_ADMIN`-scoped session, no
  `platform:admin`), and confirmed the session actually lands in that tenant's own context
  (`GET /api/v1/schemas` returned `[]`, the new tenant's own empty list, not the default tenant's
  3). Also confirmed the anti-enumeration requirement live: a login with an unknown `tenantSlug`
  and one with a wrong password on the real default tenant return byte-identical `KH-RBC-0401`
  bodies — the console adds no special-case copy for either. See "Last completed" 2026-07-30.
- **Platform ask, new 2026-07-28 (C7 delivery — on-behalf-of Users tab is create-only) — CLOSED
  2026-07-30 (chore/C7b), fixed by khatm-platform's KH-2.2d-BE.** `GET
/api/v1/admin/tenants/{id}/users` (`listUsersInTenant`) now exists — confirmed in the
  `origin/main`-refreshed contract, not a pre-merge vendor. `TenantDetailPage`'s Users tab now
  lists the tenant's users (reusing `UserList` in its new read-only mode — row actions still stay
  out of scope, since lock/roles/reset have no on-behalf-of contract variant). Live-verified
  2026-07-30: a `PLATFORM_ADMIN` session listing a freshly-onboarded tenant's users via this
  endpoint correctly returned exactly the one `TENANT_ADMIN` user created there. See "Last
  completed" 2026-07-30.
- **Noted, not fixed (C7 delivery):** every existing `ConfirmDialog`-driven page in this
  codebase (`ConsumingPartiesPage`, `TenantDetailPage`'s suspend/activate,
  `SchemaManagementPage`'s publish/archive) awaits `mutationFn.mutateAsync(...)` inside its
  `onConfirm*` handler with no `try/catch` — harmless when the mutation succeeds, but
  `mutateAsync` re-throws by design, and nothing awaits/catches the fire-and-forget `onClick`
  handler, so a _rejecting_ mutation there would surface as an unhandled promise rejection (this
  fails `npm run test`'s exit code — discovered when this session's own `UsersPage` KH-USR-0423
  test became the first test in this codebase to actually mock a `ConfirmDialog` mutation as
  rejecting). Fixed in the new `UsersPage.tsx` this session (each handler now wraps its
  `mutateAsync` call in `try { … } catch { /* surfaced via isError */ }`); the existing pages
  listed above likely have the identical latent issue but were out of scope to retrofit here —
  worth a small follow-up sweep.
- Two operation descriptions in the refreshed contract still read "Requires the admin scope"
  verbatim (`allowSchema` — `POST /api/v1/admin/consuming-parties/{id}/allowed-schemas` — and
  `GET /api/v1/admin/tenants`) even though their own `403` responses correctly cite the new
  granular scopes (`consumer:manage`/`platform:admin`) — stale docstrings from the platform's
  D2 re-gating pass, noted 2026-07-28 morning, still present, low-priority doc cleanup only.
- **Platform ask from 2026-07-27 — fully closed 2026-07-28 (C6b chore).** Spec FS-1.6
  (Consumption Lifecycle Visibility) landed and khatm-platform's KH-1.6-BE (PR #39) delivered
  exactly what was asked: `status`/`usesConsumed` on `CredentialSummary`/`CredentialView`, and a
  public `POST /api/v1/credentials/holder-status`. See "Last completed" 2026-07-28 for the C6
  delivery built against it. The residual (PR #39 was still open at C6-delivery time) is now also
  closed: PR #39 merged to `khatm-platform` `main` 2026-07-28T07:47:46Z, and the C6b chore's
  `npm run contract:update` + a recursive-key-sorted diff against what C6 had already vendored
  confirmed **zero semantic drift** (only the `servers` block differed, same as the 2026-07-26
  Dashboard contract-sanity precedent).
- **Platform ask, logged 2026-07-28 (C6b status-filter chore, self-stopped) — ADDRESSED ON THE
  PLATFORM SIDE, not yet in a console-consumable contract:** `khatm-platform` session
  `chore/credential-search-status-filter` added the server-side `status` query param this ask
  named — **PR #41 opened on `khatm-platform`, NOT YET MERGED.** Do not run `npm run
contract:update` against this until #41 merges (it is still on a feature branch, not `main`).
  Once merged: re-run the preamble contract refresh, confirm `status` (repeatable,
  `ACTIVE|EXHAUSTED|REVOKED|SUSPENDED|EXPIRED`, OR-combined) appears on `GET
/api/v1/credentials`'s `parameters`, and the status-filter dropdown (item 5 under "Next up") is
  unblocked.
- **`npm run check`'s `format:check` step fails on an untracked `.vscode/extensions.json`** —
  noticed 2026-07-23 during the qr-api-base-guard chore, pre-existing (not introduced by that
  branch or any tracked commit; present in the working tree, never staged). `typecheck`/`lint`/
  `test` all pass individually and were used to gate that session instead. Worth either adding
  the file to `.gitignore` (if it's meant to stay a local-only editor preference) or committing
  it pre-formatted (if it's meant to be shared) — whichever the repo owner intends.
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
- `khatm-platform`'s CI publishing step for `docs/api/openapi.json` (KH-1.6) should eventually
  make the raw URL work without the `gh` fallback — worth revisiting once that lands.
- Dev-only `esbuild`/vitest-toolchain `npm audit` advisory (moderate, dev-server request forgery)
  — inherent to the current vitest 3.x → vite 6 chain, not a runtime/prod risk. No fix available
  without an unreleased vitest bump; revisit on next dependency update.
- **Scope-gating placement is inconsistent across the codebase — noted, not fixed.**
  `schemaManagement`, `consumingParties`, and now `bulkIssuance` self-gate with `RequireScope`
  inside the page component itself (so the page's own test file can exercise scope gating
  directly, per `SchemaManagementPage.test.tsx`'s pattern); `issuance`'s `IssuePage` instead
  relies on an external `<RequireScope>` wrapper written at the `App.tsx` route level, with no
  scope-gating test of its own. `BulkIssuePage` followed the more common (self-gating) pattern
  specifically so the brief's required "scope gating (`/issue/bulk` needs `issue`)" test could
  exist. Both patterns work correctly today; unifying them is a small, low-risk cleanup worth
  doing in a future session but out of scope for this one.
- **CSV bulk-upload chunking (>200 rows) — deferred by explicit judgment call, per the brief's
  own fallback language.** Files over the server's 200-row cap (`KH-CRD-0400`) are rejected
  client-side with a clear bilingual message rather than chunked into sequential batches;
  chunking would need sequential submission, a partial-failure-across-chunks UX, and a different
  report-alignment model than the current single-batch one, none of which seemed "trivial to do
  cleanly" within this session. Revisit if a pilot tenant actually needs single-file uploads over
  200 rows.

## 7. Known gaps / rough edges (as of 2026-07-30)

Carried over from `docs/rbac-roles-and-hierarchy.md` §7 — surfaced during Majd's C7 (spec
FS-2.2 D7) manual walkthrough and confirmed live against the running stack (DB rows + platform
source), not console bugs:

1. ~~**No cross-tenant user listing.**~~ **RESOLVED 2026-07-30 (chore/C7b).**
   `GET /admin/tenants/{id}/users` now exists (KH-2.2d-BE); the on-behalf-of Users tab lists a
   tenant's users read-only. See "Last completed" 2026-07-30.
2. ~~**Logging in as a newly-onboarded tenant's own user doesn't work yet.**~~ **RESOLVED
   2026-07-30 (chore/C7b).** `POST /api/v1/auth/login` now accepts an optional `tenantSlug`
   (KH-2.2d-BE); the login form's new "Organization" field maps to it. See "Last completed"
   2026-07-30.
3. **Custom/ad-hoc roles don't exist.** The three-role catalog (`ISSUER_OPERATOR`,
   `TENANT_ADMIN`, `PLATFORM_ADMIN`) is fixed; a tenant can't define its own role with a custom
   scope combination (planned for a later phase per spec FS-2.2).
4. ~~**The signing-key panel shows lifecycle status only.**~~ **RESOLVED 2026-08-02
   (chore/C8-key-rotation-ui).** Rotate (hardened type-to-confirm) and per-key Retire (staged for
   the min-retiring-age guard) are now live, `key:manage`-gated — moved 2026-08-03 to their own
   `/key-management` page (nav item, `RequireScope`-gated) rather than living in the dashboard
   card; the dashboard panel is back to a read-only glance with a "Manage keys →" link out. Still
   no provider column — no `provider` field exists in the contract until KH-2.3b-BE (Vault
   Transit) lands. See "Last completed" 2026-08-02/2026-08-03.
5. **The tenant-scoped `/users` list is identical for every `tenant:admin`-holding user of the
   same tenant, including `PLATFORM_ADMIN`.** Not a privilege leak: the list is tenant-scoped,
   not role-scoped, and `PLATFORM_ADMIN`'s own session lives in the platform's default tenant —
   so it only looks like cross-tenant visibility when every test account happens to sit in that
   same default tenant, which the current seed/demo data does. A `TENANT_ADMIN` created in a
   genuinely different tenant sees only that tenant's own users.
6. **The last-active-admin guard (`KH-USR-0423`) counts by scope, not role code.** It blocks a
   disable/lock/role-change only when it would drop a tenant's active `tenant:admin`-holding
   user count to zero — `PLATFORM_ADMIN` counts toward that total (it grants `tenant:admin`
   too), so the guard also protects the last platform admin, not just a `TENANT_ADMIN`-role
   user specifically. Confirmed live: with three admins present in the default tenant, disabling
   one succeeded (two remained); reducing to the last one correctly 409s.
7. **No TOTP-mandatory-enrollment signal, and no TOTP-status signal at all (added 2026-07-30,
   C7c).** The platform enforces TOTP as opt-in/self-service only (spec FS-2.2 V1's mechanism
   half) — there is no error code or `MeResponse` field for "your scopes require TOTP, enroll
   now," so the console has no forced-enrollment takeover screen (unlike the analogous
   `mustChangePassword` gate), and no field anywhere exposes whether a given account currently
   has TOTP active, so Security Settings shows an always-available enroll/re-enroll action with
   no status badge, and the Users/on-behalf-of "Reset 2FA" actions are offered unconditionally
   (safe only because `resetTotp` is documented idempotent). See "Open decisions" above.

See `docs/rbac-roles-and-hierarchy.md` for the full roles/scopes reference this section
summarizes, including the nav-visibility matrix and the tenant-vs-user model.

## Next up (post-V1, ordered per Majd)

1. API-key revocation UI (KH-2.2-era — the platform endpoint already exists,
   `POST /api/v1/admin/api-keys/{id}/revoke`).
2. Visual identity — **DONE**. Remainder: migrate the last ~12 duplicated button blocks onto
   `Button` and adopt `.khatm-input` across remaining forms; revisit whether a real charting
   library belongs in the dashboard.
3. Unify the scope-gating placement convention (self-gating vs. App.tsx-level wrapping — see
   "Open decisions" above) across every gated page. Also sweep the `ConfirmDialog`-driven pages
   noted in C7's "Open decisions" entry for the same unguarded-`mutateAsync` unhandled-rejection
   shape fixed in the new `UsersPage.tsx`.
4. Credentials search status-filter dropdown — the platform ask logged 2026-07-28 (C6b) is
   addressed on `khatm-platform`'s side via PR #41 (`chore/credential-search-status-filter`),
   but that PR is **not yet merged** — still blocked until it lands on `khatm-platform` `main`
   and this repo's `npm run contract:update` picks it up. See "Open decisions" above.

Closed: item #3 (was #3, platform follow-ups from C7 — login/tenant-resolution and the
`GET /admin/tenants/{id}/users` counterpart), both fixed by khatm-platform's KH-2.2d-BE and
delivered console-side 2026-07-30 (chore/C7b); see "Last completed" and "Open decisions" 2026-07-30.
Closed: item #3 (was #3, Majd's EN/AR/RTL walkthrough of C7), delivered 2026-07-29 — walkthrough
raised RBAC clarification questions (answered live, no bugs; see "Last completed" 2026-07-29 and
§7 above), one copy fix applied, PR #19 merged to `main` (squash, branch deleted). Closed: item
#3 (was #3, KH-2.2-era RBAC), C7 users & scope-gating (spec FS-2.2 D7) delivered 2026-07-28 after
resuming from the same day's preamble self-stop. Closed: item #5 (was #6), contract zero-diff
sanity check for KH-1.6-BE — PR #39 merged 2026-07-28, C6b's re-run confirmed zero semantic
drift; see "Last completed" and "Open decisions". Closed: item #5 (previously), Majd's C5
Tenants EN/AR/RTL walkthrough — done, PR #15 merged 2026-07-27 (STATE's stale "PR open" line was
corrected by the C6b hygiene pass). Closed: item #6 (was #5), C6 credential lifecycle Majd
walkthrough — approved and merged as PR #16 2026-07-28; see "Last completed". Closed: Dashboard
v2's four data-less panels — all wired to real khatm-platform data (KH-1.1.5-BE) 2026-07-25; see
"Last completed". Closed: the full EN/AR + RTL click-through across every screen — Majd confirmed
the Arabic layout and messages read correctly across the rebuilt container before merging PR #6.
Closed: item #5, contract refresh sanity check — re-ran 2026-07-26, zero semantic drift found;
see "Last completed".
