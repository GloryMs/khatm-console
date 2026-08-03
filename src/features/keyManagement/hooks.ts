import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSigningKeyStatuses,
  retireSigningKey,
  rotateSigningKey,
  type RetireKeyRequest,
} from './api';

export const keyManagementKeys = {
  all: ['keyManagement'] as const,
  list: () => [...keyManagementKeys.all, 'list'] as const,
};

/** Signing keys rotate on the order of weeks/months — a 5-minute staleness window is plenty. */
const SIGNING_KEYS_REFRESH_MS = 5 * 60_000;

/**
 * Every signing key's lifecycle status — the Key Management page, and the
 * dashboard's read-only glance (same query key, shared cache: a rotate/retire
 * here refreshes the dashboard panel too, and vice versa).
 * `key:manage`-scoped on the server; pass `enabled: hasScope('key:manage')`
 * so an operator without that scope never fires a request that can only 403.
 */
export function useSigningKeyStatuses(enabled: boolean) {
  return useQuery({
    queryKey: keyManagementKeys.list(),
    queryFn: getSigningKeyStatuses,
    enabled,
    staleTime: SIGNING_KEYS_REFRESH_MS,
    refetchInterval: SIGNING_KEYS_REFRESH_MS,
  });
}

/** Rotates the tenant's signing key; refetches the signing-keys list on success. */
export function useRotateKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rotateSigningKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keyManagementKeys.list() }),
  });
}

/** Retires a RETIRING key (optionally forcing past the min-age guard); refetches the list on success. */
export function useRetireKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kid, force }: { kid: string } & RetireKeyRequest) =>
      retireSigningKey(kid, { force }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keyManagementKeys.list() }),
  });
}
