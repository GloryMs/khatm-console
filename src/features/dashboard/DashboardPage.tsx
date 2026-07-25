import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { buildStatsCsv, downloadCsv } from './csv';
import { PRIMARY_KPIS, resolveCounterValue, SECONDARY_COUNTERS } from './counters';
import {
  buildChartDays,
  buildSparkline,
  computeDeltaPercent,
  splitDailyEntries,
  sumCounter,
} from './dailyStats';
import { KpiCard } from './components/KpiCard';
import { SecondaryStat } from './components/SecondaryStat';
import { LifecycleChartPanel } from './components/LifecycleChartPanel';
import { SigningKeysPanel } from './components/SigningKeysPanel';
import { RecentActivityPanel } from './components/RecentActivityPanel';
import { NeedsAttentionPanel } from './components/NeedsAttentionPanel';
import { TopPartiesPanel } from './components/TopPartiesPanel';
import { useDailyStats, useStats } from './hooks';
import { computeWindow, formatWindowRange, type StatsWindowOption } from './windows';
import styles from './DashboardPage.module.css';

const WINDOW_OPTIONS: StatsWindowOption[] = [7, 30];

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [windowDays, setWindowDays] = useState<StatsWindowOption>(30);
  const stats = useStats(windowDays);
  const dailyStats = useDailyStats(windowDays);

  const windowRange = formatWindowRange(stats.data?.window, i18n.language);
  const lastUpdated = stats.dataUpdatedAt
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
        stats.dataUpdatedAt,
      )
    : undefined;

  const now = new Date();
  const boundary = new Date(computeWindow(windowDays, now).from);
  const { previous, current } = dailyStats.isSuccess
    ? splitDailyEntries(dailyStats.data.days ?? [], boundary)
    : { previous: [], current: [] };
  const chartDays = buildChartDays(current, windowDays, now);

  const handleExport = () => {
    const csv = buildStatsCsv(stats.data?.counters, stats.data?.window);
    downloadCsv(`khatm-dashboard-${windowDays}d.csv`, csv);
  };

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.headline}>
          <h1 className={styles.headlineText}>{t('dashboard.headline')}</h1>
          <span className={styles.headlineSub}>
            {t('dashboard.headlineSub')}
            {lastUpdated && (
              <>
                {' · '}
                <span className="ltr-embed">{lastUpdated}</span>
              </>
            )}
          </span>
        </div>
        <div className={styles.rangeSwitch} role="group" aria-label={t('dashboard.windowLabel')}>
          {WINDOW_OPTIONS.map((days) => (
            <button
              key={days}
              type="button"
              className={days === windowDays ? styles.rangeButtonActive : styles.rangeButton}
              onClick={() => setWindowDays(days)}
              aria-pressed={days === windowDays}
            >
              {t('dashboard.windowDays', { count: days })}
            </button>
          ))}
        </div>
        <Button variant="secondary" onClick={handleExport} disabled={!stats.isSuccess}>
          {t('dashboard.export')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => void stats.refetch()}
          disabled={stats.isFetching}
        >
          {stats.isFetching ? t('dashboard.refreshing') : t('dashboard.refresh')}
        </Button>
      </div>

      {stats.isPending && <p className={styles.help}>{t('common.loading')}</p>}
      {stats.isError && <ApiErrorBanner error={stats.error} />}

      <div className={styles.kpiRow}>
        {PRIMARY_KPIS.map((kpi) => (
          <KpiCard
            key={kpi.key}
            label={t(kpi.labelKey)}
            value={resolveCounterValue(stats.data?.counters, kpi.key)}
            icon={kpi.icon}
            tone={kpi.tone}
            footer={windowRange}
            delta={
              dailyStats.isSuccess
                ? computeDeltaPercent(sumCounter(current, kpi.key), sumCounter(previous, kpi.key))
                : undefined
            }
            spark={
              dailyStats.isSuccess ? buildSparkline(current, kpi.key, windowDays, now) : undefined
            }
          />
        ))}
      </div>

      <div className={styles.secondaryRow}>
        {SECONDARY_COUNTERS.map((counter) => (
          <SecondaryStat
            key={counter.key}
            label={t(counter.labelKey)}
            value={resolveCounterValue(stats.data?.counters, counter.key)}
          />
        ))}
      </div>

      <div className={styles.middleGrid}>
        <LifecycleChartPanel
          chartDays={chartDays}
          isPending={dailyStats.isPending}
          isError={dailyStats.isError}
          error={dailyStats.error}
        />
        <SigningKeysPanel />
      </div>

      <div className={styles.bottomGrid}>
        <RecentActivityPanel />
        <div className={styles.rightColumn}>
          <NeedsAttentionPanel />
          <TopPartiesPanel windowDays={windowDays} />
        </div>
      </div>
    </section>
  );
}
