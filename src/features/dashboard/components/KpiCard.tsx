import { useTranslation } from 'react-i18next';
import styles from './KpiCard.module.css';

export type KpiTone = 'primary' | 'info' | 'success' | 'danger';

interface KpiCardProps {
  label: string;
  value: number;
  icon: string;
  tone: KpiTone;
  /** Real, derived caption — e.g. the stats window's date range. Never a fabricated trend. */
  footer?: string;
}

const TONE_CLASS: Record<KpiTone, string> = {
  primary: styles.primary,
  info: styles.info,
  success: styles.success,
  danger: styles.danger,
};

/**
 * One KPI card: icon chip, big tabular-figure value, accent bar. No
 * delta/sparkline — the platform's `/api/v1/stats` is a single-window
 * aggregate with no previous-period or daily breakdown to compute either
 * from (see `docs/specs/dashboard-v2-backend-needs.md`).
 */
export function KpiCard({ label, value, icon, tone, footer }: KpiCardProps) {
  const { i18n } = useTranslation();
  return (
    <div className={`${styles.card} ${TONE_CLASS[tone]}`}>
      <span className={styles.accentBar} aria-hidden="true" />
      <div className={styles.head}>
        <span className={styles.iconChip} aria-hidden="true">
          {icon}
        </span>
        <span className={styles.label}>{label}</span>
      </div>
      <span className={`${styles.value} ltr-embed`}>
        {new Intl.NumberFormat(i18n.language).format(value)}
      </span>
      {footer && <span className={`${styles.footer} ltr-embed`}>{footer}</span>}
    </div>
  );
}
