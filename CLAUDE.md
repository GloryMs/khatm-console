# CLAUDE.md — khatm-console

You are implementing the **management web console** of Khatm (خَتْم), the digital
document trust fabric. The console serves platform admins and tenant operators:
configuration management, credential schema management, document issuing &
consuming, signing-key management, and the operations dashboard.
Core rule **P1: proofs, not content** — the console never displays or uploads
document content or PII beyond what a spec explicitly defines.

## Session protocol (mandatory)

1. Read `docs/STATE.md`, then the spec for your task (`docs/specs/FS-x.y.md`).
2. One WBS task per session, branch `feat/KH-x.y.z-<short-name>`.
3. End of session: update `docs/STATE.md`, run `npm run check` (types+lint+tests).

## Stack (frozen)

React 18 + Vite · **TypeScript strict** (no `any`, no `@ts-ignore` without a comment
and an issue ref) · react-i18next · TanStack Query · react-router · Docker/nginx.

## The API contract

- Types and client are **generated** from the platform's published `openapi.json`
  (`npm run gen:api`, openapi-typescript). Never hand-write API types or paths.
- All server communication goes through the generated client wrapped in
  `src/api/client.ts` (adds Accept-Language, auth, traceId propagation). No raw fetch
  elsewhere.

## Work rule 2 — EN/AR + RTL (first-class, not bolted on)

- Every user-visible string is an i18n key in `src/i18n/en.json` + `src/i18n/ar.json`.
  Both files updated in the same commit; CI parity check fails otherwise.
  Zero hardcoded UI strings — enforced by eslint rule (i18next/no-literal-string).
- Language switcher persists per user; `<html dir>` flips `rtl`/`ltr` with language.
- CSS: logical properties only (`margin-inline-start`, `padding-inline-end`,
  `inset-inline`) — never left/right physical properties for layout.
- Numbers/dates through `Intl.*` with the active locale; API refs/codes stay LTR
  (`unicode-bidi: embed` utility class for code-like values inside RTL text).
- Bilingual entity names arrive as `name_i18n {en,ar}` — resolve via a single shared
  `useLocalizedText()` hook, fallback `en`.

## Work rule 3 — Error handling & UX

- All API errors arrive in the platform envelope
  `{code, messageKey, message, traceId, details[]}`.
- One error layer: TanStack Query global `onError` + `<ErrorBoundary>`; components
  never toast raw errors themselves.
- Message resolution order: local i18n key `errors.<messageKey>` (preferred, matches
  UI language) → server `message` → generic fallback. Always show `code` + `traceId`
  in the error detail (support can correlate with backend logs).
- Field-level `details[]` map to form field errors, localized.
- Never show stack traces or raw JSON to users; console.error only in dev builds
  (stripped in prod).

## Work rule 4 — One concept, one style

- Function components + hooks only. No classes, no HOCs.
- Server state: TanStack Query ONLY (no server data in useState/context).
  UI-local state: useState/useReducer. No global state library unless an ADR adds one.
- Forms: react-hook-form + zod schemas — every form, the same way.
- Files: `src/features/<feature>/{components,hooks,api}.ts` feature-slice layout;
  shared UI in `src/components/ui`.
- Styling: one system (CSS modules with design tokens); no inline style objects for
  layout; no mixing in styled-components/tailwind later without an ADR.
- Enforced: ESLint + Prettier + `tsc --noEmit` in CI (`npm run check`).

## Work rule 1 — Documentation

- TSDoc on shared hooks/utilities and every feature's `api.ts`.
- Each feature folder has a 10-line `README.md`: purpose, routes, main queries/mutations.

## Scope map (what this repo builds)

Dashboard · Schema management (KH-1.1.1) · Issuance single+bulk (KH-1.1.2/3) ·
Credential search/revoke (KH-1.1.4) · Consuming-party & consumption views ·
Key management UI (rotation status, JWKS view — reads only what the API exposes) ·
Configuration management · Auth (KH-0.6 session).

## Reference documents (khatm-docs repo)

SAD 20 · WBS 31 · FS-1.1 · ADR-08/09.
