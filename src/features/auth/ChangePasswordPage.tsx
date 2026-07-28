import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ChangePasswordForm } from './components/ChangePasswordForm';
import styles from './LoginPage.module.css';

/**
 * The forced-password-change take-over screen (spec FS-2.2 D5/D6):
 * `RequireAuth` routes a session here before any other route renders
 * whenever `mustChangePassword` is set, so a temporary-password user must
 * clear it before doing anything else.
 */
export function ChangePasswordPage() {
  const { t } = useTranslation();

  return (
    <main className={styles.page}>
      <div className={styles.topBar}>
        <LanguageSwitcher />
      </div>
      <div className={styles.card}>
        <p className={styles.brand}>{t('app.brand')}</p>
        <h1 className={styles.title}>{t('auth.changePassword.title')}</h1>
        <p>{t('auth.changePassword.subtitle')}</p>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
