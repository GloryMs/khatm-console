# security

Self-service TOTP 2FA (spec FS-2.2 V1): enroll or re-enroll the caller's own
account. Any authenticated session may use this — the contract requires no
scope beyond a valid session, unlike the mandatory-2FA-for-certain-scopes
intent in FS-2.2 §4 V1, which the backend has not yet enforced (see
`docs/STATE.md`'s open platform ask — no distinct error code or `MeResponse`
field signals "must enroll," so the forced-enrollment takeover screen the
original brief called for could not be built this session).

**Routes:** `/security` (`SecuritySettingsPage`), no `RequireScope` — self-
scoped to the caller.

**Queries / mutations:** `useEnrollTotp` → `POST /users/me/totp/enroll`;
`useConfirmTotp` → `POST /users/me/totp/confirm`. Neither invalidates
anything — there is no cached "is TOTP active" query, because the platform
exposes no such field to read. The page always shows the same
enroll/re-enroll action rather than a status badge.

`components/TotpEnrollDialog.tsx` derives its step from mutation data
(no `enroll.data` → generate; `enroll.data` but no `confirm.data` → QR +
manual secret + confirm code; `confirm.data` → recovery codes) rather than
separate step state. Recovery codes and the manual secret both go through
the shared `SecretReveal` shown-once pattern; recovery codes additionally
use its new optional print action (`printRecoveryCodes.ts`, a blank
same-origin popup — no external content).

Admin-side reset (`tenant:admin`, plus the on-behalf-of variant for
`platform:admin`) lives in `features/users` and `features/tenants`
respectively, not here — this feature only ever acts on the caller's own
account.
