import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { useAuth } from '../useAuth';
import styles from './LoginForm.module.css';

function buildSchema(t: TFunction, useRecovery: boolean) {
  return z.object({
    value: z
      .string()
      .min(
        1,
        useRecovery
          ? t('auth.totpChallenge.recoveryRequired')
          : t('auth.totpChallenge.codeRequired'),
      ),
  });
}

interface FormValues {
  value: string;
}

interface TotpChallengeFormProps {
  challengeId: string;
  onBack: () => void;
}

/**
 * The code-entry step of a TOTP-gated login (spec FS-2.2 V1): a single
 * `challengeId` from `POST /auth/login` is completed here with either a live
 * authenticator code or a one-time recovery code — never both, per the
 * contract's `TotpChallengeRequest`. Errors stay generic (no wrong-code vs.
 * lockout distinction), matching the platform's own single 401 for every
 * failure reason here, same as password login.
 */
export function TotpChallengeForm({ challengeId, onBack }: TotpChallengeFormProps) {
  const { t } = useTranslation();
  const { completeTotpLogin } = useAuth();
  const [useRecovery, setUseRecovery] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const schema = useMemo(() => buildSchema(t, useRecovery), [t, useRecovery]);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    setFocus('value');
  }, [setFocus, useRecovery]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await completeTotpLogin({
        challengeId,
        ...(useRecovery ? { recoveryCode: values.value.trim() } : { code: values.value.trim() }),
      });
    } catch (err) {
      setSubmitError(err);
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.field}>
        <span>
          {useRecovery ? t('auth.totpChallenge.recoveryCode') : t('auth.totpChallenge.code')}
        </span>
        <input
          type="text"
          inputMode={useRecovery ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          autoFocus
          maxLength={useRecovery ? 32 : 6}
          className={`khatm-input ltr-embed${errors.value ? ' khatm-input--error' : ''}`}
          {...register('value')}
        />
        {errors.value && <span className={styles.fieldError}>{errors.value.message}</span>}
      </label>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setUseRecovery((v) => !v);
          setSubmitError(null);
        }}
      >
        {useRecovery
          ? t('auth.totpChallenge.useCodeInstead')
          : t('auth.totpChallenge.useRecoveryInstead')}
      </Button>
      <ApiErrorBanner error={submitError} />
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onBack} disabled={isSubmitting}>
          {t('auth.totpChallenge.back')}
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? t('auth.totpChallenge.submitting') : t('auth.totpChallenge.submit')}
        </Button>
      </div>
    </form>
  );
}
