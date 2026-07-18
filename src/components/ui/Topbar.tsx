import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserChip } from './UserChip';
import styles from './Topbar.module.css';

export function Topbar() {
  const { t } = useTranslation();
  return (
    <header className={styles.topbar} aria-label={t('shell.topbarLabel')}>
      <div className={styles.actions}>
        <LanguageSwitcher />
        <UserChip />
      </div>
    </header>
  );
}
