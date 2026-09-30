Session: chore/C7b-login-slug-and-obo-list — micro follow-up to C7, closing the console side of
the two platform gaps delivered by KH-2.2d-BE.
Preamble (hard gates): npm run contract:update from origin/main; self-stop if either is absent
from the refreshed contract: the optional tenantSlug field on login, or
GET /api/v1/admin/tenants/{id}/users.

1. LOGIN FORM: add an optional "Organization" field (maps to tenantSlug; empty => omitted from
   the request, preserving default-tenant behavior for existing users — do NOT make it required).
   Follow the platform's semantics exactly: an unknown/suspended tenant surfaces as the SAME
   generic login failure as bad credentials — no special "organization not found" message
   (deliberate anti-enumeration; do not "improve" this copy). Placement/label consistent with the
   existing login layout; EN/AR labels; RTL check.
2. ON-BEHALF-OF USERS TAB (tenant detail, platform:admin): wire the new GET so the tab now LISTS
   the tenant's users (same row shape/components as the /users screen — reuse, don't duplicate),
   alongside the existing create-only flow. Row actions (lock/roles/reset) remain OUT of scope
   unless the contract exposes on-behalf-of variants — it does not today; do not call tenant-scoped
   /api/v1/users endpoints while impersonating via the admin surface.
3. STATE hygiene same PR: close the two platform-gap entries recorded 2026-07-29 (both now
   addressed), referencing KH-2.2d-BE.
4. EN/AR keys same commit; tests for both features (slug present/absent request shapes; OBO list
   rendering).

DoD: npm run check green (report N/N). Live walkthrough against compose (platform main post-merge),
EN + AR: login WITHOUT slug as existing default-tenant admin (unchanged) -> logout -> login WITH
slug as a new tenant's admin -> lands in own-tenant context (schemas list is that tenant's) ->
as PLATFORM_ADMIN, tenant detail Users tab lists that tenant's users. PR opened NOT merged —
Majd's EN/AR/RTL walkthrough = merge gate (branch protection now enforced); STATE updated.
Self-stop: standard — any data the contract doesn't expose => record the ask, don't improvise.