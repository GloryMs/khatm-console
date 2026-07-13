# STATE — khatm-console
> Updated at the end of EVERY Claude Code session.

## Current phase / task
- Phase 0 — Active task: KH-0.1.3 (migrate POC JS → TypeScript strict) — NOT STARTED

## Last completed
- 2026-07-xx: Repository founded. POC web/ code imported as-is (JS).

## Environment facts
- Dev: VSCode + Docker Desktop; web on :5173, proxies to khatm-api:8080 over khatm-net.
- API client generation depends on platform publishing openapi.json (KH-1.6 / CI artifact).
  Until then: temporary typed client against the POC endpoints, marked TODO(KH-1.6).

## Open decisions / blockers
- Design tokens / visual identity file — pending from stakeholder (use neutral tokens meanwhile).

## Next up (ordered)
1. KH-0.1.3 TS strict migration + ESLint/Prettier + i18n scaffold (en/ar + RTL switch)
2. KH-0.6 login page + session handling + route guards
3. KH-1.1.1 schema management UI
4. KH-1.1.2/3 issuance (single form from claims_def, then bulk CSV wizard)
5. KH-1.1.4 credential search/list + revoke (RBAC-gated)
6. Dashboard v1 (issues/verifies/consumes/failures counters)
