import { useTranslation } from 'react-i18next';
import styles from './MintedKeyModal.module.css';

interface MintedKeyModalProps {
  rawKey: string;
  onClose: () => void;
}

/**
 * Shows a freshly minted consuming-party API key exactly once — same
 * one-time-display contract as the C1b claim code: copy button, explicit
 * "shown once" warning, no re-fetch path once closed.
 */
export function MintedKeyModal({ rawKey, onClose }: MintedKeyModalProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="minted-key-title"
      >
        <h2 id="minted-key-title" className={styles.title}>
          {t('consumingParties.mint.successTitle')}
        </h2>
        <p className={styles.warning}>{t('consumingParties.mint.shownOnce')}</p>
        <div className={styles.valueRow}>
          <span className={`${styles.value} ltr-embed`}>{rawKey}</span>
          <button
            type="button"
            className={styles.copyButton}
            onClick={() => navigator.clipboard.writeText(rawKey)}
          >
            {t('common.copy')}
          </button>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.confirm} onClick={onClose}>
            {t('consumingParties.mint.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
