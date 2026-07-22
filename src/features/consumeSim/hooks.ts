import { useMutation } from '@tanstack/react-query';
import { simulateConsume, type ConsumeSimParams } from './api';

/** No query cache involvement by design — each attempt is a fresh, unstored call. */
export function useSimulateConsume() {
  return useMutation({
    mutationFn: (params: ConsumeSimParams) => simulateConsume(params),
  });
}
