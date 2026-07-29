import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageSpinner } from '@/components/ui/FullPageSpinner';
import { useAuth } from './useAuth';

const CHANGE_PASSWORD_PATH = '/change-password';

/**
 * Route guard: renders nested routes only once a session is confirmed, else
 * redirects to /login. Also enforces the forced-password-change gate (spec
 * FS-2.2 D5/D6): `GET /auth/me`'s `mustChangePassword` flag is the one
 * contract-discoverable signal for this state (platform fix, see
 * docs/STATE.md), checked here — before any other route renders — rather
 * than waiting for an opaque KH-USR-0403 on the first real action.
 */
export function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (user?.mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }
  if (!user?.mustChangePassword && location.pathname === CHANGE_PASSWORD_PATH) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
