import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { ConsumingPartyStatsEntry } from '../api';
import { useConsumingPartyStats } from '../hooks';
import type { StatsWindowOption } from '../windows';
import { PanelCard } from './PanelCard';
import styles from './TopPartiesPanel.module.css';

const TOP_N = 5;

function totalCalls(party: ConsumingPartyStatsEntry): number {
  return (party.consumed ?? 0) + (party.denied ?? 0);
}

function initials(code: string | undefined): string {
  return (code ?? '?').slice(0, 2).toUpperCase();
}

/**
 * Consuming parties ranked by call volume for the selected window, from
 * `GET /api/v1/stats/consuming-parties` (KH-1.1.5-BE) — real call counts and
 * a derived success rate, no invented ranking.
 */
export function TopPartiesPanel({ windowDays }: { windowDays: StatsWindowOption }) {
  const { t, i18n } = useTranslation();
  const localize = useLocalizedText();
  const stats = useConsumingPartyStats(windowDays);
  const percentFormat = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 1,
  });
  const numberFormat = new Intl.NumberFormat(i18n.language);

  const parties = [...(stats.data?.parties ?? [])]
    .sort((a, b) => totalCalls(b) - totalCalls(a))
    .slice(0, TOP_N);

  return (
    <PanelCard title={t('dashboard.parties.title')}>
      {stats.isPending && <p className={styles.help}>{t('common.loading')}</p>}
      {stats.isError && <ApiErrorBanner error={stats.error} />}
      {stats.isSuccess && parties.length === 0 && (
        <EmptyState
          title={t('dashboard.parties.emptyTitle')}
          body={t('dashboard.parties.emptyBody')}
        />
      )}
      {stats.isSuccess && parties.length > 0 && (
        <ul className={styles.list}>
          {parties.map((party) => (
            <li key={party.partyId} className={styles.row}>
              <span className={styles.initials} aria-hidden="true">
                {initials(party.partyCode)}
              </span>
              <div className={styles.info}>
                <span className={styles.name}>
                  {party.partyName ? localize(party.partyName) : (party.partyCode ?? '—')}
                </span>
                <span className={styles.meta}>
                  {t('dashboard.parties.callsAndRate', {
                    calls: numberFormat.format(totalCalls(party)),
                    rate: percentFormat.format(party.successRate ?? 0),
                  })}
                </span>
              </div>
              <div className={styles.bar} dir="ltr">
                <span
                  className={styles.barFill}
                  style={{ inlineSize: `${Math.round((party.successRate ?? 0) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
