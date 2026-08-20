import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateUserRequest } from '@/features/tenants/api';
import {
  activateChild,
  createChildUser,
  disableChildUser,
  fetchOrgReports,
  listChildren,
  listChildSchemas,
  listChildUsers,
  resetChildUserPassword,
  suspendChild,
  type OrgReportParams,
} from './api';

export const orgKeys = {
  all: ['org'] as const,
  children: () => [...orgKeys.all, 'children'] as const,
  childUsers: (id: string) => [...orgKeys.all, 'children', id, 'users'] as const,
  childSchemas: (id: string) => [...orgKeys.all, 'children', id, 'schemas'] as const,
  reports: (params: OrgReportParams) => [...orgKeys.all, 'reports', params] as const,
};

/** The caller's own direct children (spec FS-2.5 §3). */
export function useChildren() {
  return useQuery({ queryKey: orgKeys.children(), queryFn: listChildren });
}

function useInvalidateChildren() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: orgKeys.children() });
  };
}

export function useSuspendChild() {
  const invalidate = useInvalidateChildren();
  return useMutation({
    mutationFn: (id: string) => suspendChild(id),
    onSuccess: invalidate,
  });
}

export function useActivateChild() {
  const invalidate = useInvalidateChildren();
  return useMutation({
    mutationFn: (id: string) => activateChild(id),
    onSuccess: invalidate,
  });
}

/** A direct child's schemas, read-only. */
export function useChildSchemas(childId: string | undefined) {
  return useQuery({
    queryKey: childId ? orgKeys.childSchemas(childId) : [...orgKeys.all, 'schemas', 'none'],
    queryFn: () => listChildSchemas(childId as string),
    enabled: Boolean(childId),
  });
}

/** A direct child's users, on behalf of it. */
export function useChildUsers(childId: string | undefined) {
  return useQuery({
    queryKey: childId ? orgKeys.childUsers(childId) : [...orgKeys.all, 'users', 'none'],
    queryFn: () => listChildUsers(childId as string),
    enabled: Boolean(childId),
  });
}

export function useCreateChildUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ childId, req }: { childId: string; req: CreateUserRequest }) =>
      createChildUser(childId, req),
    onSuccess: (_data, { childId }) => {
      void queryClient.invalidateQueries({ queryKey: orgKeys.childUsers(childId) });
    },
  });
}

export function useDisableChildUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ childId, userId }: { childId: string; userId: string }) =>
      disableChildUser(childId, userId),
    onSuccess: (_data, { childId }) => {
      void queryClient.invalidateQueries({ queryKey: orgKeys.childUsers(childId) });
    },
  });
}

/** No list invalidation — a password reset doesn't change any field the list renders. */
export function useResetChildUserPassword() {
  return useMutation({
    mutationFn: ({ childId, userId }: { childId: string; userId: string }) =>
      resetChildUserPassword(childId, userId),
  });
}

/** The aggregated proofs-not-content report for the requested window. */
export function useOrgReports(params: OrgReportParams) {
  return useQuery({
    queryKey: orgKeys.reports(params),
    queryFn: () => fetchOrgReports(params),
  });
}
