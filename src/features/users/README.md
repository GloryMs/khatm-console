# users

Tenant-user management plane (spec FS-2.2 D5): create users, edit roles,
lock/unlock/disable, and reset passwords — scoped to the caller's own
tenant.

**Routes:** `/users` (`UsersPage`), self-gated with
`RequireScope('tenant:admin')` (same pattern as `schemaManagement`/
`consumingParties`).

**Queries / mutations:** `useUsers` → `GET /api/v1/users`; `useCreateUser`,
`useReplaceRoles`, `useLockUser`, `useUnlockUser`, `useDisableUser`,
`useResetPassword` — every mutation invalidates the list. Role codes come
from a fixed client-side catalog (`roles.ts`, TENANT_ADMIN/ISSUER_OPERATOR —
not a contract enum, same precedent as `TenantType`).

Temporary passwords (create + reset) are shown exactly once via the shared
`TemporaryPasswordDialog` and never enter the TanStack Query cache.
KH-USR-0423 (last-active-admin guard) renders as a dedicated inline
explanation instead of the generic error banner.

`components/UserList.tsx` is shared beyond this feature: its row-action
handler props are all optional, and omitting every one renders the same row
shape with no actions column — used by `tenants`' on-behalf-of Users tab,
which has no on-behalf-of contract variant of lock/roles/reset to call.
