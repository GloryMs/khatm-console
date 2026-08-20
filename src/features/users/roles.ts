/**
 * The fixed role catalog seeded per tenant (spec FS-2.2 D3/D5, extended with
 * `ORG_ADMIN` by KH-2.6b spec FS-2.5 §3) — not exposed as a contract enum
 * (mirrors `TenantType`'s precedent from C5), so the literal codes are
 * hardcoded here from the spec text. `PLATFORM_ADMIN` is deliberately
 * excluded: it is a cross-tenant role tied to the default tenant (spec D4),
 * not one a tenant admin should be able to grant one of their own users from
 * this screen. `ORG_ADMIN` is not excluded the same way — unlike
 * `PLATFORM_ADMIN` it's an ordinary tenant-scoped role (server-side
 * `UserAdminService#resolveRoles` validates it against the caller's own
 * tenant's seeded catalog, no extra caller-privilege gate), so any tenant's
 * own `tenant:admin` can grant it exactly like `TENANT_ADMIN`/
 * `ISSUER_OPERATOR` — this is how a parent tenant designates its own
 * `org:admin` operators in the first place.
 */
export const TENANT_ROLES = ['TENANT_ADMIN', 'ISSUER_OPERATOR', 'ORG_ADMIN'] as const;

export type TenantRole = (typeof TENANT_ROLES)[number];

export function roleLabelKey(role: string): string {
  return `users.role.${role}`;
}
