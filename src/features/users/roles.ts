/**
 * The fixed role catalog seeded per tenant (spec FS-2.2 D3/D5) — not exposed
 * as a contract enum (mirrors `TenantType`'s precedent from C5), so the
 * literal codes are hardcoded here from the spec text. `PLATFORM_ADMIN` is
 * deliberately excluded: it is a cross-tenant role tied to the default
 * tenant (spec D4), not one a tenant admin should be able to grant one of
 * their own users from this screen.
 */
export const TENANT_ROLES = ['TENANT_ADMIN', 'ISSUER_OPERATOR'] as const;

export type TenantRole = (typeof TENANT_ROLES)[number];

export function roleLabelKey(role: string): string {
  return `users.role.${role}`;
}
