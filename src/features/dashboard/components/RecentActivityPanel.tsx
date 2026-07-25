import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { PanelCard } from './PanelCard';

/**
 * Design-guide mock: a tabbed, per-event activity feed (ref/event/party/
 * when). No audit-feed endpoint exists yet — ships as the card shell only,
 * per explicit sign-off (see `docs/specs/dashboard-v2-backend-needs.md`).
 * Tabs aren't rendered: they'd control a list that doesn't exist, which
 * would be a non-functional control, not a placeholder.
 */
export function RecentActivityPanel() {
  const { t } = useTranslation();
  return (
    <PanelCard title={t('dashboard.activity.title')}>
      <EmptyState
        title={t('dashboard.activity.emptyTitle')}
        body={t('dashboard.activity.emptyBody')}
      />
    </PanelCard>
  );
}
