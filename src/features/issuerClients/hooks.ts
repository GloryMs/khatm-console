import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createIssuerClient,
  listIssuerClients,
  resumeIssuerClient,
  revokeIssuerClient,
  rotateIssuerClient,
  suspendIssuerClient,
  type CreateIssuerClientRequest,
  type RotateIssuerClientRequest,
} from './api';

export const issuerClientKeys = {
  all: ['issuerClients'] as const,
  list: () => [...issuerClientKeys.all, 'list'] as const,
};

/** The caller's tenant's issuer clients. Pass `enabled: hasScope('key:manage')`. */
export function useIssuerClients(enabled: boolean) {
  return useQuery({
    queryKey: issuerClientKeys.list(),
    queryFn: listIssuerClients,
    enabled,
  });
}

function useInvalidateIssuerClients() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: issuerClientKeys.list() });
  };
}

/**
 * Creates an issuer client. The one-time `apiKey`/`holderHmacSecret` live only
 * in the resolved value of `mutateAsync` — callers must hold them in local
 * component state and never let them enter the query cache.
 */
export function useCreateIssuerClient() {
  const invalidate = useInvalidateIssuerClients();
  return useMutation({
    mutationFn: (req: CreateIssuerClientRequest) => createIssuerClient(req),
    onSuccess: invalidate,
  });
}

/** Same one-time-secret caution as {@link useCreateIssuerClient}. */
export function useRotateIssuerClient() {
  const invalidate = useInvalidateIssuerClients();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: RotateIssuerClientRequest }) =>
      rotateIssuerClient(id, req),
    onSuccess: invalidate,
  });
}

export function useSuspendIssuerClient() {
  const invalidate = useInvalidateIssuerClients();
  return useMutation({
    mutationFn: (id: string) => suspendIssuerClient(id),
    onSuccess: invalidate,
  });
}

export function useResumeIssuerClient() {
  const invalidate = useInvalidateIssuerClients();
  return useMutation({
    mutationFn: (id: string) => resumeIssuerClient(id),
    onSuccess: invalidate,
  });
}

export function useRevokeIssuerClient() {
  const invalidate = useInvalidateIssuerClients();
  return useMutation({
    mutationFn: (id: string) => revokeIssuerClient(id),
    onSuccess: invalidate,
  });
}
