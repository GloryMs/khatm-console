type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Tiny pub/sub bridge letting the (non-React) TanStack Query client tell
 * `AuthProvider` that the session is no longer valid, without either module
 * depending on the other's internals. `apiFetch` callers throw `ApiError`;
 * the query client's global `onError` calls {@link notifyUnauthorized} on a
 * 401, and `AuthProvider` reacts by dropping to the unauthenticated state —
 * `RequireAuth` then redirects to `/login` on its own.
 */
export const authBridge = {
  subscribeUnauthorized(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  notifyUnauthorized(): void {
    listeners.forEach((listener) => listener());
  },
};
