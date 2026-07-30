import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/api/errors';
import { useAuth } from '../useAuth';
import styles from './LoginForm.module.css';

function buildLoginSchema(t: TFunction) {
  return z.object({
    username: z.string().min(1, t('auth.login.usernameRequired')),
    password: z.string().min(1, t('auth.login.passwordRequired')),
    tenantSlug: z.string(),
  });
}

type LoginFormValues = z.infer<ReturnType<typeof buildLoginSchema>>;

export function LoginForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);
  const schema = useMemo(() => buildLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const tenantSlug = values.tenantSlug.trim();
    try {
      await login({
        username: values.username,
        password: values.password,
        ...(tenantSlug ? { tenantSlug } : {}),
      });
    } catch (err) {
      setSubmitError(err);
      if (err instanceof ApiError) {
        for (const detail of err.details) {
          if (detail.field === 'username' || detail.field === 'password') {
            setError(detail.field, { message: detail.message ?? t('errors.generic') });
          }
        }
      }
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.field}>
        <span>{t('auth.login.username')}</span>
        <input
          type="text"
          autoComplete="username"
          className={`khatm-input${errors.username ? ' khatm-input--error' : ''}`}
          {...register('username')}
        />
        {errors.username && <span className={styles.fieldError}>{errors.username.message}</span>}
      </label>
      <label className={styles.field}>
        <span>{t('auth.login.password')}</span>
        <input
          type="password"
          autoComplete="current-password"
          className={`khatm-input${errors.password ? ' khatm-input--error' : ''}`}
          {...register('password')}
        />
        {errors.password && <span className={styles.fieldError}>{errors.password.message}</span>}
      </label>
      <div className={styles.field}>
        <label htmlFor="login-tenant-slug">{t('auth.login.tenantSlug')}</label>
        <input
          id="login-tenant-slug"
          type="text"
          autoComplete="organization"
          className="khatm-input"
          {...register('tenantSlug')}
        />
        <span className={styles.fieldHint}>{t('auth.login.tenantSlugHint')}</span>
      </div>
      <ApiErrorBanner error={submitError} />
      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>
    </form>
  );
}
