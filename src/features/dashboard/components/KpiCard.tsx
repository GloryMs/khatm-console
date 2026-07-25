import { useTranslation } from 'react-i18next';
import styles from './KpiCard.module.css';

export type KpiTone = 'primary' | 'info' | 'success' | 'danger';

interface KpiCardProps {
  label: string;
  value: number;
  icon: string;
  tone: KpiTone;
  /** Percent change vs. the preceding period of equal length; omitted when there's no baseline to compare against (never fabricated). */
  delta?: number;
  /** One value per day, oldest first — real daily counts, not synthetic. */
  spark?: number[];
  /** Real, derived caption — e.g. the stats window's date range. Never a fabricated trend. */
  footer?: string;
}

const TONE_CLASS: Record<KpiTone, string> = {
  primary: styles.primary,
  info: styles.info,
  success: styles.success,
  danger: styles.danger,
};

function formatDelta(delta: number): string {
  const rounded = Math.round(Math.abs(delta) * 10) / 10;
  return `${delta >= 0 ? '▲' : '▼'} ${rounded}%`;
}

/**
 * One KPI card: icon chip, big tabular-figure value, optional period-over-
 * period delta and sparkline (both real, derived from `/api/v1/stats/daily`
 * — see `dailyStats.ts`; omitted rather than fabricated when there's no
 * daily breakdown or no prior-period baseline to compare against), accent
 * bar.
 */
export function KpiCard({ label, value, icon, tone, delta, spark, footer }: KpiCardProps) {
  const { i18n } = useTranslation();
  const sparkMax = spark && spark.length > 0 ? Math.max(...spark, 1) : 1;

  return (
    <div className={`${styles.card} ${TONE_CLASS[tone]}`}>
      <span className={styles.accentBar} aria-hidden="true" />
      <div className={styles.head}>
        <span className={styles.iconChip} aria-hidden="true">
          {icon}
        </span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.valueRow}>
        <span className={`${styles.value} ltr-embed`}>
          {new Intl.NumberFormat(i18n.language).format(value)}
        </span>
        {delta !== undefined && (
          <span className={`${styles.delta} ${delta >= 0 ? styles.deltaUp : styles.deltaDown}`}>
            {formatDelta(delta)}
          </span>
        )}
      </div>
      {spark && spark.length > 0 && (
        <div className={styles.spark} aria-hidden="true">
          {spark.map((v, i) => (
            <span
              key={i}
              className={styles.sparkBar}
              style={{ blockSize: `${Math.max((v / sparkMax) * 100, 4)}%` }}
            />
          ))}
        </div>
      )}
      {footer && <span className={`${styles.footer} ltr-embed`}>{footer}</span>}
    </div>
  );
}
