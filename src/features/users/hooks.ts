import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  disableUser,
  listUsers,
  lockUser,
  replaceRoles,
  resetPassword,
  resetTotp,
  unlockUser,
  type CreateUserRequest,
} from './api';

export const usersKeys = {
  all: ['users'] as const,
  list: () => [...usersKeys.all, 'list'] as const,
};

/** The caller's own tenant's users, newest first. */
export function useUsers() {
  return useQuery({ queryKey: usersKeys.list(), queryFn: listUsers });
}

/** Every user write invalidates the list query. */
function useInvalidateAfterWrite() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: usersKeys.all });
  };
}

export function useCreateUser() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (req: CreateUserRequest) => createUser(req),
    onSuccess: invalidate,
  });
}

export function useReplaceRoles() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: string[] }) => replaceRoles(id, roles),
    onSuccess: invalidate,
  });
}

export function useLockUser() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => lockUser(id),
    onSuccess: invalidate,
  });
}

export function useUnlockUser() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => unlockUser(id),
    onSuccess: invalidate,
  });
}

export function useDisableUser() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => disableUser(id),
    onSuccess: invalidate,
  });
}

export function useResetPassword() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (id: string) => resetPassword(id),
    onSuccess: invalidate,
  });
}

/** No list invalidation — TOTP reset doesn't change any field `UserList` renders. */
export function useResetTotp() {
  return useMutation({ mutationFn: (id: string) => resetTotp(id) });
}
