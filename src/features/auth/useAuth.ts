import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthContext';

/** Access the console session. Must be called under `<AuthProvider>`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
