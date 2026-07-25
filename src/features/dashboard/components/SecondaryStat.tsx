import { useTranslation } from 'react-i18next';
import styles from './SecondaryStat.module.css';

interface SecondaryStatProps {
  label: string;
  value: number;
}

/**
 * A compact label:value stat, for counters the new KPI row has no card for
 * (claim-code redemption, consume-denied, verify-failed) — real platform
 * counters, just not part of the design guide's 4-card KPI row.
 */
export function SecondaryStat({ label, value }: SecondaryStatProps) {
  const { i18n } = useTranslation();
  return (
    <div className={styles.stat}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ltr-embed`}>
        {new Intl.NumberFormat(i18n.language).format(value)}
      </span>
    </div>
  );
}
