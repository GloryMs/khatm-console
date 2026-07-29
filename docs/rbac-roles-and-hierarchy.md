# Khatm RBAC — roles, scopes, and hierarchy

> Reference doc for the granular RBAC model shipped in spec FS-2.2 (KH-2.2, console-side C7).
> Explains what each role can see/do, how tenants and users relate, and the current known gaps.

## 1. The two different things: scopes and roles

- A **scope** is a single permission string (e.g. `issue`, `tenant:admin`). Every API endpoint and
  every console screen/action is gated on one specific scope — deny-by-default, meaning an
  endpoint with no scope declared fails closed, not open.
- A **role** is a named, fixed bundle of scopes, assigned to a user. Users don't hold scopes
  directly — they hold roles, and their session's scopes are the union of their roles' scopes.
  There is currently a **fixed catalog of three roles**; custom/ad-hoc roles don't exist yet
  (planned for a later phase).

## 2. The scope registry (9 scopes)

| Scope             | Meaning                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `issue`           | Issue new credentials                                                                                                   |
| `verify`          | Verify a credential presentation                                                                                        |
| `consume`         | Consume a credential (server-to-server, via a consuming-party API key — never a console-session action)                 |
| `revoke`          | Revoke a credential                                                                                                     |
| `schema:manage`   | Create/edit/publish/archive credential schemas                                                                          |
| `consumer:manage` | Register/manage consuming parties, their schema allowlists, and their API keys                                          |
| `key:manage`      | View signing-key lifecycle status (rotation, retirement)                                                                |
| `tenant:admin`    | Manage users _within your own tenant_ (create, roles, lock/unlock/disable, reset password)                              |
| `platform:admin`  | Cross-tenant platform administration: onboard/list/suspend/activate tenants, add a user to _any_ tenant on behalf of it |

## 3. The three roles

| Role                | Scopes                                                                                                   | In one sentence                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ISSUER_OPERATOR** | `issue`, `verify`, `revoke`                                                                              | Day-to-day credential work only. No management screens of any kind.                                                                                                  |
| **TENANT_ADMIN**    | `issue`, `verify`, `consume`, `revoke`, `schema:manage`, `consumer:manage`, `key:manage`, `tenant:admin` | Everything _inside one tenant_ — full operational + management control, but no visibility into other tenants and no platform-level actions.                          |
| **PLATFORM_ADMIN**  | All 9 scopes, including `platform:admin`                                                                 | Everything a TENANT_ADMIN has, **plus** cross-tenant platform administration (onboard tenants, suspend/activate any tenant, add a user to any tenant on its behalf). |

There's no formal "level 1/2/3" numeric hierarchy in the system — it's simply three different
scope sets. In practice `PLATFORM_ADMIN` ⊃ `TENANT_ADMIN` ⊃ `ISSUER_OPERATOR` is _almost_ true
(every scope ISSUER_OPERATOR has, TENANT_ADMIN also has; every scope TENANT_ADMIN has,
PLATFORM_ADMIN also has), so it's fair to think of it as a strict ladder.

## 4. What each role sees in the console nav

| Screen                            | Required scope             | ISSUER_OPERATOR | TENANT_ADMIN | PLATFORM_ADMIN |
| --------------------------------- | -------------------------- | :-------------: | :----------: | :------------: |
| Dashboard                         | _(any authenticated user)_ |       ✅        |      ✅      |       ✅       |
| Issue / Bulk Issue                | `issue`                    |       ✅        |      ✅      |       ✅       |
| Credentials search                | _(any authenticated user)_ |       ✅        |      ✅      |       ✅       |
| Verify                            | _(any authenticated user)_ |       ✅        |      ✅      |       ✅       |
| Revoke                            | `revoke`                   |       ✅        |      ✅      |       ✅       |
| Consume Simulator                 | _(any authenticated user)_ |       ✅        |      ✅      |       ✅       |
| Manage Schemas                    | `schema:manage`            |       ❌        |      ✅      |       ✅       |
| Consuming Parties                 | `consumer:manage`          |       ❌        |      ✅      |       ✅       |
| Signing-keys panel (on Dashboard) | `key:manage`               |       ❌        |      ✅      |       ✅       |
| **Users**                         | `tenant:admin`             |       ❌        |      ✅      |       ✅       |
| **Tenants**                       | `platform:admin`           |       ❌        |      ❌      |       ✅       |

