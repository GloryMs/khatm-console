import { zodResolver } from '@hookform/resolvers/zod';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { SecretReveal } from '@/components/ui/SecretReveal';
import { copyToClipboard } from '@/components/ui/clipboard';
import { useConfirmTotp, useEnrollTotp } from '../hooks';
import { printRecoveryCodes } from '../printRecoveryCodes';
import styles from './TotpEnrollDialog.module.css';

function buildConfirmSchema(t: TFunction) {
  return z.object({ code: z.string().min(1, t('security.totp.confirmCodeRequired')) });
}

type ConfirmFormValues = z.infer<ReturnType<typeof buildConfirmSchema>>;

interface TotpEnrollDialogProps {
  onClose: () => void;
}

/**
 * The enrollment flow (spec FS-2.2 V1): generate a secret (QR + manual
 * Base32 fallback), confirm it with a live code from the authenticator app,
 * then show the 10 one-time recovery codes. Steps are derived from mutation
 * data rather than separate step state — `enroll` must run before `confirm`
 * is possible, and `confirm`'s success is itself the terminal step.
 */
export function TotpEnrollDialog({ onClose }: TotpEnrollDialogProps) {
  const { t } = useTranslation();
  const enroll = useEnrollTotp();
  const confirm = useConfirmTotp();
  const confirmSchema = useMemo(() => buildConfirmSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmFormValues>({ resolver: zodResolver(confirmSchema) });

  const onConfirmSubmit = handleSubmit(async (values) => {
    try {
      await confirm.mutateAsync({ code: values.code.trim() });
    } catch {
      // surfaced via confirm.isError/error below
    }
  });

  const recoveryCodes = confirm.data?.recoveryCodes ?? [];

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="totp-enroll-title"
      >
        <h2 id="totp-enroll-title" className={styles.title}>
          {t('security.totp.enrollTitle')}
        </h2>

        {!enroll.data && (
          <>
            <p className={styles.help}>{t('security.totp.enrollIntro')}</p>
            <ApiErrorBanner error={enroll.isError ? enroll.error : undefined} />
            <div className={styles.actions}>
              <Button variant="secondary" onClick={onClose} disabled={enroll.isPending}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={() => enroll.mutate()} disabled={enroll.isPending}>
                {enroll.isPending ? t('security.totp.generating') : t('security.totp.generateCta')}
              </Button>
            </div>
          </>
        )}

        {enroll.data && !confirm.data && (
          <form className={styles.form} onSubmit={onConfirmSubmit} noValidate>
            <p className={styles.help}>{t('security.totp.scanHint')}</p>
            {enroll.data.otpAuthUri && (
              <div className={styles.qrRow}>
                <QRCodeSVG value={enroll.data.otpAuthUri} size={200} />
              </div>
            )}
            {enroll.data.secretBase32 && (
              <SecretReveal
                label={t('security.totp.manualSecretLabel')}
                value={enroll.data.secretBase32}
                onceLabel={t('common.shownOnce')}
                revealLabel={t('common.reveal')}
                hideLabel={t('common.hide')}
                helperText={t('security.totp.manualSecretHelper')}
                copyLabel={t('common.copy')}
                onCopy={(value) => void copyToClipboard(value)}
                copiedMessage={t('common.copied')}
              />
            )}
            <label className={styles.field}>
              <span>{t('security.totp.confirmCode')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                className={`khatm-input ltr-embed${errors.code ? ' khatm-input--error' : ''}`}
                {...register('code')}
              />
              {errors.code && <span className={styles.fieldError}>{errors.code.message}</span>}
            </label>
            <ApiErrorBanner error={confirm.isError ? confirm.error : undefined} />
            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting || confirm.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting || confirm.isPending}>
                {confirm.isPending ? t('security.totp.confirming') : t('security.totp.confirmCta')}
              </Button>
            </div>
          </form>
        )}

        {confirm.data && (
          <>
            <p className={styles.help}>{t('security.totp.recoveryCodesIntro')}</p>
            <SecretReveal
              label={t('security.totp.recoveryCodesLabel')}
              value={recoveryCodes.join('\n')}
              onceLabel={t('common.shownOnce')}
              revealLabel={t('common.reveal')}
              hideLabel={t('common.hide')}
              helperText={t('security.totp.recoveryCodesHelper')}
              copyLabel={t('common.copy')}
              onCopy={(value) => void copyToClipboard(value)}
              copiedMessage={t('common.copied')}
              printLabel={t('common.print')}
              onPrint={() =>
                printRecoveryCodes(t('security.totp.recoveryCodesPrintTitle'), recoveryCodes)
              }
            />
            <div className={styles.actions}>
              <Button variant="primary" onClick={onClose}>
                {t('common.done')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
