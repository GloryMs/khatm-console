import { createContext } from 'react';
import type { LoginChallengeResponse, LoginRequest, MeResponse, TotpChallengeRequest } from './api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: MeResponse | null;
  /**
   * Resolves `undefined` on a direct login (session established), or a
   * {@link LoginChallengeResponse} when the account has TOTP active — no
   * session yet, submit the challenge via {@link completeTotpLogin}.
   */
  login: (req: LoginRequest) => Promise<LoginChallengeResponse | undefined>;
  /** Completes a `totpRequired` login challenge and establishes the session. */
  completeTotpLogin: (req: TotpChallengeRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasScope: (scope: string) => boolean;
  /** Re-fetches `GET /auth/me` — used after a password change to clear `mustChangePassword`. */
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
