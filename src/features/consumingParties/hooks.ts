import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activateConsumingParty,
  allowSchema,
  createConsumingParty,
  disallowSchema,
  listConsumingParties,
  mintApiKey,
  suspendConsumingParty,
  type CreateConsumingPartyRequest,
} from './api';

export const consumingPartiesKeys = {
  all: ['consumingParties'] as const,
  list: () => [...consumingPartiesKeys.all, 'list'] as const,
};

/** The admin plane's list of every consuming party for this tenant. */
export function useConsumingParties() {
  return useQuery({ queryKey: consumingPartiesKeys.list(), queryFn: listConsumingParties });
}

/** Every consuming-party write invalidates the list query. */
function useInvalidateAfterWrite() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: consumingPartiesKeys.all });
  };
}

export function useCreateConsumingParty() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (req: CreateConsumingPartyRequest) => createConsumingParty(req),
    onSuccess: invalidate,
  });
}

export function useActivateConsumingParty() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => activateConsumingParty(id),
    onSuccess: invalidate,
  });
}

export function useSuspendConsumingParty() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => suspendConsumingParty(id),
    onSuccess: invalidate,
  });
}

export function useAllowSchema() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: ({ id, schemaId }: { id: string; schemaId: string }) => allowSchema(id, schemaId),
    onSuccess: invalidate,
  });
}

export function useDisallowSchema() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: ({ id, schemaId }: { id: string; schemaId: string }) =>
      disallowSchema(id, schemaId),
    onSuccess: invalidate,
  });
}

export function useMintApiKey() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => mintApiKey(id),
    onSuccess: invalidate,
  });
}
