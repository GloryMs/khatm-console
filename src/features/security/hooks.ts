import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { confirmTotp, enrollTotp, type TotpConfirmRequest } from './api';

export function useEnrollTotp() {
  return useMutation({ mutationFn: enrollTotp });
}

/**
 * Re-fetches `/auth/me` on success so `user.totpEnabled` (KH-2.4x) flips to
 * `true` without a full page reload — the same `AuthContext.refresh`
 * `ChangePasswordForm` already uses to clear `mustChangePassword` in place.
 */
export function useConfirmTotp() {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: (req: TotpConfirmRequest) => confirmTotp(req),
    onSuccess: () => {
      void refresh();
    },
  });
}
