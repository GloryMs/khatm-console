import { useTranslation } from 'react-i18next';
import styles from './CounterCard.module.css';

interface CounterCardProps {
  label: string;
  value: number;
}

/** One pilot-metrics counter: a localized number plus its label. */
export function CounterCard({ label, value }: CounterCardProps) {
  const { i18n } = useTranslation();
  return (
    <div className={styles.card}>
      <span className={styles.value}>{new Intl.NumberFormat(i18n.language).format(value)}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
