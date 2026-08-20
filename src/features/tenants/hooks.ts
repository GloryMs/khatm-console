import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activateTenant,
  createTenant,
  createUserInTenant,
  getTenant,
  listTenants,
  listUsersInTenant,
  resetTotpInTenant,
  setParentTenant,
  suspendTenant,
  type CreateUserRequest,
  type OnboardTenantRequest,
} from './api';

export const tenantsKeys = {
  all: ['tenants'] as const,
  list: () => [...tenantsKeys.all, 'list'] as const,
  detail: (id: string) => [...tenantsKeys.all, 'detail', id] as const,
  users: (id: string) => [...tenantsKeys.all, 'detail', id, 'users'] as const,
};

/** The platform's tenants, newest first. */
export function useTenants() {
  return useQuery({ queryKey: tenantsKeys.list(), queryFn: listTenants });
}

/** One tenant's full detail, for the detail view. */
export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: id ? tenantsKeys.detail(id) : [...tenantsKeys.all, 'detail', 'none'],
    queryFn: () => getTenant(id as string),
    enabled: Boolean(id),
  });
}

/** Every tenant write invalidates the list and that tenant's own detail query. */
function useInvalidateAfterWrite() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: tenantsKeys.all });
  };
}

export function useCreateTenant() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (req: OnboardTenantRequest) => createTenant(req),
    onSuccess: invalidate,
  });
}

export function useSuspendTenant() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => suspendTenant(id),
    onSuccess: invalidate,
  });
}

export function useActivateTenant() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => activateTenant(id),
    onSuccess: invalidate,
  });
}

/**
 * Sets or clears a tenant's parent (spec FS-2.5 §2). Invalidates the whole
 * `tenants` query family — both the list (parent badge, other tenants'
 * children derivations) and this tenant's own detail change.
 */
export function useSetParentTenant() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: ({ id, parentSlug }: { id: string; parentSlug: string | undefined }) =>
      setParentTenant(id, parentSlug),
    onSuccess: invalidate,
  });
}

/** A tenant's users, on behalf of that tenant (spec FS-2.2 D4). Requires `platform:admin`. */
export function useTenantUsers(tenantId: string | undefined) {
  return useQuery({
    queryKey: tenantId ? tenantsKeys.users(tenantId) : [...tenantsKeys.all, 'users', 'none'],
    queryFn: () => listUsersInTenant(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

/**
 * Adds a user to a tenant other than the caller's own (spec FS-2.2 D4
 * on-behalf-of); invalidates that tenant's on-behalf-of users list.
 */
export function useCreateUserInTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, req }: { tenantId: string; req: CreateUserRequest }) =>
      createUserInTenant(tenantId, req),
    onSuccess: (_data, { tenantId }) => {
      void queryClient.invalidateQueries({ queryKey: tenantsKeys.users(tenantId) });
    },
  });
}

/**
 * Resets a user's TOTP enrollment on behalf of a tenant other than the
 * caller's own (spec FS-2.2 D4 on-behalf-of). No list invalidation — TOTP
 * reset doesn't change any field the on-behalf-of `UserList` renders.
 */
export function useResetTotpInTenant() {
  return useMutation({
    mutationFn: ({ tenantId, userId }: { tenantId: string; userId: string }) =>
      resetTotpInTenant(tenantId, userId),
  });
}
