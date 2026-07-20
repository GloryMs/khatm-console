import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './RevokeConfirmDialog.module.css';

interface RevokeConfirmDialogProps {
  /** The credential id the operator must retype to arm the confirm button. */
  expectedId: string;
  isRevoking: boolean;
  /** A localized message to surface when the revoke call failed (overlay hides the page banner). */
  errorMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RevokeConfirmDialog({
  expectedId,
  isRevoking,
  errorMessage,
  onConfirm,
  onCancel,
}: RevokeConfirmDialogProps) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the type-to-confirm input on open, reset it if the dialog is reused.
  useEffect(() => {
    setTyped('');
    inputRef.current?.focus();
  }, [expectedId]);

  const matches = typed.trim() === expectedId;

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="revoke-confirm-title"
      >
        <h2 id="revoke-confirm-title" className={styles.title}>
          {t('revoke.confirmTitle')}
        </h2>
        <p className={styles.body}>{t('revoke.confirmBody')}</p>
        <div className={styles.prompt}>
          <label htmlFor="revoke-confirm-typed">{t('revoke.confirmTypePrompt')}</label>
          <span className={`${styles.idToType} ltr-embed`}>{expectedId}</span>
          <input
            id="revoke-confirm-typed"
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          {typed.trim().length > 0 && !matches && (
            <span className={styles.mismatch}>{t('revoke.confirmMismatch')}</span>
          )}
        </div>
        {errorMessage && <p className={styles.mismatch}>{errorMessage}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={isRevoking}>
            {t('revoke.confirmCancel')}
          </button>
          <button
            type="button"
            className={styles.danger}
            onClick={onConfirm}
            disabled={!matches || isRevoking}
          >
            {isRevoking ? t('revoke.revoking') : t('revoke.confirmRevoke')}
          </button>
        </div>
      </div>
    </div>
  );
}
