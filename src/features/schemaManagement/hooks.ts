import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { issuanceKeys } from '@/features/issuance/hooks';
import { schemasKeys } from '@/features/schemas/hooks';
import {
  archiveSchema,
  createSchema,
  createSchemaVersion,
  getSchema,
  listSchemas,
  publishSchema,
  updateSchema,
  type SchemaAuthoringRequest,
  type SchemaCreateRequest,
} from '@/features/schemas/api';

export const schemaManagementKeys = {
  all: ['schemaManagement'] as const,
  list: () => [...schemaManagementKeys.all, 'list'] as const,
  detail: (id: string) => [...schemaManagementKeys.all, 'detail', id] as const,
};

/** All schemas, every status — the admin management view's list. */
export function useManagedSchemas() {
  return useQuery({ queryKey: schemaManagementKeys.list(), queryFn: listSchemas });
}

/** One schema's full detail, for the builder's edit/new-version prefill. */
export function useManagedSchema(id: string | null) {
  return useQuery({
    queryKey: id
      ? schemaManagementKeys.detail(id)
      : [...schemaManagementKeys.all, 'detail', 'none'],
    queryFn: () => getSchema(id as string),
    enabled: Boolean(id),
  });
}

/**
 * Every schema write invalidates the management list, the read-only catalog
 * (`/schemas`), and both Issue pickers' queries — so a freshly published (or
 * archived, or `requiresAttestation`-toggled) schema shows up there with no
 * code change, on whichever picker it now belongs to.
 */
function useInvalidateAfterWrite() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: schemaManagementKeys.all });
    void queryClient.invalidateQueries({ queryKey: schemasKeys.list() });
    void queryClient.invalidateQueries({ queryKey: issuanceKeys.schemas() });
    void queryClient.invalidateQueries({ queryKey: issuanceKeys.attestedSchemas() });
  };
}

export function useCreateSchema() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (req: SchemaCreateRequest) => createSchema(req),
    onSuccess: invalidate,
  });
}

export function useUpdateSchema() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: SchemaAuthoringRequest }) => updateSchema(id, req),
    onSuccess: invalidate,
  });
}

export function usePublishSchema() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => publishSchema(id),
    onSuccess: invalidate,
  });
}

export function useArchiveSchema() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => archiveSchema(id),
    onSuccess: invalidate,
  });
}

export function useCreateSchemaVersion() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: SchemaAuthoringRequest }) =>
      createSchemaVersion(id, req),
    onSuccess: invalidate,
  });
}
