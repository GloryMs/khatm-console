import { useMutation } from '@tanstack/react-query';
import { confirmTotp, enrollTotp, type TotpConfirmRequest } from './api';

/** No query invalidation — the platform exposes no "is TOTP active" status to cache (see README). */
export function useEnrollTotp() {
  return useMutation({ mutationFn: enrollTotp });
}

export function useConfirmTotp() {
  return useMutation({ mutationFn: (req: TotpConfirmRequest) => confirmTotp(req) });
}
