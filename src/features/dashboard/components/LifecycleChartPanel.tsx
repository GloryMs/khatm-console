import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import type { ChartDay } from '../dailyStats';
import { PanelCard } from './PanelCard';
import styles from './LifecycleChartPanel.module.css';

interface LifecycleChartPanelProps {
  chartDays: ChartDay[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
}

const Y_AXIS_TICKS = 4;

/**
 * Stacked daily bars (issued/consumed/revoked) from `/api/v1/stats/daily`
 * (KH-1.1.5-BE) — literal divs, no charting library, per the design guide's
 * own "placeholder-quality" framing; flag as a candidate for a real
 * charting approach if the team wants richer interaction later.
 */
export function LifecycleChartPanel({
  chartDays,
  isPending,
  isError,
  error,
}: LifecycleChartPanelProps) {
  const { t, i18n } = useTranslation();
  const numberFormat = new Intl.NumberFormat(i18n.language);
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' });

  const totals = chartDays.reduce(
    (acc, day) => ({
      issued: acc.issued + day.issued,
      consumed: acc.consumed + day.consumed,
      revoked: acc.revoked + day.revoked,
    }),
    { issued: 0, consumed: 0, revoked: 0 },
  );
  const max = Math.max(...chartDays.map((d) => d.issued + d.consumed + d.revoked), 1);
  const yTicks = Array.from({ length: Y_AXIS_TICKS + 1 }, (_, i) =>
    Math.round((max * (Y_AXIS_TICKS - i)) / Y_AXIS_TICKS),
  );
  // Thin out x-axis labels so they don't collide on a 30-day window.
  const xLabelStep = Math.max(1, Math.ceil(chartDays.length / 7));

  const legend = [
    { key: 'issued', label: t('dashboard.chart.legendIssued'), tone: styles.legendIssued },
    { key: 'consumed', label: t('dashboard.chart.legendConsumed'), tone: styles.legendConsumed },
    { key: 'revoked', label: t('dashboard.chart.legendRevoked'), tone: styles.legendRevoked },
  ] as const;

  return (
    <PanelCard title={t('dashboard.chart.title')} subtitle={t('dashboard.chart.subtitle')}>
      {isPending && <p className={styles.help}>{t('common.loading')}</p>}
      {isError && <ApiErrorBanner error={error} />}
      {!isPending &&
        !isError &&
        chartDays.every((d) => d.issued + d.consumed + d.revoked === 0) && (
          <EmptyState
            title={t('dashboard.chart.emptyTitle')}
            body={t('dashboard.chart.emptyBody')}
          />
        )}
      {!isPending && !isError && chartDays.some((d) => d.issued + d.consumed + d.revoked > 0) && (
        <>
          <div className={styles.legendRow}>
            {legend.map((l) => (
              <span key={l.key} className={styles.legendItem}>
                <span className={`${styles.legendDot} ${l.tone}`} aria-hidden="true" />
                {l.label}{' '}
                <span className={`${styles.legendTotal} ltr-embed`}>
                  {numberFormat.format(totals[l.key])}
                </span>
              </span>
            ))}
          </div>
          <div className={styles.chart} dir="ltr">
            <div className={styles.yAxis}>
              {yTicks.map((tick, i) => (
                <span key={i} className="ltr-embed">
                  {numberFormat.format(tick)}
                </span>
              ))}
            </div>
            <div className={styles.plot}>
              {chartDays.map((day) => {
                const total = day.issued + day.consumed + day.revoked;
                return (
                  <div key={day.date} className={styles.barGroup} title={day.date}>
                    <div
                      className={styles.barStack}
                      style={{ blockSize: `${(total / max) * 100}%` }}
                    >
                      <span
                        className={styles.barIssued}
                        style={{ blockSize: total ? `${(day.issued / total) * 100}%` : '0%' }}
                      />
                      <span
                        className={styles.barConsumed}
                        style={{ blockSize: total ? `${(day.consumed / total) * 100}%` : '0%' }}
                      />
                      <span
                        className={styles.barRevoked}
                        style={{ blockSize: total ? `${(day.revoked / total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={styles.xAxis} dir="ltr">
            <span className={styles.xAxisSpacer} aria-hidden="true" />
            <div className={styles.xAxisLabels}>
              {chartDays.map((day, i) => (
                <span key={day.date} className="ltr-embed">
                  {i % xLabelStep === 0 ? dateFormat.format(new Date(day.date)) : ''}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </PanelCard>
  );
}