A user without a screen's required scope doesn't just get denied on click — the nav entry itself
never renders for them, so there's nothing to click.

## 5. Tenants vs. users — the model that trips people up

- A **tenant** is an organizational container (a customer/deployment). It has no role and no
  permissions of its own — it's just the boundary that users, schemas, credentials, and consuming
  parties belong to.
- Onboarding a tenant with the **"Add an initial administrator" checkbox unchecked** creates a
  pure shell: the tenant row, its first signing key, its default status list, and the fixed
  three-role catalog seeded — but **zero users**. Nobody can log into it until someone adds a
  user.
- Checking that box **doesn't touch the account you're currently logged in as**. It creates one
  new, separate user in the new tenant, always with the `TENANT_ADMIN` role, with its own
  one-time temporary password shown right there in the dialog.
- Every user — including `PLATFORM_ADMIN` — belongs to exactly **one** tenant. `PLATFORM_ADMIN`
  users live in the platform's own "default" tenant. There is no "switch tenant" or "view as"
  feature in the console; cross-tenant actions go through specific, narrow, audited
  _on-behalf-of_ endpoints (see below), not a general context switch.

## 6. On-behalf-of: how a platform admin touches another tenant

`PLATFORM_ADMIN` can perform a small, explicit set of actions _for_ another tenant without ever
"entering" it:

- Onboard the tenant (optionally with its `initialAdmin`).
- Suspend / activate the tenant.
- Add a user to the tenant (`POST /admin/tenants/{id}/users` — the tenant detail page's **Users**
  tab in the console).

Every one of these is logged as an `ON_BEHALF_OF` audit action naming both the acting platform
admin and the target tenant.

**Known gap (platform-side, not a console bug):** there is currently no way — not in the console,
not via the raw API — to _list_ an arbitrary tenant's users from outside that tenant. The
`POST /admin/tenants/{id}/users` (create) endpoint exists; its `GET` counterpart doesn't yet. This
means a `PLATFORM_ADMIN` who onboards a tenant and adds users to it has no way to see those users
again afterward, from anywhere, until either (a) that endpoint is added, or (b) someone logs in
_as_ a user of that tenant and views `/users` from inside it. This is tracked as an open platform
ask in `docs/STATE.md`.

## 7. Known gaps / rough edges (as of 2026-07-29)

1. **No cross-tenant user listing** (above) — the most confusing one in practice.
2. **Logging in as a newly-onboarded tenant's own user doesn't work yet.** The platform's login
   endpoint currently only ever resolves users against its default tenant (a pre-authentication
   tenant-resolution gap, confirmed by reading the platform source). In practice this means:
   even once a `TENANT_ADMIN` or other user is created in a new tenant, _that user cannot sign in_
   until the platform adds a tenant-resolution mechanism for the login request itself. This is
   independent of gap #1.
3. **Custom/ad-hoc roles don't exist.** The three-role catalog is fixed; a tenant can't define its
   own role with a custom scope combination (planned for a later phase per the spec).
4. **The signing-key rotation UI shows lifecycle status only**, not rotation controls — `key:manage`
   currently gates a read-only view.

## 8. Quick answers to common questions

- _"I created a tenant but didn't check the admin box — why is it empty?"_ — By design. Add a
  user via the tenant detail page's Users tab (on-behalf-of), or re-run onboarding with the
  checkbox checked (onboarding is safely resumable).
- _"I'm PLATFORM_ADMIN, why can't I see this tenant's users list?"_ — Known gap #1 above.
- _"I created a TENANT_ADMIN user in a new tenant, why can't they log in?"_ — Known gap #2 above
  — currently a platform limitation, not something fixable from the console side.
- _"What's the difference between the 'Users' screen and the tenant detail's 'Users' tab?"_ —
  `/users` (nav) shows **your own tenant's** users, full CRUD. The tenant detail's Users tab is a
  **different tenant's** on-behalf-of, create-only surface — only visible to `PLATFORM_ADMIN`,
  only reachable from that specific tenant's detail page.
