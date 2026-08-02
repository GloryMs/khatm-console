import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/api/errors';
import { useErrorMessage } from '@/api/useErrorMessage';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import styles from './RetireKeyDialog.module.css';

const MIN_AGE_ERROR_CODE = 'KH-KEY-0422';

interface RetireKeyDialogProps {
  kid: string;
  isBusy: boolean;
  /** The retire mutation's current error (if any) — drives the min-age-blocked step. */
  error: unknown;
  onConfirm: (force: boolean) => void;
  onCancel: () => void;
}

/**
 * Staged retire flow (spec FS-2.3 C8 brief): a plain confirm first; if the
 * server refuses with KH-KEY-0422 (min-retiring-age not reached), an inline
 * explanation offers a force path; forcing requires a second, visually
 * severe confirmation (bypasses an intentional safety guard, is audited,
 * and can't be undone) rather than silently retrying with `force: true`.
 */
export function RetireKeyDialog({ kid, isBusy, error, onConfirm, onCancel }: RetireKeyDialogProps) {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();
  const [forceArmed, setForceArmed] = useState(false);

  const blockedByMinAge = isApiError(error) && error.code === MIN_AGE_ERROR_CODE;
  const otherErrorMessage = error && !blockedByMinAge ? resolveError(error) : undefined;

  const kidRow = (
    <p className={styles.kidRow}>
      <span>{t('dashboard.keys.retire.kidLabel')}</span> <span className="ltr-embed">{kid}</span>
    </p>
  );

  if (blockedByMinAge && !forceArmed) {
    return (
      <div className={styles.overlay} role="presentation">
        <div
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="retire-blocked-title"
        >
          <h2 id="retire-blocked-title" className={styles.title}>
            {t('dashboard.keys.retire.blocked.title')}
          </h2>
          {kidRow}
          <Banner tone="warning">
            <p>{resolveError(error)}</p>
            <p>{t('dashboard.keys.retire.blocked.explanation')}</p>
          </Banner>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onCancel} disabled={isBusy}>
              {t('dashboard.keys.retire.cancel')}
            </Button>
            <Button variant="danger" onClick={() => setForceArmed(true)} disabled={isBusy}>
              {t('dashboard.keys.retire.blocked.forceCta')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (forceArmed) {
    return (
      <div className={styles.overlay} role="presentation">
        <div
          className={`${styles.dialog} ${styles.severe}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="retire-force-title"
        >
          <h2 id="retire-force-title" className={styles.title}>
            <span aria-hidden="true">⚠ </span>
            {t('dashboard.keys.retire.force.title')}
          </h2>
          {kidRow}
          <p className={styles.body}>{t('dashboard.keys.retire.force.body')}</p>
          {otherErrorMessage && <p className={styles.errorText}>{otherErrorMessage}</p>}
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setForceArmed(false)} disabled={isBusy}>
              {t('dashboard.keys.retire.cancel')}
            </Button>
            <Button variant="danger" onClick={() => onConfirm(true)} disabled={isBusy}>
              {isBusy
                ? t('dashboard.keys.retire.force.confirming')
                : t('dashboard.keys.retire.force.confirm')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="retire-confirm-title"
      >
        <h2 id="retire-confirm-title" className={styles.title}>
          {t('dashboard.keys.retire.title')}
        </h2>
        {kidRow}
        <p className={styles.body}>{t('dashboard.keys.retire.body')}</p>
        {otherErrorMessage && <p className={styles.errorText}>{otherErrorMessage}</p>}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} disabled={isBusy}>
            {t('dashboard.keys.retire.cancel')}
          </Button>
          <Button variant="primary" onClick={() => onConfirm(false)} disabled={isBusy}>
            {isBusy ? t('dashboard.keys.retire.retiring') : t('dashboard.keys.retire.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
