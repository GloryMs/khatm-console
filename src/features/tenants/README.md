# tenants

Platform-admin plane for tenants (KH-2.1): onboard, view, suspend/activate.

**Routes:** `/tenants` (`TenantsPage`, list + onboarding dialog) and
`/tenants/:id` (`TenantDetailPage`, full detail + suspend/activate + an
on-behalf-of Users tab), both self-gated with `RequireScope('platform:admin')`
(spec FS-2.2 D2 — replaces the former coarse `admin` scope).

**Queries / mutations:** `useTenants` → `GET /api/v1/admin/tenants`;
`useTenant(id)` → `GET .../tenants/{id}`; `useCreateTenant` (now
`OnboardTenantRequest`/`OnboardTenantResponse`, with an optional
`initialAdmin`), `useSuspendTenant`, `useActivateTenant` — every mutation
invalidates the list and detail queries. `jwks.ts`'s `buildTenantJwksUrl`
constructs the tenant's public JWKS link client-side from its slug alone (no
extra endpoint call) — same-origin via the nginx/Vite `/t` proxy added
alongside the existing `/api` and `/.well-known` ones. `createUserInTenant`
(spec D4 `OnBehalfOfExecutor`) posts to `/admin/tenants/{id}/users` for the
detail page's Users tab; the contract has no matching `GET`, so that tab is
create-only — see STATE.md's platform ask.

Onboarding is server-resumable (a retried create for a half-onboarded slug
succeeds rather than 409ing) — the UI has no special retry handling, by
design. `KH-TNT-0400`/`KH-TNT-0409` are mapped onto the slug field inline,
in addition to the generic error banner every other mutation gets.
