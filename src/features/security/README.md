# security

Self-service TOTP 2FA (spec FS-2.2 V1): enroll the caller's own account, and
see its current status. Any authenticated session may use this — the
contract requires no scope beyond a valid session, unlike the
mandatory-2FA-for-certain-scopes intent in FS-2.2 §4 V1, which the backend
has not yet enforced (see `docs/STATE.md`'s open platform ask — no distinct
error code signals "must enroll," so the forced-enrollment takeover screen
the original brief called for could not be built).

**Routes:** `/security` (`SecuritySettingsPage`), no `RequireScope` — self-
scoped to the caller.

**Queries / mutations:** `useEnrollTotp` → `POST /users/me/totp/enroll`;
`useConfirmTotp` → `POST /users/me/totp/confirm`. Status comes from
`useAuth()`'s `user.totpEnabled` (`MeResponse.totpEnabled`, KH-2.4x — closes
the C7c gap where this field didn't exist yet) rather than its own query — no
separate fetch or invalidation needed, `AuthProvider.refresh()` (called after
`useConfirmTotp` succeeds, same as every other `/me`-derived value) already
keeps it current.

**`totpEnabled` gates the enroll CTA, it doesn't just decorate a badge**:
`POST /users/me/totp/enroll` refuses with 409 (`KH-USR-1409`) once TOTP is
already active on the account — self-service re-enroll was never actually
reachable, only untested before this field existed to check first. So the
CTA only renders when `totpEnabled === false`; when `true`, the page shows
the Enabled badge plus copy pointing at admin-mediated reset instead (see
below) rather than a button that would just 409. When `totpEnabled` is
`undefined` (the field is optional in the contract, though `RequireAuth`
guarantees a session exists by the time this route renders) the badge shows
a checking state and no CTA at all — assuming "disabled" would show a false
security status, worse than a brief loading state.

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
