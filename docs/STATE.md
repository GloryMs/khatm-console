# STATE — khatm-console

> Updated at the end of EVERY Claude Code session.

## Current phase / task

- Dashboard live-data wiring — **DONE. PR #12** merged 2026-07-25, Majd-verified (EN/AR + RTL).
- App shell sidebar redesign + toggle/button polish — **DONE. PR #13** merged 2026-07-25.
- Post-V1 bugfix — LAN-IP secure-context crashes (consume-sim idempotency key, copy buttons) —
  DONE. PR #8 merged 2026-07-24.
- Post-V1 chore — no silent QR api-base fallback — DONE. PR #7 merged 2026-07-23; Majd's
  manual EN/AR + RTL walkthrough of that specific banner was never explicitly logged as run.

## Last completed

- 2026-07-26 (Next-up #5, contract refresh sanity check): re-ran `npm run contract:update`
  (normal `gh api` fallback path, the public raw URL still 404s on this private repo) now that
  khatm-platform's KH-1.1.5-BE branch has merged to `main`, then `npm run gen:api`. Compared the
  freshly pulled `contracts/openapi.json` against the one pulled directly from the live local
  backend during the 2026-07-25 dashboard session by normalizing both (recursive key-sort) and
  diffing: **zero semantic differences** in any path, schema, or field — the only diff line was
  the `servers` block (`http://localhost:8080`) present in the locally-generated contract and
  absent from the published one. Confirms the two contracts describe the identical API surface;
  nothing to reconcile. `src/api/generated/schema.ts` regenerated (textually reshuffled by
  `openapi-typescript` due to upstream key-order changes, semantically identical — same
  operations, same types). Verified: `typecheck` clean, `lint` clean (only the pre-existing
  `FormField.tsx` fast-refresh warning), all 184 tests pass, `npm run build` clean.
  `format:check` still fails only on the pre-existing untracked `.vscode/extensions.json` (see
  "Open decisions", unrelated to this branch). Closes Next-up item #5.

- 2026-07-25 (Dashboard wired to real backend data): khatm-platform's KH-1.1.5-BE shipped the 5
  endpoints `docs/specs/dashboard-v2-backend-needs.md` asked for
  (`/api/v1/stats/daily`, `/api/v1/activity`, `/api/v1/attention`,
  `/api/v1/admin/signing-keys`, `/api/v1/stats/consuming-parties`). Pulled the OpenAPI contract
  from the live local `khatm-api` (its GitHub branch isn't merged yet) and wired all four
  previously-placeholder panels to real data: lifecycle chart (real daily bars),
  recent-activity table (real events + working tabs), needs-attention (real
  `SCHEMA_DENIED` items with a safe generic fallback for any other `type`), top consuming
  parties (real call volume + success rate). Signing-keys panel upgraded from public JWKS to
  the richer admin endpoint (real `state`/`validFrom`/`validTo`, admin-scope-gated with a
  fallback message for non-admin operators). KPI cards gained a real period-over-period delta
  and sparkline, both derived from the new daily endpoint (`dailyStats.ts`) — previously
  omitted for lack of data. No panel shows fabricated numbers anywhere on the page anymore.
  184 tests total (was 170); `npm run check` and `npm run build` clean; RTL grep clean;
  container rebuilt and reachable. Not yet committed/PR'd as of this entry.

- 2026-07-25 (design system v2 — component library + screen restyle, PR #10): built the shared
  CSS-Module primitives (`DataTable`, `FormField`, `SecretReveal`, `EmptyState`, `Banner`,
  `Toast`) and restyled Issuance (single) + Credentials search/Verify/Revoke onto them. A
  same-day follow-up fixed an undefined `--space-5` token that was silently zeroing every
  Button's padding, plus two buttons stretching to fill their container. Merged into `main`.

- 2026-07-24 (design system v1 — visual identity): applied the stakeholder verdigris-green
  token system (light/dark themes via `data-theme`) and the original shared Button/StatusBadge/
  Table primitives across the console. Merged into `main`.

- 2026-07-24 (PR #8, bugfix): Majd reported live — `ConsumeSimPage` (`/consume-sim`) rendered
  "Something went wrong" (the `ErrorBoundary` fallback) when opened via a LAN IP over plain HTTP
  (`http://10.222.39.176:3000/...`), but worked fine via `http://localhost:3000/...`. Root cause:
  `crypto.randomUUID()` requires a secure context (HTTPS, or the special-cased
  `localhost`/`127.0.0.1`) and is `undefined` otherwise; the page called it directly while
  building the form's default `idempotencyKey`, so it threw during render on a bare-HTTP LAN
  origin. Fixed with `generateIdempotencyKey()` (new `consumeSim/idempotencyKey.ts`), which uses
  `crypto.randomUUID()` when available and otherwise falls back to a manual UUIDv4 built from
  `crypto.getRandomValues()` (no secure-context restriction). Both call sites in
  `ConsumeSimPage.tsx` (initial default value, "regenerate" button) switched to it.
  Same session, same root-cause family: Majd then reported the copy button on a freshly minted
  consuming-party API key (`/consumers`) silently did nothing under the same
  localhost-vs-LAN-IP split. `navigator.clipboard` has the identical secure-context restriction;
  unlike the render-time crash above, the resulting throw happens inside an `onClick` handler,
  which React error boundaries don't catch — so the button just failed silently instead of
  showing any error UI. Three call sites had the same direct
  `navigator.clipboard.writeText(...)`: `MintedKeyModal` (`/consumers`), `ReportStep`
  (bulk-issuance report), and `IssuePage`'s success-view `CopyButton` (single issue). Fixed with a
  shared `copyToClipboard()` (new `components/ui/clipboard.ts`) that uses
  `navigator.clipboard.writeText` when available and otherwise falls back to the legacy
  `document.execCommand('copy')` path (hidden textarea), which carries no secure-context
  restriction; all three sites now call it instead of touching `navigator.clipboard` directly.
  Tests: `idempotencyKey.test.ts` (3 tests: secure-context path, insecure-context fallback,
  distinct-keys-on-repeat) and `clipboard.test.ts` (4 tests: secure-context path, fallback when
  `navigator.clipboard` is absent, fallback when `writeText` rejects, fallback-also-unsupported
  case — jsdom doesn't implement `execCommand` at all, so it's stubbed via
  `Object.defineProperty` rather than `vi.spyOn`). 154 tests total now (was 147) — 8 new, plus
  existing `ConsumeSimPage`/`IssuePage`/`MintedKeyModal`/`ReportStep` suites unchanged and still
  green. `npm run typecheck`, `npm run lint`, and `npm run test` all clean; `format:check` clean
  on tracked `src/` files (the pre-existing untracked-`.vscode/extensions.json` warning noted
  under "Open decisions" is unrelated and still present). Rebuilt the `khatm-console` Docker image
  twice this session (once per bug) via `docker compose build khatm-console` +
  `docker compose up -d --force-recreate khatm-console` against the already-running
  `khatm-api`/`khatm-worker`/`khatm-postgres`/`khatm-redis` stack on `khatm-net`; confirmed `HTTP
200` on both `http://localhost:3000/...` and `http://10.222.39.176:3000/...` after each rebuild,
  and grepped the built bundle for the new fallback guards
  (`typeof crypto.randomUUID === 'function'`, `execCommand`) as a static sanity check since no
  browser-automation tool was available in-session to exercise the JS at runtime directly. Majd
  then manually verified both fixes in an actual browser via the LAN IP and confirmed both bugs
  resolved. PR #8 opened, CI green, squash-merged with `--delete-branch`.

- 2026-07-23 (follow-up, PR #7): CI's `format:check` caught a prettier break in the `docs/STATE.md`
  edit from the same session — an inline code span (`` `api: "http://localhost:8080"` ``) had been
  hand-wrapped across a line break with leading indentation, which prettier normalizes but which
  didn't match on first write. Fixed with a follow-up commit (content unchanged, reflow only), CI
  went green, then PR #7 squash-merged into `main` (`--delete-branch`). Rebuilt the `khatm-console`
  container (`docker compose up -d --build`, the prior container was stale from before this
  session) against the already-running `khatm-api`/`khatm-worker`/`khatm-postgres`/`khatm-redis`
  stack on `khatm-net`; confirmed serving `HTTP 200` with the correct `<title>` at
  `http://localhost:3000/`. Majd's manual EN/AR + RTL + navigation walkthrough of the new
  localhost-warning banner against the rebuilt container is the next step, not yet done as of this
  entry.

- 2026-07-23: chore session, `getQrApiBase()` silent-localhost-fallback bug (confirmed live on a
  phone: a QR minted while browsing the console via `localhost` embeds
  `api: "http://localhost:8080"`, meaningless to a scanning phone). **Verified first, per the
  session brief — the guard already existed** from C1b: `isLocalhostOrigin()` (`qrPayload.ts`) plus a
  `t('issue.qrLocalhostHint')` paragraph in `IssuePage`'s success view already correctly
  distinguished the three cases (env set → hidden; env unset + localhost origin → shown; env
  unset + real host → hidden, since a deployed same-origin fallback is legitimate) — no logic
  change needed. What was genuinely weak: the warning rendered as a small colored line of text,
  easy to miss, not the "prominent" banner a phone-scanning operator actually needs to notice.
  Delivered:
  - Restyled `IssuePage.module.css`'s `.warning` into a bordered/background banner (reusing
    `ApiErrorBanner`'s danger-box visual language via `color-mix` against `--color-danger`) and
    added `role="alert"` to the element.
  - Tightened both `issue.qrLocalhostHint` strings (`en.json`/`ar.json`, same commit) to name the
    concrete failure ("will not work when scanned from a phone") rather than the more abstract
    "a physical wallet device cannot reach localhost."
  - Strengthened `isLocalhostOrigin`'s TSDoc into an explicit caller contract ("callers MUST
    surface a visible warning when this is true") so a future caller of `getQrApiBase()` can't
    silently reintroduce the bug by skipping the check.
  - Tests: `qrPayload.test.ts` gained a dedicated "misconfiguration guard" describe block
    exercising `isLocalhostOrigin(getQrApiBase())` across all three env/origin combinations
    (env set to a real base; env unset + jsdom-default-localhost origin; env unset +
    `window.location` overridden to a real deployed host via `Object.defineProperty`, restored in
    `afterEach`). `IssuePage.test.tsx` gained: an explicit "warning absent" assertion on the
    existing env-set test, a new env-unset-defaults-to-localhost case, a new
    env-unset-real-host-via-location-override case, a `role="alert"` assertion on the existing
    explicit-env-localhost case, and an Arabic-locale render of the same banner
    (`i18n.changeLanguage('ar')`, mirroring `DashboardPage.test.tsx`'s pattern). 147 tests total
    now (was 141) — 6 new, all in `issuance`.
  - i18n parity green (both keys already existed in both files; only values changed, same
    commit). RTL grep re-run across `src/features/issuance/*.css` — zero physical left/right
    matches, the new banner styling uses only shorthand `padding`/`border`/`border-radius`.
  - `npm run typecheck`, `npm run lint`, and `npm run test` all clean individually. **Note:**
    `npm run check`'s `format:check` step currently fails on `.vscode/extensions.json` — an
    untracked, pre-existing file from before this session (present in the working tree at
    session start, unrelated to this branch's diff, never staged or committed). Not fixed as
    part of this chore since it's outside the branch's scope; flagged below under "Open
    decisions" for whoever owns local editor config.
  - `npm run build` clean.

- 2026-07-22: C3+C4 session — bulk issuance wizard + dashboard v1, plus the V1 closing sweep.
  Hard gate checked first as always: `npm run contract:update` + `npm run gen:api` — both
  `POST /api/v1/credentials/bulk` (`BulkIssueRequest/Response`, KH-1.1.3-BE) and
  `GET /api/v1/stats` (`StatsResponse`, KH-1.5.3-BE) were already present in the refreshed
  contract, so the session proceeded without a pause this time. Delivered:
  - **Bulk issuance wizard** (`/issue/bulk`, `RequireScope('issue')` — self-gated inside
    `BulkIssuePage` itself, matching `schemaManagement`/`consumingParties`'s convention rather
    than `IssuePage`'s App.tsx-level wrapping; the two conventions coexist in this codebase,
    noted below). `src/features/bulkIssuance/`: a 4-step flow (schema → upload & map →
    validate & preview → report) mirroring the single-issue flow's visual language. Reused
    rather than duplicated: the schema picker was extracted out of `IssuePage` into
    `issuance/components/SchemaPicker.tsx` so both flows share the exact same component, and
    `usePublishedSchemas`/`useIssueSchema` are re-exported from `issuance/hooks` as-is.
    - CSV parsing is client-side via **papaparse** (approved dependency per the brief,
      `@types/papaparse` added alongside it) — `csv.ts` reads the file via `FileReader`
      rather than `Blob#text()`/`arrayBuffer()`; jsdom's `File` implements neither in this
      toolchain (Node 24, jsdom 25.0.1), so the original `file.text()` approach passed a
      real-browser smoke check but failed every test until switched to `FileReader`. Worth
      remembering for any future file-upload feature tested under vitest+jsdom.
    - Template download generates one CSV column per claim field plus a trailing `pseudoRef`
      column (no bilingual hint row — judged not worth the parsing complexity it would add on
      re-upload, since the brief marked the hint row optional).
    - Column mapping auto-matches by exact then case-insensitive header name; per-row
      validation (`rowValidation.ts`) mirrors `IssueForm`'s rules exactly (required = the
      already-server-derived `!selective`, text/number/date patterns) but never replaces the
      server's own validation — the per-item `error.code` in the report is always the
      displayed truth for a `FAILED` row.
    - **>200 rows are rejected client-side with a clear bilingual message** (mirroring the
      server's own `KH-CRD-0400` cap); chunking into sequential batches was explicitly judged
      not trivial enough to do cleanly in this session (would need sequential submission,
      partial-failure-across-chunks UX, and a different report-alignment model) and is left as
      a documented follow-up per the brief's own fallback language.
    - Report rows align every original CSV row — including rows excluded client-side as
      invalid — back to the server's per-item result by submission-order position
      (`report.ts`'s `buildReportRows`), since invalid rows are never sent and the server only
      indexes what it received. Claim codes are shown exactly once in the report table (never
      persisted, no re-fetch path) with an explicit bilingual "export now or lose them forever"
      warning shown both before submission (when the mint toggle is on) and again on the report
      itself; CSV export (`generateReportCsv`) is the only way to carry them out, and — per the
      P1 proofs-not-content rule — the export and the report table both omit the original claim
      values, listing only index/status/ref/claimCode/error (the operator already reviewed their
      own uploaded values in the preview step).
    - Sidebar: "Bulk Issue" under Issue (issue-scope-gated, same visibility rule as the
      Issue entry itself).
  - **Dashboard v1** (`/dashboard`, any authenticated operator, `src/features/dashboard/`) is
    now the **post-login landing page** — `/` now redirects to `/dashboard` instead of
    `/schemas`, and "Dashboard" is the sidebar's first entry. Counter cards from
    `GET /api/v1/stats`, grouped as Lifecycle (issued, claims redeemed, consumed, verifications
    passed) vs. Needs attention (revoked, consume denied, verifications failed); a 7/30-day
    window toggle maps to the `from`/`to` query params (`windows.ts`'s `computeWindow`), a
    manual refresh button, and `staleTime`/`refetchInterval` both at 60s — no websockets, per
    the brief. Every counter is read through `resolveCounterValue` (`counters.ts`), which
    defaults an absent or contract-optional field to `0` and can never crash the page — the
    same defensive stance as the C1 status-list fields. No new chart dependency, per the brief.
  - **V1 closing sweep**: re-ran the RTL logical-properties grep across every stylesheet in
    `src/` (`(margin|padding|border)-(left|right)`, bare `left:`/`right:`, physical
    `text-align`, `float: left/right`) — zero matches anywhere, including the C2b screens
    (`/consumers`, `/consume-sim`). i18n parity (`src/i18n/parity.test.ts`) green with the new
    `dashboard.*`, `issueBulk.*`, and `nav.dashboard`/`nav.issueBulk` keys added to both
    `en.json` and `ar.json` in the same commit. Full-repo `eslint .` clean (zero
    `i18next/no-literal-string` violations in the new code).
  - Tests: 141 total now (was 107) — 34 new: `bulkIssuance` (23: `csv.test.ts`,
    `columnMapping.test.ts`, `rowValidation.test.ts` incl. an Arabic-content round-trip,
    `request.test.ts` byte-for-byte DTO fixture, `report.test.ts` index-alignment incl.
    client-excluded rows, `BulkIssuePage.test.tsx` end-to-end incl. scope gating, the >200-row
    cap, and the one-time claim-code/export flow) and `dashboard` (11: `windows.test.ts`,
    `counters.test.ts` incl. absent-counter and absent-`counters`-object defensive cases,
    `DashboardPage.test.tsx` incl. both-locale number formatting, window-toggle query
    construction, and refresh re-fetch).
  - `npm run check` and `npm run build` both clean.
  - Noted, not fixed (pre-existing, out of scope): a dev-only `npm audit` advisory
    (`@redocly/openapi-core`'s vendored `js-yaml`, transitive via `openapi-typescript`) appeared
    after installing papaparse's peers refreshed the lockfile graph — same category as the
    already-noted esbuild/vitest advisory, a dev-toolchain issue with no runtime/prod exposure.

- 2026-07-22 (follow-up, PR #6): rebuilt the `khatm-console` container
  (`docker compose up -d --build`, the prior container was stale from before this session) against
  the already-running `khatm-api`/`khatm-worker`/`khatm-postgres`/`khatm-redis` stack on
  `khatm-net`. Majd confirmed the Arabic layout and messages read correctly across the app on the
  rebuilt container. PR #6 merged into `main` (`--delete-branch`), closing **console V1**.

- 2026-07-22 (follow-up, PR #5): Majd's manual pass against the running Docker stack (via the
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

## Next up (post-V1, ordered per Majd)

1. API-key revocation UI (KH-2.2-era — the platform endpoint already exists,
   `POST /api/v1/admin/api-keys/{id}/revoke`).
2. Visual identity — **DONE**. Remainder: migrate the last ~12 duplicated button blocks onto
   `Button` and adopt `.khatm-input` across remaining forms; revisit whether a real charting
   library belongs in the dashboard.
3. KH-2.2-era RBAC changes, whatever those turn out to require.
4. Unify the scope-gating placement convention (self-gating vs. App.tsx-level wrapping — see
   "Open decisions" above) across every gated page.

Closed: Dashboard v2's four data-less panels — all wired to real khatm-platform data
(KH-1.1.5-BE) 2026-07-25; see "Last completed". Closed: the full EN/AR + RTL click-through
across every screen — Majd confirmed the Arabic
layout and messages read correctly across the rebuilt container before merging PR #6. Closed:
item #5, contract refresh sanity check — re-ran 2026-07-26, zero semantic drift found; see
"Last completed".
