import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/useAuth';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import styles from './UserChip.module.css';

export function UserChip() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const localize = useLocalizedText();

  if (!user) return null;

  return (
    <div className={styles.chip}>
      <span className={styles.name}>{localize(user.displayNameI18n) || user.username}</span>
      <button type="button" className={styles.logout} onClick={() => void logout()}>
        {t('auth.logout')}
      </button>
    </div>
  );
}
