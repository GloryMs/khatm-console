# STATE — khatm-console

> Updated at the end of EVERY Claude Code session.

## Current phase / task

- Phase 0 — FS-C0 foundation session — DONE (branch `feat/C0-foundation`, PR open, not merged)

## Last completed

- 2026-07-18: FS-C0 foundation session. Repo was not empty as the session brief assumed
  (a JS POC was already committed) — reconciled with Majd: brief's full C0 scope wins,
  superseding the old incremental KH-0.1.3/KH-0.6.1 split in the previous ROADMAP entry.
  Delivered: Vite, React 18, TS strict scaffold; ESLint (strict, `i18next/no-literal-string`),
  Prettier, and Vitest quality gates; vendored `contracts/openapi.json` and generated
  `src/api/generated/schema.ts`; `react-i18next` en/ar with a parity test; API client core
  (`src/api/client.ts`) with XSRF header, Accept-Language, and `ApiError` envelope mapping;
  TanStack Query global error layer and `ErrorBoundary`; auth flow (login/logout/me bootstrap,
  `RequireAuth`, `RequireScope`); app shell (sidebar/topbar, language switcher, user chip);
  `/schemas` proof-of-life page; Docker multi-stage build, nginx proxy, and compose; GitHub
  Actions CI (typecheck, lint, format, test, build, contract-types freshness).

## Environment facts

- Dev: web on :5173, Vite proxies `/api` and `/.well-known` to `localhost:8080`.
- Container: nginx on :3000→80, proxies `/api` and `/.well-known` to `http://khatm-api:8080`
  over the external `khatm-net` network.
- `khatm-platform` is a **private** repo — the raw.githubusercontent.com URL in the FS-C0
  brief 404s without auth. `npm run contract:update` (`scripts/update-contract.mjs`) tries
  the public URL first, then falls back to `gh api` using the caller's own credentials. The
  contract was vendored this session via that fallback.
- Design tokens (`src/styles/tokens.css`) reuse the POC's neutral palette pending a real
  visual-identity file from the stakeholder — same open item as before, not resolved.

## Open decisions / blockers

- Design tokens / visual identity file — pending from stakeholder (use neutral tokens meanwhile).
- `khatm-platform`'s CI publishing step for `docs/api/openapi.json` (KH-1.6) should eventually
  make the raw URL work without the `gh` fallback — worth revisiting once that lands.
- Dev-only `esbuild`/vitest-toolchain `npm audit` advisory (moderate, dev-server request
  forgery) — inherent to the current vitest 3.x → vite 6 chain, not a runtime/prod risk. No
  fix available without an unreleased vitest bump; revisit on next dependency update.

## Next up (ordered)

1. C1: feature screens — issue (schema-driven form from `claims_def` + QR render per the claim
   contract), verify, revoke. Spec to come from the advisory session after KH-1.2.1 lands.
2. KH-1.1.1 schema management UI (create/version — this session only built the read-only list).
3. KH-1.1.2/3 issuance (single form from claims_def, then bulk CSV wizard).
4. KH-1.1.4 credential search/list + revoke (RBAC-gated, `RequireScope` is ready for this).
5. Dashboard v1 (issues/verifies/consumes/failures counters).
