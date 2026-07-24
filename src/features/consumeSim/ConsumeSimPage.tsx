import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useSimulateConsume } from './hooks';
import { generateIdempotencyKey } from './idempotencyKey';
import type { ConsumeResponse } from './api';
import styles from './ConsumeSimPage.module.css';

interface FormValues {
  credentialId: string;
  apiKey: string;
  idempotencyKey: string;
}

const REASON_KEY: Record<string, string> = {
  consumed: 'consumeSim.result.reasonConsumed',
  already_consumed: 'consumeSim.result.reasonAlreadyConsumed',
  not_consumable: 'consumeSim.result.reasonNotConsumable',
  idempotent_replay: 'consumeSim.result.reasonIdempotentReplay',
};

function ResultPanel({ result }: { result: ConsumeResponse }) {
  const { t } = useTranslation();
  const reasonKey = result.reason ? REASON_KEY[result.reason] : undefined;
  const reasonLabel = reasonKey ? t(reasonKey) : result.reason;

  return (
    <div className={styles.resultPanel} data-testid="consume-result">
      <div className={styles.resultRow}>
        <span className={styles.resultLabel}>{t('consumeSim.result.consumed')}</span>
        <StatusBadge tone={result.consumed ? 'success' : 'neutral'}>
          {result.consumed ? t('consumeSim.result.consumedYes') : t('consumeSim.result.consumedNo')}
        </StatusBadge>
      </div>
      <div className={styles.resultRow}>
        <span className={styles.resultLabel}>{t('consumeSim.result.reason')}</span>
        <span>{reasonLabel}</span>
      </div>
      <div className={styles.resultRow}>
        <span className={styles.resultLabel}>{t('consumeSim.result.usesRemaining')}</span>
        <span>
          {result.usesRemaining === undefined || result.usesRemaining === null
            ? t('consumeSim.result.usesRemainingUnknown')
            : result.usesRemaining}
        </span>
      </div>
    </div>
  );
}

export function ConsumeSimPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get('id');
  const [showKey, setShowKey] = useState(false);
  const consume = useSimulateConsume();

  const schema = z.object({
    credentialId: z
      .string()
      .trim()
      .min(1, { message: t('consumeSim.form.credentialIdRequired') }),
    apiKey: z
      .string()
      .trim()
      .min(1, { message: t('consumeSim.form.apiKeyRequired') }),
    idempotencyKey: z.string().trim().min(1),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      credentialId: presetId ?? '',
      apiKey: '',
      idempotencyKey: generateIdempotencyKey(),
    },
  });

  // Hard constraint: the pasted API key lives in component memory only —
  // cleared whenever this page's navigation entry changes (a new deep link,
  // or leaving the route entirely, which also destroys this state on unmount).
  useEffect(() => {
    setValue('apiKey', '');
    setShowKey(false);
    return () => setValue('apiKey', '');
  }, [location.key, setValue]);

  const onRegenerateIdempotencyKey = () => {
    setValue('idempotencyKey', generateIdempotencyKey());
  };

  const onSubmit = handleSubmit((values) => {
    consume.mutate({
      credentialId: values.credentialId.trim(),
      apiKey: values.apiKey.trim(),
      idempotencyKey: values.idempotencyKey.trim(),
    });
  });

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('consumeSim.title')}</h1>
      <p className={styles.banner} role="note">
        {t('consumeSim.banner')}
      </p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sim-credentialId">
            {t('consumeSim.form.credentialId')}
          </label>
          <input
            id="sim-credentialId"
            type="text"
            autoComplete="off"
            className="ltr-embed"
            {...register('credentialId')}
          />
          {errors.credentialId && (
            <span className={styles.fieldError}>{errors.credentialId.message}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="sim-apiKey">
            {t('consumeSim.form.apiKey')}
          </label>
          <div className={styles.keyRow}>
            <input
              id="sim-apiKey"
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              className="ltr-embed"
              {...register('apiKey')}
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowKey((s) => !s)}
            >
              {showKey ? t('consumeSim.form.hideKey') : t('consumeSim.form.revealKey')}
            </button>
          </div>
          <span className={styles.help}>{t('consumeSim.form.apiKeyHelp')}</span>
          {errors.apiKey && <span className={styles.fieldError}>{errors.apiKey.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="sim-idempotencyKey">
            {t('consumeSim.form.idempotencyKey')}
          </label>
          <div className={styles.keyRow}>
            <input
              id="sim-idempotencyKey"
              type="text"
              readOnly
              className="ltr-embed"
              {...register('idempotencyKey')}
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={onRegenerateIdempotencyKey}
            >
              {t('consumeSim.form.regenerate')}
            </button>
          </div>
          <span className={styles.help}>{t('consumeSim.form.idempotencyKeyHelp')}</span>
        </div>

        <button type="submit" className={styles.submit} disabled={consume.isPending}>
          {consume.isPending ? t('consumeSim.form.submitting') : t('consumeSim.form.submit')}
        </button>
      </form>

      {consume.isError && <ApiErrorBanner error={consume.error} />}
      {consume.isSuccess && <ResultPanel result={consume.data} />}
    </section>
  );
}
