import type { ReactNode } from 'react';
import { NoPermission } from '@/components/ui/NoPermission';
import { useAuth } from './useAuth';

/**
 * Gates its children behind a session scope, rendering a localized
 * "no permission" state instead of the raw content when the scope is
 * missing. Built now (foundation) so C1 feature screens can wrap
 * scope-restricted actions in it directly.
 */
export function RequireScope({ scope, children }: { scope: string; children: ReactNode }) {
  const { hasScope } = useAuth();
  if (!hasScope(scope)) return <NoPermission />;
  return <>{children}</>;
}
