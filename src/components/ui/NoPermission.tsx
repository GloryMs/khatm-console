import { useTranslation } from 'react-i18next';
import styles from './NoPermission.module.css';

export function NoPermission() {
  const { t } = useTranslation();
  return (
    <div className={styles.wrap} role="alert">
      <h2>{t('errors.noPermission.title')}</h2>
      <p>{t('errors.noPermission.body')}</p>
    </div>
  );
}
