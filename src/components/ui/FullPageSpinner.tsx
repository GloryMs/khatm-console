import { useTranslation } from 'react-i18next';
import styles from './FullPageSpinner.module.css';

export function FullPageSpinner() {
  const { t } = useTranslation();
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      {t('auth.sessionLoading')}
    </div>
  );
}
