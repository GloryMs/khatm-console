import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { PanelCard } from './PanelCard';

/**
 * Design-guide mock: top consuming parties ranked by call volume, with a
 * success rate and progress bar. No per-party call-volume/success-rate
 * stats endpoint exists yet — ships as the card shell only, per explicit
 * sign-off (see `docs/specs/dashboard-v2-backend-needs.md`). The
 * registered-party list itself already exists (`/consumers`) but carries
 * none of the usage numbers this panel needs, so it isn't substituted in.
 */
export function TopPartiesPanel() {
  const { t } = useTranslation();
  return (
    <PanelCard title={t('dashboard.parties.title')}>
      <EmptyState
        title={t('dashboard.parties.emptyTitle')}
        body={t('dashboard.parties.emptyBody')}
      />
    </PanelCard>
  );
}
