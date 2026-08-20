import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { OrgReportCounters, OrgReportEntry } from '../api';
import { useOrgReports } from '../hooks';
import {
  computeOrgReportWindow,
  formatOrgReportWindow,
  type OrgReportWindowOption,
} from '../windows';
import styles from './OrgReportsPanel.module.css';

const WINDOW_OPTIONS: OrgReportWindowOption[] = ['month', 'quarter', 'year'];
const COUNTER_KEYS: (keyof OrgReportCounters)[] = [
  'issued',
  'consumed',
  'revoked',
  'verifyOk',
  'verifyFailed',
];

function counterValue(counters: OrgReportCounters | undefined, key: keyof OrgReportCounters) {
  return counters?.[key] ?? 0;
}

/**
 * The parent's aggregated proofs-not-content report (spec FS-2.5 §4, D3):
 * per-descendant counters (transitive over the full subtree, spec §7) plus
 * a whole-organization rollup, over a fixed calendar window. Numbers only,
 * exactly as the server returns them — no local derivation.
 */
export function OrgReportsPanel() {
  const { t, i18n } = useTranslation();
  const localize = useLocalizedText();
  const [windowOption, setWindowOption] = useState<OrgReportWindowOption>('month');
  // computeOrgReportWindow defaults `to` to `new Date()` — memoized so the window (and the
  // React Query cache key built from it) only changes when the operator picks a different
  // preset, not on every render (an unmemoized call here was a real bug: a fresh `to`
  // timestamp on every render kept changing the query key, triggering a fetch loop).
  const range = useMemo(() => computeOrgReportWindow(windowOption), [windowOption]);
  const reports = useOrgReports(range);

  const columns: DataTableColumn<OrgReportEntry>[] = [
    {
      key: 'child',
      header: t('org.reports.columnChild'),
      cell: (row) => localize(row.nameI18n) || row.tenantSlug,
    },
    ...COUNTER_KEYS.map((key): DataTableColumn<OrgReportEntry> => ({
      key,
      header: t(`org.reports.column.${key}`),
      code: true,
      cell: (row) => counterValue(row.counters, key),
    })),
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <h2>{t('org.reports.title')}</h2>
        <div className={styles.windowSwitch} role="group" aria-label={t('org.reports.windowLabel')}>
          {WINDOW_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={option === windowOption ? styles.windowButtonActive : styles.windowButton}
              aria-pressed={option === windowOption}
              onClick={() => setWindowOption(option)}
            >
              {t(`org.reports.window.${option}`)}
            </button>
          ))}
        </div>
        <span className={`${styles.range} ltr-embed`}>
          {formatOrgReportWindow(reports.data?.window, i18n.language)}
        </span>
      </div>

      {reports.isPending && <p>{t('common.loading')}</p>}
      {reports.isError && <ApiErrorBanner error={reports.error} />}

      {reports.data && (
        <>
          {(reports.data.children ?? []).length === 0 ? (
            <EmptyState title={t('org.reports.emptyChildren')} />
          ) : (
            <>
              <div className={styles.rollupRow}>
                {COUNTER_KEYS.map((key) => (
                  <div key={key} className={styles.rollupStat}>
                    <span className={styles.rollupLabel}>{t(`org.reports.column.${key}`)}</span>
                    <span className={`${styles.rollupValue} ltr-embed`}>
                      {counterValue(reports.data.rollup, key)}
                    </span>
                  </div>
                ))}
              </div>
              <DataTable
                columns={columns}
                rows={reports.data.children ?? []}
                rowKey={(row) => row.tenantId ?? row.tenantSlug ?? ''}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
