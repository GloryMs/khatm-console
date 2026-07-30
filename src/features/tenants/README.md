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
alongside the existing `/api` and `/.well-known` ones. `useTenantUsers(id)`
→ `GET /admin/tenants/{id}/users` and `createUserInTenant` (spec D4
`OnBehalfOfExecutor`) → `POST .../{id}/users` back the detail page's Users
tab: it lists the tenant's users (`UserList` with only `onResetTotp` wired
— lock/roles/reset-password still have no on-behalf-of contract variant, so
those actions aren't offered here) alongside the existing create form;
creating invalidates that tenant's users query. `useResetTotpInTenant`
(spec FS-2.2 V1, `POST .../{id}/users/{userId}/totp/reset`,
`OnBehalfOfExecutor`) resets a user's TOTP enrollment on behalf of the
named tenant; no invalidation, same reasoning as `features/users`'
`useResetTotp`.

Onboarding is server-resumable (a retried create for a half-onboarded slug
succeeds rather than 409ing) — the UI has no special retry handling, by
design. `KH-TNT-0400`/`KH-TNT-0409` are mapped onto the slug field inline,
in addition to the generic error banner every other mutation gets.
