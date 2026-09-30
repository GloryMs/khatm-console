Session: feat/C7-users-and-scope-gating — spec FS-2.2 D7. 
Preamble (hard gates): npm run contract:update from origin/main; self-stop if any of these are
absent from the refreshed contract: /api/v1/users family, initialAdmin on tenant creation,
/admin/tenants/{id}/users, the forced-password-change error code — OR if the legacy 'admin'
scope still appears anywhere in the contract's security schemes (means a platform merge is missing).

1. RE-GATING (D2 map, console side): update every RequireScope value from 'admin' to the granular
   scope per the contract's security schemes — schemas screen -> schema:manage; consuming parties
   + their keys -> consumer:manage; signing-keys dashboard panel -> key:manage; tenants area ->
   platform:admin; users screen (new) -> tenant:admin. Nav renders strictly from the session's
   actual scopes — a user lacking a scope sees neither the nav entry nor the route (redirect to
   an unauthorized surface, reuse the existing pattern if one exists — verify, don't invent).
2. USERS SCREEN (tenant:admin), mirroring the C2b/C5 list+detail shape: list (username, localized
   display name, roles as chips, status badge ACTIVE/LOCKED/DISABLED); create dialog (username +
   display name EN/AR + role multi-select from the fixed catalog); row/detail actions: edit roles,
   lock/unlock, disable, reset password — each with confirm dialog. KH-USR-0423 (last-admin guard)
   surfaces as a clear inline explanation, not a generic toast. Temporary passwords render via the
   EXISTING plaintext-once component used for API keys — same copy-once/regenerate-warning UX.
3. FORCED PASSWORD CHANGE: on the distinct error code (or login response flag — follow the
   contract), route the session into a change-password screen before anything else; on success,
   continue to the app. Cover with a test.
4. TENANTS SCREEN ADDITIONS (platform:admin): create-tenant form gains optional Initial admin
   (username + display name EN/AR); tenant detail gains a Users tab listing/creating users for
   that tenant via /admin/tenants/{id}/users — visually marked as acting on behalf of the tenant.
5. EN/AR keys same commit; full RTL pass on all new/changed views (users table, dialogs,
   change-password screen, on-behalf-of tab).

DoD: npm run check green (report N/N). Live walkthrough against compose (platform main post-merge),
EN and AR both: login as TENANT_ADMIN -> Users visible, Tenants absent from nav -> create an
ISSUER_OPERATOR -> its login sees only issuance surfaces -> reset its password -> forced-change
flow works -> try disabling the sole admin -> friendly 0423 explanation -> login as
PLATFORM_ADMIN -> Tenants + on-behalf-of Users tab work. PR opened NOT merged — Majd's EN/AR/RTL
browser walkthrough + Arabic gate = merge blockers; STATE updated (including closing any stale
'coarse admin scope' debt notes recorded since C2b).
Self-stop: any screen needs data the contract doesn't expose -> record the platform ask in STATE
and stop that sub-feature, don't improvise.