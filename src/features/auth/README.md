# auth

Console session: login, logout, `me` bootstrap, and route/scope gates.

**Routes:** `/login` (`LoginPage`).

**Queries/mutations:** none via TanStack Query — session state lives in
`AuthProvider` (React context), refetched explicitly via `login`/`logout`,
since it gates routing rather than rendering a list/detail view.

**Exports used elsewhere:** `AuthProvider`, `useAuth`, `RequireAuth` (route
guard), `RequireScope` (scope gate, used by C1+ feature screens).

**Cross-cutting:** reacts to `authBridge`'s unauthorized event (see
`src/auth/authBridge.ts`) so an expired session mid-app drops to `/login`.

`LoginForm` has an optional "Organization" field (`tenantSlug`, spec FS-2.2):
blank omits it from the request entirely, preserving the existing
default-tenant login for every current user. A non-default tenant, an
unknown slug, and a suspended tenant all fail with the identical generic
401 as bad credentials (deliberate anti-enumeration, spec FS-0.6b D7) — the
UI must never special-case that response.

**TOTP login challenge (spec FS-2.2 V1):** when `login()` resolves a
`LoginChallengeResponse` (`totpRequired: true` + `challengeId`), no session
exists yet — `LoginPage` swaps `LoginForm` for `TotpChallengeForm`, which
submits either a live code or a recovery code (never both) to
`completeTotpLogin`. Errors stay generic here too, same anti-enumeration
stance as password login. Self-service enrollment (QR + manual secret +
recovery codes) lives in `features/security`, not here — this feature only
ever completes a challenge already issued by the platform.
