# tenants

Platform-admin plane for tenants (KH-2.1): onboard, view, suspend/activate.
Coarse `admin` scope stand-in, same as `consumingParties` — KH-2.2 replaces
it with granular scopes later.

**Routes:** `/tenants` (`TenantsPage`, list + onboarding dialog) and
`/tenants/:id` (`TenantDetailPage`, full detail + suspend/activate), both
self-gated with `RequireScope('admin')`.

**Queries / mutations:** `useTenants` → `GET /api/v1/admin/tenants`;
`useTenant(id)` → `GET .../tenants/{id}`; `useCreateTenant`,
`useSuspendTenant`, `useActivateTenant` — every mutation invalidates the
list and detail queries. `jwks.ts`'s `buildTenantJwksUrl` constructs the
tenant's public JWKS link client-side from its slug alone (no extra
endpoint call) — same-origin via the nginx/Vite `/t` proxy added alongside
the existing `/api` and `/.well-known` ones.

Onboarding is server-resumable (a retried create for a half-onboarded slug
succeeds rather than 409ing) — the UI has no special retry handling, by
design. `KH-TNT-0400`/`KH-TNT-0409` are mapped onto the slug field inline,
in addition to the generic error banner every other mutation gets.
