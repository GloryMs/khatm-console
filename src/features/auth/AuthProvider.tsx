import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authBridge } from '@/auth/authBridge';
import {
  completeTotpLogin as completeTotpLoginRequest,
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  type LoginRequest,
  type MeResponse,
  type TotpChallengeRequest,
} from './api';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';

/**
 * Owns the console session: bootstraps it from `GET /auth/me` on mount,
 * exposes `login`/`logout`, and drops to `unauthenticated` whenever the API
 * client reports a 401 (via {@link authBridge}) so `RequireAuth` can redirect.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<MeResponse | null>(null);

  const bootstrap = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(
    () =>
      authBridge.subscribeUnauthorized(() => {
        setUser(null);
        setStatus('unauthenticated');
      }),
    [],
  );

  const login = useCallback(
    async (req: LoginRequest) => {
      const result = await loginRequest(req);
      if (result?.totpRequired) return result;
      await bootstrap();
      return undefined;
    },
    [bootstrap],
  );

  const completeTotpLogin = useCallback(
    async (req: TotpChallengeRequest) => {
      await completeTotpLoginRequest(req);
      await bootstrap();
    },
    [bootstrap],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const hasScope = useCallback((scope: string) => user?.scopes?.includes(scope) ?? false, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, completeTotpLogin, logout, hasScope, refresh: bootstrap }),
    [status, user, login, completeTotpLogin, logout, hasScope, bootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
