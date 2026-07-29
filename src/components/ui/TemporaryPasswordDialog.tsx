import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { SecretReveal } from './SecretReveal';
import { copyToClipboard } from './clipboard';
import styles from './TemporaryPasswordDialog.module.css';

interface TemporaryPasswordDialogProps {
  titleId: string;
  title: string;
  username: string;
  password: string;
  onClose: () => void;
}

/**
 * Shows a freshly generated temporary password exactly once — reuses the
 * shared {@link SecretReveal} shown-once-secret pattern (same
 * copy-once/regenerate-warning UX as consuming-party API keys and claim
 * codes) for user creation and password-reset flows (spec FS-2.2 D5/D6).
 */
export function TemporaryPasswordDialog({
  titleId,
  title,
  username,
  password,
  onClose,
}: TemporaryPasswordDialogProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={`${styles.username} ltr-embed`}>{username}</p>
        <SecretReveal
          label={t('users.temporaryPassword.label')}
          value={password}
          onceLabel={t('common.shownOnce')}
          revealLabel={t('common.reveal')}
          hideLabel={t('common.hide')}
          helperText={t('users.temporaryPassword.helper')}
          copyLabel={t('common.copy')}
          onCopy={(value) => void copyToClipboard(value)}
          copiedMessage={t('common.copied')}
        />
        <div className={styles.actions}>
          <Button variant="primary" onClick={onClose}>
            {t('common.done')}
          </Button>
        </div>
      </div>
    </div>
  );
}
