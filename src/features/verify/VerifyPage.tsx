import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { VerifyResult } from './components/VerifyResult';
import { useVerifyPresentation } from './hooks';
import type { VerifyResponse } from './api';
import styles from './VerifyPage.module.css';

interface VerifyFormValues {
  sdJwt: string;
}

export function VerifyPage() {
  const { t } = useTranslation();
  const schema = useMemo(
    () => z.object({ sdJwt: z.string().min(1, { message: t('verify.sdJwtRequired') }) }),
    [t],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormValues>({ resolver: zodResolver(schema) });

  const verify = useVerifyPresentation();
  // A verification result is a domain outcome (always HTTP 200), kept locally so
  // the panel persists independent of the mutation's loading state.
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    const response = await verify.mutateAsync({ sdJwt: values.sdJwt });
    setResult(response);
  });

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('verify.title')}</h1>
      <p className={styles.help}>{t('verify.prompt')}</p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="verify-sdJwt">
            {t('verify.sdJwtLabel')}
          </label>
          <textarea
            id="verify-sdJwt"
            autoComplete="off"
            spellCheck={false}
            placeholder={t('verify.sdJwtPlaceholder')}
            {...register('sdJwt')}
          />
          {errors.sdJwt && <span className={styles.fieldError}>{errors.sdJwt.message}</span>}
        </div>

        <ApiErrorBanner error={verify.error} />
        <button type="submit" className={styles.submit} disabled={verify.isPending}>
          {verify.isPending ? t('verify.submitting') : t('verify.submit')}
        </button>
      </form>

      <h2 className={styles.label}>{t('verify.resultHeading')}</h2>
      {result ? (
        <VerifyResult result={result} />
      ) : (
        <p className={styles.help}>{t('verify.blank')}</p>
      )}
    </section>
  );
}
