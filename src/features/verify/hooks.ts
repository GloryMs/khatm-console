import { useMutation } from '@tanstack/react-query';
import { verifyPresentation, type VerifyRequest } from './api';

/** Verify a presentation. Result carries `valid` plus the server's localized reason. */
export function useVerifyPresentation() {
  return useMutation({
    mutationFn: (req: VerifyRequest) => verifyPresentation(req),
  });
}
