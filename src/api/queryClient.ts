import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { authBridge } from '@/auth/authBridge';
import { isApiError } from './errors';

function handleError(error: unknown): void {
  if (isApiError(error) && error.status === 401) {
    authBridge.notifyUnauthorized();
  }
  if (import.meta.env.DEV) {
    console.error(error);
  }
}

/**
 * Work rule 3's "one error layer": every query/mutation error passes through
 * here once. Components resolve the user-facing message themselves (via
 * {@link useErrorMessage}) — this hook only owns the cross-cutting 401 →
 * unauthenticated transition and dev logging.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isApiError(error) && (error.status === 401 || error.status === 403)) return false;
        return failureCount < 2;
      },
    },
  },
});
