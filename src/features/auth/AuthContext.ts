import { createContext } from 'react';
import type { LoginRequest, MeResponse } from './api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: MeResponse | null;
  login: (req: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasScope: (scope: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
