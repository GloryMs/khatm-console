# Session Brief — C5: Tenants Management Screen

> **Repo:** khatm-console · **Branch:** `feat/C5-tenants-screen`
> **Depends on:** platform PR #36 (KH-2.1-BE) merged to `main` **and** KH-1.1.5-BE merged to `main`. Both are verified in the preamble — this brief self-stops if either is absent.
> **Scope gating:** existing coarse `admin` scope, same deliberate stand-in as the consuming-parties screen (C2b). KH-2.2 replaces it with granular scopes later — do not invent finer gating now.
> **Pattern authority:** mirror the consuming-parties screen (C2b) end to end — routing, list/detail layout, error-envelope handling, i18n key structure, test shape. Deviate only where the tenant domain genuinely differs, and record each deviation in `docs/STATE.md`.

---

## 0. Preamble (protocol — all gates hard)

1. `npm run contract:update` against `origin/main`, then regenerate types. **Self-stop if** the refreshed contract lacks either (a) the `/api/v1/admin/tenants` family or (b) the five Dashboard v2 read endpoints — that means a platform merge is missing; report and stop.
2. Contract freshness CI gate must pass locally before any screen work.
3. Read the vendored contract for the tenant plane's exact shapes — **the contract is the authority**; do not construct requests from platform source via `gh api` (investigation only, per standing rule).

## 1. Scope

One new admin area: **Tenants** (`/tenants`), navigation entry in the redesigned sidebar (PR #13 structure), visible under `admin` scope only.

1. **List view**: newest first, columns: slug, name (localized from `name_i18n` per active UI language), type, status badge (ACTIVE/SUSPENDED), created. Server data as-is — no client-side invention of fields the contract doesn't return.
2. **Create (onboarding) form**: slug, name EN + name AR (both required — mirror the platform's dual-language constraint client-side), type, deploy_mode (default SAAS). On success show the created tenant's detail. Surface `KH-TNT-0400` (slug format) and `KH-TNT-0409` (duplicate) inline on the slug field via the standard error-envelope mapping; everything else through the shared error surface. **Note the platform's resumable-create semantics** (a retried create for a half-onboarded slug succeeds rather than 409s) — the UI needs no special handling, but don't "protect" against retry client-side; the server owns that.
3. **Detail view**: full tenant fields, status, plus two derived conveniences: a copyable link to the tenant's public JWKS (`{base}/t/{slug}/.well-known/jwks.json`) and, if the contract exposes it, the tenant's status-list reference(s). If the contract does not expose key/status-list info on the tenant resource, show only the JWKS link (constructible from slug alone) — do not call non-contract endpoints.
4. **Suspend / Activate** actions with confirm dialog. Copy must reflect the real semantics (spec V4): suspension blocks **new issuance and sign-ins** for that tenant's operators; already-issued credentials keep verifying and its public endpoints keep serving. Do not write copy implying "everything stops."
5. i18n: every new string in EN and AR bundles in the same commit; full RTL pass on all new views. **Arabic-review gate (Majd) is a hard merge blocker.**

**Out of scope:** per-tenant user management (KH-2.2), key rotation UI (KH-2.2/2.3), editing tenant fields post-create unless the contract exposes an update endpoint (if it does not — expected — omit edit entirely, don't stub it).

## 2. Definition of Done

1. `npm run verify` (lint, typecheck, tests, format, contract freshness) green; report test count.
2. Live walkthrough against the local compose stack (platform `main` post-merges): create a tenant EN+AR → appears in list → detail shows JWKS link that actually resolves in the browser → suspend → confirm copy → activate. Record the walkthrough result in STATE (EN and AR passes both).
3. PR opened, **not merged** — Majd's review + Arabic gate.
4. `docs/STATE.md` updated end of session.

## 3. Self-stop gates

- Preamble gate 1 (missing contract surface) → stop.
- Any need for data the contract doesn't expose → stop and record the platform ask in STATE rather than improvising (this becomes a platform "concrete console ask" per the platform STATE's standing rule).
- Anything requiring a scope other than `admin` → stop; that's KH-2.2 territory.
