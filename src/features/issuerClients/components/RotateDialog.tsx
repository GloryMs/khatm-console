import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { FormField, khatmInputClass } from '@/components/ui/FormField';
import { useErrorMessage } from '@/api/useErrorMessage';
import styles from './RotateDialog.module.css';

const MIN_HOURS = 0;
const MAX_HOURS = 72;
const DEFAULT_HOURS = 24;

interface RotateDialogProps {
  keyPrefix: string;
  isBusy: boolean;
  error?: unknown;
  onConfirm: (retireAfterHours: number) => void;
  onCancel: () => void;
}

/**
 * Rotates an issuer client (spec FS-2.7a D10 V4): mints a replacement and
 * puts the current one into a grace window before it stops authenticating.
 * `retireAfterHours` is clamped client-side to the contract's 0-72 range
 * (server-enforced too, KH-ICL-0400) — 0 retires the old client immediately.
 */
export function RotateDialog({ keyPrefix, isBusy, error, onConfirm, onCancel }: RotateDialogProps) {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();
  const [hours, setHours] = useState(DEFAULT_HOURS);

  const valid = Number.isInteger(hours) && hours >= MIN_HOURS && hours <= MAX_HOURS;
  const errorMessage = error ? resolveError(error) : undefined;

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rotate-client-title"
      >
        <h2 id="rotate-client-title" className={styles.title}>
          {t('clients.rotate.title')}
        </h2>
        <p className={`${styles.prefixRow} ltr-embed`}>
          {t('clients.rotate.prefixLabel')} {keyPrefix}
        </p>
        <p className={styles.body}>{t('clients.rotate.body')}</p>
        <FormField
          label={t('clients.rotate.retireAfterHours')}
          htmlFor="rotate-retire-after"
          help={t('clients.rotate.retireAfterHoursHelp', { hours })}
          error={!valid ? t('clients.rotate.retireAfterHoursInvalid') : undefined}
        >
          <input
            id="rotate-retire-after"
            type="number"
            min={MIN_HOURS}
            max={MAX_HOURS}
            step={1}
            className={`${khatmInputClass(!valid ? 'error' : 'default')} ltr-embed`}
            value={Number.isNaN(hours) ? '' : hours}
            onChange={(e) => setHours(e.target.valueAsNumber)}
          />
        </FormField>
        {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
        <div className={styles.actions}>
          <Button variant="secondary" type="button" onClick={onCancel} disabled={isBusy}>
            {t('clients.rotate.cancel')}
          </Button>
          <Button
            variant="danger"
            type="button"
            disabled={!valid || isBusy}
            onClick={() => onConfirm(hours)}
          >
            {isBusy ? t('clients.rotate.rotating') : t('clients.rotate.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
