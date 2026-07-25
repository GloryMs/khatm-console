import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { ActivityItem } from '../api';
import { ACTIVITY_TABS, activityActionMeta } from '../activity';
import { useActivity } from '../hooks';
import { PanelCard } from './PanelCard';
import styles from './RecentActivityPanel.module.css';

const ACTIVITY_LIMIT = 15;

/**
 * The most recent credential-lifecycle events from `GET /api/v1/activity`
 * (KH-1.1.5-BE) — already display-ready (human-readable `entityRef`,
 * resolved consuming-party attribution), so this is a straight render, no
 * client-side joins.
 */
export function RecentActivityPanel() {
  const { t, i18n } = useTranslation();
  const localize = useLocalizedText();
  const [tab, setTab] = useState(ACTIVITY_TABS[0].key);
  const activeTab = ACTIVITY_TABS.find((tb) => tb.key === tab) ?? ACTIVITY_TABS[0];
  const activity = useActivity({ limit: ACTIVITY_LIMIT, event: activeTab.event });
  const dateFormat = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const columns: DataTableColumn<ActivityItem>[] = [
    {
      key: 'ref',
      header: t('dashboard.activity.columns.ref'),
      code: true,
      cell: (row) => row.entityRef ?? '—',
    },
    {
      key: 'event',
      header: t('dashboard.activity.columns.event'),
      cell: (row) => {
        const meta = activityActionMeta(row.action);
        return <StatusBadge tone={meta.tone}>{t(meta.labelKey)}</StatusBadge>;
      },
    },
    {
      key: 'party',
      header: t('dashboard.activity.columns.party'),
      cell: (row) => (row.consumingPartyName ? localize(row.consumingPartyName) : '—'),
    },
    {
      key: 'when',
      header: t('dashboard.activity.columns.when'),
      code: true,
      cell: (row) => (row.occurredAt ? dateFormat.format(new Date(row.occurredAt)) : '—'),
    },
  ];

  return (
    <PanelCard
      title={t('dashboard.activity.title')}
      action={
        <div className={styles.tabs} role="group" aria-label={t('dashboard.activity.title')}>
          {ACTIVITY_TABS.map((tb) => (
            <button
              key={tb.key}
              type="button"
              className={tb.key === tab ? styles.tabActive : styles.tab}
              onClick={() => setTab(tb.key)}
              aria-pressed={tb.key === tab}
            >
              {t(tb.labelKey)}
            </button>
          ))}
        </div>
      }
      noBodyPadding
    >
      {activity.isPending && <p className={styles.help}>{t('common.loading')}</p>}
      {activity.isError && <ApiErrorBanner error={activity.error} />}
      {activity.isSuccess && (
        <DataTable
          columns={columns}
          rows={activity.data.items ?? []}
          rowKey={(row) => `${row.action ?? ''}-${row.entityRef ?? ''}-${row.occurredAt ?? ''}`}
          emptyState={
            <EmptyState
              title={t('dashboard.activity.emptyTitle')}
              body={t('dashboard.activity.emptyBody')}
            />
          }
        />
      )}
    </PanelCard>
  );
}
