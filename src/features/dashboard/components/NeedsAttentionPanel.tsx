import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { PanelCard } from './PanelCard';

/**
 * Design-guide mock: itemized anomaly cards (denied consumes, verification
 * failure-rate spikes, upcoming key rotations). No anomaly-detection
 * endpoint exists yet — ships as the card shell only, per explicit
 * sign-off (see `docs/specs/dashboard-v2-backend-needs.md`). The raw
 * consume-denied/verify-failed counters this would summarize are still
 * shown, for real, in the secondary stats strip above.
 */
export function NeedsAttentionPanel() {
  const { t } = useTranslation();
  return (
    <PanelCard title={t('dashboard.attention.title')}>
      <EmptyState
        title={t('dashboard.attention.emptyTitle')}
        body={t('dashboard.attention.emptyBody')}
      />
    </PanelCard>
  );
}
