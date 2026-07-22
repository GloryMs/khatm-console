import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { CounterCard } from './components/CounterCard';
import {
  ATTENTION_GROUP,
  LIFECYCLE_GROUP,
  resolveCounterValue,
  type CounterGroupDef,
} from './counters';
import { useStats } from './hooks';
import type { StatsWindowOption } from './windows';
import styles from './DashboardPage.module.css';

const WINDOW_OPTIONS: StatsWindowOption[] = [7, 30];

export function DashboardPage() {
  const { t } = useTranslation();
  const [windowDays, setWindowDays] = useState<StatsWindowOption>(30);
  const stats = useStats(windowDays);

  const renderGroup = (group: CounterGroupDef) => (
    <section key={group.titleKey}>
      <h2 className={styles.groupTitle}>{t(group.titleKey)}</h2>
      <div className={styles.grid}>
        {group.counters.map((counter) => (
          <CounterCard
            key={counter.key}
            label={t(counter.labelKey)}
            value={resolveCounterValue(stats.data?.counters, counter.key)}
          />
        ))}
      </div>
    </section>
  );

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('dashboard.title')}</h1>

      <div className={styles.toolbar}>
        <div className={styles.windowSwitch} role="group" aria-label={t('dashboard.windowLabel')}>
          {WINDOW_OPTIONS.map((days) => (
            <button
              key={days}
              type="button"
              className={days === windowDays ? styles.windowButtonActive : styles.windowButton}
              onClick={() => setWindowDays(days)}
              aria-pressed={days === windowDays}
            >
              {t('dashboard.windowDays', { count: days })}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void stats.refetch()}
          disabled={stats.isFetching}
        >
          {stats.isFetching ? t('dashboard.refreshing') : t('dashboard.refresh')}
        </button>
      </div>

      {stats.isPending && <p className={styles.help}>{t('common.loading')}</p>}
      {stats.isError && <ApiErrorBanner error={stats.error} />}

      {renderGroup(LIFECYCLE_GROUP)}
      {renderGroup(ATTENTION_GROUP)}
    </section>
  );
}
