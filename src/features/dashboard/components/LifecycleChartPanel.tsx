import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { PanelCard } from './PanelCard';

/**
 * Design-guide mock: a stacked daily bar chart of issued/consumed/revoked
 * volume. `/api/v1/stats` returns one aggregate per window, not a daily
 * time series, so there is no real data to chart — ships as the card
 * shell only, per explicit sign-off, until a time-series endpoint exists
 * (see `docs/specs/dashboard-v2-backend-needs.md`).
 */
export function LifecycleChartPanel() {
  const { t } = useTranslation();
  return (
    <PanelCard title={t('dashboard.chart.title')} subtitle={t('dashboard.chart.subtitle')}>
      <EmptyState title={t('dashboard.chart.emptyTitle')} body={t('dashboard.chart.emptyBody')} />
    </PanelCard>
  );
}
