import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCredential, revokeCredential } from './api';

export const credentialsKeys = {
  all: ['credentials'] as const,
  detail: (id: string) => [...credentialsKeys.all, 'detail', id] as const,
};

/** Fetch a credential's status by its UUID id. Enabled only when an id is set. */
export function useCredential(id: string | null) {
  return useQuery({
    queryKey: id ? credentialsKeys.detail(id) : ['credentials', 'detail', 'none'],
    queryFn: () => getCredential(id as string),
    enabled: Boolean(id),
  });
}

/**
 * Revoke, then refetch the credential so the summary flips to "revoked"
 * without a manual reload.
 */
export function useRevokeCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeCredential(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: credentialsKeys.detail(id) });
    },
  });
}
