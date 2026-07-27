import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activateTenant,
  createTenant,
  getTenant,
  listTenants,
  suspendTenant,
  type CreateTenantRequest,
} from './api';

export const tenantsKeys = {
  all: ['tenants'] as const,
  list: () => [...tenantsKeys.all, 'list'] as const,
  detail: (id: string) => [...tenantsKeys.all, 'detail', id] as const,
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
    mutationFn: (req: CreateTenantRequest) => createTenant(req),
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
